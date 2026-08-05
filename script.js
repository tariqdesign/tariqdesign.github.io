const CONTENT_PATHS = {
  site: './content/site.json',
  engagements: './content/engagements.json'
};

const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';

const setText = (element, value) => {
  if (element) element.textContent = isNonEmptyString(value) ? value : '';
};

const safeExternalUrl = (value) => {
  if (!isNonEmptyString(value)) return '';
  try {
    const url = new URL(value, window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
};

const publicAssetUrl = (value) => {
  if (!isNonEmptyString(value)) return '';
  const path = value.trim();
  if (/^https?:\/\//i.test(path)) return safeExternalUrl(path);
  return new URL(path.replace(/^\/+/, ''), document.baseURI).href;
};

const sanitiseRichText = (html) => {
  const template = document.createElement('template');
  template.innerHTML = isNonEmptyString(html) ? html : '';
  const allowedTags = new Set(['P', 'BR', 'STRONG', 'EM', 'CITE', 'A']);

  [...template.content.querySelectorAll('*')].forEach((element) => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...element.childNodes);
      return;
    }

    const originalHref = element.tagName === 'A' ? element.getAttribute('href') : '';
    [...element.attributes].forEach((attribute) => element.removeAttribute(attribute.name));
    if (element.tagName === 'A') {
      const href = safeExternalUrl(originalHref);
      if (href) {
        element.href = href;
        element.rel = 'noopener noreferrer';
      } else {
        element.replaceWith(...element.childNodes);
      }
    }
  });

  return template.content;
};

const renderSite = (site) => {
  if (!site || typeof site !== 'object' || Array.isArray(site)) {
    throw new TypeError('General website content must be a JSON object.');
  }

  document.querySelectorAll('[data-site]').forEach((element) => {
    setText(element, site[element.dataset.site]);
  });

  document.querySelectorAll('[data-rich-text]').forEach((element) => {
    element.replaceChildren(sanitiseRichText(site[element.dataset.richText]));
  });

  const labels = site.labels && typeof site.labels === 'object' ? site.labels : {};
  document.querySelectorAll('[data-label]').forEach((element) => {
    setText(element, labels[element.dataset.label]);
  });

  document.querySelectorAll('[data-optional-content]').forEach((element) => {
    element.hidden = !isNonEmptyString(site[element.dataset.optionalContent]);
  });

  document.querySelectorAll('[data-list-text]').forEach((element) => {
    const values = site[element.dataset.listText];
    setText(element, Array.isArray(values) ? values.filter(isNonEmptyString).join(', ') : '');
  });

  let hasPracticeContext = false;
  document.querySelectorAll('[data-optional-list]').forEach((element) => {
    const values = site[element.dataset.optionalList];
    const hasValues = Array.isArray(values) && values.some(isNonEmptyString);
    element.hidden = !hasValues;
    hasPracticeContext ||= hasValues;
  });
  const practiceContext = document.querySelector('[data-practice-context]');
  if (practiceContext) practiceContext.hidden = !hasPracticeContext;

  const capabilities = document.querySelector('[data-list="capabilities"]');
  if (capabilities) {
    const items = Array.isArray(site.capabilities) ? site.capabilities : [];
    capabilities.replaceChildren(...items.filter((item) => item && isNonEmptyString(item.title)).map((item) => {
      const article = document.createElement('article');
      const heading = document.createElement('h3');
      const description = document.createElement('p');
      setText(heading, item.title);
      setText(description, item.description);
      article.append(heading);
      if (description.textContent) article.append(description);
      return article;
    }));
  }

  const recognition = document.querySelector('[data-list="recognition"]');
  if (recognition) {
    const items = Array.isArray(site.recognition) ? site.recognition : [];
    recognition.replaceChildren(...items.filter((item) => item && (isNonEmptyString(item.name) || isNonEmptyString(item.detail))).map((item) => {
      const row = document.createElement('li');
      const name = document.createElement('span');
      const detail = document.createElement('span');
      setText(name, item.name);
      detail.append(sanitiseRichText(item.detail));
      row.append(name, detail);
      return row;
    }));
  }

  const email = isNonEmptyString(site.email) ? site.email.trim() : '';
  document.querySelectorAll('[data-link="email"]').forEach((link) => {
    link.hidden = !email;
    if (email) {
      link.href = `mailto:${email}`;
      link.textContent = email;
    }
  });

  const socialLinks = {
    linkedInUrl: { url: safeExternalUrl(site.linkedInUrl), label: labels.linkedInLink },
    behanceUrl: { url: safeExternalUrl(site.behanceUrl), label: labels.behanceContactLink }
  };

  Object.entries(socialLinks).forEach(([name, details]) => {
    document.querySelectorAll(`[data-link="${name}"]`).forEach((link) => {
      link.hidden = !details.url;
      if (!details.url) return;
      link.href = details.url;
      if (link.classList.contains('about-work-link')) setText(link, labels.behanceLink);
      else if (!link.classList.contains('work-link')) setText(link, details.label);
    });
  });

  const workLink = document.querySelector('.work-link');
  if (workLink) {
    workLink.hidden = !socialLinks.behanceUrl.url || !isNonEmptyString(site.privatePortfolioRequestText);
  }

  const title = site.seo?.title || `${site.name || ''} — ${site.professionalTitle || ''}`;
  if (isNonEmptyString(title)) document.title = title;
  const description = isNonEmptyString(site.seo?.description) ? site.seo.description : '';
  const socialDescription = isNonEmptyString(site.seo?.socialDescription) ? site.seo.socialDescription : description;
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', socialDescription);
};

