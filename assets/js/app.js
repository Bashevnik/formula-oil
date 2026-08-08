/* =============================================================
   FORMULA OIL — interactions v2
   Preloader · page transitions · once-only reveals (IO) ·
   custom cursor · magnetic · parallax · faq · counters
   ============================================================= */
(function () {
  "use strict";

  window.addEventListener("error", (e) => { window.__lasterr = (e.message || "") + " @ " + (e.filename || "") + ":" + (e.lineno || ""); });

  const docEl = document.documentElement;
  docEl.classList.remove("no-js");

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";

  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if (hasGSAP && window.ScrollToPlugin) gsap.registerPlugin(ScrollToPlugin);

  /* ==========================================================
     PRELOADER
  ========================================================== */
  const preloader = document.querySelector(".preloader");
  const bar = preloader ? preloader.querySelector(".preloader__bar i") : null;
  const dropFill = preloader ? preloader.querySelector(".preloader__mark .drop-fill") : null;
  const wordSpans = preloader ? preloader.querySelectorAll(".preloader__word span") : [];
  const countEl = preloader ? preloader.querySelector(".preloader__count") : null;
  const firstVisit = !sessionStorage.getItem("fo_visited");

  // scroll lock that preserves position and never removes the scrollbar
  // (see body.is-locked in CSS — position:fixed, permanent html scrollbar).
  let lockedScrollY = 0;
  function setLock(on) {
    const b = document.body;
    if (on) {
      lockedScrollY = window.scrollY || window.pageYOffset || 0;
      b.style.top = -lockedScrollY + "px";
      b.classList.add("is-locked");
    } else {
      b.classList.remove("is-locked");
      b.style.top = "";
      window.scrollTo(0, lockedScrollY);
    }
  }

  let heroStarted = false;
  function startHero() {
    if (heroStarted) return;
    heroStarted = true;
    setLock(false);
    animateHeroIn();
    initReveals();
    initParallax();
    if (hasGSAP && window.ScrollTrigger) ScrollTrigger.refresh();
  }

  let preloaderHidden = false;
  function forceHide() {
    if (preloaderHidden) return;
    preloaderHidden = true;
    if (preloader) preloader.classList.add("is-hidden");
    startHero();
  }

  function hidePreloader(quick) {
    if (!preloader || !hasGSAP || prefersReduced) { forceHide(); return; }
    gsap.to(preloader.querySelector(".preloader__logo"), { y: -18, opacity: 0, duration: 0.5, ease: "power2.in" });
    gsap.to(preloader, { yPercent: -100, duration: 0.85, ease: "power4.inOut", delay: quick ? 0.05 : 0.15, onComplete: forceHide });
    setTimeout(forceHide, 1400);
  }

  // Resolve once the above-the-fold images are actually decoded (so the page is
  // ready to show by the time the preloader lifts), or after a hard cap.
  function whenImagesReady(maxWait) {
    return new Promise((resolve) => {
      const imgs = [].slice.call(
        document.querySelectorAll(".hero__media img, .section--tight img, #services .svc img, .showcase img")
      ).slice(0, 6);
      let done = false;
      const finish = () => { if (done) return; done = true; resolve(); };
      if (!imgs.length) return finish();
      let pending = imgs.length;
      imgs.forEach((img) => {
        const dec = img.decode ? img.decode().catch(() => {}) : Promise.resolve();
        Promise.resolve(dec).then(() => { if (--pending <= 0) finish(); });
      });
      setTimeout(finish, maxWait || 1600);
    });
  }

  function runPreloader() {
    setLock(true);
    if (!preloader || !hasGSAP || prefersReduced) {
      whenImagesReady(1200).then(() => hidePreloader(true));
      sessionStorage.setItem("fo_visited", "1");
      return;
    }
    if (firstVisit) {
      const counter = { v: 0 };
      const tl = gsap.timeline({ onComplete: () => whenImagesReady(1400).then(() => hidePreloader(false)) });
      tl.set(wordSpans, { yPercent: 110 })
        .set(dropFill, { opacity: 0 })
        .to(dropFill, { opacity: 1, duration: 0.6, ease: "power2.out" }, 0.1)
        .to(wordSpans, { yPercent: 0, duration: 0.7, stagger: 0.03, ease: "power4.out" }, 0.15)
        .to(bar, { width: "100%", duration: 1.25, ease: "power2.inOut" }, 0.2)
        .to(counter, { v: 100, duration: 1.25, ease: "power2.inOut", onUpdate: () => { if (countEl) countEl.textContent = Math.round(counter.v); } }, 0.2)
        .to(".preloader__sub", { opacity: 1, duration: 0.4 }, 0.5);
      sessionStorage.setItem("fo_visited", "1");
    } else {
      const tl = gsap.timeline({ onComplete: () => whenImagesReady(900).then(() => hidePreloader(true)) });
      tl.set(wordSpans, { yPercent: 0 }).set(dropFill, { opacity: 1 })
        .fromTo(preloader.querySelector(".preloader__logo"), { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "power3.out" })
        .to(bar, { width: "100%", duration: 0.55, ease: "power2.inOut" }, 0.1);
    }
  }

  window.addEventListener("load", () => {
    if (preloader && !preloader.classList.contains("is-hidden")) setTimeout(forceHide, 4000);
    // images now have their real size → recompute all scroll positions so
    // parallax/reveals don't jump or shimmer on first scroll
    if (hasGSAP && window.ScrollTrigger) { ScrollTrigger.refresh(); setTimeout(() => ScrollTrigger.refresh(), 300); }
  });

  /* ==========================================================
     PAGE TRANSITION
  ========================================================== */
  const transition = document.querySelector(".transition");
  function isInternal(a) {
    if (!a) return false;
    const href = a.getAttribute("href");
    if (!href) return false;
    if (a.hasAttribute("data-no-transition")) return false;
    if (a.target === "_blank") return false;
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
    if (/^https?:\/\//i.test(href) && a.host !== window.location.host) return false;
    if (a.pathname === window.location.pathname && href.includes("#")) return false;
    return href.endsWith(".html") || a.host === window.location.host;
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!isInternal(a)) return;
    const url = a.href;
    if (url === window.location.href) return;
    e.preventDefault();
    if (!transition || !hasGSAP || prefersReduced) { window.location.href = url; return; }
    let navigated = false;
    const go = () => { if (navigated) return; navigated = true; window.location.href = url; };
    const mark = transition.querySelector(".transition__mark");
    gsap.set(transition, { yPercent: 100 });
    gsap.set(mark, { opacity: 0, scale: 0.9, rotate: -8 });
    gsap.to(transition, { yPercent: 0, duration: 0.6, ease: "power4.inOut" });
    gsap.to(mark, { opacity: 1, scale: 1, rotate: 0, duration: 0.45, ease: "power2.out", delay: 0.28 });
    setTimeout(go, 720);
  });
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) { if (transition) gsap.set(transition, { yPercent: 100 }); forceHide(); }
  });

  /* ==========================================================
     HERO intro
  ========================================================== */
  // set hidden states IMMEDIATELY (while preloader still covers) so text never
  // flashes visible → hidden → in. Runs synchronously at init().
  // NOTE: the hero image is intentionally NOT animated (no scale/translate on
  // load). Animating a large decoded bitmap caused the "shimmer + zoom-back"
  // right after the preloader. The image stays perfectly static; only text moves.
  function prepHero() {
    if (!hasGSAP || prefersReduced) return;
    const heroLines = document.querySelectorAll(".hero__title .line > span");
    const heroEls = document.querySelectorAll(".hero [data-hero]");
    const pageHeroEls = document.querySelectorAll(".page-hero [data-hero]");
    if (heroLines.length) gsap.set(heroLines, { yPercent: 115 });
    if (heroEls.length) gsap.set(heroEls, { y: 28, opacity: 0 });
    if (pageHeroEls.length) gsap.set(pageHeroEls, { y: 30, opacity: 0 });
  }

  function animateHeroIn() {
    if (!hasGSAP || prefersReduced) return;
    const heroLines = document.querySelectorAll(".hero__title .line > span");
    const heroEls = document.querySelectorAll(".hero [data-hero]");
    const pageHeroEls = document.querySelectorAll(".page-hero [data-hero]");
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    if (heroLines.length) tl.to(heroLines, { yPercent: 0, duration: 1.1, stagger: 0.08 }, 0.15);
    if (heroEls.length) tl.to(heroEls, { y: 0, opacity: 1, duration: 0.9, stagger: 0.09 }, 0.4);
    if (pageHeroEls.length) tl.to(pageHeroEls, { y: 0, opacity: 1, duration: 0.95, stagger: 0.08 }, 0.1);
  }

  /* ==========================================================
     REVEALS — IntersectionObserver, guaranteed ONCE
  ========================================================== */
  let revealsInited = false;
  function initReveals() {
    if (revealsInited) return;
    revealsInited = true;

    const solos = gsap.utils ? gsap.utils.toArray("[data-reveal]") : [].slice.call(document.querySelectorAll("[data-reveal]"));
    const groups = [].slice.call(document.querySelectorAll("[data-reveal-group]"));

    if (!hasGSAP || prefersReduced || !("IntersectionObserver" in window)) {
      solos.forEach((el) => (el.style.opacity = 1));
      groups.forEach((g) => [].forEach.call(g.children, (c) => (c.style.opacity = 1)));
      return;
    }

    const fromFor = (type) => {
      switch (type) {
        case "fade": return { opacity: 0 };
        case "scale": return { opacity: 0, scale: 0.94 };
        case "left": return { opacity: 0, x: -55 };
        case "right": return { opacity: 0, x: 55 };
        case "mask": return { opacity: 0, y: 40, clipPath: "inset(0 0 100% 0)" };
        default: return { opacity: 0, y: 44 };
      }
    };

    // set initial states up-front (avoids flash)
    solos.forEach((el) => { const t = el.getAttribute("data-reveal") || "up"; gsap.set(el, fromFor(t)); });
    groups.forEach((g) => gsap.set(g.children, { opacity: 0, y: 46 }));

    const animate = (el) => {
      const d = parseFloat(el.getAttribute("data-delay")) || 0;
      gsap.to(el, { opacity: 1, y: 0, x: 0, scale: 1, duration: 1.05, delay: d, ease: "power3.out" });
    };
    const animateGroup = (g) => gsap.to(g.children, { opacity: 1, y: 0, duration: 0.95, stagger: 0.09, ease: "power3.out" });

    // single guarded entry point → never animates twice, never leaves a void
    const reveal = (el) => {
      if (el.__rv) return;
      el.__rv = 1;
      io.unobserve(el);
      if (el.hasAttribute("data-reveal-group")) animateGroup(el);
      else animate(el);
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) reveal(entry.target); });
    }, { threshold: 0.05, rootMargin: "0px 0px -4% 0px" });

    solos.forEach((el) => io.observe(el));
    groups.forEach((g) => io.observe(g));

    // safety net: reveal anything already inside the viewport right now (deep
    // links, jump-scroll, or a missed IO callback) so a heading never sits blank
    const sweep = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      [].concat(solos, groups).forEach((el) => {
        if (el.__rv) return;
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.98 && r.bottom > 0) reveal(el);
      });
    };
    requestAnimationFrame(sweep);
    window.addEventListener("scroll", sweep, { passive: true });
    window.addEventListener("load", sweep);
  }

  /* ==========================================================
     PARALLAX (scrub) — continuous, not a reveal
  ========================================================== */
  let parallaxInited = false;
  function initParallax() {
    if (parallaxInited || !hasGSAP || !window.ScrollTrigger || prefersReduced) return;
    parallaxInited = true;
    gsap.utils.toArray("[data-parallax]").forEach((el) => {
      const amount = parseFloat(el.getAttribute("data-parallax")) || 12;
      gsap.to(el, { yPercent: amount, ease: "none", scrollTrigger: { trigger: el.closest("section, .split__media, .svc, .cta-band, .showcase, .page-hero") || el, start: "top bottom", end: "bottom top", scrub: 0.6 } });
    });
    gsap.utils.toArray(".split__media img").forEach((img) => {
      gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: img.closest(".split__media"), start: "top bottom", end: "bottom top", scrub: 0.6 } });
    });
    gsap.utils.toArray(".showcase img").forEach((img) => {
      gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: img.closest(".showcase"), start: "top bottom", end: "bottom top", scrub: 0.6 } });
    });
  }

  /* ==========================================================
     MARQUEE
  ========================================================== */
  function initMarquee() {
    document.querySelectorAll(".marquee__track").forEach((track) => {
      if (!hasGSAP || prefersReduced) return;
      const right = track.getAttribute("data-dir") === "right";
      const speed = parseFloat(track.getAttribute("data-speed")) || 32;
      if (right) { gsap.set(track, { xPercent: -50 }); gsap.to(track, { xPercent: 0, duration: speed, ease: "none", repeat: -1 }); }
      else { gsap.to(track, { xPercent: -50, duration: speed, ease: "none", repeat: -1 }); }
    });
  }

  // Reviews: native-scroll carousel that auto-drifts, pauses on hover, and can
  // be dragged/swiped with the pointer. Cards are duplicated → seamless loop.
  function initReviews() {
    const wrap = document.querySelector(".reviews-marquee");
    const track = wrap && wrap.querySelector(".reviews-track");
    if (!wrap || !track) return;
    let pos = 0, paused = false, down = false, startX = 0, startScroll = 0, moved = false;
    const wrapAround = () => { const h = wrap.scrollWidth / 2; if (h > 0) { if (pos >= h) pos -= h; else if (pos < 0) pos += h; } return h; };
    const tick = () => {
      if (down || paused) { pos = wrap.scrollLeft; }
      else { pos += 0.55; wrapAround(); wrap.scrollLeft = pos; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    wrap.addEventListener("pointerenter", () => { paused = true; });
    wrap.addEventListener("pointerleave", () => { paused = false; down = false; wrap.classList.remove("is-dragging"); });
    wrap.addEventListener("pointerdown", (e) => { down = true; moved = false; startX = e.clientX; startScroll = wrap.scrollLeft; wrap.classList.add("is-dragging"); });
    window.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;
      pos = startScroll - dx; wrapAround(); wrap.scrollLeft = pos;
    }, { passive: true });
    window.addEventListener("pointerup", () => { down = false; wrap.classList.remove("is-dragging"); });
    track.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  }

  /* ==========================================================
     COUNTERS — once via IO
  ========================================================== */
  function initCounters() {
    const els = [].slice.call(document.querySelectorAll("[data-count]"));
    if (!els.length) return;
    const run = (el) => {
      const target = parseFloat(el.getAttribute("data-count"));
      const suffix = el.getAttribute("data-suffix") || "";
      if (!hasGSAP || prefersReduced) { el.textContent = target + suffix; return; }
      // Reserve the FINAL rendered width up-front so the number growing digits
      // (0→6000) never reflows the flex row = kills the horizontal "shake".
      const box = el.parentElement;
      if (box && !box.style.minWidth) {
        el.textContent = Math.round(target) + suffix;
        box.style.minWidth = Math.ceil(box.getBoundingClientRect().width) + "px";
      }
      el.textContent = "0" + suffix;
      const obj = { v: 0 };
      gsap.to(obj, { v: target, duration: 1.9, ease: "power2.out", onUpdate: () => { el.textContent = Math.round(obj.v) + suffix; } });
    };
    if (!("IntersectionObserver" in window)) { els.forEach(run); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); run(e.target); } });
    }, { threshold: 0.4 });
    els.forEach((el) => io.observe(el));
  }

  /* ==========================================================
     HEADER + active link + topbar hide
  ========================================================== */
  function initHeader() {
    const header = document.querySelector(".header");
    if (!header) return;
    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 30);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav__link, .mobile-menu__nav a").forEach((a) => {
      const href = (a.getAttribute("href") || "").split("/").pop();
      if (href === path) a.classList.add("is-active");
    });
  }

  /* ==========================================================
     MOBILE MENU
  ========================================================== */
  function initMenu() {
    const burger = document.querySelector(".burger");
    const menu = document.querySelector(".mobile-menu");
    if (!burger || !menu) return;
    const toggle = (open) => { burger.classList.toggle("is-open", open); menu.classList.toggle("is-open", open); setLock(open); };
    burger.addEventListener("click", () => toggle(!menu.classList.contains("is-open")));
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggle(false)));
  }

  /* ==========================================================
     CARD glow
  ========================================================== */
  function initCardGlow() {
    document.querySelectorAll(".card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
      });
    });
  }

  /* ==========================================================
     FAQ accordion
  ========================================================== */
  function initFaq() {
    document.querySelectorAll(".faq__item").forEach((item) => {
      const q = item.querySelector(".faq__q");
      const a = item.querySelector(".faq__a");
      if (!q || !a) return;
      q.addEventListener("click", () => {
        const open = item.classList.contains("is-open");
        // close siblings
        item.parentElement.querySelectorAll(".faq__item.is-open").forEach((sib) => {
          if (sib !== item) { sib.classList.remove("is-open"); const sa = sib.querySelector(".faq__a"); if (hasGSAP) gsap.to(sa, { height: 0, duration: 0.4, ease: "power2.inOut" }); else sa.style.height = "0px"; }
        });
        if (open) { item.classList.remove("is-open"); if (hasGSAP) gsap.to(a, { height: 0, duration: 0.4, ease: "power2.inOut" }); else a.style.height = "0px"; }
        else { item.classList.add("is-open"); const h = a.querySelector(".faq__a-inner").offsetHeight; if (hasGSAP) gsap.fromTo(a, { height: a.offsetHeight }, { height: h, duration: 0.5, ease: "power3.out" }); else a.style.height = h + "px"; }
      });
    });
  }

  /* ==========================================================
     CHIPS (service picker)
  ========================================================== */
  function initChips() {
    document.querySelectorAll("[data-chips]").forEach((group) => {
      const target = document.querySelector(group.getAttribute("data-chips"));
      group.querySelectorAll(".chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          group.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
          chip.classList.add("is-active");
          if (target) target.value = chip.textContent.trim();
        });
      });
    });
  }

  /* ==========================================================
     FORM
  ========================================================== */
  function initForm() {
    const form = document.querySelector("[data-form]");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = form.querySelector(".form__ok");
      const btn = form.querySelector("button[type=submit]");
      if (btn) { btn.disabled = true; btn.style.opacity = 0.6; }
      if (ok) { ok.classList.add("is-visible"); if (hasGSAP) gsap.fromTo(ok, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }); }
      form.querySelectorAll("input, textarea").forEach((f) => (f.value = ""));
      setTimeout(() => { if (btn) { btn.disabled = false; btn.style.opacity = 1; } }, 2500);
    });
  }

  /* ==========================================================
     CUSTOM CURSOR + MAGNETIC
  ========================================================== */
  // Custom cursor: a yellow arrow that follows the pointer EXACTLY (no lerp →
  // no lag/shake), morphing into a ring over clickable elements.
  function initCursor() {
    if (!finePointer || prefersReduced) return;
    const cur = document.createElement("div");
    cur.className = "cur";
    cur.innerHTML =
      '<svg class="cur__arrow" viewBox="0 0 320 512" aria-hidden="true"><path d="M0 55.2V426c0 12.2 9.9 22 22 22 6.3 0 12.4-2.7 16.6-7.5L121.2 346l58.1 116.3c7.9 15.8 27.1 22.2 42.9 14.3s22.2-27.1 14.3-42.9L179.8 320H297.9c12.2 0 22.1-9.9 22.1-22.1 0-6.4-2.8-12.5-7.6-16.7L38.6 37.9C34.4 34.1 28.9 32 23.2 32 10.4 32 0 42.4 0 55.2z" fill="#EBBB57" stroke="#17110A" stroke-width="26" stroke-linejoin="round"/></svg>' +
      '<svg class="cur__hand" viewBox="0 0 448 512" aria-hidden="true"><path d="M128 40c0-22.1 17.9-40 40-40s40 17.9 40 40V188.2c8.5-7.6 19.7-12.2 32-12.2c20.6 0 38.2 13 45 31.2c8.8-9.3 21.2-15.2 35-15.2c25.3 0 46 19.5 47.9 44.3c7.1-4 15.3-6.3 24.1-6.3c26.5 0 48 21.5 48 48v48 24 24c0 70.7-57.3 128-128 128H240 208c-.5 0-.9 0-1.4 0c-43.6-.6-79.9-31.4-89-72.4c-.9-4.2-3.1-8.1-6.2-11.1L24.8 361c-19.6-19.4-24.4-49.2-11.9-73.9C24.5 264 47.6 250.3 72.2 250.6c14.8 .2 29 5.6 40.1 15L128 280.6V40z" fill="#EBBB57" stroke="#17110A" stroke-width="24" stroke-linejoin="round"/></svg>';
    document.body.appendChild(cur);
    docEl.classList.add("has-cursor");
    // Hide until the first real pointer move so it never sits stuck in the
    // top-left corner right after a page load / page transition.
    cur.style.opacity = "0";
    let shown = false;
    window.addEventListener("pointermove", (e) => {
      cur.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      if (!shown) { shown = true; cur.style.opacity = "1"; }
    }, { passive: true });
    const sel = "a, button, select, label, summary, [role=button], [onclick], [tabindex]:not([tabindex='-1']), .chip, .faq__q, .burger, .phone-fab__btn, .to-top, .link-arrow, .reviews-marquee, input[type=submit], input[type=button]";
    document.addEventListener("pointerover", (e) => { if (e.target.closest && e.target.closest(sel)) cur.classList.add("is-pointer"); });
    document.addEventListener("pointerout", (e) => { if (e.target.closest && e.target.closest(sel)) cur.classList.remove("is-pointer"); });
    window.addEventListener("pointerdown", () => cur.classList.add("is-down"));
    window.addEventListener("pointerup", () => cur.classList.remove("is-down"));
    document.addEventListener("mouseleave", () => { cur.style.opacity = "0"; });
    document.addEventListener("mouseenter", () => { if (shown) cur.style.opacity = "1"; });
    // Hide our cursor over iframes (Google Maps) → native map cursor takes over
    document.querySelectorAll("iframe").forEach((f) => {
      f.addEventListener("mouseenter", () => { cur.style.opacity = "0"; });
      f.addEventListener("mouseleave", () => { if (shown) cur.style.opacity = "1"; });
    });
  }

  // floating phone button → toggles a compact numbers panel
  function initPhoneFab() {
    const fab = document.querySelector("[data-phone-fab]");
    if (!fab) return;
    const btn = fab.querySelector(".phone-fab__btn");
    const setOpen = (open) => { fab.classList.toggle("is-open", open); btn.setAttribute("aria-expanded", open ? "true" : "false"); };
    btn.addEventListener("click", (e) => { e.stopPropagation(); setOpen(!fab.classList.contains("is-open")); });
    document.addEventListener("click", (e) => { if (!fab.contains(e.target)) setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  }

  function initMagnetic() {
    if (!finePointer || prefersReduced || !hasGSAP) return;
    document.querySelectorAll(".btn--primary, [data-magnetic]").forEach((el) => {
      const strength = 0.35;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * strength;
        const y = (e.clientY - (r.top + r.height / 2)) * strength;
        gsap.to(el, { x, y, duration: 0.4, ease: "power3.out" });
      });
      el.addEventListener("pointerleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" }));
    });
  }

  /* ==========================================================
     BACK TO TOP
  ========================================================== */
  function initToTop() {
    document.querySelectorAll("[data-totop]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        if (hasGSAP && window.ScrollToPlugin) gsap.to(window, { scrollTo: 0, duration: 1, ease: "power3.inOut" });
        else window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  function initYear() { document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear())); }

  /* ==========================================================
     INIT
  ========================================================== */
  function init() {
    prepHero();       // hide hero bits immediately → no post-preloader flash
    initHeader();
    initMenu();
    initMarquee();
    initReviews();
    initCounters();
    initCardGlow();
    initFaq();
    initChips();
    initForm();
    initCursor();
    initPhoneFab();
    initToTop();
    initYear();
    runPreloader();   // reveals + parallax start after preloader lifts (startHero)
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
