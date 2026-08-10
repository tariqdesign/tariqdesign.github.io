const SITE_ROOT = new URL('./', document.currentScript.src);
const PATHS = {
  site: new URL('content/site.json', SITE_ROOT),
  engagements: new URL('content/engagements.json', SITE_ROOT)
};

const PAGE = document.body.dataset.page || 'home';
const HOME_PROJECT_LIMIT = 3;
const PROJECT_URL = new URL('project/', SITE_ROOT);
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

const projectSlug = (project) => {
  const value = project.title || project.clientOrProjectName || 'selected-work';
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'selected-work';
};

const getPublishedProjects = (engagements) => Array.isArray(engagements)
  ? engagements
    .filter((item) => item && item.published === true)
    .map((item, originalIndex) => ({ item, originalIndex }))
    .sort((a, b) => Number(a.item.displayOrder ?? 999) - Number(b.item.displayOrder ?? 999) || a.originalIndex - b.originalIndex)
    .map(({ item }) => {
      const slug = projectSlug(item);
      return { ...item, slug, anchor: `project-${slug}` };
    })
  : [];

const projectPageUrl = (project) => {
  const url = new URL(PROJECT_URL);
  url.searchParams.set('project', project.slug);
  return url.href;
};

const normaliseOption = (value, allowed, fallback) => allowed.includes(value) ? value : fallback;

const createSafeRichText = (value) => {
  const template = document.createElement('template');
  template.innerHTML = hasText(value) ? value : '';
  const allowedTags = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'UL', 'OL', 'LI', 'A']);
  const blockedTags = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED']);

  [...template.content.querySelectorAll('*')].forEach((element) => {
    if (blockedTags.has(element.tagName)) {
      element.remove();
      return;
    }
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...element.childNodes);
      return;
    }

    const href = element.tagName === 'A' ? safeUrl(element.getAttribute('href')) : '';
    [...element.attributes].forEach((attribute) => element.removeAttribute(attribute.name));
    if (element.tagName !== 'A') return;
    if (!href) {
      element.replaceWith(...element.childNodes);
      return;
    }
    element.href = href;
    element.target = '_blank';
    element.rel = 'noopener noreferrer';
  });

  return template.content;
};

const createAboutRichText = (block) => {
  const textSize = normaliseOption(block.textSize, ['small', 'standard', 'large'], 'standard');
  const container = document.createElement('div');
  container.className = `about-rich-text about-rich-text--${textSize}`;
  if (hasText(block.heading)) {
    const heading = document.createElement('h3');
    heading.textContent = block.heading.trim();
    container.append(heading);
  }
  container.append(createSafeRichText(block.body));
  return container;
};

const createAboutImage = (block) => {
  const figure = document.createElement('figure');
  figure.className = 'about-image';
  const image = document.createElement('img');
  image.src = assetUrl(block.image);
  image.alt = hasText(block.alt) ? block.alt.trim() : '';
  image.loading = 'lazy';
  image.decoding = 'async';
  figure.append(image);
  if (hasText(block.caption)) {
    const caption = document.createElement('figcaption');
    caption.textContent = block.caption.trim();
    figure.append(caption);
  }
  return figure;
};

