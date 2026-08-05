const countryList = document.getElementById('country-list');
const countryDetail = document.getElementById('country-detail');
const countrySummary = document.getElementById('country-summary');
const totalCountries = document.getElementById('total-countries');
const searchInput = document.getElementById('search-country');
let countries = [];
let filteredCountries = [];
let activeIndex = 0;
let detailMap = null;

const countryMapLocations = {
  'Estados Unidos': { lat: 39.8283, lng: -98.5795, zoom: 4 },
  'México': { lat: 23.6345, lng: -102.5528, zoom: 5 },
  'Guatemala': { lat: 15.7835, lng: -90.2308, zoom: 7 },
  'El Salvador': { lat: 13.7942, lng: -88.8965, zoom: 8 },
  'Costa Rica': { lat: 9.7489, lng: -83.7534, zoom: 7 },
  'Panamá': { lat: 8.538, lng: -80.7821, zoom: 7 },
  'Colombia': { lat: 4.5709, lng: -74.2973, zoom: 5 },
  'Perú': { lat: -9.19, lng: -75.0152, zoom: 5 },
  'Paraguay': { lat: -23.4425, lng: -58.4438, zoom: 6 },
  'Brasil': { lat: -14.235, lng: -51.9253, zoom: 4 },
  'Argentina': { lat: -38.4161, lng: -63.6167, zoom: 4 },
  'Inglaterra': { lat: 52.3555, lng: -1.1743, zoom: 6 },
  'Francia': { lat: 46.6034, lng: 1.8883, zoom: 6 },
  'Mónaco': { lat: 43.7384, lng: 7.4246, zoom: 10 },
  'Bélgica': { lat: 50.5039, lng: 4.4699, zoom: 7 },
  'Países Bajos': { lat: 52.1326, lng: 5.2913, zoom: 7 },
  'Alemania': { lat: 51.1657, lng: 10.4515, zoom: 6 },
  'Italia': { lat: 41.8719, lng: 12.5674, zoom: 6 },
  'Suiza': { lat: 46.8182, lng: 8.2275, zoom: 7 },
  'Ciudad de Vaticano': { lat: 41.9029, lng: 12.4534, zoom: 13 },
  'Portugal': { lat: 39.3999, lng: -8.2245, zoom: 6 },
  'España': { lat: 40.4637, lng: -3.7492, zoom: 6 }
};

