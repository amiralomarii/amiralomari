(() => {
  'use strict';

  const html = document.documentElement;
  const body = document.body;
  const doc = document.documentElement;
  const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
  const lerp = (a, b, t) => a + (b - a) * t;
  const round = (n, d = 2) => Number(n.toFixed(d));

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarseQuery = window.matchMedia('(pointer: coarse)');
  const fineQuery = window.matchMedia('(pointer: fine)');

  const viewportWidth = () => Math.round(window.visualViewport?.width || window.innerWidth);
  const viewportHeight = () => Math.round(window.visualViewport?.height || window.innerHeight);

  let reducedMotion = reducedMotionQuery.matches;
  let motionProfile = 'desktop';
  let lastScrollY = window.scrollY;
  let scrollDirection = 0;
  let raf = 0;

  function resolveMotionProfile() {
    reducedMotion = reducedMotionQuery.matches;
    if (reducedMotion) return 'reduced';
    const width = viewportWidth();
    const coarse = coarseQuery.matches;
    if (width <= 720 || (coarse && width <= 820)) return 'mobile';
    if (width <= 1179 || coarse) return 'tablet';
    return 'desktop';
  }

  function setMotionProfile(force = false) {
    const next = resolveMotionProfile();
    if (!force && next === motionProfile) return false;
    motionProfile = next;
    html.dataset.motion = next;
    return true;
  }
  setMotionProfile(true);

  const isDesktop = () => motionProfile === 'desktop';
  const isTablet = () => motionProfile === 'tablet';
  const isMobile = () => motionProfile === 'mobile';

  /* 0 → 1 while an element travels through the viewport. Because this is
     calculated from geometry on every frame, all choreography reverses when
     the visitor scrolls upward. */
  function travelProgress(element, enter = .9, exit = .12) {
    if (!element) return 0;
    const r = element.getBoundingClientRect();
    const vh = viewportHeight();
    const start = vh * enter;
    const end = vh * exit - r.height;
    return clamp((start - r.top) / Math.max(1, start - end));
  }

  function viewportSigned(element) {
    if (!element) return 0;
    const r = element.getBoundingClientRect();
    const vh = viewportHeight();
    const center = r.top + r.height / 2;
    const range = Math.max(vh * .55, (vh + r.height) * .36);
    return clamp((center - vh * .5) / range, -1, 1);
  }

  function viewportFocus(element) {
    return 1 - Math.abs(viewportSigned(element));
  }

  /* ------------------------------------------------------------------
     Header + mobile menu
     ------------------------------------------------------------------ */
  const header = document.querySelector('[data-header]');
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileBackdrop = document.querySelector('.mobile-nav__backdrop');

  const closeMenu = () => {
    if (!menuToggle || !mobileNav) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    mobileNav.classList.remove('is-open');
    mobileNav.setAttribute('aria-hidden', 'true');
    body.classList.remove('menu-open');
  };

  const openMenu = () => {
    if (!menuToggle || !mobileNav) return;
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close navigation');
    mobileNav.classList.add('is-open');
    mobileNav.setAttribute('aria-hidden', 'false');
    body.classList.add('menu-open');
  };

  menuToggle?.addEventListener('click', () => menuToggle.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu());
  mobileBackdrop?.addEventListener('click', closeMenu);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

  const headerOffset = () => isMobile() ? 78 : 94;
  document.querySelectorAll('[data-scroll-link][href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      closeMenu();
      const top = target.getBoundingClientRect().top + window.scrollY - headerOffset();
      window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  });

  /* ------------------------------------------------------------------
     Custom desktop scroll rail. Native wheel / trackpad physics remain intact.
     ------------------------------------------------------------------ */
  const scrollRail = document.querySelector('.custom-scroll');
  const scrollThumb = document.querySelector('.custom-scroll__thumb');
  let thumbHeight = 60;
  let thumbTravel = 0;
  let draggingThumb = false;
  let dragStartY = 0;
  let dragStartScroll = 0;
  let railTimer = 0;

  function measureScrollbar() {
    if (!scrollRail || !scrollThumb || !isDesktop()) return;
    const railHeight = scrollRail.clientHeight;
    const total = Math.max(viewportHeight(), doc.scrollHeight);
    const ratio = viewportHeight() / total;
    thumbHeight = clamp(railHeight * ratio, 48, 105);
    thumbTravel = Math.max(0, railHeight - thumbHeight);
    scrollThumb.style.height = `${thumbHeight}px`;
  }

  function wakeScrollRail() {
    if (!scrollRail || !isDesktop()) return;
    scrollRail.classList.add('is-active');
    clearTimeout(railTimer);
    railTimer = setTimeout(() => scrollRail.classList.remove('is-active'), 760);
  }

  function updateScrollbar(scrollY, maxScroll) {
    if (!scrollThumb || !isDesktop()) return;
    const p = maxScroll <= 0 ? 0 : scrollY / maxScroll;
    scrollThumb.style.transform = `translate3d(-50%,${round(thumbTravel * p)}px,0)`;
  }

  if (scrollRail && scrollThumb) {
    scrollRail.addEventListener('pointerdown', event => {
      if (!isDesktop()) return;
      if (event.target === scrollThumb || scrollThumb.contains(event.target)) {
        draggingThumb = true;
        dragStartY = event.clientY;
        dragStartScroll = window.scrollY;
        scrollRail.classList.add('is-dragging');
        scrollThumb.setPointerCapture?.(event.pointerId);
      } else {
        const r = scrollRail.getBoundingClientRect();
        const maxScroll = Math.max(1, doc.scrollHeight - viewportHeight());
        const p = clamp((event.clientY - r.top - thumbHeight / 2) / Math.max(1, r.height - thumbHeight));
        window.scrollTo({ top: p * maxScroll, behavior: reducedMotion ? 'auto' : 'smooth' });
      }
      event.preventDefault();
    });

    scrollThumb.addEventListener('pointermove', event => {
      if (!draggingThumb) return;
      const maxScroll = Math.max(1, doc.scrollHeight - viewportHeight());
      const delta = event.clientY - dragStartY;
      const next = dragStartScroll + (thumbTravel ? delta / thumbTravel * maxScroll : 0);
      window.scrollTo(0, clamp(next, 0, maxScroll));
    });

    const endDrag = event => {
      if (!draggingThumb) return;
      draggingThumb = false;
      scrollRail.classList.remove('is-dragging');
      try { scrollThumb.releasePointerCapture?.(event.pointerId); } catch (_) {}
    };
    scrollThumb.addEventListener('pointerup', endDrag);
    scrollThumb.addEventListener('pointercancel', endDrag);
  }

  /* ------------------------------------------------------------------
     Signature motion scenes
     ------------------------------------------------------------------ */
  const hero = document.querySelector('[data-hero]');
  const heroCopy = document.querySelector('[data-hero-copy]');
  const heroMedia = document.querySelector('[data-hero-media]');
  const manifesto = document.querySelector('[data-manifesto]');
  const manifestoStats = [...document.querySelectorAll('.manifesto-stats article')];
  const workIntro = document.querySelector('.work-intro');
  const caseCards = [...document.querySelectorAll('[data-case-card]')];
  const capabilityList = document.querySelector('[data-capability-list]');
  const capabilityMarker = capabilityList?.querySelector('.capabilities-marker');
  const capabilityItems = [...document.querySelectorAll('[data-capability-item]')];
  const processScene = document.querySelector('[data-horizontal]');
  const processCards = [...document.querySelectorAll('.process-card')];
  const assistantScene = document.querySelector('[data-assistant-scene]');
  const assistantCopy = document.querySelector('[data-assistant-copy]');
  const assistantDevice = document.querySelector('[data-assistant-device]');
  const profileScene = document.querySelector('[data-profile-scene]');
  const footerScene = document.querySelector('[data-footer-scene]');
  const darkSections = [...document.querySelectorAll('.capabilities,.assistant-scene,.site-footer')];
  const navLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
  const navSections = ['work','capabilities','assistant'].map(id => document.getElementById(id)).filter(Boolean);
  const webPointer = document.querySelector('.demo-pointer');

  const automationCards = caseCards.map(card => {
    if (card.dataset.caseType !== 'automation') return null;
    const path = card.querySelector('.flow-base');
    const dot = card.querySelector('.flow-dot');
    return {
      card,
      path,
      dot,
      length: path?.getTotalLength?.() || 0,
      steps: [...card.querySelectorAll('.workflow-step')]
    };
  }).filter(Boolean);

  function setIndexPulse(root, value) {
    root?.style.setProperty('--index-line', String(clamp(.32 + value * .68)));
  }

  function renderHero(scrollY) {
    if (!hero) return;
    const vh = viewportHeight();
    const end = Math.max(vh * .82, hero.offsetHeight * .84);
    const p = clamp(scrollY / end);

    hero.style.setProperty('--hero-accent-p', String(round(p,4)));

    if (reducedMotion) {
      hero.style.setProperty('--hero-image-y', '0px');
      return;
    }

    if (isDesktop()) {
      hero.style.setProperty('--hero-l1x', `${round(lerp(0,-54,p))}px`);
      hero.style.setProperty('--hero-l2x', `${round(lerp(0,38,p))}px`);
      hero.style.setProperty('--hero-l3x', `${round(lerp(0,-26,p))}px`);
      hero.style.setProperty('--hero-l4x', `${round(lerp(0,24,p))}px`);
      hero.style.setProperty('--hero-l1y', `${round(lerp(0,-5,p))}px`);
      hero.style.setProperty('--hero-l2y', `${round(lerp(0,5,p))}px`);
      hero.style.setProperty('--hero-media-x', `${round(lerp(0,24,p))}px`);
      hero.style.setProperty('--hero-media-y', `${round(lerp(0,-18,p))}px`);
      hero.style.setProperty('--hero-media-r', `${round(lerp(0,.75,p),3)}deg`);
      hero.style.setProperty('--hero-image-y', `${round(lerp(18,-20,p))}px`);
      hero.style.setProperty('--hero-caption-y', `${round(lerp(-2,4,p))}px`);
    } else if (isTablet()) {
      hero.style.setProperty('--hero-media-y', `${round(lerp(0,-11,p))}px`);
      hero.style.setProperty('--hero-image-y', `${round(lerp(6,-7,p))}px`);
      hero.style.setProperty('--hero-caption-y', `${round(lerp(0,2,p))}px`);
    } else {
      hero.style.setProperty('--hero-image-y', '0px');
      hero.style.setProperty('--hero-caption-y', '0px');
    }

    hero.style.setProperty('--hero-cue-y', `${round(p * 10)}px`);
    hero.style.setProperty('--hero-cue-o', String(round(1 - p * .9, 3)));
  }

  function renderManifesto() {
    if (!manifesto) return;
    const p = travelProgress(manifesto, .9, .24);
    manifesto.style.setProperty('--manifesto-p', String(round(p, 4)));
    manifesto.style.setProperty('--manifesto-shift', `${round(lerp(18,-10,p))}px`);
    setIndexPulse(manifesto, p);
    manifestoStats.forEach((item, i) => {
      const start = .08 + i * .1;
      const local = clamp((p - start) / .42);
      item.style.setProperty('--stat-p', String(round(local, 4)));
      item.style.setProperty('--stat-y', `${round(lerp(12,-3,local))}px`);
    });
  }

  function renderWorkIntro() {
    if (!workIntro || reducedMotion) return;
    const signed = viewportSigned(workIntro);
    const focus = viewportFocus(workIntro);
    const amp = isDesktop() ? 42 : isTablet() ? 14 : 0;
    workIntro.style.setProperty('--work-title-x', `${round(signed * amp)}px`);
    workIntro.style.setProperty('--work-note-x', `${round(-signed * amp * .75)}px`);
    setIndexPulse(workIntro, focus);
  }

  function renderCases() {
    caseCards.forEach(card => {
      const p = travelProgress(card, .92, .1);
      const signed = viewportSigned(card);
      const focus = viewportFocus(card);
      card.style.setProperty('--case-p', String(round(p,4)));
      card.style.setProperty('--case-focus', String(round(focus,4)));
      card.style.setProperty('--case-lift', `${round((1-focus) * (isDesktop() ? 9 : isTablet() ? 4 : 0))}px`);
      card.style.setProperty('--case-copy-y', `${round(signed * (isDesktop() ? 14 : 0))}px`);
      card.style.setProperty('--case-stage-y', `${round(-signed * (isDesktop() ? 13 : 0))}px`);
      card.style.setProperty('--case-shadow-y', `${round(focus * 12)}px`);
      card.style.setProperty('--case-shadow-blur', `${round(focus * 28)}px`);
      card.style.setProperty('--case-shadow-a', String(round(.05 + focus * .035,3)));
      card.style.setProperty('--case-border-a', String(round(.13 + focus * .12,3)));
      setIndexPulse(card, focus);

      const stage = card.querySelector('.automation-stage,.web-stage,.ask-stage');
      stage?.classList.toggle('is-focused', focus > .56);

      if (card.dataset.caseType === 'web') {
        const amp = isDesktop() ? 1 : isTablet() ? .58 : .34;
        card.style.setProperty('--web-back-x', `${round(-signed * 30 * amp)}px`);
        card.style.setProperty('--web-back-y', `${round(signed * 24 * amp)}px`);
        card.style.setProperty('--web-front-x', `${round(signed * 22 * amp)}px`);
        card.style.setProperty('--web-front-y', `${round(-signed * 20 * amp)}px`);
        card.style.setProperty('--web-phone-x', `${round(-signed * 34 * amp)}px`);
        card.style.setProperty('--web-phone-y', `${round(signed * 30 * amp)}px`);
        card.style.setProperty('--web-back-r', `${round(1.35 + signed * 1.15 * amp,3)}deg`);
        card.style.setProperty('--web-front-r', `${round(-.8 - signed * .95 * amp,3)}deg`);
        card.style.setProperty('--web-phone-r', `${round(1.5 + signed * 1.6 * amp,3)}deg`);
        card.style.setProperty('--web-scale', String(round(.97 + focus * .035,4)));
        card.style.setProperty('--web-line-p', String(round(focus,4)));

        const pointerP = clamp((p - .12) / .74);
        const px = lerp(25, 76, pointerP);
        const py = 50 + Math.sin(pointerP * Math.PI * 1.65) * 17;
        card.style.setProperty('--web-pointer-x', `${round(px,2)}%`);
        card.style.setProperty('--web-pointer-y', `${round(py,2)}%`);
        card.style.setProperty('--web-pointer-o', String(round(clamp((focus-.18)/.55),3)));
      }

      if (card.dataset.caseType === 'ask') {
        const amp = isDesktop() ? 1 : isTablet() ? .55 : .22;
        card.style.setProperty('--ask-command-x', `${round(signed * 28 * amp)}px`);
        card.style.setProperty('--ask-command-y', `${round(signed * 9 * amp)}px`);
        card.style.setProperty('--ask-answer-x', `${round(-signed * 24 * amp)}px`);
        card.style.setProperty('--ask-answer-y', `${round(-signed * 8 * amp)}px`);
        card.style.setProperty('--ask-query-x', `${round(signed * 18 * amp)}px`);
        card.classList.toggle('is-command-sent', p > .34);
        card.classList.toggle('is-answer-ready', p > .51);
        card.classList.toggle('is-queries-ready', p > .67);
      }
    });

    automationCards.forEach(({card,path,dot,length,steps}) => {
      if (!path || !dot || !length) return;
      const p = travelProgress(card, .9, .12);
      const signalP = clamp((p - .04) / .91);
      card.style.setProperty('--flow-offset', String(round(100 - signalP * 100,3)));
      card.style.setProperty('--flow-dot-opacity', String(signalP > .01 && signalP < .995 ? 1 : .25));
      const point = path.getPointAtLength(length * signalP);
      dot.setAttribute('cx', round(point.x, 2));
      dot.setAttribute('cy', round(point.y, 2));

      const thresholds = [.05,.29,.54,.78];
      let current = 0;
      for (let i=0;i<thresholds.length;i++) if (signalP >= thresholds[i]) current = i;
      steps.forEach((step,i) => {
        step.classList.toggle('is-current', i === current && signalP < .985);
        step.classList.toggle('is-complete', signalP >= Math.min(.98, thresholds[i] + .16));
      });
    });
  }

  function renderCapabilities() {
    if (!capabilityItems.length || !capabilityList) return;
    let active = 0;
    let best = Infinity;
    const targetY = viewportHeight() * .52;
    capabilityItems.forEach((item, index) => {
      const r = item.getBoundingClientRect();
      const center = r.top + r.height / 2;
      const distance = Math.abs(center - targetY);
      const rowFocus = clamp(1 - distance / Math.max(viewportHeight() * .48, 320));
      item.style.setProperty('--row-focus', String(round(rowFocus,4)));
      item.style.setProperty('--row-x', `${round(rowFocus * (isDesktop() ? 18 : 7))}px`);
      if (distance < best) { best = distance; active = index; }
    });
    capabilityItems.forEach((item,index) => item.classList.toggle('is-active', index === active));
    if (capabilityMarker) {
      const item = capabilityItems[active];
      const markerH = isMobile() ? 36 : 52;
      const y = item.offsetTop + item.offsetHeight / 2 - markerH / 2;
      capabilityList.style.setProperty('--cap-marker-y', `${round(y)}px`);
    }
    const section = document.getElementById('capabilities');
    if (section) setIndexPulse(section, viewportFocus(section));
  }

  function renderProcess() {
    if (!processScene || !processCards.length) return;
    const p = travelProgress(processScene, .9, .12);
    processScene.style.setProperty('--process-p', String(round(p,4)));
    setIndexPulse(processScene, viewportFocus(processScene));

    const n = processCards.length;
    let current = Math.min(n - 1, Math.max(0, Math.floor(p * n)));
    if (p >= .995) current = n - 1;
    processCards.forEach((card,i) => {
      const center = (i + .5) / n;
      const local = clamp(1 - Math.abs(p - center) * n * 1.25);
      const passed = p >= (i + 1) / n - .015;
      card.classList.toggle('is-passed', passed);
      card.classList.toggle('is-current', i === current && p < 1);
      card.style.setProperty('--process-card-y', `${round((1-local) * (isDesktop() ? 8 : 3))}px`);
      card.style.setProperty('--process-card-r', `${round((i%2?1:-1) * local * (isDesktop()? .45:.15),3)}deg`);
      card.style.setProperty('--process-card-glow', String(round(.35 + local*.55,3)));
    });
  }

  function renderAssistant() {
    if (!assistantScene) return;
    const signed = viewportSigned(assistantScene);
    const focus = viewportFocus(assistantScene);
    const active = focus > .32;
    assistantScene.classList.toggle('is-scene-active', active);
    assistantScene.style.setProperty('--assistant-focus', String(round(focus,4)));
    assistantDevice?.style.setProperty('--assistant-ring-a', String(round(focus*.15,4)));
    setIndexPulse(assistantScene, focus);
    if (reducedMotion) return;

    if (isDesktop()) {
      assistantCopy?.style.setProperty('--assistant-copy-x', `${round(-signed * 16)}px`);
      assistantDevice?.style.setProperty('--assistant-device-x', `${round(signed * 18)}px`);
      assistantDevice?.style.setProperty('--assistant-device-y', `${round(signed * 10)}px`);
      assistantDevice?.style.setProperty('--assistant-device-r', `${round(signed * .42,3)}deg`);
    } else if (isTablet()) {
      assistantCopy?.style.setProperty('--assistant-copy-x', '0px');
      assistantDevice?.style.setProperty('--assistant-device-x', '0px');
      assistantDevice?.style.setProperty('--assistant-device-y', `${round(signed * 8)}px`);
      assistantDevice?.style.setProperty('--assistant-device-r', '0deg');
    } else {
      assistantCopy?.style.setProperty('--assistant-copy-x', '0px');
      assistantDevice?.style.setProperty('--assistant-device-x', '0px');
      assistantDevice?.style.setProperty('--assistant-device-y', '0px');
      assistantDevice?.style.setProperty('--assistant-device-r', '0deg');
    }
  }

  function renderProfile() {
    if (!profileScene || reducedMotion) return;
    const signed = viewportSigned(profileScene);
    const focus = viewportFocus(profileScene);
    const imageAmp = isDesktop() ? 24 : isTablet() ? 10 : 0;
    const copyAmp = isDesktop() ? 14 : 0;
    profileScene.style.setProperty('--profile-image-y', `${round(signed * imageAmp)}px`);
    profileScene.style.setProperty('--profile-caption-y', `${round(-signed * imageAmp * .12)}px`);
    profileScene.style.setProperty('--profile-copy-x', `${round(-signed * copyAmp)}px`);
    setIndexPulse(profileScene, focus);
  }

  function renderFooter() {
    if (!footerScene || reducedMotion) return;
    const p = travelProgress(footerScene, .96, .22);
    const signed = viewportSigned(footerScene);
    footerScene.style.setProperty('--footer-copy-x', `${round(signed * (isDesktop() ? 20 : 0))}px`);
    footerScene.style.setProperty('--footer-arrow-r', `${round(lerp(-12,12,p),2)}deg`);
    footerScene.style.setProperty('--footer-arrow-x', `${round(lerp(5,-3,p))}px`);
    footerScene.style.setProperty('--footer-arrow-y', `${round(lerp(5,-3,p))}px`);
    setIndexPulse(footerScene, viewportFocus(footerScene));
  }

  function renderHeader(scrollY) {
    if (!header) return;
    header.classList.toggle('is-scrolled', scrollY > 20);
    if ((isMobile() || isTablet()) && !body.classList.contains('menu-open')) {
      const hide = scrollDirection > 0 && scrollY > 220;
      header.classList.toggle('is-hidden', hide);
    } else {
      header.classList.remove('is-hidden');
    }

    const probe = Math.min(viewportHeight() * .12, 105);
    const onDark = darkSections.some(section => {
      const r = section.getBoundingClientRect();
      return r.top <= probe && r.bottom >= probe;
    });
    body.classList.toggle('on-dark', onDark);
  }

  function renderNavigation() {
    if (!navSections.length) return;
    let current = null;
    let score = Infinity;
    navSections.forEach(section => {
      const r = section.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= viewportHeight()) return;
      const distance = Math.abs(r.top - viewportHeight() * .24);
      if (distance < score) { score = distance; current = section.id; }
    });
    navLinks.forEach(link => link.classList.toggle('is-active', !!current && link.getAttribute('href') === `#${current}`));
  }

  function render() {
    raf = 0;
    const scrollY = window.scrollY || doc.scrollTop;
    const delta = scrollY - lastScrollY;
    if (Math.abs(delta) > 1) {
      scrollDirection = delta > 0 ? 1 : -1;
      html.dataset.scrollDirection = scrollDirection > 0 ? 'down' : 'up';
    }
    lastScrollY = scrollY;

    const maxScroll = Math.max(1, doc.scrollHeight - viewportHeight());
    updateScrollbar(scrollY, maxScroll);
    renderHeader(scrollY);
    renderHero(scrollY);
    renderManifesto();
    renderWorkIntro();
    renderCases();
    renderCapabilities();
    renderProcess();
    renderAssistant();
    renderProfile();
    renderFooter();
    renderNavigation();
  }

  const requestRender = () => {
    wakeScrollRail();
    if (!raf) raf = requestAnimationFrame(render);
  };

  /* Desktop-only magnetic microinteraction. */
  const magneticBindings = new WeakSet();
  function bindMagnetics() {
    if (!isDesktop() || reducedMotion || !fineQuery.matches) return;
    document.querySelectorAll('.magnetic').forEach(el => {
      if (magneticBindings.has(el)) return;
      magneticBindings.add(el);
      el.addEventListener('pointermove', event => {
        const r = el.getBoundingClientRect();
        const x = clamp((event.clientX - r.left - r.width / 2) * .05, -5, 5);
        const y = clamp((event.clientY - r.top - r.height / 2) * .05, -3, 3);
        el.style.transform = `translate3d(${round(x)}px,${round(y)}px,0)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* Desktop-only pointer light. It adds depth without changing layout. */
  const spotlightBindings = new WeakSet();
  function bindSpotlights() {
    if (!isDesktop() || reducedMotion || !fineQuery.matches) return;
    document.querySelectorAll('.case-card,.assistant-device,.profile-photo').forEach(el => {
      if (spotlightBindings.has(el)) return;
      spotlightBindings.add(el);
      el.addEventListener('pointermove', event => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--pointer-x', `${round(event.clientX-r.left)}px`);
        el.style.setProperty('--pointer-y', `${round(event.clientY-r.top)}px`);
        el.style.setProperty('--pointer-o', '.9');
      });
      el.addEventListener('pointerleave', () => el.style.setProperty('--pointer-o', '0'));
    });
  }

  /* Assistant prompt helpers. */
  document.querySelectorAll('[data-prompt-target]').forEach(button => {
    button.addEventListener('click', async () => {
      const frame = document.getElementById(button.getAttribute('data-prompt-target'));
      if (!frame) return;
      const prompt = button.textContent.trim();
      const original = button.textContent;
      try {
        await navigator.clipboard.writeText(prompt);
        button.textContent = 'Copied · paste in assistant';
        setTimeout(() => { button.textContent = original; }, 1400);
      } catch (_) {}
      frame.focus();
    });
  });

  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });

  /* The load entrance is intentionally brief. Scroll animation starts only
     after the page is usable, and it is never required to reveal content. */
  function armHero() {
    if (!heroCopy || !heroMedia) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      heroCopy.classList.add('is-ready');
      heroMedia.classList.add('is-ready');
    }));
  }

  function measure() {
    setMotionProfile();
    measureScrollbar();
    automationCards.forEach(item => {
      if (item.path?.getTotalLength) item.length = item.path.getTotalLength();
    });
  }

  function handleProfileChange() {
    const changed = setMotionProfile();
    if (changed) closeMenu();
    measure();
    bindMagnetics();
    bindSpotlights();
    requestRender();
  }

  window.addEventListener('scroll', requestRender, { passive:true });
  window.addEventListener('resize', handleProfileChange, { passive:true });
  window.addEventListener('orientationchange', () => setTimeout(handleProfileChange, 120), { passive:true });
  window.visualViewport?.addEventListener('resize', handleProfileChange, { passive:true });
  reducedMotionQuery.addEventListener?.('change', handleProfileChange);
  coarseQuery.addEventListener?.('change', handleProfileChange);

  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => {
      measure();
      requestRender();
    });
    ro.observe(doc);
  }

  window.addEventListener('load', () => {
    measure();
    bindMagnetics();
    bindSpotlights();
    armHero();
    render();
  });

  measure();
  bindMagnetics();
  bindSpotlights();
  armHero();
  render();
})();
