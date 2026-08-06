const countryList = document.getElementById('country-list');
const countryDetail = document.getElementById('country-detail');
const countrySummary = document.getElementById('country-summary');
const totalCountries = document.getElementById('total-countries');
const searchInput = document.getElementById('search-country');
const metricKilometers = document.getElementById('metric-km');
const metricFlights = document.getElementById('metric-flights');
const metricContinents = document.getElementById('metric-continents');
const continentNorthAmerica = document.getElementById('continent-north-america');
const continentCentralAmerica = document.getElementById('continent-central-america');
const continentSouthAmerica = document.getElementById('continent-south-america');
const continentEurope = document.getElementById('continent-europe');
const achievementPhotos = document.getElementById('achievement-photos');
const achievementStories = document.getElementById('achievement-stories');
const achievementUpdated = document.getElementById('achievement-updated');
const achievementFirstCountry = document.getElementById('achievement-first-country');
const achievementLatestCountry = document.getElementById('achievement-latest-country');
const achievementFavoriteDestination = document.getElementById('achievement-favorite-destination');
const achievementMostTraveledContinent = document.getElementById('achievement-most-traveled-continent');
const wishlistGrid = document.getElementById('wishlist-grid');
let countries = [];
let filteredCountries = [];
let activeIndex = 0;
let detailMap = null;
let photoLightbox = null;
let revealObserver = null;

const defaultSiteContent = {
  metrics: {
    totalFlights: 0,
    favoriteDestination: ''
  },
  customCountryOrder: [],
  wishlist: [],
  countries: {}
};

let siteContent = { ...defaultSiteContent };

