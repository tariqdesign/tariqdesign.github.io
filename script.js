const SITE_ROOT = new URL('./', document.currentScript.src);
const PATHS = {
  site: new URL('content/site.json', SITE_ROOT),
  engagements: new URL('content/engagements.json', SITE_ROOT)
};

const INDEX_PROJECT_LIMIT = 14;
const hasText = (value) => typeof value === 'string' && value.trim() !== '';
const toText = (value) => value === null || value === undefined ? '' : String(value).trim();

const stripHtml = (value) => {
  const template = document.createElement('template');
  template.innerHTML = hasText(value) ? value : '';
  return template.content.textContent.trim();
};

const safeUrl = (value) => {
  if (!hasText(value)) return '';
  try {
    const url = new URL(value, window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
};

const assetUrl = (value) => {
  if (!hasText(value)) return '';
  if (/^https?:\/\//i.test(value)) return safeUrl(value);
  return new URL(value.replace(/^\/+/, ''), SITE_ROOT).href;
};

let galleryItems = [];
let feedProjects = [];
let activeImageIndex = 0;
let lightboxReturnFocus = null;

const renderInformation = (site) => {
  document.querySelectorAll('[data-site="name"]').forEach((element) => {
    element.textContent = hasText(site.name) ? site.name.trim() : 'Tariq Yosef';
  });
  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
  document.querySelectorAll('[data-professional-title]').forEach((element) => {
    element.textContent = hasText(site.professionalTitle) ? site.professionalTitle.trim() : 'Design Director';
  });

  const labels = site.labels && typeof site.labels === 'object' ? site.labels : {};
  document.querySelectorAll('[data-label]').forEach((element) => {
    const label = labels[element.dataset.label];
    if (hasText(label)) element.textContent = label;
  });

  const capabilities = Array.isArray(site.capabilities) ? site.capabilities.filter((item) => item && hasText(item.title)) : [];
  const focus = document.querySelector('[data-focus]');
  focus.textContent = capabilities.slice(0, 3).map((item) => item.title).join(' / ');

  const capabilityList = document.querySelector('[data-capabilities]');
  capabilityList.replaceChildren(...capabilities.map((item) => {
    const listItem = document.createElement('li');
    const title = document.createElement('span');
    title.className = 'capability-title';
    title.textContent = item.title;
    listItem.append(title);
    if (hasText(item.description)) {
      const description = document.createElement('span');
      description.className = 'capability-description';
      description.textContent = item.description;
      listItem.append(description);
    }
    return listItem;
  }));

  const introduction = document.querySelector('[data-introduction]');
  introduction.textContent = stripHtml(site.introduction);

  const practiceItems = [
    Array.isArray(site.markets) && site.markets.some(hasText) ? `Markets / ${site.markets.filter(hasText).join(', ')}` : '',
    Array.isArray(site.sectors) && site.sectors.some(hasText) ? `Sectors / ${site.sectors.filter(hasText).join(', ')}` : ''
  ].filter(hasText);
  const practiceList = document.querySelector('[data-practice]');
  practiceList.replaceChildren(...practiceItems.map((value) => {
    const listItem = document.createElement('li');
    listItem.textContent = value;
    return listItem;
  }));

  const approachItems = [site.leadershipStatement, site.pointOfViewText, site.systemsStatement].filter(hasText);
  const approachList = document.querySelector('[data-approach]');
  approachList.replaceChildren(...approachItems.map((value) => {
    const listItem = document.createElement('li');
    listItem.textContent = value;
    return listItem;
  }));

  const recognition = Array.isArray(site.recognition) ? site.recognition : [];
  const recognitionList = document.querySelector('[data-recognition]');
  recognitionList.replaceChildren(...recognition.map((item) => {
    const listItem = document.createElement('li');
    listItem.textContent = [item.name, stripHtml(item.detail)].filter(hasText).join(' / ');
    return listItem;
  }));

  const summary = document.querySelector('[data-summary]');
  summary.textContent = stripHtml(site.mainPositioningStatement) || stripHtml(site.introduction);

  const footerText = document.querySelector('[data-footer-text]');
  footerText.textContent = hasText(site.footerText) ? site.footerText.trim() : '';
  footerText.hidden = !footerText.textContent;

  const externalLinks = {
    linkedInUrl: safeUrl(site.linkedInUrl),
    behanceUrl: safeUrl(site.behanceUrl)
  };
  Object.entries(externalLinks).forEach(([name, href]) => {
    document.querySelectorAll(`[data-link="${name}"]`).forEach((link) => {
      link.hidden = !href;
      if (href) link.href = href;
    });
  });

  const portfolioLink = document.querySelector('[data-portfolio-link]');
  const portfolioText = hasText(site.privatePortfolioRequestText) ? site.privatePortfolioRequestText.trim() : '';
  portfolioLink.hidden = !externalLinks.behanceUrl || !portfolioText;
  if (!portfolioLink.hidden) {
    portfolioLink.href = externalLinks.behanceUrl;
    portfolioLink.textContent = `${portfolioText} ↗`;
  }

  const email = hasText(site.email) ? site.email.trim() : '';
  document.querySelectorAll('[data-link="email"]').forEach((link) => {
    link.hidden = !email;
    if (email) {
      link.href = `mailto:${email}`;
      link.textContent = 'E-mail';
    }
  });

  const seoTitle = hasText(site.seo?.title) ? site.seo.title.trim() : `${site.name || 'Tariq Yosef'} — ${site.professionalTitle || 'Design Director'}`;
  const seoDescription = hasText(site.seo?.description) ? site.seo.description.trim() : stripHtml(site.introduction);
  const socialDescription = hasText(site.seo?.socialDescription) ? site.seo.socialDescription.trim() : seoDescription;
  document.title = seoTitle;
  document.querySelector('meta[name="description"]')?.setAttribute('content', seoDescription);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', seoTitle);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', socialDescription);
};

const buildGallery = (site, engagements) => {
  const projects = Array.isArray(engagements)
    ? engagements
      .filter((item) => item && item.published === true)
      .map((item, originalIndex) => ({ item, originalIndex }))
      .sort((a, b) => Number(a.item.displayOrder ?? 999) - Number(b.item.displayOrder ?? 999) || a.originalIndex - b.originalIndex)
      .map(({ item }) => item)
    : [];

  const projectByImage = new Map();
  projects.forEach((project) => {
    const images = [project.coverImage, ...(Array.isArray(project.supportingImages) ? project.supportingImages : [])].filter(hasText);
    images.forEach((path) => projectByImage.set(path, project));
  });

  const candidates = [];
  const projectItem = (project, path) => {
    const title = project.title || project.clientOrProjectName || 'Selected work';
    return {
      path,
      title,
      caption: [title, project.sector, project.year].map(toText).filter(hasText).join(' / '),
      meta: [project.clientOrProjectName, project.role, project.location, project.year].map(toText).filter(hasText).join(' / '),
      description: stripHtml(project.description)
    };
  };

  feedProjects = [];
  projects.forEach((project) => {
    const paths = [project.coverImage, ...(Array.isArray(project.supportingImages) ? project.supportingImages : [])].filter(hasText);
    if (!paths.length) return;
    const items = paths.map((path) => projectItem(project, path));
    candidates.push(...items);
    feedProjects.push({
      title: project.title || project.clientOrProjectName || 'Selected work',
      meta: [project.sector, project.location, project.year].map(toText).filter(hasText).join(' / '),
      items
    });
  });

  // General featured images remain part of the full lightbox archive.
  const heroImages = Array.isArray(site.heroImages) ? site.heroImages : [];
  heroImages.forEach((entry) => {
    const path = typeof entry === 'string' ? entry : entry?.image;
    if (!hasText(path)) return;
    const project = projectByImage.get(path);
    candidates.push({
      path,
      title: project?.title || project?.clientOrProjectName || (typeof entry === 'object' ? entry.alt : '') || 'Selected work',
      caption: [project?.title || project?.clientOrProjectName, project?.sector, project?.year].map(toText).filter(hasText).join(' / ') || (typeof entry === 'object' ? entry.alt : 'Selected work'),
      meta: [project?.clientOrProjectName, project?.role, project?.location, project?.year].map(toText).filter(hasText).join(' / '),
      description: stripHtml(project?.description)
    });
  });

  const seen = new Set();
  galleryItems = candidates.filter((item) => {
    if (seen.has(item.path)) return false;
    seen.add(item.path);
    return true;
  });
};

const renderFeed = () => {
  const feed = document.querySelector('[data-feed]');
  const groups = feedProjects.slice(0, INDEX_PROJECT_LIMIT);
  feed.replaceChildren(...groups.map((project, projectIndex) => {
    const article = document.createElement('article');
    article.className = 'project-group';

    const header = document.createElement('header');
    header.className = 'project-heading';
    const title = document.createElement('h2');
    title.textContent = project.title;
    header.append(title);
    if (hasText(project.meta)) {
      const meta = document.createElement('p');
      meta.textContent = project.meta;
      header.append(meta);
    }

    const images = document.createElement('div');
    images.className = 'project-images';
    project.items.forEach((item, imageIndex) => {
      const galleryIndex = galleryItems.findIndex((galleryItem) => galleryItem.path === item.path);
      const figure = document.createElement('figure');
      figure.className = 'project-image';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'feed-image-button';
      button.setAttribute('aria-label', `Open ${project.title}, image ${imageIndex + 1} of ${project.items.length}`);
      const image = document.createElement('img');
      image.src = assetUrl(item.path);
      image.alt = `${project.title} — image ${imageIndex + 1}`;
      image.loading = projectIndex === 0 && imageIndex === 0 ? 'eager' : 'lazy';
      image.decoding = 'async';
      button.append(image);
      button.addEventListener('click', () => openLightbox(galleryIndex, button));
      figure.append(button);
      images.append(figure);
    });

    article.append(header, images);
    return article;
  }));
};

const layoutProjectImages = (container) => {
  const figures = [...container.querySelectorAll('.project-image')];
  const containerWidth = container.clientWidth;
  if (!figures.length || !containerWidth) return;

  const styles = window.getComputedStyle(container);
  const gap = Number.parseFloat(styles.columnGap) || 0;
  const targetRatio = Number.parseFloat(styles.getPropertyValue('--gallery-target-ratio')) || 0.56;
  const maxItems = Number.parseInt(styles.getPropertyValue('--gallery-max-items'), 10) || 3;
  const targetHeight = containerWidth * targetRatio;
  const fragment = document.createDocumentFragment();
  let pending = [];
  let pendingRatio = 0;

  const appendRow = (items, complete = true) => {
    const row = document.createElement('div');
    row.className = complete ? 'project-row' : 'project-row project-row--incomplete';
    items.forEach((figure) => {
      if (complete) {
        figure.style.removeProperty('--incomplete-width');
      } else {
        const ratio = Number(figure.dataset.ratio) || 1.25;
        const itemWidth = Math.min(containerWidth, targetHeight * ratio);
        figure.style.setProperty('--incomplete-width', `${itemWidth}px`);
      }
      row.append(figure);
    });
    fragment.append(row);
  };

  figures.forEach((figure) => {
    const ratio = Number(figure.dataset.ratio) || 1.25;
    pending.push(figure);
    pendingRatio += ratio;
    const projectedWidth = (pendingRatio * targetHeight) + (gap * (pending.length - 1));
    const wideSingle = pending.length === 1 && ratio >= 1.45;
    if (wideSingle || projectedWidth >= containerWidth || pending.length >= maxItems) {
      appendRow(pending);
      pending = [];
      pendingRatio = 0;
    }
  });

  if (pending.length) appendRow(pending, false);

  container.replaceChildren(fragment);
};

const setupJustifiedGalleries = () => {
  document.querySelectorAll('.project-images').forEach((container) => {
    const figures = [...container.querySelectorAll('.project-image')];
    figures.forEach((figure) => {
      const image = figure.querySelector('img');
      const updateRatio = () => {
        if (!image.naturalWidth || !image.naturalHeight) {
          figure.remove();
        } else {
          const ratio = image.naturalWidth / image.naturalHeight;
          figure.dataset.ratio = ratio.toFixed(4);
          figure.style.setProperty('--image-ratio', ratio.toFixed(4));
        }
        layoutProjectImages(container);
      };

      if (image.complete) updateRatio();
      else {
        image.addEventListener('load', updateRatio, { once: true });
        image.addEventListener('error', updateRatio, { once: true });
      }
    });
    layoutProjectImages(container);

    if ('ResizeObserver' in window) {
      let previousWidth = container.clientWidth;
      const observer = new ResizeObserver(([entry]) => {
        const nextWidth = entry.contentRect.width;
        if (Math.abs(nextWidth - previousWidth) < 1) return;
        previousWidth = nextWidth;
        layoutProjectImages(container);
      });
      observer.observe(container);
    }
  });
};

const setupParallax = () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const images = [...document.querySelectorAll('.feed-image-button img')];
  if (!images.length) return;
  let frameRequested = false;
  const update = () => {
    const viewportHeight = window.innerHeight;
    images.forEach((image) => {
      const rect = image.parentElement.getBoundingClientRect();
      const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
      const offset = Math.max(-20, Math.min(20, (progress - 0.5) * 40));
      image.style.setProperty('--parallax-y', `${offset}px`);
    });
    frameRequested = false;
  };
  const requestUpdate = () => {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(update);
  };
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();
};

const updateLightbox = () => {
  const item = galleryItems[activeImageIndex];
  const lightbox = document.querySelector('[data-lightbox]');
  if (!item || !lightbox) return;
  const image = lightbox.querySelector('[data-lightbox-image]');
  image.src = assetUrl(item.path);
  image.alt = `${item.title} — image ${activeImageIndex + 1} of ${galleryItems.length}`;
  lightbox.querySelector('[data-lightbox-caption]').textContent = item.caption;
  const meta = lightbox.querySelector('[data-lightbox-meta]');
  meta.textContent = item.meta;
  meta.hidden = !item.meta;
  const description = lightbox.querySelector('[data-lightbox-description]');
  description.textContent = item.description;
  description.hidden = !item.description;
  lightbox.querySelector('[data-lightbox-current]').textContent = String(activeImageIndex + 1);
  lightbox.querySelector('[data-lightbox-total]').textContent = String(galleryItems.length);
  const hasMultiple = galleryItems.length > 1;
  lightbox.querySelector('[data-lightbox-previous]').hidden = !hasMultiple;
  lightbox.querySelector('[data-lightbox-next]').hidden = !hasMultiple;
};

const moveLightbox = (direction) => {
  if (!galleryItems.length) return;
  activeImageIndex = (activeImageIndex + direction + galleryItems.length) % galleryItems.length;
  updateLightbox();
};

const openLightbox = (index, trigger) => {
  const lightbox = document.querySelector('[data-lightbox]');
  if (!lightbox || !galleryItems[index]) return;
  activeImageIndex = index;
  lightboxReturnFocus = trigger;
  updateLightbox();
  document.body.classList.add('quick-view-open');
  if (typeof lightbox.showModal === 'function') lightbox.showModal();
  else lightbox.setAttribute('open', '');
  lightbox.querySelector('[data-lightbox-close]').focus();
};

const closeLightbox = () => {
  const lightbox = document.querySelector('[data-lightbox]');
  if (!lightbox?.open) return;
  if (typeof lightbox.close === 'function') lightbox.close();
  else lightbox.removeAttribute('open');
  document.body.classList.remove('quick-view-open');
  lightboxReturnFocus?.focus();
};

const setupLightbox = () => {
  const lightbox = document.querySelector('[data-lightbox]');
  lightbox.querySelector('[data-lightbox-close]').addEventListener('click', closeLightbox);
  lightbox.querySelector('[data-lightbox-previous]').addEventListener('click', () => moveLightbox(-1));
  lightbox.querySelector('[data-lightbox-next]').addEventListener('click', () => moveLightbox(1));
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  lightbox.addEventListener('close', () => document.body.classList.remove('quick-view-open'));
  document.addEventListener('keydown', (event) => {
    if (!lightbox.open) return;
    if (event.key === 'ArrowLeft') moveLightbox(-1);
    if (event.key === 'ArrowRight') moveLightbox(1);
  });
};

const initialise = async () => {
  try {
    const [siteResponse, engagementResponse] = await Promise.all([
      fetch(PATHS.site, { cache: 'no-cache' }),
      fetch(PATHS.engagements, { cache: 'no-cache' })
    ]);
    if (!siteResponse.ok || !engagementResponse.ok) throw new Error('Content could not be loaded.');
    const [site, engagements] = await Promise.all([siteResponse.json(), engagementResponse.json()]);
    renderInformation(site);
    buildGallery(site, engagements);
    renderFeed();
    setupJustifiedGalleries();
    setupParallax();
    setupLightbox();
  } catch (error) {
    const status = document.querySelector('[data-error]');
    status.hidden = false;
    status.textContent = error.message;
  }
};

initialise();
