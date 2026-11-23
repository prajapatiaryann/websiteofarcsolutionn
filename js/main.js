/**
 * ARC Solution — main.js
 * GSAP 3 + ScrollTrigger animation logic
 */

(function () {
  'use strict';

  // ── 1. Register GSAP plugins ──────────────────────────────────────────────
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

  // ── 2. Reduced-motion check ───────────────────────────────────────────────
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 3. INTRO ANIMATION ────────────────────────────────────────────────────
  const introOverlay = document.getElementById('intro-overlay');
  const skipBtn      = document.getElementById('skip-intro');

  function dismissIntro() {
    if (introOverlay) introOverlay.style.display = 'none';
  }

  if (!prefersReduced && introOverlay) {
    const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });

    // Phase 1 — Arc reactor powers on
    tl.fromTo('#intro-reactor',
      { scale: 0, opacity: 0, rotation: -60 },
      { scale: 1, opacity: 1, rotation: 0, duration: 0.7, ease: 'power3.out' }
    )
    // Reactor glow pulse
    .to('#intro-reactor', {
      filter: 'drop-shadow(0 0 24px #00d4ff) drop-shadow(0 0 64px rgba(0,212,255,0.3))',
      duration: 0.5
    })
    // Phase 2 — Armor plates assemble
    .to('.plate-top',    { y: '0%', duration: 0.55, ease: 'power3.inOut' }, 1.0)
    .to('.plate-bottom', { y: '0%', duration: 0.55, ease: 'power3.inOut' }, 1.0)
    .to('.plate-left',   { x: '0%', duration: 0.55, ease: 'power3.inOut' }, 1.15)
    .to('.plate-right',  { x: '0%', duration: 0.55, ease: 'power3.inOut' }, 1.15)
    // Brief moment fully assembled — reactor stays visible through plates z-index
    .to('#intro-reactor', {
      scale: 1.1,
      filter: 'drop-shadow(0 0 48px #00d4ff) drop-shadow(0 0 96px rgba(0,212,255,0.5))',
      duration: 0.25,
      ease: 'power1.inOut'
    }, 1.8)
    // Phase 3 — Plates break away
    .to('.armor-plate', {
      opacity: 0,
      duration: 0.35,
      stagger: 0.07,
      ease: 'power2.in'
    }, 2.3)
    .to('#intro-overlay', {
      opacity: 0,
      duration: 0.45,
      ease: 'power2.in',
      onComplete: dismissIntro
    }, 2.65)
    // Phase 4 — Hero content reveals
    .from('.hero-overline',
      { opacity: 0, y: 24, duration: 0.6, ease: 'power2.out' }, 2.9)
    .from('.hero-title',
      { opacity: 0, y: 50, duration: 0.7, ease: 'power3.out' }, 3.1)
    .from('.hero-sub',
      { opacity: 0, y: 24, duration: 0.6, ease: 'power2.out' }, 3.4)
    .from('.hero-ctas',
      { opacity: 0, y: 24, duration: 0.6, ease: 'power2.out' }, 3.65);

    // Skip button
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        tl.progress(1).kill();
        dismissIntro();
      });
    }
  } else {
    dismissIntro();
  }

  // ── 4. FLYING IRON MAN ────────────────────────────────────────────────────
  const flyer = document.getElementById('ironman-flyer');

  if (!prefersReduced && flyer) {
    // Show the flyer
    gsap.set(flyer, { opacity: 1 });

    let lastScrollY      = 0;
    let lastRotation     = 0;
    let flyerVisible     = false;

    // Show flyer after intro finishes (approx 3.8s)
    gsap.delayedCall(prefersReduced ? 0 : 3.9, () => {
      flyerVisible = true;
      gsap.to(flyer, { opacity: 1, duration: 0.5 });
    });

    ScrollTrigger.create({
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        if (!flyerVisible) return;

        const progress  = self.progress; // 0 → 1
        const scrollY   = self.scroll();
        const vh        = window.innerHeight;
        const totalH    = document.body.scrollHeight;
        const travelY   = totalH - vh;         // total scrollable px

        // Sinusoidal X drift (px from right edge baseline)
        const cycles    = 4;
        const amplitude = 90;
        const xSine     = Math.sin(progress * Math.PI * cycles);
        const xOffset   = xSine * amplitude;    // positive = move LEFT from right edge

        // Y position: flyer travels through the full page height at 25% speed
        const baseTopPx = vh * 0.1;             // start 10vh from top
        const yPos      = baseTopPx + (scrollY * 0.25);

        // Clamp so it doesn't fly off screen
        const maxY = totalH - 100;
        const clampedY = Math.min(yPos, maxY);

        // Tilt based on scroll velocity
        const velocity    = scrollY - lastScrollY;
        lastScrollY       = scrollY;
        const targetRot   = velocity > 0
          ? Math.min(velocity * 0.6, 25)
          : Math.max(velocity * 0.6, -25);
        lastRotation      = lastRotation + (targetRot - lastRotation) * 0.12;

        // Apply x using right position offset
        gsap.set(flyer, {
          right:    24 - xOffset,
          top:      clampedY,
          rotation: lastRotation,
          scaleX:   xSine < -0.5 ? -1 : 1,   // flip when moving left
        });
      }
    });
  } else if (flyer) {
    flyer.style.display = 'none';
  }

  // ── 5. SCROLL ANIMATIONS ─────────────────────────────────────────────────

  // Generic section reveal — use set + to pattern so elements are VISIBLE if
  // the ScrollTrigger fires immediately (already in view on load) or if JS is slow.
  gsap.utils.toArray('.section-reveal').forEach((el) => {
    gsap.set(el, { opacity: 0, y: 50 });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 82%',
      once: true,
      onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' })
    });
  });

  // Stagger cards
  gsap.utils.toArray('.cards-grid, .failures-grid, .testimonials-grid').forEach((grid) => {
    const cards = grid.querySelectorAll('.card, .failure-card, .testimonial-card');
    if (!cards.length) return;
    gsap.set(cards, { opacity: 0, y: 60 });
    ScrollTrigger.create({
      trigger: grid,
      start: 'top 78%',
      once: true,
      onEnter: () => gsap.to(cards, { opacity: 1, y: 0, stagger: 0.15, duration: 0.75, ease: 'power2.out' })
    });
  });

  // Animated counters
  gsap.utils.toArray('.stat-number').forEach((el) => {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';

    if (isNaN(target)) return;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 2,
          ease: 'power2.out',
          onUpdate() {
            const display = Number.isInteger(target)
              ? Math.round(obj.val)
              : obj.val.toFixed(0);
            el.textContent = prefix + display + suffix;
          }
        });
      }
    });
  });

  // Hero parallax background
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg) {
    gsap.to(heroBg, {
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1
      },
      y: 150,
      ease: 'none'
    });
  }

  // Timeline items
  gsap.utils.toArray('.timeline-item').forEach((item, i) => {
    gsap.set(item, { opacity: 0, x: -30 });
    ScrollTrigger.create({
      trigger: item, start: 'top 84%', once: true,
      onEnter: () => gsap.to(item, { opacity: 1, x: 0, duration: 0.6, delay: i * 0.08, ease: 'power2.out' })
    });
  });

  // Process steps
  gsap.utils.toArray('.process-step').forEach((step, i) => {
    gsap.set(step, { opacity: 0, y: 40 });
    ScrollTrigger.create({
      trigger: step, start: 'top 84%', once: true,
      onEnter: () => gsap.to(step, { opacity: 1, y: 0, duration: 0.6, delay: i * 0.1, ease: 'power2.out' })
    });
  });

  // Stats grid
  gsap.utils.toArray('.stat-block').forEach((block, i) => {
    gsap.set(block, { opacity: 0, y: 30 });
    ScrollTrigger.create({
      trigger: block, start: 'top 88%', once: true,
      onEnter: () => gsap.to(block, { opacity: 1, y: 0, duration: 0.5, delay: i * 0.08, ease: 'power2.out' })
    });
  });

  // About section columns
  const aboutLeft  = document.querySelector('.about-left');
  const aboutRight = document.querySelector('.about-right');
  if (aboutLeft) {
    gsap.set(aboutLeft, { opacity: 0, x: -50 });
    ScrollTrigger.create({
      trigger: '#about', start: 'top 75%', once: true,
      onEnter: () => gsap.to(aboutLeft, { opacity: 1, x: 0, duration: 0.9, ease: 'power2.out' })
    });
  }
  if (aboutRight) {
    gsap.set(aboutRight, { opacity: 0, x: 50 });
    ScrollTrigger.create({
      trigger: '#about', start: 'top 75%', once: true,
      onEnter: () => gsap.to(aboutRight, { opacity: 1, x: 0, duration: 0.9, ease: 'power2.out', delay: 0.15 })
    });
  }

  // Failure section heading reveal
  const failuresHeading = document.querySelector('#failures .section-reveal-block');
  if (failuresHeading) {
    gsap.set(failuresHeading, { opacity: 0, y: 30 });
    ScrollTrigger.create({
      trigger: failuresHeading, start: 'top 82%', once: true,
      onEnter: () => gsap.to(failuresHeading, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' })
    });
  }

  // Contact form fade in
  const contactForm = document.querySelector('#contact-form');
  const contactRight = document.querySelector('.contact-right');
  if (contactForm) {
    gsap.set(contactForm, { opacity: 0, x: -40 });
    ScrollTrigger.create({
      trigger: '#contact', start: 'top 75%', once: true,
      onEnter: () => gsap.to(contactForm, { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' })
    });
  }
  if (contactRight) {
    gsap.set(contactRight, { opacity: 0, x: 40 });
    ScrollTrigger.create({
      trigger: '#contact', start: 'top 75%', once: true,
      onEnter: () => gsap.to(contactRight, { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out', delay: 0.2 })
    });
  }

  // ── 6. NAV SCROLL BEHAVIOUR ───────────────────────────────────────────────
  const nav = document.getElementById('main-nav');
  if (nav) {
    ScrollTrigger.create({
      start: 'top -60px',
      onUpdate: (self) => {
        nav.classList.toggle('scrolled', self.scroll() > 60);
      }
    });
  }

  // ── 7. MOBILE NAV TOGGLE ──────────────────────────────────────────────────
  const navToggle  = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

      // Animate hamburger to X
      const spans = navToggle.querySelectorAll('span');
      if (isOpen) {
        gsap.to(spans[0], { rotation: 45, y: 7, duration: 0.25 });
        gsap.to(spans[1], { opacity: 0, x: -10, duration: 0.2 });
        gsap.to(spans[2], { rotation: -45, y: -7, duration: 0.25 });
      } else {
        gsap.to(spans[0], { rotation: 0, y: 0, duration: 0.25 });
        gsap.to(spans[1], { opacity: 1, x: 0, duration: 0.2 });
        gsap.to(spans[2], { rotation: 0, y: 0, duration: 0.25 });
      }
    });

    // Close mobile menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        const spans = navToggle.querySelectorAll('span');
        gsap.to(spans[0], { rotation: 0, y: 0, duration: 0.25 });
        gsap.to(spans[1], { opacity: 1, x: 0, duration: 0.2 });
        gsap.to(spans[2], { rotation: 0, y: 0, duration: 0.25 });
      });
    });
  }

  // ── 8. CONTACT FORM ───────────────────────────────────────────────────────
  const contactFormEl = document.getElementById('contact-form');
  if (contactFormEl) {
    contactFormEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactFormEl.querySelector('button[type="submit"]');
      if (!btn) return;

      const originalText = btn.textContent;
      btn.textContent = 'SENT ✓';
      btn.style.background = 'var(--gold)';
      btn.disabled = true;

      gsap.from(btn, { scale: 0.95, duration: 0.2, ease: 'back.out(2)' });

      setTimeout(() => {
        contactFormEl.reset();
        btn.textContent = originalText;
        btn.style.background = '';
        btn.disabled = false;
      }, 3000);
    });
  }

})(); // end IIFE