async function fetchJsonWithFallback(paths) {
  let lastError = null;

  for (const path of paths) {
    try {
      const response = await fetch(path, { cache: 'no-store' });
      if (!response.ok) {
        lastError = new Error(`No se pudo cargar ${path}`);
        continue;
      }
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('No fue posible cargar el contenido del sitio.');
}

function getDataPaths(fileName) {
  return [
    `data/${fileName}`,
    `./data/${fileName}`,
    `/travel-journal/data/${fileName}`
  ];
}

function normalizeForKey(value) {
  return (value || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function sortCountriesByCustomOrder(countryEntries, order = []) {
  const customCountryOrderMap = new Map(
    order.map((countryName, index) => [normalizeForKey(countryName), index])
  );

  return [...countryEntries].sort((a, b) => {
    const rankA = customCountryOrderMap.get(normalizeForKey(a.name));
    const rankB = customCountryOrderMap.get(normalizeForKey(b.name));

    if (rankA !== undefined && rankB !== undefined) return rankA - rankB;
    if (rankA !== undefined) return -1;
    if (rankB !== undefined) return 1;

    return a.name.localeCompare(b.name, 'es');
  });
}

function renderWishlist() {
  if (!wishlistGrid) return;

  wishlistGrid.innerHTML = (siteContent.wishlist || []).map((group) => {
    const destinations = (group.destinations || []).map((destination) => {
      const title = destination.place ? `${destination.country}` : destination.country;
      const subtitle = destination.place ? destination.place : 'Destino completo por descubrir';

      return `
        <article class="wishlist-card">
          <h5>${title}</h5>
          <p>${subtitle}</p>
        </article>
      `;
    }).join('');

    return `
      <section class="wishlist-group reveal">
        <div class="wishlist-group-header">
          <span class="wishlist-group-icon" aria-hidden="true">${group.icon || '✈️'}</span>
          <div>
            <span class="wishlist-badge">${group.category || 'Wishlist'}</span>
            <h4>${group.category || 'Por visitar'}</h4>
            <p>${group.description || ''}</p>
          </div>
        </div>
        <div class="wishlist-destinations-grid">
          ${destinations}
        </div>
      </section>
    `;
  }).join('');

  observeReveals(wishlistGrid.querySelectorAll('.reveal'));
}

function getCountryContentByName(countryName) {
  const entries = Object.entries(siteContent.countries || {});
  const normalizedName = normalizeForKey(countryName);
  const match = entries.find(([name]) => normalizeForKey(name) === normalizedName);
  return match ? match[1] : {};
}

function mergeCountryContent(countryEntries) {
  return countryEntries.map((country) => ({
    ...country,
    ...getCountryContentByName(country.name)
  }));
}

async function loadCountries() {
  try {
    const [fetchedCountries, fetchedSiteContent] = await Promise.all([
      fetchJsonWithFallback(getDataPaths('countries.json')),
      fetchJsonWithFallback(getDataPaths('site-content.json'))
    ]);

    siteContent = {
      ...defaultSiteContent,
      ...fetchedSiteContent,
      metrics: {
        ...defaultSiteContent.metrics,
        ...(fetchedSiteContent.metrics || {})
      },
      countries: fetchedSiteContent.countries || {}
    };

    renderWishlist();

    countries = sortCountriesByCustomOrder(
      mergeCountryContent(fetchedCountries),
      siteContent.customCountryOrder || []
    );
    filteredCountries = countries;
    updateCredibilityMetrics(countries);
    bindSearch();
    renderCountryList();
  } catch (error) {
    const runningFromLocalFile = window.location.protocol === 'file:';
    const baseMessage = runningFromLocalFile
      ? 'En móvil, esta app no puede cargar JSON abriendo index.html directamente. Ábrela desde GitHub Pages o un servidor local.'
      : (error?.message || 'No se pudo cargar la información de viajes.');

    countryList.innerHTML = `<p class="error">${baseMessage}</p>`;
    countrySummary.textContent = 'No hay países disponibles';
    if (totalCountries) totalCountries.textContent = '0';
  }
}

function haversineDistanceKm(origin, destination) {
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latDiff = toRad(destination.lat - origin.lat);
  const lngDiff = toRad(destination.lng - origin.lng);

  const a =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(toRad(origin.lat)) * Math.cos(toRad(destination.lat)) *
    Math.sin(lngDiff / 2) * Math.sin(lngDiff / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function calculateEstimatedKilometers(countryEntries) {
  let previousLocation = null;
  let totalDistance = 0;

  countryEntries.forEach((country) => {
    const location = country.location;
    if (!location) return;

    if (previousLocation) {
      totalDistance += haversineDistanceKm(previousLocation, location);
    }
    previousLocation = location;
  });

  return Math.round(totalDistance);
}

function updateCredibilityMetrics(countryEntries) {
  const regionCount = {
    'Norteamérica': 0,
    'Centroamérica': 0,
    'Sudamérica': 0,
    'Europa': 0
  };

  const regionToContinent = {
    'Norteamérica': 'América',
    'Centroamérica': 'América',
    'Sudamérica': 'América',
    'Europa': 'Europa'
  };

  countryEntries.forEach((country) => {
    if (regionCount[country.region] !== undefined) {
      regionCount[country.region] += 1;
    }
  });

  const visitedContinents = new Set(
    countryEntries
      .map(country => regionToContinent[country.region])
      .filter(Boolean)
  ).size;
  const estimatedKilometers = calculateEstimatedKilometers(countryEntries);
  const totalPhotos = countryEntries.reduce((sum, country) => sum + (country.photos?.length || 0), 0);
  const totalStories = countryEntries.reduce((sum, country) => sum + (country.experiences ? 1 : 0), 0);
  const latestYear = countryEntries.reduce((max, country) => Math.max(max, Number(country.year) || 0), 0);
  const sortedByYear = [...countryEntries]
    .filter(country => Number(country.year))
    .sort((a, b) => Number(a.year) - Number(b.year));
  const firstVisitedCountry = sortedByYear[0]?.name || 'N/A';
  const latestVisitedCountry = sortedByYear[sortedByYear.length - 1]?.name || 'N/A';
  const favoriteDestination = siteContent.metrics?.favoriteDestination
    || countryEntries.find(country => country.favorite)?.name
    || 'N/A';
  const continentCount = {
    'América': regionCount['Norteamérica'] + regionCount['Centroamérica'] + regionCount['Sudamérica'],
    'Europa': regionCount['Europa']
  };
  const mostTraveledContinent = Object.entries(continentCount)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const numberFormatter = new Intl.NumberFormat('es-ES');

  if (metricKilometers) metricKilometers.textContent = `${numberFormatter.format(estimatedKilometers)} km`;
  if (metricFlights) metricFlights.textContent = numberFormatter.format(siteContent.metrics?.totalFlights || 0);
  if (metricContinents) metricContinents.textContent = numberFormatter.format(visitedContinents);

  if (continentNorthAmerica) continentNorthAmerica.textContent = numberFormatter.format(regionCount['Norteamérica']);
  if (continentCentralAmerica) continentCentralAmerica.textContent = numberFormatter.format(regionCount['Centroamérica']);
  if (continentSouthAmerica) continentSouthAmerica.textContent = numberFormatter.format(regionCount['Sudamérica']);
  if (continentEurope) continentEurope.textContent = numberFormatter.format(regionCount['Europa']);

  if (achievementPhotos) achievementPhotos.textContent = numberFormatter.format(totalPhotos);
  if (achievementStories) achievementStories.textContent = numberFormatter.format(totalStories);
  if (achievementUpdated) achievementUpdated.textContent = latestYear > 0 ? latestYear.toString() : 'N/A';
  if (achievementFirstCountry) achievementFirstCountry.textContent = firstVisitedCountry;
  if (achievementLatestCountry) achievementLatestCountry.textContent = latestVisitedCountry;
  if (achievementFavoriteDestination) achievementFavoriteDestination.textContent = favoriteDestination;
  if (achievementMostTraveledContinent) achievementMostTraveledContinent.textContent = mostTraveledContinent;
}

function bindSearch() {
  if (!searchInput) return;
  searchInput.addEventListener('input', event => {
    const query = event.target.value.trim().toLowerCase();
    filteredCountries = countries.filter(country => {
      const text = `${country.name} ${country.description || ''}`.toLowerCase();
      return text.includes(query);
    });
    activeIndex = 0;
    renderCountryList();
  });
}

function getCountryExperienceMeta(country) {
  const text = `${country.name} ${country.description || ''} ${country.places?.join(' ') || ''} ${country.activities?.join(' ') || ''}`.toLowerCase();

  if (/(playa|mar|costa|isla|beach|coast)/.test(text)) {
    return { icon: '🌊', label: 'Playa & relax', badge: 'Relax' };
  }

  if (/(cultura|historia|arte|museo|tradicion|tradición|heritage)/.test(text)) {
    return { icon: '🏛️', label: 'Cultura', badge: 'Cultura' };
  }

  if (/(comida|gastr|food|mercado|sabores)/.test(text)) {
    return { icon: '🍽️', label: 'Gastronomía', badge: 'Gastronomía' };
  }

  if (/(montaña|aventura|ruta|trek|nature|volcan|parque|nature)/.test(text)) {
    return { icon: '🧭', label: 'Aventura', badge: 'Aventura' };
  }

  return { icon: '🗺️', label: 'Viaje', badge: 'Experiencia' };
}

function renderCountryList() {
  const count = filteredCountries.length;
  if (totalCountries) totalCountries.textContent = countries.length;
  countrySummary.textContent = `${count} de ${countries.length} países disponibles`;

  if (count === 0) {
    countryList.innerHTML = '<p class="empty-result">No se encontró ningún país. Intenta otro término de búsqueda.</p>';
    countryDetail.innerHTML = `
      <div class="detail-empty">
        <h3>Sin resultados</h3>
        <p>Prueba con otro nombre o borra el filtro para ver todos los países.</p>
      </div>
    `;
    return;
  }

  countryList.innerHTML = filteredCountries.map((country, index) => {
    const meta = getCountryExperienceMeta(country);
    return `
      <article class="country-card${index === activeIndex ? ' active' : ''}" data-index="${index}">
        <div class="country-card-title-group">
          <span class="country-icon" aria-hidden="true">${meta.icon}</span>
          <div>
            <h4>${country.name}</h4>
            <p class="country-card-subtitle">${meta.label}</p>
          </div>
        </div>
        <span class="country-badge">${meta.badge}</span>
        <p>${country.description || 'Haz clic para ver detalles.'}</p>
      </article>
    `;
  }).join('');

  const cards = countryList.querySelectorAll('.country-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const index = Number(card.dataset.index);
      activeIndex = index;
      renderCountryList();
      renderCountryDetail(filteredCountries[index]);
    });
  });

  renderCountryDetail(filteredCountries[activeIndex]);
}

function animateDetailPanelEntry() {
  const detailPanel = countryDetail.querySelector('.detail-panel');
  if (!detailPanel) {
    return;
  }

  detailPanel.classList.add('detail-panel-enter');
  requestAnimationFrame(() => {
    detailPanel.classList.add('detail-panel-enter-active');
  });

  window.setTimeout(() => {
    detailPanel.classList.remove('detail-panel-enter', 'detail-panel-enter-active');
  }, 420);
}

function swapCarouselImage(image, nextSrc, nextAlt) {
  if (!image || !nextSrc) {
    return;
  }

  image.classList.add('is-swapping');

  const finishSwap = () => {
    image.classList.remove('is-swapping');
    image.removeEventListener('load', finishSwap);
  };

  image.addEventListener('load', finishSwap, { once: true });
  image.src = nextSrc;
  image.alt = nextAlt;

  if (image.complete) {
    requestAnimationFrame(() => {
      image.classList.remove('is-swapping');
    });
  }
}


function createList(items) {
  if (!items || items.length === 0) {
    return '<p>Ninguno</p>';
  }
  return `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
}

function createPhotoCarousel(photos, countryName) {
  if (!photos || photos.length === 0) {
    return '<p>No hay fotos disponibles.</p>';
  }

  const safeCountryName = countryName || 'este destino';

  if (photos.length === 1) {
    return `
      <div class="photo-single">
        <img class="photo-carousel-image" src="${photos[0]}" alt="Foto de viaje en ${safeCountryName}" loading="lazy" tabindex="0" role="button" aria-label="Abrir foto en pantalla completa" />
      </div>
    `;
  }

  return `
    <div class="photo-carousel" data-index="0">
      <div class="photo-carousel-main">
        <img class="photo-carousel-image" src="${photos[0]}" alt="Foto de viaje en ${safeCountryName}" loading="lazy" tabindex="0" role="button" aria-label="Abrir foto en pantalla completa" />
        <button class="photo-carousel-control photo-carousel-prev" type="button" aria-label="Foto anterior">←</button>
        <button class="photo-carousel-control photo-carousel-next" type="button" aria-label="Siguiente foto">→</button>
      </div>
      <div class="photo-carousel-thumbs">
        ${photos.map((photo, index) => `<button type="button" class="photo-thumb${index === 0 ? ' active' : ''}" data-photo-index="${index}" style="background-image: url('${photo}');" aria-label="Ver foto ${index + 1} de ${safeCountryName}"></button>`).join('')}
      </div>
    </div>
  `;
}

function ensurePhotoLightbox() {
  if (photoLightbox) return photoLightbox;

  const modal = document.createElement('div');
  modal.className = 'photo-lightbox';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="photo-lightbox-backdrop" data-close="true"></div>
    <div class="photo-lightbox-dialog" role="dialog" aria-modal="true" aria-label="Imagen ampliada de viaje">
      <button type="button" class="photo-lightbox-close" aria-label="Cerrar imagen">×</button>
      <img class="photo-lightbox-image" src="" alt="" />
    </div>
  `;

  const closeButton = modal.querySelector('.photo-lightbox-close');
  const closeBackdrop = modal.querySelector('[data-close="true"]');

  const closeLightbox = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
  };

  closeButton?.addEventListener('click', closeLightbox);
  closeBackdrop?.addEventListener('click', closeLightbox);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeLightbox();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('open')) {
      closeLightbox();
    }
  });

  document.body.appendChild(modal);
  photoLightbox = { modal, closeLightbox };
  return photoLightbox;
}

