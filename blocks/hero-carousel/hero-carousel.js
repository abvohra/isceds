import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * hero-carousel
 *
 * Rotating masthead banner. Each authored row is one slide:
 *   | hero-carousel |                          |
 *   | [banner img]  | /link/for/this/slide     |
 *
 * Renders slides in a track with dot indicators and auto-advance.
 */

const AUTO_ADVANCE_MS = 5000;

function goToSlide(track, dots, index) {
  const slides = track.children;
  const target = (index + slides.length) % slides.length;
  track.style.transform = `translateX(-${target * 100}%)`;
  [...dots.children].forEach((dot, i) => {
    dot.setAttribute('aria-selected', i === target ? 'true' : 'false');
  });
  track.dataset.current = target;
}

export default function decorate(block) {
  const rows = [...block.children];

  const viewport = document.createElement('div');
  viewport.className = 'hero-carousel-viewport';
  const track = document.createElement('div');
  track.className = 'hero-carousel-track';
  track.dataset.current = '0';
  viewport.append(track);

  const dots = document.createElement('div');
  dots.className = 'hero-carousel-dots';
  dots.setAttribute('role', 'tablist');

  rows.forEach((row, i) => {
    const cells = [...row.children];
    const img = cells[0]?.querySelector('img');
    const href = row.querySelector('a')?.getAttribute('href') || cells[1]?.textContent.trim();

    const slide = document.createElement('div');
    slide.className = 'hero-carousel-slide';
    if (img) {
      const picture = createOptimizedPicture(img.src, img.alt || '', i === 0, [{ width: '1600' }]);
      if (href) {
        const link = document.createElement('a');
        link.href = href;
        link.append(picture);
        slide.append(link);
      } else {
        slide.append(picture);
      }
    }
    track.append(slide);

    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'hero-carousel-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', () => goToSlide(track, dots, i));
    dots.append(dot);
  });

  block.textContent = '';
  block.append(viewport, dots);

  if (rows.length > 1) {
    setInterval(() => {
      goToSlide(track, dots, Number(track.dataset.current) + 1);
    }, AUTO_ADVANCE_MS);
  }
}
