/* ============================
   GreenWrap – script.js
   ============================ */

'use strict';

/* ── Navbar ──────────────────────────────────────────── */
(function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  const links     = navLinks.querySelectorAll('.nav-link');

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
      const el    = entry.target;
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
    const target   = parseInt(el.dataset.target, 10);
    const duration = 2000;
    const steps    = 60;
    const increment = target / steps;
    let current = 0;
    let step    = 0;

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
  const track  = document.getElementById('testimonialsTrack');
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
  const form    = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');

  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();

    // Simple client-side validation
    const name  = form.querySelector('#name').value.trim();
    const email = form.querySelector('#email').value.trim();
    const msg   = form.querySelector('#message').value.trim();
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


/* ── Parallax Hero ───────────────────────────────────── */
(function initParallax() {
  const hero   = document.querySelector('.hero');
  const leaves = document.querySelectorAll('.leaf');
  const shapes = document.querySelectorAll('.shape');

  if (!hero) return;

  const onScroll = () => {
    const scrollY = window.scrollY;
    if (scrollY > window.innerHeight) return;

    leaves.forEach((leaf, i) => {
      const speed = (i % 2 === 0 ? 0.08 : 0.05);
      leaf.style.transform = `translateY(${scrollY * speed}px) rotate(${scrollY * .02}deg)`;
    });
    shapes.forEach((shape, i) => {
      const speed = 0.06 + i * 0.02;
      shape.style.transform = `translateY(${scrollY * speed}px)`;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
})();


/* ── Product gallery scroll rotation ─────────────────── */
(function initProductGallery() {
  const wrapper = document.getElementById('productGallery');
  if (!wrapper) return;

  const cards = Array.from(wrapper.children);
  wrapper.style.setProperty('--cards', cards.length);
  cards.forEach((card, index) => {
    card.style.setProperty('--card-i', index + 1);
  });

  const section = wrapper.closest('.product-showcase');
  const updateRotate = () => {
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const progress = Math.min(Math.max((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0), 1);
    wrapper.style.setProperty('--rotate', progress.toFixed(4));
  };

  window.addEventListener('scroll', updateRotate, { passive: true });
  window.addEventListener('resize', updateRotate);
  updateRotate();
})();

/* ── Smooth scroll for anchor links (Safari fallback) ── */
(function smoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id  = a.getAttribute('href').slice(1);
      const el  = id ? document.getElementById(id) : null;
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();