function openPhotoLightbox(src, alt) {
  if (!src) return;
  const { modal } = ensurePhotoLightbox();
  const image = modal.querySelector('.photo-lightbox-image');

  if (!image) return;
  image.src = src;
  image.alt = alt || 'Imagen de viaje ampliada';

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lightbox-open');
}

function setupDetailPhotoLightbox() {
  const clickableImages = countryDetail.querySelectorAll('.photo-carousel-image');
  if (!clickableImages.length) return;

  clickableImages.forEach((image) => {
    const open = () => openPhotoLightbox(image.currentSrc || image.src, image.alt);
    image.addEventListener('click', open);
    image.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });
  });
}

function setupDetailPhotoCarousel(photos, countryName) {
  if (!photos || photos.length <= 1) {
    return;
  }

  const carousel = countryDetail.querySelector('.photo-carousel');
  const image = carousel?.querySelector('.photo-carousel-image');
  const prevButton = carousel?.querySelector('.photo-carousel-prev');
  const nextButton = carousel?.querySelector('.photo-carousel-next');
  const thumbButtons = carousel?.querySelectorAll('.photo-thumb');

  if (!carousel || !image || !prevButton || !nextButton || !thumbButtons?.length) {
    return;
  }

  let currentPhotoIndex = 0;

  const updateCarousel = () => {
    swapCarouselImage(
      image,
      photos[currentPhotoIndex],
      `Foto ${currentPhotoIndex + 1} de ${countryName}`
    );
    thumbButtons.forEach((thumb, index) => {
      thumb.classList.toggle('active', index === currentPhotoIndex);
    });
  };

  prevButton.addEventListener('click', () => {
    currentPhotoIndex = (currentPhotoIndex - 1 + photos.length) % photos.length;
    updateCarousel();
  });

  nextButton.addEventListener('click', () => {
    currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
    updateCarousel();
  });

  thumbButtons.forEach((thumb, index) => {
    thumb.addEventListener('click', () => {
      currentPhotoIndex = index;
      updateCarousel();
    });
  });
}

