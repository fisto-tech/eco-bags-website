/* ============================
   GreenWrap – script.js
   ============================ */

'use strict';

/* ── Preloader ───────────────────────────────────────── */
const preloaderStartTime = Date.now();
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    const minPreloadTime = 2500; // Minimum 2.5 seconds
    const elapsedTime = Date.now() - preloaderStartTime;
    const remainingTime = Math.max(0, minPreloadTime - elapsedTime);

    setTimeout(() => {
      preloader.classList.add('hidden');
      setTimeout(() => {
        preloader.remove();
      }, 600); // Matches CSS transition
    }, remainingTime);
  }
});

/* ── Navbar ──────────────────────────────────────────── */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const links = navLinks.querySelectorAll('.nav-link');

  // Scroll: tint navbar + highlight active link
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
    highlightActiveLink();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburger toggle
  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    navLinks.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Close menu on link click
  links.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click (mobile)
  document.addEventListener('click', e => {
    if (!navbar.contains(e.target)) {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  // Active link highlight
  function highlightActiveLink() {
    const sections = document.querySelectorAll('section[id]');
    const scrollMid = window.scrollY + window.innerHeight * 0.4;

    let current = '';
    sections.forEach(sec => {
      if (sec.offsetTop <= scrollMid) current = sec.id;
    });

    links.forEach(link => {
      link.classList.toggle(
        'active',
        link.getAttribute('href') === `#${current}`
      );
    });
  }
})();


/* ── Intersection Observer – Scroll Animations ───────── */
(function initAnimations() {
  const elements = document.querySelectorAll('[data-anim]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      const delay = parseInt(el.dataset.delay || 0, 10);

      if (entry.isIntersecting) {
        setTimeout(() => {
          el.classList.add('in-view');
          el.classList.remove('out-view');
        }, delay);
      } else {
        el.classList.remove('in-view');
        el.classList.add('out-view');
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
})();


/* ── Animated Counters ───────────────────────────────── */
(function initCounters() {
  const counterEls = document.querySelectorAll('.counter-num');
  let started = false;

  const sectionObs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !started) {
      started = true;
      counterEls.forEach(el => animateCounter(el));
    }
  }, { threshold: 0.3 });

  const aboutSection = document.querySelector('.counters');
  if (aboutSection) sectionObs.observe(aboutSection);

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    let step = 0;

    const easeOut = t => 1 - Math.pow(1 - t, 3);

    const tick = () => {
      step++;
      const progress = easeOut(step / steps);
      current = Math.round(progress * target);
      el.textContent = current.toLocaleString('en-IN');
      if (step < steps) {
        setTimeout(tick, duration / steps);
      } else {
        el.textContent = target.toLocaleString('en-IN');
      }
    };
    setTimeout(tick, duration / steps);
  }
})();


/* ── Testimonials Carousel ───────────────────────────── */
(function initCarousel() {
  const track = document.getElementById('testimonialsTrack');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dotsWrap = document.getElementById('tDots');

  if (!track) return;

  const cards = track.querySelectorAll('.testimonial-card');
  const total = cards.length;
  let current = 0;
  let autoTimer = null;

  // Determine visible count based on viewport
  const getVisible = () => (window.innerWidth <= 768 ? 1 : 3);

  // Build dots
  function buildDots() {
    dotsWrap.innerHTML = '';
    const visible = getVisible();
    const pages = Math.ceil(total / visible);
    for (let i = 0; i < pages; i++) {
      const dot = document.createElement('button');
      dot.className = 'tctrl-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.addEventListener('click', () => goTo(i * visible));
      dotsWrap.appendChild(dot);
    }
  }

  function updateDots() {
    const visible = getVisible();
    const pageIdx = Math.floor(current / visible);
    dotsWrap.querySelectorAll('.tctrl-dot').forEach((d, i) => {
      d.classList.toggle('active', i === pageIdx);
    });
  }

  function goTo(idx) {
    const visible = getVisible();
    const cardWidth = cards[0].getBoundingClientRect().width;
    const gap = 24; // 1.5rem gap

    // Clamp to valid range
    const max = Math.max(0, total - visible);
    current = Math.max(0, Math.min(idx, max));

    const offset = current * (cardWidth + gap);
    track.style.transform = `translateX(-${offset}px)`;
    updateDots();
  }

  prevBtn.addEventListener('click', () => {
    const visible = getVisible();
    goTo(current - visible);
    resetAuto();
  });

  nextBtn.addEventListener('click', () => {
    const visible = getVisible();
    const nextIdx = current + visible;
    goTo(nextIdx >= total ? 0 : nextIdx);
    resetAuto();
  });

  // Auto-advance
  function startAuto() {
    autoTimer = setInterval(() => {
      const visible = getVisible();
      const nextIdx = current + visible >= total ? 0 : current + visible;
      goTo(nextIdx);
    }, 5000);
  }
  function resetAuto() {
    clearInterval(autoTimer);
    startAuto();
  }

  // Touch / swipe support
  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const delta = e.changedTouches[0].clientX - startX;
    if (Math.abs(delta) > 50) {
      const visible = getVisible();
      if (delta < 0) {
        const nextIdx = current + visible >= total ? 0 : current + visible;
        goTo(nextIdx);
      } else {
        goTo(current - visible);
      }
      resetAuto();
    }
  }, { passive: true });

  // Rebuild on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      buildDots();
      goTo(0);
    }, 250);
  });

  buildDots();
  goTo(0);
  startAuto();
})();


