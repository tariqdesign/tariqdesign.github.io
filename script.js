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

const normaliseProjectBlocks = (project) => {
  const mediaBlocks = Array.isArray(project.mediaBlocks) ? project.mediaBlocks.flatMap((block) => {
    if (!block || !hasText(block.type)) return [];
    if (block.type === 'image' && hasText(block.image)) {
      return [{ type: 'image', path: block.image, alt: toText(block.alt) }];
    }
    if (block.type === 'video' && hasText(block.video)) {
      return [{
        type: 'video',
        path: block.video,
        poster: hasText(block.poster) ? block.poster : '',
        description: toText(block.description)
      }];
    }
    if (block.type === 'slider' && Array.isArray(block.slides)) {
      const slides = block.slides
        .map((slide) => typeof slide === 'string'
          ? { path: slide, alt: '' }
          : { path: slide?.image, alt: toText(slide?.alt) })
        .filter((slide) => hasText(slide.path))
        .slice(0, 4);
      return slides.length ? [{ type: 'slider', slides }] : [];
    }
    return [];
  }) : [];

  if (mediaBlocks.length) return mediaBlocks;

  return [project.coverImage, ...(Array.isArray(project.supportingImages) ? project.supportingImages : [])]
    .filter(hasText)
    .map((path) => ({ type: 'image', path, alt: '' }));
};

const getBlockImages = (block) => {
  if (block.type === 'image') return [{ path: block.path, alt: block.alt }];
  if (block.type === 'slider') return block.slides;
  return [];
};

const buildGallery = (site, engagements) => {
  const projects = Array.isArray(engagements)
    ? engagements
      .filter((item) => item && item.published === true)
      .map((item, originalIndex) => ({ item, originalIndex }))
      .sort((a, b) => Number(a.item.displayOrder ?? 999) - Number(b.item.displayOrder ?? 999) || a.originalIndex - b.originalIndex)
      .map(({ item }) => item)
    : [];

  const candidates = [];
  const projectByImage = new Map();
  const projectItem = (project, entry) => {
    const title = project.title || project.clientOrProjectName || 'Selected work';
    return {
      path: entry.path,
      title,
      alt: entry.alt || `${title} project image`,
      caption: title
    };
  };

  feedProjects = [];
  projects.forEach((project) => {
    const blocks = normaliseProjectBlocks(project);
    if (!blocks.length) return;
    const hydratedBlocks = blocks.map((block) => {
      if (block.type === 'image') {
        const item = projectItem(project, block);
        candidates.push(item);
        projectByImage.set(item.path, project);
        return { ...block, item };
      }
      if (block.type === 'slider') {
        const slides = block.slides.map((slide) => {
          const item = projectItem(project, slide);
          candidates.push(item);
          projectByImage.set(item.path, project);
          return { ...slide, item };
        });
        return { ...block, slides };
      }
      return block;
    });
    feedProjects.push({
      title: project.title || project.clientOrProjectName || 'Selected work',
      description: stripHtml(project.description),
      blocks: hydratedBlocks
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
      caption: project?.title || project?.clientOrProjectName || (typeof entry === 'object' ? entry.alt : '') || 'Selected work'
    });
  });

  const seen = new Set();
  galleryItems = candidates.filter((item) => {
    if (seen.has(item.path)) return false;
    seen.add(item.path);
    return true;
  });
};

const createProjectImage = (project, item, projectIndex, imageIndex, totalImages) => {
  const galleryIndex = galleryItems.findIndex((galleryItem) => galleryItem.path === item.path);
  const figure = document.createElement('figure');
  figure.className = 'project-image';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'feed-image-button';
  button.setAttribute('aria-label', `Open ${project.title}, image ${imageIndex + 1} of ${totalImages}`);
  const image = document.createElement('img');
  image.src = assetUrl(item.path);
  image.alt = item.alt;
  image.loading = projectIndex === 0 && imageIndex === 0 ? 'eager' : 'lazy';
  image.decoding = 'async';
  button.append(image);
  button.addEventListener('click', () => openLightbox(galleryIndex, button));
  figure.append(button);
  return figure;
};

const createProjectVideo = (project, block) => {
  const figure = document.createElement('figure');
  figure.className = 'project-video';

  const fallbackPath = hasText(block.poster) ? block.poster : '';
  let fallback = null;
  if (fallbackPath) {
    fallback = document.createElement('img');
    fallback.className = 'project-video-fallback';
    fallback.src = assetUrl(fallbackPath);
    fallback.alt = block.description || `${project.title} video fallback image`;
    fallback.loading = 'lazy';
    fallback.decoding = 'async';
    figure.classList.add('has-fallback');
    figure.append(fallback);
  }

  const video = document.createElement('video');
  video.autoplay = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  video.controls = true;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.setAttribute('aria-label', block.description || `${project.title} project video`);
  if (fallbackPath) video.poster = assetUrl(fallbackPath);

  const source = document.createElement('source');
  source.src = assetUrl(block.path);
  source.type = block.path.toLowerCase().split('?')[0].endsWith('.webm') ? 'video/webm' : 'video/mp4';
  video.append(source);
  video.append(document.createTextNode('Your browser does not support embedded video.'));

  const showVideo = () => {
    figure.classList.add('is-video-ready');
    fallback?.setAttribute('aria-hidden', 'true');
  };
  const showFallback = () => {
    figure.classList.remove('is-video-ready');
    figure.classList.add('has-video-error');
    fallback?.removeAttribute('aria-hidden');
  };
  video.addEventListener('loadeddata', showVideo, { once: true });
  video.addEventListener('error', showFallback);
  source.addEventListener('error', showFallback);
  figure.append(video);
  return figure;
};