function getCountryMapLocation(country) {
  return country.location || { lat: 20, lng: 0, zoom: 2 };
}

function destroyDetailMap() {
  if (detailMap) {
    detailMap.remove();
    detailMap = null;
  }
}

function normalizeTravelText(value) {
  return normalizeForKey(value);
}

function getCountryTravelTips(country) {
  const travelTips = {
    climate: 'Clima agradable y fácil de planificar.',
    estimatedCost: 'Coste medio para una escapada equilibrada.',
    bestTime: 'Ideal para viajar en temporada baja o intermedia.'
  };

  if (country.travelTips?.climate) travelTips.climate = country.travelTips.climate;
  if (country.travelTips?.estimatedCost) travelTips.estimatedCost = country.travelTips.estimatedCost;
  if (country.travelTips?.bestTime) travelTips.bestTime = country.travelTips.bestTime;

  const name = (country.name || '').toLowerCase();
  const region = (country.region || '').toLowerCase();

  if (name.includes('estados') || name.includes('unidos') || name.includes('usa')) {
    travelTips.climate = 'Clima variado según la región y la época del año.';
    travelTips.estimatedCost = 'Costo medio-alto si se incluyen ciudades y parques temáticos.';
    travelTips.bestTime = 'Mejor entre primavera y otoño.';
  } else if (region.includes('centro') || /guatemala|salvador|costa rica|panama|mexico/.test(name)) {
    travelTips.climate = 'Tropical y cálido, con lluvias en ciertas estaciones.';
    travelTips.estimatedCost = 'Costo moderado, muy accesible para escapadas largas.';
    travelTips.bestTime = 'Ideal entre noviembre y abril.';
  } else if (region.includes('sud') || /argentina|brasil|colombia|perú|paraguay/.test(name)) {
    travelTips.climate = 'Clima diverso: desde andino hasta tropical y subtropical.';
    travelTips.estimatedCost = 'Costo moderado, con opciones para diferentes presupuestos.';
    travelTips.bestTime = 'Muy recomendable entre mayo y octubre.';
  } else if (name.includes('europa') || /italia|españa|francia|portugal|grecia/.test(name)) {
    travelTips.climate = 'Clima mediterráneo con veranos secos e inviernos suaves.';
    travelTips.estimatedCost = 'Costo medio-alto en temporada alta.';
    travelTips.bestTime = 'Mejor entre abril y junio o septiembre y octubre.';
  }

  return travelTips;
}