/* ── Contact Form ────────────────────────────────────── */
(function initForm() {
  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');

  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();

    // Simple client-side validation
    const name = form.querySelector('#name').value.trim();
    const email = form.querySelector('#email').value.trim();
    const msg = form.querySelector('#message').value.trim();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || !email || !msg) {
      shakeForm(form);
      return;
    }
    if (!emailRe.test(email)) {
      shakeForm(form.querySelector('#email'));
      return;
    }

    // Simulate submission
    const btn = form.querySelector('.btn-primary');
    const btnText = btn.querySelector('.btn-text');
    btnText.textContent = 'Sending…';
    btn.disabled = true;

    setTimeout(() => {
      btnText.textContent = 'Send Message';
      btn.disabled = false;
      form.reset();
      success.classList.add('show');
      setTimeout(() => success.classList.remove('show'), 5000);
    }, 1500);
  });

  function shakeForm(el) {
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = 'shake .4s ease';
  }

  // Inject shake keyframes once
  if (!document.getElementById('shakeKF')) {
    const style = document.createElement('style');
    style.id = 'shakeKF';
    style.textContent = `
      @keyframes shake {
        0%,100% { transform: translateX(0); }
        20%      { transform: translateX(-8px); }
        40%      { transform: translateX(8px); }
        60%      { transform: translateX(-6px); }
        80%      { transform: translateX(6px); }
      }
    `;
    document.head.appendChild(style);
  }
})();


/* ── Slow Motion Hero Video ───────────────────────────────── */
(function initHeroVideoSpeed() {
  const video = document.querySelector('.hero-video');
  if (!video) return;

  const applySlowSpeed = () => {
    video.playbackRate = 0.6;
    if (video.paused) {
      video.play().catch(() => {
        // Autoplay may be blocked in some browsers, but video remains muted.
      });
    }
  };

  if (video.readyState >= 2) {
    applySlowSpeed();
  } else {
    video.addEventListener('loadedmetadata', applySlowSpeed, { once: true });
  }
})();


/* ── Hero Panel Switcher ───────────────────────────────── */
(function initHeroPanels() {
  const panelRoot = document.querySelector('.hero-panel');
  if (!panelRoot) return;

  const buttons = panelRoot.querySelectorAll('.hero-panel-btn');
  const panels = panelRoot.querySelectorAll('.hero-panel-content');

  const setActivePanel = (id) => {
    panels.forEach(panel => panel.classList.toggle('active', panel.dataset.panel === id));
    buttons.forEach(button => button.classList.toggle('active', button.dataset.target === id));
  };

  buttons.forEach(button => {
    button.addEventListener('click', () => setActivePanel(button.dataset.target));
  });
})();


/* ── Hero Split Reveal ───────────────────────────────── */
(function initHeroSplitReveal() {
  const hero = document.querySelector('.hero');
  if (!hero || typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') return;

  window.gsap.registerPlugin(window.ScrollTrigger);

  // Entrance animation for load (targets wrapper to avoid conflicting with ScrollTrigger start states)
  window.gsap.from('.hero-content', { opacity: 0, y: 30, duration: 1.2, ease: 'power3.out', delay: 0.2 });

  const tl = window.gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: '+=150%',
      pin: true,
      pinSpacing: false,
      scrub: true
    }
  });

  tl.to('.hero-bg-left', { xPercent: -100, ease: 'power1.inOut' }, 0)
    .to('.hero-bg-right', { xPercent: 100, ease: 'power1.inOut' }, 0)
    .to('.hero-anim-left', { xPercent: -150, opacity: 0, ease: 'power1.inOut' }, 0)
    .to('.hero-scroll', { y: 50, opacity: 0, ease: 'power1.inOut' }, 0);
})();