const createAboutSection = (block) => {
  if (!block || block.published === false || !hasText(block.type) || !hasText(block.label)) return null;
  const isText = block.type === 'text' && hasText(block.body);
  const isImage = block.type === 'image' && hasText(block.image);
  const isTextImage = block.type === 'textImage' && hasText(block.body) && hasText(block.image);
  if (!isText && !isImage && !isTextImage) return null;

  const section = document.createElement('section');
  section.className = `about-section about-section--${block.type}`;
  const label = document.createElement('h2');
  label.className = 'detail-heading';
  label.textContent = `${block.label.trim()}:`;
  const content = document.createElement('div');
  content.className = 'about-section-content';

  if (isText) content.append(createAboutRichText(block));
  if (isImage) {
    const imageWidth = normaliseOption(block.imageWidth, ['one', 'two', 'three'], 'two');
    content.classList.add(`about-section-content--${imageWidth}`);
    content.append(createAboutImage(block));
  }
  if (isTextImage) {
    const imagePosition = normaliseOption(block.imagePosition, ['left', 'right'], 'right');
    content.classList.add('about-section-content--split', `about-section-content--image-${imagePosition}`);
    content.append(createAboutRichText(block), createAboutImage(block));
  }

  section.append(label, content);
  return section;
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
  if (focus) focus.textContent = capabilities.slice(0, 3).map((item) => item.title).join(' / ');

  const capabilityList = document.querySelector('[data-capabilities]');
  if (capabilityList) {
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
  }

  const introduction = document.querySelector('[data-introduction]');
  if (introduction) introduction.textContent = stripHtml(site.introduction);
  document.querySelectorAll('[data-positioning]').forEach((element) => {
    element.textContent = stripHtml(site.mainPositioningStatement) || stripHtml(site.introduction);
  });

  const practiceItems = [
    Array.isArray(site.markets) && site.markets.some(hasText) ? `Markets / ${site.markets.filter(hasText).join(', ')}` : '',
    Array.isArray(site.sectors) && site.sectors.some(hasText) ? `Sectors / ${site.sectors.filter(hasText).join(', ')}` : ''
  ].filter(hasText);
  const practiceList = document.querySelector('[data-practice]');
  if (practiceList) {
    practiceList.replaceChildren(...practiceItems.map((value) => {
      const listItem = document.createElement('li');
      listItem.textContent = value;
      return listItem;
    }));
  }

  const approachItems = [site.leadershipStatement, site.pointOfViewText, site.systemsStatement].filter(hasText);
  const approachList = document.querySelector('[data-approach]');
  if (approachList) {
    approachList.replaceChildren(...approachItems.map((value) => {
      const listItem = document.createElement('li');
      listItem.textContent = value;
      return listItem;
    }));
  }

  const recognition = Array.isArray(site.recognition) ? site.recognition : [];
  const recognitionList = document.querySelector('[data-recognition]');
  if (recognitionList) {
    recognitionList.replaceChildren(...recognition.map((item) => {
      const listItem = document.createElement('li');
      listItem.textContent = [item.name, stripHtml(item.detail)].filter(hasText).join(' / ');
      return listItem;
    }));
  }

  const aboutSections = document.querySelector('[data-about-sections]');
  const additionalSections = Array.isArray(site.aboutSections)
    ? site.aboutSections.map(createAboutSection).filter(Boolean)
    : [];
  if (aboutSections) {
    aboutSections.replaceChildren(...additionalSections);
    aboutSections.hidden = additionalSections.length === 0;
  }

  const summary = document.querySelector('[data-summary]');
  if (summary) summary.textContent = stripHtml(site.mainPositioningStatement) || stripHtml(site.introduction);

  const footerText = document.querySelector('[data-footer-text]');
  if (footerText) {
    footerText.textContent = hasText(site.footerText) ? site.footerText.trim() : '';
    footerText.hidden = !footerText.textContent;
  }

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
  if (portfolioLink) {
    portfolioLink.hidden = !externalLinks.behanceUrl || !portfolioText;
    if (!portfolioLink.hidden) {
      portfolioLink.href = externalLinks.behanceUrl;
      portfolioLink.textContent = `${portfolioText} ↗`;
    }
  }

  const email = hasText(site.email) ? site.email.trim() : '';
  document.querySelectorAll('[data-link="email"]').forEach((link) => {
    link.hidden = !email;
    if (email) {
      link.href = `mailto:${email}`;
      link.textContent = link.dataset.emailDisplay === 'address' ? email : 'E-mail';
    }
  });

  const name = hasText(site.name) ? site.name.trim() : 'Tariq Yosef';
  const title = hasText(site.professionalTitle) ? site.professionalTitle.trim() : 'Design Director';
  const homeTitle = hasText(site.seo?.title) ? site.seo.title.trim() : `${name} — ${title}`;
  const seoTitle = PAGE === 'about' ? `About — ${name}, ${title}` : PAGE === 'work' ? `Work — ${name}, ${title}` : homeTitle;
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

const getProjectCovers = (project, blocks) => {
  const covers = [];
  if (hasText(project.coverImage)) covers.push(project.coverImage);
  const image = blocks.find((block) => block.type === 'image' && hasText(block.path));
  if (image) covers.push(image.path);
  const video = blocks.find((block) => block.type === 'video' && hasText(block.poster));
  if (video) covers.push(video.poster);
  const slider = blocks.find((block) => block.type === 'slider' && hasText(block.slides?.[0]?.path));
  if (slider) covers.push(slider.slides[0].path);
  return [...new Set(covers)];
};

const buildGallery = (site, engagements) => {
  const projects = getPublishedProjects(engagements);

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
      slug: project.slug,
      anchor: project.anchor,
      featuredOnHome: project.featuredOnHome === true,
      coverImages: getProjectCovers(project, blocks),
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

const renderHomeProjects = () => {
  const container = document.querySelector('[data-home-projects]');
  if (!container) return;
  const projects = feedProjects
    .filter((project) => project.featuredOnHome && project.coverImages.length)
    .slice(0, HOME_PROJECT_LIMIT);

  const cards = projects.map((project, projectIndex) => {
    const article = document.createElement('article');
    article.className = 'featured-project';
    const link = document.createElement('a');
    link.className = 'featured-project-link';
    link.href = projectPageUrl(project);
    link.setAttribute('aria-label', `View the full ${project.title} project`);

    const heading = document.createElement('div');
    heading.className = 'featured-project-heading';
    const title = document.createElement('h3');
    title.textContent = project.title;
    const action = document.createElement('span');
    action.textContent = 'View project →';
    heading.append(title, action);

    const image = document.createElement('img');
    let coverIndex = 0;
    image.src = assetUrl(project.coverImages[coverIndex]);
    image.alt = `${project.title} project cover`;
    image.loading = projectIndex === 0 ? 'eager' : 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', () => {
      coverIndex += 1;
      if (project.coverImages[coverIndex]) image.src = assetUrl(project.coverImages[coverIndex]);
      else article.remove();
    });
    link.append(heading, image);
    article.append(link);
    return article;
  });

  container.replaceChildren(...cards);
  if (!cards.length) {
    const message = document.createElement('p');
    message.className = 'featured-projects-empty';
    message.textContent = 'Featured projects will appear here when selected in Pages CMS.';
    container.append(message);
  }
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

const createProjectArticle = (project, projectIndex, showHeading = true) => {
  const article = document.createElement('article');
  article.className = 'project-group';
  article.id = project.anchor;
  article.tabIndex = -1;

  if (showHeading) {
    const header = document.createElement('header');
    header.className = 'project-heading';
    const title = document.createElement('h2');
    const titleLink = document.createElement('a');
    titleLink.href = projectPageUrl(project);
    titleLink.textContent = project.title;
    title.append(titleLink);
    header.append(title);
    if (hasText(project.description)) {
      const description = document.createElement('p');
      description.textContent = project.description;
      header.append(description);
    }
    article.append(header);
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

  article.append(media);
  return article;
};

const renderFeed = (projects = feedProjects, showHeadings = true) => {
  const feed = document.querySelector('[data-feed]');
  if (!feed) return;
  feed.replaceChildren(...projects.map((project, projectIndex) => createProjectArticle(project, projectIndex, showHeadings)));
};

const renderProjectPage = (site) => {
  const requestedSlug = new URLSearchParams(window.location.search).get('project');
  const project = feedProjects.find((item) => item.slug === requestedSlug);
  if (!project) throw new Error('This project could not be found.');

  document.querySelector('[data-project-title]').textContent = project.title;
  document.querySelector('[data-project-description]').textContent = project.description || 'Selected design direction engagement.';

  const name = hasText(site.name) ? site.name.trim() : 'Tariq Yosef';
  const title = `${project.title} — ${name}`;
  const description = project.description || `Selected work by ${name}.`;
  document.title = title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);

  const canonical = projectPageUrl(project);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical);
  document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonical);

  const projectPaths = new Set(project.blocks.flatMap((block) => getBlockImages(block).map((item) => item.path)));
  galleryItems = galleryItems.filter((item) => projectPaths.has(item.path));
  renderFeed([project], false);
};

const scrollToRequestedProject = () => {
  if (PAGE !== 'work' || !window.location.hash) return;
  const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
  if (!target) return;
  window.requestAnimationFrame(() => {
    target.scrollIntoView({ block: 'start' });
    target.focus({ preventScroll: true });
  });
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
  if (!lightbox) return;
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
    if (PAGE === 'home') renderHomeProjects();
    if (PAGE === 'work') {
      renderFeed();
      setupJustifiedGalleries();
      setupSliders();
      setupParallax();
      setupLightbox();
      scrollToRequestedProject();
    }
    if (PAGE === 'project') {
      renderProjectPage(site);
      setupJustifiedGalleries();
      setupSliders();
      setupParallax();
      setupLightbox();
    }
  } catch (error) {
    const status = document.querySelector('[data-error]');
    if (status) {
      status.hidden = false;
      status.textContent = error.message;
    }
  }
};

initialise();
