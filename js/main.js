/* Dementia Companions — site interactions */
(function () {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* Sticky header shadow + back-to-top ------------------------------- */
  const header = $(".header");
  const toTop = $(".to-top");
  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 10);
    if (toTop) toTop.classList.toggle("show", y > 500);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* Mobile nav ------------------------------------------------------- */
  const burger = $(".burger");
  const mobileNav = $(".mobile-nav");
  if (burger && mobileNav) {
    const close = () => { mobileNav.classList.remove("open"); document.body.style.overflow = ""; };
    burger.addEventListener("click", () => { mobileNav.classList.add("open"); document.body.style.overflow = "hidden"; });
    $(".close", mobileNav).addEventListener("click", close);
    $$("a", mobileNav).forEach(a => a.addEventListener("click", close));
  }

  /* Highlight current nav item --------------------------------------- */
  const path = location.pathname.split("/").pop() || "index.html";
  $$(".nav > li > a").forEach(a => {
    const href = a.getAttribute("href") || "";
    if (href === path || (path === "index.html" && href === "index.html")) a.parentElement.classList.add("active");
  });

  /* Service tabs ----------------------------------------------------- */
  $$("[data-tabs]").forEach(root => {
    const tabs = $$(".tab", root);
    const panels = $$(".tab-panel", root);
    const activate = i => {
      tabs.forEach((t, j) => { t.classList.toggle("active", i === j); t.setAttribute("aria-selected", i === j); });
      panels.forEach((p, j) => p.classList.toggle("active", i === j));
    };
    tabs.forEach((t, i) => t.addEventListener("click", () => activate(i)));
    activate(0);
  });

  /* Testimonial slider ----------------------------------------------- */
  $$("[data-slider]").forEach(root => {
    const slides = $$(".slide", root);
    let i = 0, timer;
    const go = n => { i = (n + slides.length) % slides.length; slides.forEach((s, j) => s.classList.toggle("active", i === j)); };
    const auto = () => { clearInterval(timer); timer = setInterval(() => go(i + 1), 7000); };
    $(".prev", root)?.addEventListener("click", () => { go(i - 1); auto(); });
    $(".next", root)?.addEventListener("click", () => { go(i + 1); auto(); });
    go(0); auto();
  });

  /* Accordion -------------------------------------------------------- */
  $$(".accordion").forEach(acc => {
    const items = $$(".acc", acc);
    items.forEach(item => {
      const btn = $("button", item), body = $(".body", item);
      btn.addEventListener("click", () => {
        const open = item.classList.contains("open");
        items.forEach(o => { o.classList.remove("open"); $(".body", o).style.maxHeight = null; $("button", o).setAttribute("aria-expanded", "false"); });
        if (!open) { item.classList.add("open"); body.style.maxHeight = body.scrollHeight + "px"; btn.setAttribute("aria-expanded", "true"); }
      });
    });
    if (items[0]) $("button", items[0]).click();
  });

  /* Reveal-on-scroll, counters and progress bars --------------------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add("in");
      $$("[data-count]", el).concat(el.matches("[data-count]") ? [el] : []).forEach(runCounter);
      $$(".bar i[data-w]", el).forEach(b => { b.style.width = b.dataset.w + "%"; });
      io.unobserve(el);
    });
  }, { threshold: 0.2 });
  $$(".reveal, .stats, .score-card").forEach(el => io.observe(el));

  function runCounter(el) {
    if (el.dataset.done) return;
    el.dataset.done = "1";
    const target = parseFloat(el.dataset.count), decimals = (el.dataset.count.split(".")[1] || "").length;
    const dur = 1400, start = performance.now();
    const tick = now => {
      const p = Math.min(1, (now - start) / dur), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* Contact page: option pickers + live estimate --------------------- */
  $$("[data-options]").forEach(group => {
    const opts = $$(".opt", group);
    opts.forEach(o => o.addEventListener("click", () => {
      opts.forEach(x => x.classList.remove("active"));
      o.classList.add("active");
      updateEstimate();
    }));
  });
  function updateEstimate() {
    const out = $("[data-estimate]");
    if (!out) return;
    const hrs = parseFloat($("[data-options='hours'] .opt.active")?.dataset.hours || 0);
    const rate = 35;
    out.textContent = "$" + Math.round(hrs * rate).toLocaleString();
    const lbl = $("[data-estimate-label]");
    if (lbl) lbl.textContent = hrs + " hrs/week × $" + rate + "/hr";
  }
  updateEstimate();

  /* Demo forms: prevent navigation, show a friendly confirmation ------ */
  $$("form[data-demo]").forEach(f => f.addEventListener("submit", ev => {
    ev.preventDefault();
    const btn = $("button[type=submit], button", f);
    const original = btn ? btn.innerHTML : "";
    if (btn) { btn.innerHTML = "Thank you — we'll be in touch"; btn.disabled = true; }
    setTimeout(() => { if (btn) { btn.innerHTML = original; btn.disabled = false; } f.reset(); }, 3500);
  }));
})();
