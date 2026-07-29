/* global WebImporter */

/**
 * PLP import script for ishopchangi.com brand pages (e.g. /en/brand/lancome).
 *
 * Pattern: extract standard content while the DOM is intact, clear <main>, then
 * rebuild sections in page order. The product grid ("Best Sellers") is replaced by
 * the `product-list-page` commerce block, which loads products at runtime via the
 * catalog API — no product data is extracted here.
 */

// --- Standard block parsers (document-scoped, return table nodes) ---

function parseHeroBlock(document) {
  const banner = document.querySelector('.master-banner');
  if (!banner) {
    console.warn('⚠️ parseHeroBlock: .master-banner not found');
    return null;
  }
  const img = banner.querySelector('img');
  if (!img) {
    console.warn('⚠️ parseHeroBlock: no image inside .master-banner');
    return null;
  }
  return WebImporter.DOMUtils.createTable([['hero'], [img]], document);
}

function parseCategoryCards(document) {
  const tiles = [...document.querySelectorAll('a.inline-block > img.ms-image-width')];
  if (tiles.length === 0) {
    console.warn('⚠️ parseCategoryCards: no .ms-image-width tiles found');
    return null;
  }
  const rows = [['cards']];
  tiles.forEach((img) => {
    const link = img.closest('a');
    const cell = document.createElement('div');
    cell.append(img);
    if (link && link.getAttribute('href')) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.textContent = link.getAttribute('href');
      cell.append(a);
    }
    rows.push([cell]);
  });
  return WebImporter.DOMUtils.createTable(rows, document);
}

function extractSeoContent(document) {
  const seo = document.querySelector('.rtext-custom');
  if (!seo) {
    console.warn('⚠️ extractSeoContent: .rtext-custom not found');
    return null;
  }
  return seo;
}

export default {
  transform({ document, url }) {
    const main = document.body;

    // STEP 1: extract everything while the DOM is intact
    const heroBlock = parseHeroBlock(document);
    const cardsBlock = parseCategoryCards(document);
    const seoContent = extractSeoContent(document);

    // Commerce block config (not DOM-dependent)
    const productListPageBlock = WebImporter.DOMUtils.createTable([
      ['product-list-page'],
      ['urlPath', 'lancome'],
    ], document);

    // STEP 2: clear — no DOM queries after this line
    main.innerHTML = '';

    // STEP 3: rebuild sections in page order
    // Section 1: masthead hero
    if (heroBlock) {
      const heroSection = document.createElement('div');
      heroSection.append(heroBlock);
      main.append(heroSection);
      main.append(document.createElement('hr'));
    }

    // Section 2: Best Sellers -> commerce product listing
    const commerceSection = document.createElement('div');
    commerceSection.append(productListPageBlock);
    main.append(commerceSection);
    main.append(document.createElement('hr'));

    // Section 3: category tiles
    if (cardsBlock) {
      const cardsSection = document.createElement('div');
      cardsSection.append(cardsBlock);
      main.append(cardsSection);
      main.append(document.createElement('hr'));
    }

    // Section 4: SEO rich text (default content)
    if (seoContent) {
      const seoSection = document.createElement('div');
      seoSection.append(seoContent);
      main.append(seoSection);
    }

    // STEP 4: metadata + built-in rules
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.adjustImageUrls(main, url);

    const rawPath = new URL(url).pathname.replace(/\.html?$/i, '').replace(/\/+$/, '') || '/';
    return [{ element: main, path: WebImporter.FileUtils.sanitizePath(rawPath) }];
  },
};