/* ── Product gallery scroll rotation ─────────────────── */
(function initProductGallery() {
  const wrapper = document.getElementById('productGallery');
  if (!wrapper) return;

  const originalCards = Array.from(wrapper.children);
  const uniqueCards = originalCards.length;

  // Clone cards twice to create 15 cards for a seamless infinite loop
  for (let i = 0; i < 2; i++) {
    originalCards.forEach(card => {
      wrapper.appendChild(card.cloneNode(true));
    });
  }

  const cards = Array.from(wrapper.children);
  const total = cards.length;
  const spacingFactor = total; // 15
  wrapper.style.setProperty('--cards', spacingFactor);
  cards.forEach((card, index) => {
    card.style.setProperty('--card-i', index + 1);
  });

  const section = wrapper.closest('.products-showcase') || wrapper.closest('.product-showcase');
  const updateRotate = () => {
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const scrolledPastTop = -rect.top;
    const scrollableDistance = rect.height - window.innerHeight;
    let progress = 0;
    if (scrollableDistance > 0) {
      progress = scrolledPastTop / scrollableDistance;
    }
    progress = Math.min(Math.max(progress, 0), 1);

    // Snap to the nearest card step to mimic the CodePen steps() behavior
    const maxIndex = uniqueCards - 1; // 4
    const rotate = Math.round(progress * maxIndex) / spacingFactor;
    wrapper.style.setProperty('--rotate', rotate.toFixed(4));

    let activeIndex = -1;
    let minPhaseDist = Infinity;

    cards.forEach((card, index) => {
      let pos = (rotate - index / spacingFactor + 1) % 1;
      if (pos < 0) pos += 1;
      const dist = Math.min(pos, 1 - pos);

      const grayscale = Math.max(0, Math.min(dist * total * 1.4, 1));
      const opacity = 1 - (dist / 0.22);

      const focusRange = 0.1;
      const maxBlur = 5;
      const normDist = Math.min(dist, focusRange);
      const blurProgress = normDist / focusRange;
      const blur = blurProgress * maxBlur;

      const activeProgress = Math.max(0, Math.min(1 - (dist / 0.035), 1));
      const scale = 0.58 + 0.72 * activeProgress;

      card.style.filter = `blur(${blur.toFixed(2)}px) grayscale(${grayscale.toFixed(3)})`;
      card.style.opacity = Math.max(0.35, opacity).toFixed(3);
      card.style.zIndex = Math.round(1 + activeProgress * 9);

      const inner = card.querySelector('.product-card-inner');
      if (inner) {
        inner.style.transform = `scale3d(${scale.toFixed(3)}, ${scale.toFixed(3)}, 1)`;
      }

      if (dist < minPhaseDist) {
        minPhaseDist = dist;
        activeIndex = index;
      }
    });

    if (activeIndex !== -1) {
      const activeCard = cards[activeIndex];
      const titleEl = document.getElementById('activeProductTitle');
      const descEl = document.getElementById('activeProductDesc');
      if (titleEl) titleEl.textContent = activeCard.dataset.title || '';
      if (descEl) descEl.textContent = activeCard.dataset.desc || '';

      const displayIndex = (activeIndex % uniqueCards) + 1;
      const productCurrent = document.getElementById('productCurrent');
      const productTotal = document.getElementById('productTotal');
      const productProgressFill = document.getElementById('productProgressFill');

      if (productCurrent) productCurrent.textContent = String(displayIndex).padStart(2, '0');
      if (productTotal) productTotal.textContent = String(uniqueCards).padStart(2, '0');
      if (productProgressFill) productProgressFill.style.width = `${(displayIndex / uniqueCards) * 100}%`;
    }
  };

  window.addEventListener('scroll', updateRotate, { passive: true });
  window.addEventListener('resize', updateRotate);
  updateRotate();
})();

