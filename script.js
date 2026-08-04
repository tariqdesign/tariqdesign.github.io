// Mobile navigation. The 800px value matches the breakpoint in styles.css.
const menuButton = document.querySelector('[data-menu-button]');
const nav = document.querySelector('[data-nav]');

if (menuButton && nav) {
  const sectionLinks = [...nav.querySelectorAll('a[href^="#"]')];
  const sections = sectionLinks
    .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
    .filter(({ section }) => section);

  const closeMenu = () => {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.textContent = 'Menu';
    nav.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  };

  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menuButton.textContent = isOpen ? 'Menu' : 'Close';
    nav.classList.toggle('is-open', !isOpen);
    document.body.classList.toggle('menu-open', !isOpen);
  });

  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 800) closeMenu();
  });

  // Keep the highlighted navigation item aligned with the visible section.
  let activeFrame;
  const updateActiveLink = () => {
    const readingLine = window.scrollY + (window.innerHeight * 0.35);
    let current = sections[0];

    sections.forEach((item) => {
      if (item.section.offsetTop <= readingLine) current = item;
    });

    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      current = sections.at(-1);
    }

    sections.forEach(({ link }) => {
      const isCurrent = link === current.link;
      link.classList.toggle('is-active', isCurrent);
      if (isCurrent) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  const requestActiveLinkUpdate = () => {
    if (activeFrame) return;
    activeFrame = window.requestAnimationFrame(() => {
      updateActiveLink();
      activeFrame = null;
    });
  };

  updateActiveLink();
  window.addEventListener('scroll', requestActiveLinkUpdate, { passive: true });
  window.addEventListener('resize', requestActiveLinkUpdate);
}
