import { readBlockConfig, createOptimizedPicture } from '../../scripts/aem.js';

/**
 * product-list-page
 *
 * Authored as a config block:
 *   | product-list-page |          |
 *   | urlPath           | lancome  |
 *
 * At runtime the block queries the Adobe Commerce catalog (Live Search /
 * Catalog Service GraphQL) for the products in the given category/brand and
 * renders a responsive grid. No product data is baked into the page — the
 * shell stays cacheable and the grid hydrates client-side.
 */

// Commerce backend configuration. Override per environment via a <meta> tag in
// head.html, e.g. <meta name="commerce-endpoint" content="https://.../graphql">.
function getCommerceConfig() {
  const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.content?.trim();
  return {
    endpoint: meta('commerce-endpoint'),
    environmentId: meta('commerce-environment-id'),
    storeCode: meta('commerce-store-code'),
    storeViewCode: meta('commerce-store-view-code'),
    websiteCode: meta('commerce-website-code'),
    apiKey: meta('commerce-x-api-key'),
    pageSize: Number(meta('commerce-page-size')) || 12,
  };
}

const PRODUCT_SEARCH_QUERY = `
  query ProductSearch($phrase: String!, $filter: [SearchClauseInput!], $pageSize: Int!) {
    productSearch(phrase: $phrase, filter: $filter, page_size: $pageSize) {
      items {
        productView {
          name
          sku
          urlKey
          images(roles: ["small_image"]) { url label }
          ... on SimpleProductView {
            price {
              final { amount { value currency } }
              regular { amount { value currency } }
            }
          }
        }
      }
      total_count
    }
  }`;

