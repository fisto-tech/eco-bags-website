import sys
import re

with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('/* ── Parallax Hero ───────────────────────────────────── */')
if idx != -1:
    content = content[:idx]

new_content = """/* ── Parallax Hero ───────────────────────────────────── */
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
  const total = cards.length;
  wrapper.style.setProperty('--cards', total);
  cards.forEach((card, index) => {
    card.style.setProperty('--card-i', index + 1);
  });

  const section = wrapper.closest('.products-showcase') || wrapper.closest('.product-showcase');
  const updateRotate = () => {
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const progress = Math.min(Math.max((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0), 1);
    const rotate = progress;
    wrapper.style.setProperty('--rotate', rotate.toFixed(4));
    
    // JS Fallback for unsupported CSS mod()
    cards.forEach((card, index) => {
      const phase = (index) / total - 0.75;
      let pos = (phase + rotate + 1) % 1;
      if (pos < 0) pos += 1;
      const dist = Math.min(pos, 1 - pos);
      card.style.setProperty('--card-dist', dist.toFixed(4));
    });
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

/* -- Bag scroll image sequence (scroll-scrub video) --- */
(function initBagScrollSequence() {
  const root       = document.querySelector('.bag-scroll-sequence');
  const track      = document.getElementById('bagScrollTrack') || root?.querySelector('.bag-scroll-track');
  const frameEl    = document.getElementById('bagScrollFrame') || root?.querySelector('canvas, img');
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
"""

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(content + new_content)

with open('style.css', 'r', encoding='utf-8') as f:
    c = f.read()

c = re.sub(r'--card-phase:.*?;', '', c)
c = re.sub(r'--card-pos:.*?;', '', c)

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(c)
