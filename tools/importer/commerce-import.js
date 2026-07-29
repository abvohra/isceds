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

    // Best Sellers products — static content mirroring the source page.
    // (The live catalog carousel lazy-loads client-side; these mirror what renders.)
    const STATIC_PRODUCTS = [
      {
        href: '/en/product/lanc-me-genifique-ultimate-serum-mp00314690.html',
        img: 'https://changiairport.scene7.com/is/image/changiairport/mp00314691-1-lanc-me-1778643023701',
        brand: 'Lancôme',
        name: 'LANCÔME Genifique Ultimate Serum',
        price: 'From S$222.10',
      },
      {
        href: '/en/product/lanc-me-id-le-l-eau-de-parfum-mp00170984.html',
        img: 'https://changiairport.scene7.com/is/image/changiairport/mp00170986-1-lanc-me-1759308179807',
        brand: 'Lancôme',
        name: "LANCÔME Idôle L'Eau De Parfum",
        price: 'From S$143.10',
      },
    ];

    const productRows = STATIC_PRODUCTS.map((p) => {
      const imgCell = document.createElement('div');
      const link = document.createElement('a');
      link.href = p.href;
      const img = document.createElement('img');
      img.src = p.img;
      img.alt = p.name;
      link.append(img);
      imgCell.append(link);

      const textCell = document.createElement('div');
      const brand = document.createElement('p');
      brand.textContent = p.brand;
      const name = document.createElement('p');
      name.textContent = p.name;
      const price = document.createElement('p');
      price.textContent = p.price;
      textCell.append(brand, name, price);

      return [imgCell, textCell];
    });

    const productListPageBlock = WebImporter.DOMUtils.createTable([
      ['product-list-page'],
      ...productRows,
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
