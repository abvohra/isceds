import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * banner
 *
 * Full-width promotional banner image, optionally linked.
 *   | banner |                     |
 *   | [img]  | /link/target        |
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;
  const cells = [...row.children];
  const img = cells[0]?.querySelector('img');
  const href = block.querySelector('a')?.getAttribute('href') || cells[1]?.textContent.trim();

  block.textContent = '';
  if (!img) return;

  const picture = createOptimizedPicture(img.src, img.alt || '', true, [{ width: '1920' }]);
  if (href) {
    const link = document.createElement('a');
    link.href = href;
    link.className = 'banner-link';
    link.append(picture);
    block.append(link);
  } else {
    block.append(picture);
  }
}