async function loadCountries() {
  try {
    const response = await fetch('data/countries.json');
    if (!response.ok) {
      throw new Error('No se pudo cargar data/countries.json');
    }
    countries = await response.json();
    filteredCountries = countries;
    bindSearch();
    renderCountryList();
  } catch (error) {
    countryList.innerHTML = `<p class="error">${error.message}</p>`;
    countrySummary.textContent = 'No hay países disponibles';
    if (totalCountries) totalCountries.textContent = '0';
  }
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


function createList(items) {
  if (!items || items.length === 0) {
    return '<p>Ninguno</p>';
  }
  return `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
}

function createPhotoGrid(photos) {
  if (!photos || photos.length === 0) {
    return '<p>No hay fotos disponibles.</p>';
  }
  return `
    <div class="photo-grid">
      ${photos.map(photo => `<img src="${photo}" alt="Foto de viaje en ${photo}" loading="lazy" />`).join('')}
    </div>
  `;
}

function getCountryMapLocation(country) {
  return countryMapLocations[country.name] || { lat: 20, lng: 0, zoom: 2 };
}

function destroyDetailMap() {
  if (detailMap) {
    detailMap.remove();
    detailMap = null;
  }
}

function normalizeTravelText(value) {
  return (value || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getCountryTravelTips(country) {
  const travelTips = {
    climate: 'Clima agradable y fácil de planificar.',
    estimatedCost: 'Coste medio para una escapada equilibrada.',
    bestTime: 'Ideal para viajar en temporada baja o intermedia.'
  };

  if (country.climate) travelTips.climate = country.climate;
  if (country.estimatedCost) travelTips.estimatedCost = country.estimatedCost;
  if (country.bestTime) travelTips.bestTime = country.bestTime;

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
  const name = normalizeTravelText(country.name);
  const region = normalizeTravelText(country.region);
  const places = normalizeTravelText((country.places || []).join(' '));
  const activities = normalizeTravelText((country.activities || []).join(' '));

  const primaryPlace = country.places?.[0] || 'el destino principal';
  const secondaryPlace = country.places?.[1] || country.places?.[0] || 'otro rincón del país';
  const thirdPlace = country.places?.[2] || country.places?.[1] || country.places?.[0] || 'un lugar especial';

  const recommendation = {
    mustSee: `No te pierdas ${primaryPlace} y alguno de los otros puntos que marcaste en tu ruta.`,
    localTip: 'Prueba sabores locales y conversa con la gente del lugar para descubrir rincones que no salen en las guías.',
    pace: 'Reserva tiempo para caminar sin prisa y mezclar visitas principales con momentos espontáneos.'
  };

  if (name.includes('mexico')) {
    recommendation.mustSee = `No te pierdas ${secondaryPlace === 'otro rincón del país' ? 'Teotihuacán y una tarde de comida callejera auténtica' : `${secondaryPlace} y una tarde de comida callejera auténtica`}.`;
    recommendation.localTip = 'Pregunta por mercados y antojitos locales; suelen ser el mejor punto para entender la ciudad.';
    recommendation.pace = 'Combina ruinas, centro urbano y una pausa para comer sin prisas.';
  } else if (name.includes('costa rica')) {
    recommendation.mustSee = 'No te pierdas hacer canopy en Monteverde y recorrer una reserva natural o una playa al atardecer.';
    recommendation.localTip = 'Lleva ropa ligera, bloqueador y pregunta por rutas seguras de senderismo antes de salir.';
    recommendation.pace = 'Haz base en una zona y deja margen para naturaleza, aventura y descanso.';
  } else if (name.includes('guatemala')) {
    recommendation.mustSee = 'No te pierdas Tikal y un recorrido por Antigua o el Lago de Atitlán.';
    recommendation.localTip = 'Los mercados locales y los traslados tempranos te ayudan a aprovechar mejor el día.';
    recommendation.pace = 'Divide el viaje entre historia, volcanes y una visita tranquila a pueblos coloniales.';
  } else if (name.includes('el salvador')) {
    recommendation.mustSee = 'No te pierdas El Boquerón y una parada en la Puerta del Diablo.';
    recommendation.localTip = 'Reserva tiempo para probar pupusas en un lugar local y conversar con la gente del área.';
    recommendation.pace = 'Es un destino ideal para combinar miradores, ciudad y comida en un mismo día.';
  } else if (name.includes('panama')) {
    recommendation.mustSee = 'No te pierdas el Canal de Panamá y una escapada a Bocas del Toro o al casco antiguo.';
    recommendation.localTip = 'Aprovecha las caminatas cortas por la ciudad y deja una tarde para zona costera o islas.';
    recommendation.pace = 'Mezcla ciudad, canal y descanso junto al mar para que el viaje quede equilibrado.';
  } else if (name.includes('peru')) {
    recommendation.mustSee = 'No te pierdas Machu Picchu y un recorrido por Cusco o el Valle Sagrado.';
    recommendation.localTip = 'Aclimatarte un día antes de subir a zonas altas te cambia por completo la experiencia.';
    recommendation.pace = 'Alterna ruinas, ciudad y caminatas suaves para no saturarte con la altura.';
  } else if (name.includes('paraguay')) {
    recommendation.mustSee = 'No te pierdas Ciudad del Este y la triple frontera.';
    recommendation.localTip = 'Cruza temprano, compara precios con calma y deja espacio para caminar la frontera a pie.';
    recommendation.pace = 'Funciona mejor como viaje breve pero muy activo entre compras y frontera.';
  } else if (name.includes('brasil')) {
    recommendation.mustSee = 'No te pierdas las cataratas del Iguazú y una tarde en Río de Janeiro.';
    recommendation.localTip = 'Combina playa, miradores y traslados con tiempo; el tamaño del país hace que todo tome más de lo previsto.';
    recommendation.pace = 'Divide el viaje por zonas para aprovechar mejor ciudad, playa y naturaleza.';
  } else if (name.includes('argentina')) {
    recommendation.mustSee = 'No te pierdas Buenos Aires, Mendoza y una visita a las Cataratas del Iguazú.';
    recommendation.localTip = 'Reserva tiempo para asado, caminatas urbanas y algún plan de clima frío si vas en temporada adecuada.';
    recommendation.pace = 'Mejor con una ruta clara entre ciudad, vino y naturaleza para que el viaje no se disperse.';
  } else if (name.includes('inglaterra')) {
    recommendation.mustSee = 'No te pierdas Londres y el Harry Potter Studios, además de algún paseo histórico.';
    recommendation.localTip = 'Usa transporte público y deja margen para museos, plazas y barrios con mucha vida.';
    recommendation.pace = 'Es un destino ideal para alternar historia, estudio de cine y caminatas urbanas.';
  } else if (name.includes('francia')) {
    recommendation.mustSee = `No te pierdas París y alguna salida a ${thirdPlace}.`;
    recommendation.localTip = 'Aprovecha museos, cafeterías y paseos largos por la ciudad; allí se vive el viaje con calma.';
    recommendation.pace = 'Combina monumentos, comida y un paseo menos planificado para que el viaje se sienta completo.';
  } else if (name.includes('italia')) {
    recommendation.mustSee = 'No te pierdas el Coliseo Romano y el recorrido entre Roma, Venecia y Florencia.';
    recommendation.localTip = 'Deja espacio para comidas largas y traslados entre ciudades; vale la pena ir sin prisa.';
    recommendation.pace = 'Tu ruta funciona mejor como viaje cultural con pausas para disfrutar cada ciudad.';
  } else if (name.includes('espana')) {
    recommendation.mustSee = 'No te pierdas los estadios, el centro histórico y una caminata por Madrid o Barcelona.';
    recommendation.localTip = 'Aprovecha los horarios largos de comida y la vida nocturna en barrios céntricos.';
    recommendation.pace = 'Haz una mezcla de ciudad, fútbol y paseo urbano para que el viaje quede bien redondo.';
  } else if (region.includes('europa')) {
    recommendation.mustSee = `No te pierdas el casco histórico de ${primaryPlace} y una caminata sin plan fijo por sus calles.`;
    recommendation.localTip = 'Usa transporte público y reserva tiempo para cafés, plazas y barrios antiguos.';
    recommendation.pace = 'Conviene viajar con poca rigidez para dejar espacio a museos y rincones imprevistos.';
  } else if (region.includes('centroamerica')) {
    recommendation.mustSee = `No te pierdas ${primaryPlace} y los paisajes o mercados que rodean esa zona.`;
    recommendation.localTip = 'Pregunta por rutas tempranas y lleva siempre algo de efectivo para comer y moverte.';
    recommendation.pace = 'Mejor en un ritmo mixto: naturaleza por la mañana y ciudad o comida por la tarde.';
  } else if (region.includes('sudamerica')) {
    recommendation.mustSee = `No te pierdas ${primaryPlace} y al menos otro punto de tu lista, como ${secondaryPlace}.`;
    recommendation.localTip = 'Ajusta tus recorridos por zonas y clima; las distancias entre lugares suelen ser mayores de lo que parecen.';
    recommendation.pace = 'Divide el viaje por bloques para que ciudad, naturaleza y gastronomía no se sientan apurados.';
  }

  if (places.includes('playa') || activities.includes('playa')) {
    recommendation.mustSee = 'No te pierdas una puesta de sol frente al mar y deja tiempo para una caminata tranquila por la costa.';
  }

  if (places.includes('canopy') || activities.includes('canopy')) {
    recommendation.mustSee = 'No te pierdas hacer canopy y combinarlo con una caminata por la zona natural que ya marcaste.';
  }

  if (places.includes('mercado') || activities.includes('mercado')) {
    recommendation.localTip = 'Tu mejor consejo local aquí es ir temprano al mercado, porque allí se siente más auténtico el destino.';
  }

  if (places.includes('estadio') || activities.includes('estadio') || activities.includes('futbol')) {
    recommendation.mustSee = 'No te pierdas el estadio o la visita deportiva que marcaste; suele ser uno de los momentos más memorables.';
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
          ${createPhotoGrid(country.photos)}
        </div>
      </div>
    </section>
  `;

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

function setupRevealObserver() {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  reveals.forEach(item => observer.observe(item));
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
setupHeroCarousel();
