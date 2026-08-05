const countryList = document.getElementById('country-list');
const countryDetail = document.getElementById('country-detail');
const countrySummary = document.getElementById('country-summary');
const totalCountries = document.getElementById('total-countries');
const searchInput = document.getElementById('search-country');
let countries = [];
let filteredCountries = [];
let activeIndex = 0;

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
    return `
      <article class="country-card${index === activeIndex ? ' active' : ''}" data-index="${index}">
        <h4>${country.name}</h4>
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

function renderCountryDetail(country) {
  if (!country) return;

  const imageUrl = country.photos && country.photos.length > 0 ? country.photos[0] : 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80';
  const countryCountText = filteredCountries.length === countries.length ? countries.length : `${activeIndex + 1} / ${filteredCountries.length}`;

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
          <h4>Lugares destacados</h4>
          ${createList(country.places)}
        </div>

        <div class="detail-section">
          <h4>Actividades favoritas</h4>
          ${createList(country.activities)}
        </div>

        <div class="detail-section">
          <h4>Experiencias</h4>
          <p>${country.experiences || 'Sin comentarios adicionales.'}</p>
        </div>

        <div class="detail-section">
          <h4>Fotos</h4>
          ${createPhotoGrid(country.photos)}
        </div>
      </div>
    </section>
  `;
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
