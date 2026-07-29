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

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const urlPath = config.urlpath || config['url-path'] || config.urlPath || '';
  const commerce = getCommerceConfig();

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
