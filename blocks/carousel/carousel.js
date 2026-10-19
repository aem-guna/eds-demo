
/* carousel.js */

export default function decorate(block) {
  // Avoid decorating the same block more than once.
  if (block.dataset.carouselReady === 'true') return;
  block.dataset.carouselReady = 'true';

  const rows = [...block.children];

  // Expected structure:
  // First row: previous navigation placeholder (>>)
  // Middle rows: image and caption slides
  // Last row: next navigation placeholder (>>)
  if (rows.length < 3) return;

  const slides = rows.slice(1, -1);

  if (!slides.length) return;

  // Build the carousel viewport and track.
  const viewport = document.createElement('div');
  viewport.className = 'carousel-viewport';
  viewport.setAttribute('aria-roledescription', 'carousel');

  const track = document.createElement('div');
  track.className = 'carousel-track';

  slides.forEach((slide, index) => {
    slide.classList.add('carousel-slide');
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${index + 1} of ${slides.length}`);

    track.append(slide);
  });

  viewport.append(track);

  // Create navigation controls.
  const controls = document.createElement('div');
  controls.className = 'carousel-controls';

  const previous = document.createElement('button');
  previous.className = 'carousel-button';
  previous.type = 'button';
  previous.textContent = '‹';
  previous.setAttribute('aria-label', 'Previous slide');

  const dots = document.createElement('div');
  dots.className = 'carousel-dots';
  dots.setAttribute('aria-label', 'Choose a slide');

  const next = document.createElement('button');
  next.className = 'carousel-button';
  next.type = 'button';
  next.textContent = '›';
  next.setAttribute('aria-label', 'Next slide');

  controls.append(previous, dots, next);

  // Replace the original placeholder rows.
  block.replaceChildren(viewport, controls);

  let index = 0;
  let visibleSlides = 1;
  const dotButtons = [];

  // Number of slides displayed at the current viewport width.
  function getVisibleSlides() {
    return window.matchMedia('(min-width: 600px)').matches ? 2 : 1;
  }

  function getMaxIndex() {
    return Math.max(0, slides.length - visibleSlides);
  }

  function buildDots() {
    dots.replaceChildren();
    dotButtons.length = 0;

    const pages = getMaxIndex() + 1;

    for (let i = 0; i < pages; i += 1) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot';
      dot.type = 'button';
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);

      dot.addEventListener('click', () => {
        index = i;
        update();
      });

      dots.append(dot);
      dotButtons.push(dot);
    }

    dots.hidden = pages <= 1;
  }

  function update() {
    visibleSlides = getVisibleSlides();
    index = Math.min(index, getMaxIndex());

    // Calculate slide width and gap from the actual rendered layout.
    const slide = slides[0];
    if (!slide) return;

    const slideWidth = slide.getBoundingClientRect().width;
    const trackStyle = window.getComputedStyle(track);
    const gap = parseFloat(trackStyle.columnGap) || 0;
    const offset = index * (slideWidth + gap);

    track.style.transform = `translateX(-${offset}px)`;

    previous.disabled = index === 0;
    next.disabled = index >= getMaxIndex();

    dotButtons.forEach((dot, i) => {
      dot.setAttribute(
        'aria-current',
        i === index ? 'true' : 'false'
      );
    });
  }

  previous.addEventListener('click', () => {
    if (index > 0) {
      index -= 1;
      update();
    }
  });

  next.addEventListener('click', () => {
    if (index < getMaxIndex()) {
      index += 1;
      update();
    }
  });

  // Recalculate slide widths when the viewport changes.
  let resizeFrame;
  window.addEventListener('resize', () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => {
      visibleSlides = getVisibleSlides();
      buildDots();
      update();
    });
  });

  // Optional keyboard navigation while focus is inside the carousel.
  block.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      index = Math.max(0, index - 1);
      update();
    } else if (event.key === 'ArrowRight') {
      index = Math.min(getMaxIndex(), index + 1);
      update();
    }
  });

  buildDots();
  update();
}
s