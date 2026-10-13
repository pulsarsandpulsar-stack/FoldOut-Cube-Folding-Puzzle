/*
 * FoldOut website: theme switching, reveal-on-scroll and small page helpers.
 * The theme is applied before first paint by an inline script in each page's <head>.
 */
(function () {
  "use strict";

  var KEY = "foldout-theme";
  var MODES = ["auto", "light", "dark"];
  var LABELS = { auto: "Theme: match system", light: "Theme: light", dark: "Theme: dark" };

  function currentMode() {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    return saved === "light" || saved === "dark" ? saved : "auto";
  }

  function applyMode(mode) {
    var root = document.documentElement;
    if (mode === "auto") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", mode);
    }
    try {
      mode === "auto" ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, mode);
    } catch (e) {}
    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      button.setAttribute("data-mode", mode);
      button.setAttribute("aria-label", LABELS[mode] + ". Click to change.");
      button.setAttribute("title", LABELS[mode]);
    });
  }

  function setUpReveal() {
    var items = document.querySelectorAll(".reveal:not(.is-visible)");
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    // threshold 0: reveal as soon as any part is on screen. A ratio threshold never
    // fires for elements taller than the viewport (like the Terms and Privacy text).
    }, { rootMargin: "0px 0px -40px 0px", threshold: 0 });
    var viewport = window.innerHeight || document.documentElement.clientHeight;
    items.forEach(function (el) {
      // Anything already on screen (or scrolled past) shows straight away; the rest
      // fades in as it scrolls into view.
      if (el.getBoundingClientRect().top < viewport) {
        el.classList.add("is-visible");
      } else {
        observer.observe(el);
      }
    });
  }

  // Highlights the table-of-contents entry for the section being read.
  function setUpTOC() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".toc a[href^='#']"));
    if (!links.length || !("IntersectionObserver" in window)) return;
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          links.forEach(function (a) { a.classList.remove("is-active"); });
          var link = byId[entry.target.id];
          if (link) link.classList.add("is-active");
        }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyMode(currentMode());

    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      button.addEventListener("click", function () {
        var next = MODES[(MODES.indexOf(currentMode()) + 1) % MODES.length];
        applyMode(next);
      });
    });

    var nav = document.querySelector(".nav");
    if (nav) {
      var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 8); };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    // Until the App Store link is filled in, the placeholder buttons do nothing.
    document.querySelectorAll("[data-app-store-link][href='#']").forEach(function (link) {
      link.addEventListener("click", function (event) { event.preventDefault(); });
    });

    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });

    setUpReveal();
    setUpTOC();
  });

  // fold.js adds the nets gallery after load.
  document.addEventListener("foldout:content", setUpReveal);
})();
