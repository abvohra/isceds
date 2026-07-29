/**
 * category-nav
 *
 * Horizontal row of category CTA links (e.g. SKINCARE, MAKEUP, FRAGRANCE).
 * Each authored row is one link:
 *   | category-nav |                              |
 *   | SKINCARE     | /en/brand/lancome/skincare   |
 */
export default function decorate(block) {
  const nav = document.createElement('nav');
  nav.className = 'category-nav-list';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const label = cells[0]?.textContent.trim();
    const href = cells[1]?.querySelector('a')?.getAttribute('href')
      || cells[1]?.textContent.trim();
    if (!label) return;

    const link = document.createElement('a');
    link.className = 'category-nav-item';
    if (href) link.href = href;
    link.textContent = label;
    nav.append(link);
  });

  block.textContent = '';
  block.append(nav);
}
