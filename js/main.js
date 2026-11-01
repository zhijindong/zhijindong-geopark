/* =========================================================
   织金洞世界地质公园 · 科普宣传站
   交互脚本：导航 / 轮播 / 筛选 / 灯箱 / 滚动动效
   ========================================================= */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 顶部导航 ---------- */
  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    var toggle = header.querySelector(".nav-toggle");
    var nav = header.querySelector(".nav");

    function onScroll() {
      if (window.scrollY > 40) header.classList.add("is-scrolled");
      else header.classList.remove("is-scrolled");
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        toggle.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        document.body.classList.toggle("no-scroll", open);
      });

      nav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          nav.classList.remove("is-open");
          toggle.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
          document.body.classList.remove("no-scroll");
        });
      });

      window.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && nav.classList.contains("is-open")) {
          nav.classList.remove("is-open");
          toggle.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
          document.body.classList.remove("no-scroll");
        }
      });

      window.addEventListener("resize", function () {
        if (window.innerWidth > 960 && nav.classList.contains("is-open")) {
          nav.classList.remove("is-open");
          toggle.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
          document.body.classList.remove("no-scroll");
        }
      });
    }
  }

  /* ---------- 首屏轮播 ---------- */
  function initHero() {
    var hero = document.querySelector("[data-carousel]");
    if (!hero) return;

    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero__slide"));
    var dotsWrap = hero.querySelector(".hero__dots");
    var countEl = hero.querySelector(".hero__current");
    var prevBtn = hero.querySelector(".hero__arrow--prev");
    var nextBtn = hero.querySelector(".hero__arrow--next");
    var index = 0;
    var timer = null;
    var delay = 6500;

    if (!slides.length) return;

    var dots = [];
    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "hero__dot";
        dot.setAttribute("aria-label", "查看第 " + (i + 1) + " 张画面");
        dot.addEventListener("click", function () {
          go(i, true);
        });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    function go(next, manual) {
      next = (next + slides.length) % slides.length;
      slides[index].classList.remove("is-active");
      slides[index].setAttribute("aria-hidden", "true");
      index = next;
      slides[index].classList.add("is-active");
      slides[index].setAttribute("aria-hidden", "false");
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === index); });
      if (countEl) countEl.textContent = String(index + 1).padStart(2, "0");
      if (manual) restart();
    }

    function start() {
      if (prefersReduced || timer) return;
      timer = window.setInterval(function () { go(index + 1); }, delay);
    }
    function stop() {
      window.clearInterval(timer);
      timer = null;
    }
    function restart() {
      stop();
      start();
    }

    slides.forEach(function (s, i) {
      s.setAttribute("aria-hidden", i === 0 ? "false" : "true");
    });
    if (dots.length) dots[0].classList.add("is-active");

    if (prevBtn) prevBtn.addEventListener("click", function () { go(index - 1, true); });
    if (nextBtn) nextBtn.addEventListener("click", function () { go(index + 1, true); });

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    hero.addEventListener("focusin", stop);
    hero.addEventListener("focusout", start);

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });

    var touchX = null;
    hero.addEventListener("touchstart", function (e) {
      touchX = e.changedTouches[0].clientX;
    }, { passive: true });
    hero.addEventListener("touchend", function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1), true);
      touchX = null;
    }, { passive: true });

    start();
  }

  /* ---------- 滚动入场 ---------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window) || prefersReduced) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 数字滚动 ---------- */
  function initCounters() {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      if (isNaN(target)) return;
      if (prefersReduced) {
        el.textContent = target.toFixed(decimals);
        return;
      }
      var duration = 1400;
      var startTime = null;

      function step(ts) {
        if (!startTime) startTime = ts;
        var p = Math.min((ts - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target.toFixed(decimals);
      }
      requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      nums.forEach(run);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          run(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 分类筛选 ---------- */
  function initFilters() {
    var groups = document.querySelectorAll("[data-filter-group]");
    groups.forEach(function (group) {
      var scopeSelector = group.getAttribute("data-filter-group");
      var scope = scopeSelector ? document.querySelector(scopeSelector) : document;
      if (!scope) return;
      var buttons = group.querySelectorAll("[data-filter]");
      var items = scope.querySelectorAll("[data-cat]");

      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var value = btn.getAttribute("data-filter");
          buttons.forEach(function (b) {
            b.classList.toggle("is-active", b === btn);
            b.setAttribute("aria-pressed", b === btn ? "true" : "false");
          });
          items.forEach(function (item) {
            var show = value === "all" || item.getAttribute("data-cat") === value;
            item.classList.toggle("is-hidden", !show);
            if (show) item.classList.add("is-visible");
          });
          // 让被隐藏元素不再参与灯箱
          scope.dispatchEvent(new CustomEvent("filter:change"));
        });
      });
    });
  }

  /* ---------- 图库灯箱 ---------- */
  function initLightbox() {
    var gallery = document.querySelector("[data-lightbox-gallery]");
    var box = document.querySelector("[data-lightbox]");
    if (!gallery || !box) return;

    var items = Array.prototype.slice.call(gallery.querySelectorAll(".g-item"));
    var img = box.querySelector(".lightbox__img");
    var titleEl = box.querySelector(".lightbox__title");
    var metaEl = box.querySelector(".lightbox__meta");
    var countEl = box.querySelector(".lightbox__current");
    var totalEl = box.querySelector(".lightbox__total");
    var closeBtn = box.querySelector(".lightbox__close");
    var prevBtn = box.querySelector(".lightbox__prev");
    var nextBtn = box.querySelector(".lightbox__next");
    var current = 0;
    var lastFocus = null;

    function visibleItems() {
      return items.filter(function (el) {
        return !el.classList.contains("is-hidden") && el.offsetParent !== null;
      });
    }

    function render() {
      var list = visibleItems();
      if (!list.length) return;
      current = (current + list.length) % list.length;
      var el = list[current];
      var innerImg = el.querySelector("img");
      var full = el.getAttribute("data-full") || (innerImg ? innerImg.src : "");
      var title = el.getAttribute("data-title") || (innerImg ? innerImg.alt : "");
      var meta = el.getAttribute("data-meta") || "";

      img.classList.remove("is-ready");
      img.src = full;
      img.alt = title;
      if (img.complete) img.classList.add("is-ready");
      else img.addEventListener("load", function onload() {
        img.classList.add("is-ready");
        img.removeEventListener("load", onload);
      });

      if (titleEl) titleEl.textContent = title;
      if (metaEl) metaEl.textContent = meta;
      if (countEl) countEl.textContent = String(current + 1).padStart(2, "0");
      if (totalEl) totalEl.textContent = String(list.length).padStart(2, "0");
    }

    function open(el) {
      var list = visibleItems();
      current = list.indexOf(el);
      if (current < 0) current = 0;
      lastFocus = document.activeElement;
      box.classList.add("is-open");
      box.setAttribute("aria-hidden", "false");
      document.body.classList.add("no-scroll");
      render();
      window.setTimeout(function () { closeBtn.focus(); }, 60);
    }

    function close() {
      box.classList.remove("is-open");
      box.setAttribute("aria-hidden", "true");
      document.body.classList.remove("no-scroll");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function step(dir) {
      current += dir;
      render();
    }

    items.forEach(function (el) {
      el.addEventListener("click", function () { open(el); });
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(el);
        }
      });
    });

    if (closeBtn) closeBtn.addEventListener("click", close);
    if (prevBtn) prevBtn.addEventListener("click", function () { step(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { step(1); });
    box.addEventListener("click", function (e) {
      if (e.target === box || e.target.classList.contains("lightbox__stage")) close();
    });

    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    });

    // 筛选后同步灯箱总数
    gallery.addEventListener("filter:change", function () {
      if (!box.classList.contains("is-open")) return;
      if (!visibleItems().length) close();
      else render();
    });

    if (totalEl) totalEl.textContent = String(visibleItems().length).padStart(2, "0");
  }

  /* ---------- 返回顶部 ---------- */
  function initToTop() {
    var btn = document.querySelector("[data-to-top]");
    if (!btn) return;

    function check() {
      btn.classList.toggle("is-visible", window.scrollY > 560);
    }
    check();
    window.addEventListener("scroll", check, { passive: true });
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
    });
  }

  /* ---------- 页脚年份 ---------- */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ---------- 启动 ---------- */
  function boot() {
    initHeader();
    initHero();
    initReveal();
    initCounters();
    initFilters();
    initLightbox();
    initToTop();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
