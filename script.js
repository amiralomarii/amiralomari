(() => {
  'use strict';

  const body = document.body;
  const header = document.querySelector('[data-header]');
  const progress = document.querySelector('.scroll-progress span');
  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const year = document.querySelector('[data-year]');
  const stage = document.querySelector('[data-tilt-stage]');
  const portraitCard = document.querySelector('[data-portrait-card]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (year) year.textContent = new Date().getFullYear();

  const updateScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (header) header.classList.toggle('is-scrolled', y > 18);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    }
  };

  const clamp01 = value => Math.max(0, Math.min(1, value));
  const smootherStep = value => {
    const x = clamp01(value);
    return x * x * x * (x * (x * 6 - 15) + 10);
  };
  const lerp = (from, to, amount) => from + (to - from) * amount;

  const revealTargets = [...document.querySelectorAll('.reveal-split, .reveal-board, .reveal-process, .reveal-device, .reveal-profile')];
  const projectScenes = [...document.querySelectorAll('.reveal-project')];
  const motionItems = [...revealTargets, ...projectScenes];
  const motionState = new WeakMap();

  // A scene is fully settled through the useful middle of the viewport, then
  // gently relaxes in the opposite direction near either edge. Because the
  // same progress is calculated in both directions, scrolling back up feels
  // like a composed reverse motion rather than a one-time reveal being replayed.
  const getSceneTarget = (element, vh) => {
    const rect = element.getBoundingClientRect();
    const entry = smootherStep((vh * .96 - rect.top) / (vh * .30));
    const exit = smootherStep((rect.bottom - vh * .08) / (vh * .26));
    const presence = Math.min(entry, exit);

    // Enter from below when scrolling down; leave toward the top once the
    // section is almost gone. The reverse path happens naturally on scroll-up.
    const y = (1 - entry) * 30 - (1 - exit) * 20;
    const scale = .986 + presence * .014;
    const opacity = .08 + presence * .92;
    const blur = (1 - presence) * 2.4;

    return { presence, entry, exit, y, scale, opacity, blur };
  };

  const applyRevealState = (element, state) => {
    element.style.setProperty('--reveal-progress', state.presence.toFixed(4));
    element.style.setProperty('--reveal-y', `${state.y.toFixed(2)}px`);
    element.style.setProperty('--reveal-scale', state.scale.toFixed(4));
    element.style.setProperty('--reveal-opacity', state.opacity.toFixed(3));
    element.style.setProperty('--reveal-blur', `${state.blur.toFixed(2)}px`);
  };

  const applyProjectState = (scene, state) => {
    // Large visuals use a little more depth than ordinary section reveals, but
    // stay restrained so the UI itself remains the focus.
    const p = state.presence;
    const sceneY = state.y * 1.15;
    const sceneScale = .972 + p * .028;
    const sceneOpacity = .06 + p * .94;
    const sceneBlur = (1 - p) * 4.4;
    const copyY = state.y * .62;
    const copyOpacity = .16 + p * .84;

    scene.style.setProperty('--scene-progress', p.toFixed(4));
    scene.style.setProperty('--detail-progress', p.toFixed(4));
    scene.style.setProperty('--scene-y', `${sceneY.toFixed(2)}px`);
    scene.style.setProperty('--scene-scale', sceneScale.toFixed(4));
    scene.style.setProperty('--scene-opacity', sceneOpacity.toFixed(3));
    scene.style.setProperty('--scene-blur', `${sceneBlur.toFixed(2)}px`);
    scene.style.setProperty('--copy-y', `${copyY.toFixed(2)}px`);
    scene.style.setProperty('--copy-opacity', copyOpacity.toFixed(3));

    const canvas = scene.querySelector('.automation-canvas');
    if (canvas) {
      // Keep the travelling workflow signals active only while the canvas is
      // comfortably on screen. Hysteresis prevents rapid on/off flicker.
      const flowing = canvas.classList.contains('is-flowing');
      if (!flowing && p > .72) canvas.classList.add('is-flowing');
      if (flowing && p < .58) canvas.classList.remove('is-flowing');
    }
  };

  const valuesAreSettled = (current, target) => (
    Math.abs(current.presence - target.presence) < .001 &&
    Math.abs(current.y - target.y) < .05 &&
    Math.abs(current.scale - target.scale) < .0002 &&
    Math.abs(current.opacity - target.opacity) < .001 &&
    Math.abs(current.blur - target.blur) < .03
  );

  let motionRaf = 0;
  let lastFrameTime = performance.now();

  const renderScrollMotion = now => {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const dt = Math.min(40, Math.max(8, now - lastFrameTime));
    lastFrameTime = now;

    // Frame-rate independent damping: responsive under a mouse wheel but still
    // fluid on a fast trackpad or mobile momentum scroll.
    const damping = 1 - Math.exp(-dt * .018);
    let unsettled = false;

    motionItems.forEach(element => {
      const target = getSceneTarget(element, vh);
      let current = motionState.get(element);

      if (!current) {
        // Do not animate from an arbitrary state on a refreshed anchor/deep link.
        current = { ...target };
        motionState.set(element, current);
      } else {
        current.presence = lerp(current.presence, target.presence, damping);
        current.entry = lerp(current.entry, target.entry, damping);
        current.exit = lerp(current.exit, target.exit, damping);
        current.y = lerp(current.y, target.y, damping);
        current.scale = lerp(current.scale, target.scale, damping);
        current.opacity = lerp(current.opacity, target.opacity, damping);
        current.blur = lerp(current.blur, target.blur, damping);
        if (!valuesAreSettled(current, target)) unsettled = true;
      }

      if (element.classList.contains('reveal-project')) {
        applyProjectState(element, current);
      } else {
        applyRevealState(element, current);
      }
    });

    updateScroll();

    if (unsettled) {
      motionRaf = requestAnimationFrame(renderScrollMotion);
    } else {
      motionRaf = 0;
    }
  };

  const requestScrollMotion = () => {
    if (reducedMotion) {
      updateScroll();
      return;
    }
    if (!motionRaf) {
      lastFrameTime = performance.now();
      motionRaf = requestAnimationFrame(renderScrollMotion);
    }
  };

  if (reducedMotion) {
    revealTargets.forEach(element => {
      element.style.setProperty('--reveal-progress', '1');
      element.style.setProperty('--reveal-y', '0px');
      element.style.setProperty('--reveal-scale', '1');
      element.style.setProperty('--reveal-opacity', '1');
      element.style.setProperty('--reveal-blur', '0px');
    });
    projectScenes.forEach(scene => {
      scene.style.setProperty('--scene-progress', '1');
      scene.style.setProperty('--detail-progress', '1');
      scene.style.setProperty('--scene-y', '0px');
      scene.style.setProperty('--scene-scale', '1');
      scene.style.setProperty('--scene-opacity', '1');
      scene.style.setProperty('--scene-blur', '0px');
      scene.style.setProperty('--copy-y', '0px');
      scene.style.setProperty('--copy-opacity', '1');
      const canvas = scene.querySelector('.automation-canvas');
      if (canvas) canvas.classList.add('is-flowing');
    });
    updateScroll();
  } else {
    // Prime positions once so below-the-fold content starts in the correct state,
    // then let every wheel/touch movement drive the same reversible choreography.
    const vh = window.innerHeight || document.documentElement.clientHeight;
    motionItems.forEach(element => {
      const state = getSceneTarget(element, vh);
      motionState.set(element, { ...state });
      element.classList.contains('reveal-project') ? applyProjectState(element, state) : applyRevealState(element, state);
    });
    updateScroll();
  }

  window.addEventListener('scroll', requestScrollMotion, { passive: true });
  window.addEventListener('resize', requestScrollMotion, { passive: true });

  const closeMenu = () => {
    if (!menuButton || !mobileNav) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    mobileNav.classList.remove('is-open');
    mobileNav.setAttribute('aria-hidden', 'true');
    body.classList.remove('menu-open');
  };

  const openMenu = () => {
    if (!menuButton || !mobileNav) return;
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', 'Close navigation');
    mobileNav.classList.add('is-open');
    mobileNav.setAttribute('aria-hidden', 'false');
    body.classList.add('menu-open');
  };

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') === 'true';
      open ? closeMenu() : openMenu();
    });
    mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    const backdrop = mobileNav.querySelector('.mobile-nav__backdrop');
    if (backdrop) backdrop.addEventListener('click', closeMenu);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  }

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const selector = link.getAttribute('href');
      if (!selector || selector === '#') return;
      const target = document.querySelector(selector);
      if (!target) return;
      event.preventDefault();
      const offset = header ? header.getBoundingClientRect().height + 24 : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', selector);
    });
  });

  if (stage && portraitCard && !reducedMotion && matchMedia('(pointer:fine)').matches) {
    let currentX = 0, currentY = 0, currentTiltX = 0, currentTiltY = 0;
    let targetX = 0, targetY = 0, targetTiltX = 0, targetTiltY = 0;
    let portraitRaf = 0;

    const animatePortrait = () => {
      currentX += (targetX - currentX) * .09;
      currentY += (targetY - currentY) * .09;
      currentTiltX += (targetTiltX - currentTiltX) * .085;
      currentTiltY += (targetTiltY - currentTiltY) * .085;
      portraitCard.style.setProperty('--portrait-x', `${currentX.toFixed(2)}px`);
      portraitCard.style.setProperty('--portrait-y', `${currentY.toFixed(2)}px`);
      portraitCard.style.setProperty('--tilt-x', `${currentTiltX.toFixed(2)}deg`);
      portraitCard.style.setProperty('--tilt-y', `${currentTiltY.toFixed(2)}deg`);

      const moving = Math.abs(targetX-currentX)+Math.abs(targetY-currentY)+Math.abs(targetTiltX-currentTiltX)+Math.abs(targetTiltY-currentTiltY) > .025;
      portraitRaf = moving ? requestAnimationFrame(animatePortrait) : 0;
    };
    const startPortrait = () => { if (!portraitRaf) portraitRaf = requestAnimationFrame(animatePortrait); };

    stage.addEventListener('pointermove', event => {
      const rect = stage.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - .5;
      const ny = (event.clientY - rect.top) / rect.height - .5;
      targetTiltY = nx * 3.6;
      targetTiltX = ny * -2.8;
      targetX = nx * 5;
      targetY = ny * 4;
      startPortrait();
    });
    stage.addEventListener('pointerleave', () => {
      targetX = targetY = targetTiltX = targetTiltY = 0;
      startPortrait();
    });
  }

  if (!reducedMotion && matchMedia('(pointer:fine)').matches) {
    // Smooth magnetic controls: pointer movement sets a target and a small
    // spring loop eases the element toward it. This avoids the stutter that
    // happens when CSS transform transitions fight pointermove updates.
    document.querySelectorAll('.magnetic').forEach(el => {
      let currentX = 0;
      let currentY = 0;
      let targetX = 0;
      let targetY = 0;
      let raf = 0;
      let hovering = false;
      let bounds = null;

      const tick = () => {
        currentX += (targetX - currentX) * .16;
        currentY += (targetY - currentY) * .16;

        if (Math.abs(targetX - currentX) < .01) currentX = targetX;
        if (Math.abs(targetY - currentY) < .01) currentY = targetY;

        el.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;

        const settled = Math.abs(targetX - currentX) < .02 && Math.abs(targetY - currentY) < .02;
        if (!settled) {
          raf = requestAnimationFrame(tick);
        } else {
          raf = 0;
          if (!hovering) {
            el.classList.remove('is-magnetic');
            el.style.transform = '';
          }
        }
      };

      const startLoop = () => {
        if (!raf) raf = requestAnimationFrame(tick);
      };

      el.addEventListener('pointerenter', () => {
        hovering = true;
        bounds = el.getBoundingClientRect();
        el.classList.add('is-magnetic');
        startLoop();
      });

      el.addEventListener('pointermove', event => {
        const rect = bounds || el.getBoundingClientRect();
        const dx = event.clientX - rect.left - rect.width / 2;
        const dy = event.clientY - rect.top - rect.height / 2;

        // Keep large CTAs elegant while letting compact buttons feel playful.
        const strength = rect.width > 420 ? .035 : .14;
        const limit = rect.width > 420 ? 10 : 8;
        targetX = Math.max(-limit, Math.min(limit, dx * strength));
        targetY = Math.max(-limit, Math.min(limit, dy * strength));
        startLoop();
      });

      const release = () => {
        hovering = false;
        bounds = null;
        targetX = 0;
        targetY = 0;
        startLoop();
      };

      el.addEventListener('pointerleave', release);
      el.addEventListener('pointercancel', release);
    });
  }

  // The assistant is hosted on another origin, so prompt chips copy a useful
  // starter question and then move focus to the live assistant.
  document.querySelectorAll('[data-prompt-target]').forEach(button => {
    button.addEventListener('click', async () => {
      const id = button.getAttribute('data-prompt-target');
      const frame = document.getElementById(id);
      if (!frame) return;
      const prompt = button.textContent.trim();
      const original = button.textContent;
      try {
        await navigator.clipboard.writeText(prompt);
        button.textContent = 'Copied — paste in the assistant';
        setTimeout(() => { button.textContent = original; }, 1200);
      } catch (_) {
        // Clipboard access can be blocked on some local/file deployments.
      }
      frame.focus();
      const device = frame.closest('.assistant-device');
      if (device && !reducedMotion) {
        device.animate([
          { transform: 'translateY(0) scale(1)' },
          { transform: 'translateY(-4px) scale(1.006)' },
          { transform: 'translateY(0) scale(1)' }
        ], { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    });
  });
})();
