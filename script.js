/* =========================================================
   Portfolio interactions — Hrishikesh Baidya
   Dark cinematic + anime.js
   ========================================================= */
(function () {
  "use strict";

  var hasAnime = typeof window.anime !== "undefined";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- small utils ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function debounce(fn, wait) {
    var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, wait); };
  }
  function setNumberFinal(el) {
    el.textContent = el.getAttribute("data-count") + (el.getAttribute("data-suffix") || "");
  }

  /* ---------- Year in footer ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Theme switcher (light / dark) ---------- */
  // The pre-paint inline script in <head> has already set data-theme.
  var root = document.documentElement;
  var themeBtn = document.getElementById("themeToggle");
  var mql = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function syncThemeButton() {
    if (!themeBtn) return;
    var isDark = root.getAttribute("data-theme") === "dark";
    // Button switches you TO the other theme.
    themeBtn.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
    themeBtn.setAttribute("aria-pressed", String(!isDark)); // pressed = light active
  }

  function applyTheme(theme, persist) {
    root.setAttribute("data-theme", theme);
    if (persist) {
      try { localStorage.setItem("theme", theme); } catch (e) {}
    }
    syncThemeButton();
    // Let the canvas (and anything else) react to the new accent color.
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: theme } }));
  }

  syncThemeButton();

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next, true);
    });
  }

  // Follow the OS theme live — but only while the user hasn't made a manual choice.
  if (mql) {
    var onSysChange = function (e) {
      var saved;
      try { saved = localStorage.getItem("theme"); } catch (err) { saved = null; }
      if (!saved) applyTheme(e.matches ? "dark" : "light", false);
    };
    if (mql.addEventListener) mql.addEventListener("change", onSysChange);
    else if (mql.addListener) mql.addListener(onSysChange);
  }

  /* ---------- Sticky header shadow on scroll ---------- */
  var header = $(".site-header");
  var onScroll = function () {
    if (window.scrollY > 8) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById("menuToggle");
  var menu = document.getElementById("mobileMenu");
  var closeMenu = function () {
    menu.classList.remove("show");
    toggle.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-hidden", "true");
  };
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("show");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-hidden", String(!open));
    });
    $all("a", menu).forEach(function (a) { a.addEventListener("click", closeMenu); });
  }

  /* ---------- Count-up stats ---------- */
  function countUp(el, delay) {
    var target = +el.getAttribute("data-count");
    var suffix = el.getAttribute("data-suffix") || "";
    var obj = { v: 0 };
    anime({
      targets: obj, v: target, round: 1, duration: 1600, delay: delay || 0,
      easing: "easeOutExpo",
      update: function () { el.textContent = obj.v + suffix; }
    });
  }
  function startCounts() {
    $all(".hero-meta .num").forEach(function (el, i) { countUp(el, i * 120); });
  }

  /* ---------- Hero intro timeline + logo draw ---------- */
  function runIntro() {
    var tl = anime.timeline({ easing: "easeOutExpo", duration: 800 });

    // Logo monogram draws itself in
    tl.add({
      targets: ".brand-mark .hb-box",
      strokeDashoffset: [anime.setDashoffset, 0],
      duration: 700, easing: "easeInOutSine"
    })
    .add({
      targets: ".brand-mark .hb-glyph path",
      strokeDashoffset: [anime.setDashoffset, 0],
      duration: 650, delay: anime.stagger(55), easing: "easeInOutSine"
    }, "-=420")
    .add({ targets: ".hero .eyebrow", opacity: [0, 1], translateY: [14, 0], duration: 600 }, "-=300")
    .add({
      targets: ".hero-title .hw span",
      translateY: ["110%", "0%"],
      duration: 850, delay: anime.stagger(55), easing: "easeOutQuint"
    }, "-=350")
    .add({ targets: ".hero-sub", opacity: [0, 1], translateY: [16, 0] }, "-=560")
    .add({ targets: ".hero-actions", opacity: [0, 1], translateY: [16, 0] }, "-=620")
    .add({ targets: ".hero-social", opacity: [0, 1], translateY: [12, 0] }, "-=660")
    .add({ targets: ".hero-meta", opacity: [0, 1], translateY: [16, 0], begin: startCounts }, "-=600");
  }

  /* ---------- No-anime / reduced-motion fallbacks ---------- */
  function showHeroStatic() {
    $all(".hero .eyebrow, .hero-sub, .hero-actions, .hero-social, .hero-meta").forEach(function (e) {
      e.style.opacity = 1; e.style.transform = "none";
    });
    $all(".hero-title .hw span").forEach(function (e) { e.style.transform = "none"; });
    // Make sure the logo strokes are fully drawn (not left hidden).
    $all(".brand-mark .hb-box, .brand-mark .hb-glyph path").forEach(function (p) {
      p.style.strokeDasharray = "none"; p.style.strokeDashoffset = "0";
    });
  }

  // Safety net: if anime never finishes (CDN blocked, runtime error), never leave
  // the hero invisible — reveal it statically and settle the numbers.
  function ensureHeroVisible() {
    var sub = $(".hero-sub");
    if (sub && parseFloat(getComputedStyle(sub).opacity || "1") < 0.05) {
      showHeroStatic();
      $all(".hero-meta .num").forEach(setNumberFinal);
    }
  }

  if (!hasAnime) {
    showHeroStatic();
    $all(".hero-meta .num").forEach(setNumberFinal);
    $all(".reveal").forEach(function (el) { el.classList.add("in"); });
  } else if (reduce) {
    // CSS reveals the hero/sections under reduced motion; just settle the numbers.
    $all(".hero-meta .num").forEach(setNumberFinal);
  } else {
    runIntro();
    startCanvas();
    setTimeout(ensureHeroVisible, 3600); // failsafe only — well after the intro finishes
  }

  /* ---------- Scroll reveals (staggered) ---------- */
  var revealEls = $all(".reveal");
  // Pre-set per-group stagger delay for a nicer cascade.
  revealEls.forEach(function (el) {
    var siblings = $all(".reveal", el.parentNode).filter(function (s) { return s.parentNode === el.parentNode; });
    var idx = siblings.indexOf(el);
    if (idx > 0) el.style.transitionDelay = Math.min(idx * 80, 320) + "ms";
  });
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Active nav link via section observer ---------- */
  var navLinks = $all(".nav-links a");
  var sections = navLinks
    .map(function (a) { return $(a.getAttribute("href")); })
    .filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          navLinks.forEach(function (a) {
            a.classList.toggle("active", a.getAttribute("href") === "#" + id);
          });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Generative particle / constellation background ---------- */
  function startCanvas() {
    var canvas = document.getElementById("bg-canvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, nodes = [], mouse = { x: -9999, y: -9999 };
    var LINK = 132, MLINK = 168;
    var raf = 0, running = true;

    function readAccentRGB() {
      var v = getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim();
      return v || "94,234,212";
    }
    var RGB = readAccentRGB();
    document.addEventListener("themechange", function () { RGB = readAccentRGB(); });

    function build() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.max(28, Math.min(90, Math.floor((w * h) / 15000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28
        });
      }
    }

    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      var i, j, a, b, dx, dy, d;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
      }
      ctx.lineWidth = 1;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j];
          dx = a.x - b.x; dy = a.y - b.y; d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            ctx.strokeStyle = "rgba(" + RGB + "," + (1 - d / LINK) * 0.45 + ")";
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        dx = a.x - mouse.x; dy = a.y - mouse.y; d = Math.sqrt(dx * dx + dy * dy);
        if (d < MLINK) {
          ctx.strokeStyle = "rgba(" + RGB + "," + (1 - d / MLINK) * 0.55 + ")";
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      ctx.fillStyle = "rgba(" + RGB + ",0.85)";
      for (i = 0; i < nodes.length; i++) {
        ctx.beginPath(); ctx.arc(nodes[i].x, nodes[i].y, 1.4, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }

    build();
    window.addEventListener("resize", debounce(build, 200));
    window.addEventListener("mousemove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    window.addEventListener("mouseout", function () { mouse.x = -9999; mouse.y = -9999; });
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) { cancelAnimationFrame(raf); tick(); }
    });
    tick();
  }
})();