/* ── Smooth scroll for anchor links (Safari fallback) ── */
(function smoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const el = id ? document.getElementById(id) : null;
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();

/* -- Bag scroll image sequence (scroll-scrub video) --- */
(function initBagScrollSequence() {
  const root = document.querySelector('.bag-scroll-sequence');
  const track = document.getElementById('bagScrollTrack') || root?.querySelector('.bag-scroll-track');
  const frameEl = document.getElementById('bagScrollFrame') || root?.querySelector('canvas, img');
  const progressEl = document.getElementById('bagScrollProgress') || root?.querySelector('.bag-scroll-progress-fill');

  if (!root || !track || !frameEl) return;

  const isCanvas = frameEl instanceof HTMLCanvasElement;
  let ctx = null;
  if (isCanvas) {
    ctx = frameEl.getContext('2d');
  }

  const DEFAULT_FRAME_COUNT = 134;
  const frameDir = (root.dataset.frameDir || 'images/bag-video-images/').trim();
  const frameExt = (root.dataset.frameExt || 'webp').trim().replace(/^\./, '');

  const frameCount = (() => {
    const fromData = Number.parseInt(root.dataset.frameCount || '', 10);
    return Number.isFinite(fromData) && fromData > 0 ? fromData : DEFAULT_FRAME_COUNT;
  })();

  root.style.setProperty('--bag-frames', String(frameCount));

  const frameSrc = (index) =>
    `${frameDir}${String(index + 1).padStart(5, '0')}.${frameExt}`;

  const cache = new Array(frameCount);
  let rafId = null;
  let currentFrame = -1;
  let preloadStarted = false;

  const preloadFrames = () => {
    if (preloadStarted) return;
    preloadStarted = true;

    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.decoding = 'async';
      const idx = i;
      img.onload = () => { cache[idx] = img; };
      img.src = frameSrc(idx);
    }
  };

  const setFrame = (index) => {
    const clamped = Math.max(0, Math.min(frameCount - 1, index));
    if (clamped === currentFrame) return;
    currentFrame = clamped;

    const cached = cache[clamped];
    const srcToUse = cached?.src || frameSrc(clamped);

    if (isCanvas) {
      if (cached && cached.complete) {
        ctx.clearRect(0, 0, frameEl.width, frameEl.height);
        ctx.drawImage(cached, 0, 0, frameEl.width, frameEl.height);
      } else {
        const temp = new Image();
        temp.onload = () => {
          if (currentFrame === clamped) {
            ctx.clearRect(0, 0, frameEl.width, frameEl.height);
            ctx.drawImage(temp, 0, 0, frameEl.width, frameEl.height);
          }
        };
        temp.src = srcToUse;
      }
    } else {
      frameEl.src = srcToUse;
    }
  };

  if (isCanvas) {
    const initialImg = new Image();
    initialImg.onload = () => {
      if (currentFrame <= 0) {
        ctx.clearRect(0, 0, frameEl.width, frameEl.height);
        ctx.drawImage(initialImg, 0, 0, frameEl.width, frameEl.height);
      }
    };
    initialImg.src = frameSrc(0);
  }

  const update = () => {
    rafId = null;

    const rect = track.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    if (scrollable <= 0) return;

    const scrolled = Math.max(0, -rect.top);
    const progress = Math.min(scrolled / scrollable, 1);
    const frameIndex = Math.round(progress * (frameCount - 1));

    setFrame(frameIndex);
    if (progressEl) progressEl.style.width = `${progress * 100}%`;
  };

  const onScroll = () => {
    if (!rafId) rafId = requestAnimationFrame(update);
  };

  const canUseGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  if (canUseGSAP) {
    window.gsap.registerPlugin(window.ScrollTrigger);

    const state = { frame: 0 };
    const scrubSetting = (() => {
      const raw = root.dataset.scrub;
      if (raw == null || raw === '') return true;
      const n = Number.parseFloat(raw);
      return Number.isFinite(n) && n >= 0 ? n : true;
    })();

    window.ScrollTrigger.create({
      trigger: track,
      start: 'top bottom',
      once: true,
      onEnter: preloadFrames
    });

    window.gsap.to(state, {
      frame: frameCount - 1,
      ease: 'none',
      snap: { frame: 1 },
      scrollTrigger: {
        trigger: track,
        start: 'top top',
        end: 'bottom bottom',
        scrub: scrubSetting
      },
      onUpdate: () => {
        const idx = Math.round(state.frame);
        setFrame(idx);
        if (progressEl) progressEl.style.width = `${(idx / (frameCount - 1)) * 100}%`;
      }
    });

    window.ScrollTrigger.addEventListener('refresh', () => {
      const idx = Math.round(state.frame);
      setFrame(idx);
    });

    window.ScrollTrigger.refresh();
  } else {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        preloadFrames();
        observer.disconnect();
      }
    }, { rootMargin: '300px 0px' });

    observer.observe(track);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    update();
  }
})();