const createImage = (path, alt, className) => {
  const src = publicAssetUrl(path);
  if (!src) return null;
  const image = document.createElement('img');
  image.className = className;
  image.src = src;
  image.alt = alt;
  image.loading = 'lazy';
  image.decoding = 'async';
  image.addEventListener('error', () => image.closest('figure')?.remove(), { once: true });
  return image;
};

const appendDetail = (container, label, value) => {
  if (!isNonEmptyString(value)) return;
  const group = document.createElement('div');
  const heading = document.createElement('h4');
  const copy = document.createElement('div');
  copy.className = 'engagement-copy';
  setText(heading, label);
  copy.append(sanitiseRichText(value));
  group.append(heading, copy);
  container.append(group);
};

const renderEngagements = (data) => {
  if (!Array.isArray(data)) throw new TypeError('Selected engagements must be a JSON array.');
  const container = document.querySelector('[data-list="engagements"]');
  if (!container) return;

  const items = data
    .filter((item) => item && item.published === true)
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const orderA = Number.isFinite(Number(a.item.displayOrder)) ? Number(a.item.displayOrder) : Number.MAX_SAFE_INTEGER;
      const orderB = Number.isFinite(Number(b.item.displayOrder)) ? Number(b.item.displayOrder) : Number.MAX_SAFE_INTEGER;
      return orderA - orderB || a.index - b.index;
    });

  container.replaceChildren(...items.map(({ item }) => {
    const article = document.createElement('article');
    article.className = 'engagement';

    const cover = createImage(item.coverImage, `${item.title || item.clientOrProjectName || 'Project'} cover`, 'engagement-cover');
    if (cover) {
      const figure = document.createElement('figure');
      figure.append(cover);
      article.append(figure);
    }

    const summary = document.createElement('div');
    summary.className = 'engagement-summary';
    const heading = document.createElement('h3');
    setText(heading, item.title || item.clientOrProjectName);
    summary.append(heading);

    const titleValue = String(item.title || item.clientOrProjectName || '').trim();
    const metadataValues = [item.clientOrProjectName, item.sector, item.location, item.year, item.role]
      .filter((value, index, values) => value !== null && value !== undefined && String(value).trim() !== '' && String(value).trim() !== titleValue && values.indexOf(value) === index);
    if (metadataValues.length) {
      const metadata = document.createElement('p');
      metadata.className = 'engagement-meta';
      metadata.textContent = metadataValues.join(' · ');
      summary.append(metadata);
    }
    article.append(summary);

    const details = document.createElement('div');
    details.className = 'engagement-details';
    appendDetail(details, 'Problem', item.problem);
    appendDetail(details, 'Creative decision', item.decision);
    appendDetail(details, 'Business or design outcome', item.outcome);
    if (details.childElementCount) article.append(details);

    const supportingImages = Array.isArray(item.supportingImages) ? item.supportingImages : [];
    const galleryImages = supportingImages.map((path, index) => createImage(path, `${item.title || 'Project'} supporting image ${index + 1}`, 'engagement-supporting-image')).filter(Boolean);
    if (galleryImages.length) {
      const gallery = document.createElement('div');
      gallery.className = 'engagement-gallery';
      galleryImages.forEach((image) => {
        const figure = document.createElement('figure');
        figure.append(image);
        gallery.append(figure);
      });
      article.append(gallery);
    }

    return article;
  }));
};

const showContentError = (message) => {
  const status = document.querySelector('[data-content-status]');
  if (!status) return;
  status.hidden = false;
  status.textContent = message;
};

const loadJson = async (path) => {
  const response = await fetch(path, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
};

const initialiseContent = async () => {
  const [siteResult, engagementsResult] = await Promise.allSettled([
    loadJson(CONTENT_PATHS.site),
    loadJson(CONTENT_PATHS.engagements)
  ]);

  const failures = [];
  if (siteResult.status === 'fulfilled') {
    try { renderSite(siteResult.value); } catch (error) { failures.push('general website content'); console.error(error); }
  } else {
    failures.push('general website content');
    console.error(siteResult.reason);
  }

  if (engagementsResult.status === 'fulfilled') {
    try { renderEngagements(engagementsResult.value); } catch (error) { failures.push('selected engagements'); console.error(error); }
  } else {
    failures.push('selected engagements');
    console.error(engagementsResult.reason);
  }

  if (failures.length) showContentError(`Some ${failures.join(' and ')} could not be loaded. Please try again later.`);
  initialiseNavigation();
};

const initialiseNavigation = () => {
  const menuButton = document.querySelector('[data-menu-button]');
  const nav = document.querySelector('[data-nav]');
  if (!menuButton || !nav) return;

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
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 800) closeMenu(); });

  let activeFrame;
  const updateActiveLink = () => {
    const readingLine = window.scrollY + (window.innerHeight * 0.35);
    let current = sections[0];
    sections.forEach((item) => { if (item.section.offsetTop <= readingLine) current = item; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = sections.at(-1);
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
};

initialiseContent();