async function fetchProducts(config, urlPath) {
  const headers = { 'Content-Type': 'application/json' };
  if (config.apiKey) headers['x-api-key'] = config.apiKey;
  if (config.environmentId) headers['Magento-Environment-Id'] = config.environmentId;
  if (config.storeCode) headers['Magento-Store-Code'] = config.storeCode;
  if (config.storeViewCode) headers['Magento-Store-View-Code'] = config.storeViewCode;
  if (config.websiteCode) headers['Magento-Website-Code'] = config.websiteCode;

  const res = await fetch(config.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: PRODUCT_SEARCH_QUERY,
      variables: {
        phrase: '',
        filter: [{ attribute: 'categoryPath', eq: urlPath }],
        pageSize: config.pageSize,
      },
    }),
  });
  if (!res.ok) throw new Error(`Commerce API responded ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join('; '));
  return json.data?.productSearch?.items ?? [];
}

function formatPrice(price) {
  const amount = price?.final?.amount;
  if (!amount) return '';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: amount.currency }).format(amount.value);
  } catch {
    return `${amount.currency} ${amount.value}`;
  }
}

function renderProduct(item) {
  const p = item.productView;
  const li = document.createElement('li');
  li.className = 'product-list-page-item';

  const image = p.images?.[0];
  const imageWrap = document.createElement('div');
  imageWrap.className = 'product-list-page-item-image';
  if (image?.url) {
    imageWrap.append(createOptimizedPicture(image.url, p.name, false, [{ width: '400' }]));
  }
  li.append(imageWrap);

  const body = document.createElement('div');
  body.className = 'product-list-page-item-body';
  const title = document.createElement('p');
  title.className = 'product-list-page-item-title';
  title.textContent = p.name;
  body.append(title);

  const priceText = formatPrice(p.price);
  if (priceText) {
    const price = document.createElement('p');
    price.className = 'product-list-page-item-price';
    price.textContent = priceText;
    body.append(price);
  }
  li.append(body);
  return li;
}

// A row is authored product content (not config) when it contains an image.
function isProductRow(row) {
  return !!row.querySelector('picture, img');
}

// Badge styling class per known label; anything else uses the default pill.
function badgeClass(label) {
  const key = label.toLowerCase();
  if (key === 'exclusive') return 'product-list-page-badge-exclusive';
  if (key === 'promo') return 'product-list-page-badge-promo';
  if (/off$/.test(key)) return 'product-list-page-badge-discount';
  return 'product-list-page-badge-default';
}

function renderAuthoredProduct(row) {
  const cells = [...row.children];
  const li = document.createElement('li');
  li.className = 'product-list-page-item';

  const link = row.querySelector('a')?.getAttribute('href');
  const wrapper = link ? document.createElement('a') : document.createElement('div');
  if (link) wrapper.href = link;
  wrapper.className = 'product-list-page-item-link';

  const imageCell = cells[0];
  const picture = imageCell?.querySelector('picture, img');
  const imageWrap = document.createElement('div');
  imageWrap.className = 'product-list-page-item-image';

  // Badges are authored as a comma-separated list in the image cell (as text,
  // alongside the image) or as its own paragraph, e.g. "Exclusive, Promo".
  const badgeText = [...(imageCell?.querySelectorAll('p') || [])]
    .map((p) => p.textContent.trim())
    .filter(Boolean)
    .join(',');
  if (badgeText) {
    const badgeRow = document.createElement('div');
    badgeRow.className = 'product-list-page-badges';
    badgeText.split(',').map((b) => b.trim()).filter(Boolean).forEach((label) => {
      const span = document.createElement('span');
      span.className = `product-list-page-badge ${badgeClass(label)}`;
      span.textContent = label;
      badgeRow.append(span);
    });
    imageWrap.append(badgeRow);
  }

  if (picture) {
    const img = picture.tagName === 'IMG' ? picture : picture.querySelector('img');
    if (img) imageWrap.append(createOptimizedPicture(img.src, img.alt || '', false, [{ width: '400' }]));
  }
  wrapper.append(imageWrap);

  const body = document.createElement('div');
  body.className = 'product-list-page-item-body';
  const textCell = cells[1];
  if (textCell) {
    [...textCell.children].forEach((node) => {
      const p = document.createElement('p');
      p.innerHTML = node.innerHTML;
      const text = node.textContent.trim();
      if (/^(from|s\$|sgd|\$)/i.test(text) || /\d/.test(text)) p.classList.add('product-list-page-item-price');
      else if (text.toLowerCase() === 'lancôme' || text.length < 16) p.classList.add('product-list-page-item-brand');
      else p.classList.add('product-list-page-item-title');
      body.append(p);
    });
  }
  wrapper.append(body);
  li.append(wrapper);
  return li;
}

function buildCarousel(items) {
  const carousel = document.createElement('div');
  carousel.className = 'product-list-page-carousel';

  const heading = document.createElement('h3');
  heading.className = 'product-list-page-heading';
  heading.textContent = 'Best Sellers';

  const viewport = document.createElement('div');
  viewport.className = 'product-list-page-viewport';

  const track = document.createElement('ul');
  track.className = 'product-list-page-grid';
  items.forEach((li) => track.append(li));
  viewport.append(track);

  const prev = document.createElement('button');
  prev.className = 'product-list-page-arrow product-list-page-arrow-prev';
  prev.type = 'button';
  prev.setAttribute('aria-label', 'Previous products');
  prev.textContent = '‹';

  const next = document.createElement('button');
  next.className = 'product-list-page-arrow product-list-page-arrow-next';
  next.type = 'button';
  next.setAttribute('aria-label', 'Next products');
  next.textContent = '›';

  const scrollByCards = (dir) => {
    const card = track.querySelector('.product-list-page-item');
    const step = card ? card.getBoundingClientRect().width + 24 : viewport.clientWidth;
    viewport.scrollBy({ left: dir * step, behavior: 'smooth' });
  };
  prev.addEventListener('click', () => scrollByCards(-1));
  next.addEventListener('click', () => scrollByCards(1));

  carousel.append(heading, prev, viewport, next);
  return carousel;
}

export default async function decorate(block) {
  const rows = [...block.children];
  const productRows = rows.filter(isProductRow);
  const config = readBlockConfig(block);
  const urlPath = config.urlpath || config['url-path'] || config.urlPath || '';
  const commerce = getCommerceConfig();

  // Authored static products take precedence — mirror the source page exactly.
  if (productRows.length > 0) {
    const items = productRows.map((row) => renderAuthoredProduct(row));
    block.textContent = '';
    block.append(buildCarousel(items));
    return;
  }

  block.textContent = '';
  const grid = document.createElement('ul');
  grid.className = 'product-list-page-grid';
  block.append(grid);

  if (!commerce.endpoint) {
    const notice = document.createElement('p');
    notice.className = 'product-list-page-notice';
    notice.textContent = 'Products will appear here once the Adobe Commerce backend is configured.';
    block.append(notice);
    return;
  }

  try {
    const items = await fetchProducts(commerce, urlPath);
    if (items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'product-list-page-notice';
      empty.textContent = 'No products found.';
      block.append(empty);
      return;
    }
    items.forEach((item) => grid.append(renderProduct(item)));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('product-list-page: failed to load products', error);
    const err = document.createElement('p');
    err.className = 'product-list-page-notice';
    err.textContent = 'Products are temporarily unavailable.';
    block.append(err);
  }
}