function getCountryRecommendations(country) {
  const region = normalizeTravelText(country.region);

  const primaryPlace = country.places?.[0] || 'el destino principal';
  const secondaryPlace = country.places?.[1] || country.places?.[0] || 'otro rincón del país';

  const recommendation = {
    mustSee: `No te pierdas ${primaryPlace} y alguno de los otros puntos que marcaste en tu ruta.`,
    localTip: 'Prueba sabores locales y conversa con la gente del lugar para descubrir rincones que no salen en las guías.',
    pace: 'Reserva tiempo para caminar sin prisa y mezclar visitas principales con momentos espontáneos.'
  };

  if (country.recommendations?.mustSee) recommendation.mustSee = country.recommendations.mustSee;
  if (country.recommendations?.localTip) recommendation.localTip = country.recommendations.localTip;
  if (country.recommendations?.pace) recommendation.pace = country.recommendations.pace;

  if (!country.recommendations && region.includes('europa')) {
    recommendation.mustSee = `No te pierdas el casco histórico de ${primaryPlace} y una caminata sin plan fijo por sus calles.`;
    recommendation.localTip = 'Usa transporte público y reserva tiempo para cafés, plazas y barrios antiguos.';
    recommendation.pace = 'Conviene viajar con poca rigidez para dejar espacio a museos y rincones imprevistos.';
  } else if (!country.recommendations && region.includes('centroamerica')) {
    recommendation.mustSee = `No te pierdas ${primaryPlace} y los paisajes o mercados que rodean esa zona.`;
    recommendation.localTip = 'Pregunta por rutas tempranas y lleva siempre algo de efectivo para comer y moverte.';
    recommendation.pace = 'Mejor en un ritmo mixto: naturaleza por la mañana y ciudad o comida por la tarde.';
  } else if (!country.recommendations && region.includes('sudamerica')) {
    recommendation.mustSee = `No te pierdas ${primaryPlace} y al menos otro punto de tu lista, como ${secondaryPlace}.`;
    recommendation.localTip = 'Ajusta tus recorridos por zonas y clima; las distancias entre lugares suelen ser mayores de lo que parecen.';
    recommendation.pace = 'Divide el viaje por bloques para que ciudad, naturaleza y gastronomía no se sientan apurados.';
  }

  return recommendation;
}

