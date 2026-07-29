import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Classify the two content sections: info row (top) and legal bar (bottom).
  const sections = footer.querySelectorAll(':scope > div');
  if (sections[0]) sections[0].classList.add('footer-info');
  if (sections.length > 1) {
    sections[sections.length - 1].classList.add('footer-legal');
  }

  // The "Let's Connect" list is the social row — mark it and tag each platform.
  const infoSection = footer.querySelector('.footer-info');
  if (infoSection) {
    const lists = infoSection.querySelectorAll('ul');
    const socialList = lists[lists.length - 1];
    if (socialList && socialList !== lists[0]) {
      socialList.classList.add('footer-social');
      socialList.querySelectorAll('a').forEach((a) => {
        const label = a.textContent.trim().toLowerCase();
        a.classList.add('footer-social-link', `footer-social-${label}`);
        a.setAttribute('aria-label', a.textContent.trim());
        a.textContent = '';
      });
    }
  }

  block.append(footer);
}