const createProjectSlider = (project, block, projectIndex, startIndex, totalImages) => {
  const slider = document.createElement('section');
  slider.className = 'project-slider';
  slider.setAttribute('aria-label', `${project.title} image slider`);

  const viewport = document.createElement('div');
  viewport.className = 'slider-viewport';
  block.slides.forEach((slide, slideIndex) => {
    const galleryIndex = galleryItems.findIndex((galleryItem) => galleryItem.path === slide.item.path);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'slider-slide';
    button.setAttribute('aria-label', `Open ${project.title}, image ${startIndex + slideIndex + 1} of ${totalImages}`);
    const image = document.createElement('img');
    image.src = assetUrl(slide.item.path);
    image.alt = slide.item.alt;
    image.loading = projectIndex === 0 && startIndex === 0 && slideIndex === 0 ? 'eager' : 'lazy';
    image.decoding = 'async';
    if (slideIndex === 0) {
      const updateRatio = () => {
        if (image.naturalWidth && image.naturalHeight) {
          slider.style.setProperty('--slider-ratio', `${image.naturalWidth} / ${image.naturalHeight}`);
        }
      };
      if (image.complete) updateRatio();
      else image.addEventListener('load', updateRatio, { once: true });
    }
    button.append(image);
    button.addEventListener('click', () => openLightbox(galleryIndex, button));
    viewport.append(button);
  });

  const dots = document.createElement('div');
  dots.className = 'slider-dots';
  dots.setAttribute('aria-label', 'Choose slide');
  block.slides.forEach((slide, slideIndex) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'slider-dot';
    dot.dataset.sliderDot = String(slideIndex);
    dot.setAttribute('aria-label', `Show slide ${slideIndex + 1} of ${block.slides.length}`);
    dots.append(dot);
  });
  slider.append(viewport, dots);
  return slider;
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
    if (hasText(project.description)) {
      const description = document.createElement('p');
      description.textContent = project.description;
      header.append(description);
    }

    const media = document.createElement('div');
    media.className = 'project-media';
    const totalImages = project.blocks.reduce((total, block) => total + getBlockImages(block).length, 0);
    let imageIndex = 0;
    let imageGroup = null;
    project.blocks.forEach((block) => {
      if (block.type === 'image') {
        if (!imageGroup) {
          imageGroup = document.createElement('div');
          imageGroup.className = 'project-images';
          media.append(imageGroup);
        }
        imageGroup.append(createProjectImage(project, block.item, projectIndex, imageIndex, totalImages));
        imageIndex += 1;
        return;
      }

      imageGroup = null;
      if (block.type === 'video') {
        media.append(createProjectVideo(project, block));
        return;
      }
      if (block.type === 'slider') {
        media.append(createProjectSlider(project, block, projectIndex, imageIndex, totalImages));
        imageIndex += block.slides.length;
      }
    });

    article.append(header, media);
    return article;
  }));
};

const setupSliders = () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.project-slider').forEach((slider) => {
    const slides = [...slider.querySelectorAll('.slider-slide')];
    if (slides.length < 2) return;
    const viewport = slider.querySelector('.slider-viewport');
    const dots = [...slider.querySelectorAll('.slider-dot')];
    const firstSlideClone = slides[0].cloneNode(true);
    firstSlideClone.classList.add('slider-slide--clone');
    firstSlideClone.setAttribute('aria-hidden', 'true');
    firstSlideClone.tabIndex = -1;
    viewport.append(firstSlideClone);

    let active = 0;
    let timer = null;
    let pointerStart = null;
    let wrapping = false;

    const syncState = () => {
      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === active;
        slide.setAttribute('aria-hidden', String(!isActive));
        slide.tabIndex = isActive ? 0 : -1;
      });
      dots.forEach((dot, dotIndex) => {
        if (dotIndex === active) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
    };
    const finishWrap = () => {
      viewport.removeEventListener('transitionend', finishWrap);
      viewport.classList.add('is-resetting');
      slider.style.setProperty('--slider-offset', '0%');
      void viewport.offsetWidth;
      window.requestAnimationFrame(() => viewport.classList.remove('is-resetting'));
      wrapping = false;
    };
    const show = (index) => {
      if (wrapping) finishWrap();
      active = (index + slides.length) % slides.length;
      syncState();
      slider.style.setProperty('--slider-offset', `${active * -100}%`);
    };
    const advance = () => {
      if (active < slides.length - 1) {
        show(active + 1);
        return;
      }

      wrapping = true;
      active = 0;
      syncState();
      slider.style.setProperty('--slider-offset', `${slides.length * -100}%`);
      viewport.addEventListener('transitionend', finishWrap, { once: true });
    };
    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = null;
    };
    const start = () => {
      stop();
      if (!reducedMotion) {
        timer = window.setInterval(advance, 1000);
      }
    };
    const move = (direction) => {
      if (direction > 0) advance();
      else show(active - 1);
      start();
    };

    dots.forEach((dot, dotIndex) => {
      dot.addEventListener('click', () => {
        show(dotIndex);
        start();
      });
    });
    slider.addEventListener('pointerdown', (event) => {
      pointerStart = event.clientX;
    });
    slider.addEventListener('pointerup', (event) => {
      if (pointerStart === null) return;
      const distance = event.clientX - pointerStart;
      pointerStart = null;
      if (Math.abs(distance) > 40) move(distance > 0 ? -1 : 1);
    });

    show(0);
    start();
  });
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
  const images = [...document.querySelectorAll('.project-image .feed-image-button img')];
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
  image.alt = item.alt;
  lightbox.querySelector('[data-lightbox-caption]').textContent = item.caption;
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
    setupSliders();
    setupParallax();
    setupLightbox();
  } catch (error) {
    const status = document.querySelector('[data-error]');
    status.hidden = false;
    status.textContent = error.message;
  }
};

initialise();
