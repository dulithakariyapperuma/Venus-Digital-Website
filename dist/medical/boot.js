// Runs before the page paints. Hide-then-reveal only when site.js runs; if it fails to load, show everything after 3 s.
// (A separate file instead of an inline script, so the site's Content-Security-Policy can block inline scripts.)
document.documentElement.classList.add('js');
setTimeout(function () {
  if (!window.SITE_READY) document.documentElement.classList.remove('js');
}, 3000);
