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

// Full-width static masthead banner (above the hero carousel).
function buildStaticBanner(document) {
  const imgCell = document.createElement('div');
  const img = document.createElement('img');
  img.src = 'https://www.ishopchangi.com/content/dam/cagishop/brands/lancome/ISC%20Masthead%20Banner_PC_EN_1920%C3%97250px.jpg';
  img.alt = 'Lancôme at iShopChangi';
  imgCell.append(img);

  const linkCell = document.createElement('div');
  const a = document.createElement('a');
  a.href = '/en/brand/lancome.html';
  a.textContent = '/en/brand/lancome.html';
  linkCell.append(a);

  return WebImporter.DOMUtils.createTable([['banner'], [imgCell, linkCell]], document);
}

// Category CTA links (SKINCARE, MAKEUP, FRAGRANCE, TRAVEL FAVORITES, GENIFIQUE).
const CATEGORY_LINKS = [
  { label: 'SKINCARE', href: '/en/brand/lancome/skincare.html' },
  { label: 'MAKEUP', href: '/en/brand/lancome/makeup.html' },
  { label: 'FRAGRANCE', href: '/en/brand/lancome/fragrance.html' },
  { label: 'TRAVEL FAVORITES', href: '/en/brand/lancome/best-seller' },
  { label: 'GENIFIQUE', href: '/en/brand/lancome/genifique' },
];

function buildCategoryNav(document) {
  const rows = CATEGORY_LINKS.map((c) => {
    const labelCell = document.createElement('div');
    labelCell.textContent = c.label;
    const hrefCell = document.createElement('div');
    const a = document.createElement('a');
    a.href = c.href;
    a.textContent = c.href;
    hrefCell.append(a);
    return [labelCell, hrefCell];
  });
  return WebImporter.DOMUtils.createTable([['category-nav'], ...rows], document);
}

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

// Category promo tiles — 4 square rounded image links (no captions), matching
// the source. The masthead banner is intentionally excluded (it is a separate
// section). Uses the `cards (category)` variant for image-only styling.
const CATEGORY_TILES = [
  { img: 'https://www.ishopchangi.com/content/dam/cagishop/brands/lancome/620.jpg', href: '/en/brand/lancome/skincare.html', alt: 'Skincare' },
  { img: 'https://www.ishopchangi.com/content/dam/cagishop/brands/lancome/%E4%BA%A7%E5%93%81%E5%88%86%E7%B1%BB-ISC-620x620%20%E6%8B%B7%E8%B4%9D1.jpg', href: '/en/brand/lancome/makeup.html', alt: 'Makeup' },
  { img: 'https://www.ishopchangi.com/content/dam/cagishop/brands/lancome/%E4%BA%A7%E5%93%81%E5%88%86%E7%B1%BB-ISC-620x620%20%E6%8B%B7%E8%B4%9D%2021.jpg', href: '/en/brand/lancome/fragrance.html', alt: 'Fragrance' },
  { img: 'https://www.ishopchangi.com/content/dam/cagishop/brands/lancome/%E4%BA%A7%E5%93%81%E5%88%86%E7%B1%BB-ISC-620x620%20%E6%8B%B7%E8%B4%9D%2031.jpg', href: '/en/brand/lancome/view-all.html?cagPromotionExclusive=Exclusive', alt: 'View All' },
];

function parseCategoryCards(document) {
  const rows = [['cards (category)']];
  CATEGORY_TILES.forEach((tile) => {
    const cell = document.createElement('div');
    const link = document.createElement('a');
    link.href = tile.href;
    const img = document.createElement('img');
    img.src = tile.img;
    img.alt = tile.alt;
    link.append(img);
    cell.append(link);
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
    const staticBanner = buildStaticBanner(document);
    const categoryNav = buildCategoryNav(document);
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

    const buildProductRows = () => STATIC_PRODUCTS.map((p) => {
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

    // Config rows are text-only 2-cell rows (no image); product rows contain images.
    const configRow = (key, value) => {
      const k = document.createElement('div');
      k.textContent = key;
      const v = document.createElement('div');
      v.textContent = value;
      return [k, v];
    };

    // Best Sellers — heading, no CTA.
    const bestSellersBlock = WebImporter.DOMUtils.createTable([
      ['product-list-page'],
      configRow('title', 'Best Sellers'),
      ...buildProductRows(),
    ], document);

    // Travel Exclusives — reuses the same products, adds a VIEW ALL BEAUTY CTA.
    const travelExclusivesBlock = WebImporter.DOMUtils.createTable([
      ['product-list-page'],
      configRow('title', 'Travel Exclusives'),
      configRow('cta', 'VIEW ALL BEAUTY'),
      configRow('ctaHref', '/en/category/beauty'),
      ...buildProductRows(),
    ], document);

    // STEP 2: clear — no DOM queries after this line
    main.innerHTML = '';

    // STEP 3: rebuild sections in page order
    // Section 1: full-width static banner
    const bannerSection = document.createElement('div');
    bannerSection.append(staticBanner);
    main.append(bannerSection);
    main.append(document.createElement('hr'));

    // Section 2: category CTA nav
    const categorySection = document.createElement('div');
    categorySection.append(categoryNav);
    main.append(categorySection);
    main.append(document.createElement('hr'));

    // Section 3: masthead banner carousel
    if (heroCarousel) {
      const heroSection = document.createElement('div');
      heroSection.append(heroCarousel);
      main.append(heroSection);
      main.append(document.createElement('hr'));
    }

    // Section 4: Best Sellers -> commerce product listing
    const commerceSection = document.createElement('div');
    commerceSection.append(bestSellersBlock);
    main.append(commerceSection);
    main.append(document.createElement('hr'));

    // Section 5: Travel Exclusives -> second product listing with CTA
    const travelSection = document.createElement('div');
    travelSection.append(travelExclusivesBlock);
    main.append(travelSection);
    main.append(document.createElement('hr'));

    // Section 6: category tiles
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
