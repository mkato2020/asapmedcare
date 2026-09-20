/* =========================================================
   ASAP MedCare — interactions
   Progressive enhancement only: the page works without JS.
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- current year ---------- */
  var yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- header state on scroll ---------- */
  var header = document.querySelector('[data-header]');
  var onScroll = function () {
    if (header) header.classList.toggle('is-stuck', window.scrollY > 12);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mobile navigation ---------- */
  var toggle = document.querySelector('[data-nav-toggle]');
  var nav = document.getElementById('nav');

  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        closeNav();
        toggle.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) closeNav();
    });
  }

  /* ---------- scroll reveal ---------- */
  var revealables = document.querySelectorAll('.reveal');

  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(revealables, function (el) {
      el.classList.add('is-in');
    });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    Array.prototype.forEach.call(revealables, function (el) { io.observe(el); });
  }

  /* ---------- active section in nav ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));
  var sections = links
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) {
          link.classList.toggle(
            'is-active',
            link.getAttribute('href') === '#' + entry.target.id
          );
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (section) { spy.observe(section); });
  }

  /* ---------- enquiry form ---------- */
  var form = document.getElementById('enquiry-form');
  if (!form) return;

  var status = document.getElementById('form-status');
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function fieldOf(input) { return input.closest('.field'); }

  function errorOf(input) {
    var id = input.getAttribute('aria-describedby');
    return id ? document.getElementById(id) : null;
  }

  function setInvalid(input, invalid) {
    var wrap = fieldOf(input);
    var err = errorOf(input);
    if (wrap) wrap.classList.toggle('is-invalid', invalid);
    if (err) err.hidden = !invalid;
    input.setAttribute('aria-invalid', String(invalid));
  }

  function validate(input) {
    var ok;
    if (input.type === 'checkbox') ok = input.checked;
    else if (input.type === 'email') ok = EMAIL.test(input.value.trim());
    else ok = input.value.trim().length > 0;
    setInvalid(input, !ok);
    return ok;
  }

  var required = Array.prototype.slice.call(form.querySelectorAll('[required]'));

  required.forEach(function (input) {
    input.addEventListener('blur', function () { validate(input); });
    input.addEventListener('input', function () {
      if (fieldOf(input) && fieldOf(input).classList.contains('is-invalid')) validate(input);
    });
    input.addEventListener('change', function () {
      if (input.type === 'checkbox') validate(input);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var firstBad = null;
    required.forEach(function (input) {
      if (!validate(input) && !firstBad) firstBad = input;
    });

    if (firstBad) {
      status.textContent = 'Please complete the highlighted fields.';
      status.classList.add('is-error');
      firstBad.focus();
      return;
    }

    status.classList.remove('is-error');
    status.textContent = 'Sending…';

    var button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;

    /* Netlify Forms: POST the encoded form back to the page itself.
       Netlify intercepts it at the edge — no backend, no API key.
       Submissions appear in the Netlify dashboard; set up notifications there. */
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString()
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.reset();
        required.forEach(function (input) { setInvalid(input, false); });
        status.textContent =
          'Thank you — your enquiry has reached us. We reply to every serious enquiry, usually within two working days.';
      })
      .catch(function () {
        /* Offline, or running somewhere Netlify isn't handling the POST.
           Don't swallow it — give them a route that works. */
        status.classList.add('is-error');
        status.innerHTML =
          'We could not send that just now. Please email ' +
          '<a href="mailto:sales@asapmedcare.co.ug">sales@asapmedcare.co.ug</a> ' +
          'and we will pick it up straight away.';
      })
      .then(function () {
        if (button) button.disabled = false;
      });
  });
})();