function renderCountryDetail(country) {
  if (!country) return;

  const imageUrl = country.photos && country.photos.length > 0 ? country.photos[0] : 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80';
  const countryCountText = filteredCountries.length === countries.length ? countries.length : `${activeIndex + 1} / ${filteredCountries.length}`;

  const travelTips = getCountryTravelTips(country);
  const recommendations = getCountryRecommendations(country);

  countryDetail.innerHTML = `
    <section class="detail-panel">
      <div class="detail-hero">
        <img src="${imageUrl}" alt="Vista de ${country.name}" loading="lazy" />
      </div>
      <div class="detail-content">
        <div class="detail-title">
          <div>
            <h3>${country.name}</h3>
            <p>${country.description || 'Un destino increíble con muchas experiencias.'}</p>
          </div>
          <span class="detail-badge">${countryCountText}</span>
        </div>

        <div class="detail-section">
          <h4>🧭 Planifica tu viaje</h4>
          <div class="detail-planning">
            <div class="detail-map-card">
              <div class="detail-map-visual">
                <div class="detail-map-topbar">Mapa interactivo</div>
                <div id="country-map" class="country-map" aria-label="Mapa interactivo de ${country.name}"></div>
                <div class="detail-map-caption">
                  <strong>${country.name}</strong>
                  <span>${country.region || 'Destino internacional'}</span>
                </div>
                <div class="detail-map-footer">El punto marca una ubicación aproximada del país para orientar el viaje.</div>
              </div>
            </div>
            <div class="detail-insights">
              <div class="insight-card">
                <span aria-hidden="true">🌤️</span>
                <strong>Clima</strong>
                <p>${travelTips.climate}</p>
              </div>
              <div class="insight-card">
                <span aria-hidden="true">💸</span>
                <strong>Costo estimado</strong>
                <p>${travelTips.estimatedCost}</p>
              </div>
              <div class="insight-card">
                <span aria-hidden="true">🗓️</span>
                <strong>Mejor época</strong>
                <p>${travelTips.bestTime}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>⭐ No te pierdas</h4>
          <div class="recommendation-grid">
            <article class="recommendation-card">
              <span class="recommendation-label">Recomendación personal</span>
              <p>${recommendations.mustSee}</p>
            </article>
            <article class="recommendation-card">
              <span class="recommendation-label">Consejo local</span>
              <p>${recommendations.localTip}</p>
            </article>
            <article class="recommendation-card recommendation-card-wide">
              <span class="recommendation-label">Ritmo sugerido</span>
              <p>${recommendations.pace}</p>
            </article>
          </div>
        </div>

        <div class="detail-section">
          <h4>📍 Lugares destacados</h4>
          ${createList(country.places)}
        </div>

        <div class="detail-section">
          <h4>🧭 Actividades favoritas</h4>
          ${createList(country.activities)}
        </div>

        <div class="detail-section">
          <h4>✨ Experiencias</h4>
          <p>${country.experiences || 'Sin comentarios adicionales.'}</p>
        </div>

        <div class="detail-section">
          <h4>📸 Fotos</h4>
          ${createPhotoCarousel(country.photos, country.name)}
        </div>
      </div>
    </section>
  `;

  setupDetailPhotoCarousel(country.photos, country.name);
  setupDetailPhotoLightbox();
  animateDetailPanelEntry();

  destroyDetailMap();

  if (window.L) {
    const location = getCountryMapLocation(country);
    const mapElement = document.getElementById('country-map');

    if (mapElement) {
      detailMap = L.map(mapElement, {
        zoomControl: true,
        scrollWheelZoom: false,
        dragging: true,
        tap: false
      }).setView([location.lat, location.lng], location.zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(detailMap);

      L.marker([location.lat, location.lng]).addTo(detailMap).bindPopup(country.name).openPopup();

      setTimeout(() => {
        detailMap?.invalidateSize();
      }, 0);
    }
  }
}

function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  const storedTheme = localStorage.getItem('travelJournalTheme');
  const initialTheme = storedTheme || 'light';
  document.body.dataset.theme = initialTheme;
  themeToggle.textContent = initialTheme === 'dark' ? 'Modo claro' : 'Modo oscuro';

  themeToggle.addEventListener('click', () => {
    const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    document.body.dataset.theme = nextTheme;
    themeToggle.textContent = nextTheme === 'dark' ? 'Modo claro' : 'Modo oscuro';
    localStorage.setItem('travelJournalTheme', nextTheme);
  });
}

