import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(min-width: 900px)');

function closeAllDropdowns(nav) {
  nav.querySelectorAll('.nav-sections .nav-drop[aria-expanded="true"]')
    .forEach((drop) => drop.setAttribute('aria-expanded', 'false'));
}

function toggleMenu(nav, button, forceExpanded = null) {
  const expanded = forceExpanded !== null
    ? !forceExpanded
    : nav.getAttribute('aria-expanded') === 'true';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  closeAllDropdowns(nav);
}

export default async function decorate(block) {
  // nav path comes from <meta name="nav" content="/nav"> or defaults to /nav
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // Section 1 = brand, 2 = sections, 3 = tools
  ['brand', 'sections', 'tools'].forEach((cls, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${cls}`);
  });

  const brand = nav.querySelector('.nav-brand');
  if (brand) {
    const link = brand.querySelector('.button');
    if (link) {
      link.className = '';
      link.closest('.button-container')?.classList.remove('button-container');
    }
  }

  // Dropdown behaviour
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope > .default-content-wrapper > ul > li, :scope > ul > li')
      .forEach((li) => {
        if (li.querySelector('ul')) {
          li.classList.add('nav-drop');
          li.setAttribute('aria-expanded', 'false');
          const trigger = li.firstElementChild;
          trigger?.addEventListener('click', (e) => {
            if (trigger.tagName === 'A' && isDesktop.matches) {
              // keep link clickable on desktop, open on hover/focus instead
              return;
            }
            e.preventDefault();
            const open = li.getAttribute('aria-expanded') === 'true';
            closeAllDropdowns(nav);
            li.setAttribute('aria-expanded', open ? 'false' : 'true');
          });
          li.addEventListener('mouseenter', () => {
            if (isDesktop.matches) li.setAttribute('aria-expanded', 'true');
          });
          li.addEventListener('mouseleave', () => {
            if (isDesktop.matches) li.setAttribute('aria-expanded', 'false');
          });
          li.addEventListener('focusin', () => {
            if (isDesktop.matches) li.setAttribute('aria-expanded', 'true');
          });
        }
      });

    // Mark the current page as active
    navSections.querySelectorAll('a').forEach((a) => {
      const url = new URL(a.href, window.location);
      if (url.pathname === window.location.pathname) a.classList.add('active');
    });
  }

  // Hamburger (mobile)
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  const button = hamburger.querySelector('button');
  button.addEventListener('click', () => toggleMenu(nav, button));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      closeAllDropdowns(nav);
      if (!isDesktop.matches && nav.getAttribute('aria-expanded') === 'true') {
        toggleMenu(nav, button, false);
        button.focus();
      }
    }
  });
  isDesktop.addEventListener('change', () => toggleMenu(nav, button, isDesktop.matches));
  toggleMenu(nav, button, isDesktop.matches);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}