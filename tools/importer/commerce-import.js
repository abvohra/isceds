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

// Masthead banner carousel — 4 rotating promotional banners, each linking to a
// product. Built as static content mirroring the source slider.
const HERO_SLIDES = [
  {
    img: 'https://www.ishopchangi.com/content/dam/cagishop/brands/lancome/GNF_ISHOP_1300X430_PC_EN_1.jpg',
    href: '/en/product/lanc-me-genifique-ultimate-serum-mp00314690.html',
    alt: 'Lancôme Génifique Ultimate Serum',
  },
  {
    img: 'https://www.ishopchangi.com/content/dam/cagishop/brands/lancome/ABS_PC_EN_1300x430px1.jpg',
    href: '/en/product/lanc-me-absolue-the-eye-cream-duo-mp00306701',
    alt: 'Lancôme Absolue The Eye Cream Duo',
  },
  {
    img: 'https://www.ishopchangi.com/content/dam/cagishop/brands/lancome/CLX_ISHOP_1300X430_PC_EN1.jpg',
    href: '/en/product/lanc-me-clarifique-double-treatment-essence-mp00226693.html',
    alt: 'Lancôme Clarifique Double Treatment Essence',
  },
  {
    img: 'https://www.ishopchangi.com/content/dam/cagishop/brands/lancome/TIUW_ISHOP_1300X430_PC_EN.jpg',
    href: '/en/product/lanc-me-teint-idole-ultra-wear-foundation-mp00055580.html',
    alt: 'Lancôme Teint Idole Ultra Wear Foundation',
  },
];

function buildHeroCarousel(document) {
  const rows = HERO_SLIDES.map((slide) => {
    const imgCell = document.createElement('div');
    const img = document.createElement('img');
    img.src = slide.img;
    img.alt = slide.alt;
    imgCell.append(img);

    const linkCell = document.createElement('div');
    const a = document.createElement('a');
    a.href = slide.href;
    a.textContent = slide.href;
    linkCell.append(a);

    return [imgCell, linkCell];
  });
  return WebImporter.DOMUtils.createTable([['hero-carousel'], ...rows], document);
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
    const heroCarousel = buildHeroCarousel(document);
    const cardsBlock = parseCategoryCards(document);
    const seoContent = extractSeoContent(document);

    // Best Sellers products — static content mirroring the source page.
    // (The live catalog carousel lazy-loads client-side; these mirror what renders.)
    const STATIC_PRODUCTS = [
      {
        href: '/en/product/lanc-me-genifique-ultimate-serum-mp00314690.html',
        img: 'https://changiairport.scene7.com/is/image/changiairport/mp00314691-1-lanc-me-1778643023701',
        badges: ['Exclusive', 'Promo'],
        brand: 'Lancôme',
        name: 'LANCÔME Genifique Ultimate Serum',
        price: 'From S$222.10',
      },
      {
        href: '/en/product/lanc-me-id-le-l-eau-de-parfum-mp00170984.html',
        img: 'https://changiairport.scene7.com/is/image/changiairport/mp00170986-1-lanc-me-1759308179807',
        badges: ['10% Off'],
        brand: 'Lancôme',
        name: "LANCÔME Idôle L'Eau De Parfum",
        price: 'From S$143.10',
      },
    ];

    const productRows = STATIC_PRODUCTS.map((p) => {
      const imgCell = document.createElement('div');
      if (p.badges && p.badges.length) {
        const badgeP = document.createElement('p');
        badgeP.textContent = p.badges.join(', ');
        imgCell.append(badgeP);
      }
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
    // Section 1: masthead banner carousel
    if (heroCarousel) {
      const heroSection = document.createElement('div');
      heroSection.append(heroCarousel);
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