function observeReveals(elements) {
  if (!elements?.length) {
    return;
  }

  if (!revealObserver) {
    elements.forEach((item) => item.classList.add('visible'));
    return;
  }

  elements.forEach((item) => {
    if (!item.classList.contains('visible')) {
      revealObserver.observe(item);
    }
  });
}

function setupRevealObserver() {
  const reveals = document.querySelectorAll('.reveal');

  if (typeof window.IntersectionObserver !== 'function') {
    reveals.forEach((item) => item.classList.add('visible'));
    return;
  }

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  observeReveals(reveals);
}

function setupHeroCarousel() {
  const slides = Array.from(document.querySelectorAll('.hero-slide'));
  const dotsContainer = document.getElementById('carousel-dots');
  const prevButton = document.getElementById('carousel-prev');
  const nextButton = document.getElementById('carousel-next');
  let currentIndex = 0;
  let autoAdvance;

  if (!slides.length || !dotsContainer) {
    return;
  }

  const thumbsContainer = document.getElementById('carousel-thumbs');

  slides.forEach((slide, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = index === 0 ? 'active' : '';
    dot.setAttribute('aria-label', `Ver diapositiva ${index + 1}`);
    dot.addEventListener('click', () => {
      goToSlide(index);
      resetAutoAdvance();
    });
    dotsContainer.appendChild(dot);

    if (thumbsContainer) {
      const thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.className = index === 0 ? 'carousel-thumb active' : 'carousel-thumb';
      thumb.style.backgroundImage = slide.style.backgroundImage;
      thumb.setAttribute('aria-label', `Miniatura de diapositiva ${index + 1}`);
      thumb.addEventListener('click', () => {
        goToSlide(index);
        resetAutoAdvance();
      });
      thumbsContainer.appendChild(thumb);
    }
  });

  function updateSlides() {
    slides.forEach((slide, index) => {
      slide.classList.toggle('active', index === currentIndex);
    });
    const dots = dotsContainer.querySelectorAll('button');
    dots.forEach((dot, index) => dot.classList.toggle('active', index === currentIndex));
    const thumbs = thumbsContainer?.querySelectorAll('.carousel-thumb') || [];
    thumbs.forEach((thumb, index) => thumb.classList.toggle('active', index === currentIndex));
  }

  function goToSlide(index) {
    currentIndex = (index + slides.length) % slides.length;
    updateSlides();
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function previousSlide() {
    goToSlide(currentIndex - 1);
  }

  function resetAutoAdvance() {
    clearInterval(autoAdvance);
    autoAdvance = setInterval(nextSlide, 6500);
  }

  prevButton?.addEventListener('click', () => {
    previousSlide();
    resetAutoAdvance();
  });

  nextButton?.addEventListener('click', () => {
    nextSlide();
    resetAutoAdvance();
  });

  resetAutoAdvance();
}

loadCountries();
setupThemeToggle();
setupRevealObserver();
renderWishlist();
setupHeroCarousel();
