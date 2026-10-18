// --- Hero background video ---
// assets/venus-planet-boomerang.mp4 already plays forward then backward, so a native loop
// gives the boomerang. (The old version kept every frame in memory, ~450 MB, which crashed phones.)
const video = document.querySelector('#planet-video');
const motionButton = document.querySelector('.motion-toggle');

if (video && motionButton) {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = motionPreference.matches;

  function updateMotionButton() {
    const isPaused = video.paused;
    motionButton.setAttribute('aria-pressed', String(isPaused));
    motionButton.setAttribute('aria-label', isPaused ? 'Play background animation' : 'Pause background animation');
    const label = motionButton.querySelector('.motion-label');
    if (label) label.textContent = isPaused ? 'Play motion' : 'Pause motion';
  }

  function playMotion() { video.play().catch(() => {}); }

  if (userPaused) {
    video.removeAttribute('autoplay');
    video.pause();
  } else {
    playMotion();
  }

  video.addEventListener('play', updateMotionButton);
  video.addEventListener('pause', updateMotionButton);

  motionButton.addEventListener('click', () => {
    userPaused = !userPaused;
    if (userPaused) video.pause();
    else playMotion();
  });

  motionPreference.addEventListener('change', event => {
    userPaused = event.matches;
    if (userPaused) video.pause();
    else playMotion();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else if (!userPaused) playMotion();
  });

  updateMotionButton();
}
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
if (menuButton && nav) {
  function closeMenu() { nav.classList.remove('is-open'); menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open navigation'); }
  menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; nav.classList.toggle('is-open', open); menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); });
  nav.querySelectorAll('a,button').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
}
// --- Pricing carousel: scrolls slowly on its own and loops. Hover, touch or keyboard focus pauses it;
// swiping, the arrows and the pause button all work. People who prefer reduced motion start paused. ---
const priceViewport = document.querySelector('.price-viewport');
if (priceViewport) {
  const track = priceViewport.querySelector('.price-track');
  const originals = [...track.children];
  // A second copy of the tiles makes the loop seamless; screen readers and Tab skip the copy.
  originals.forEach(card => {
    const copy = card.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    copy.querySelectorAll('button, a').forEach(el => el.setAttribute('tabindex', '-1'));
    track.appendChild(copy);
  });
  const toggle = document.querySelector('.price-toggle');
  const SPEED = 0.035; // pixels per millisecond (about 35 px a second)
  let paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let hovering = false, holdUntil = 0, pos = 0, last = 0, running = false;
  const loopWidth = () => track.children[originals.length].offsetLeft - track.children[0].offsetLeft;
  const step = () => originals[0].getBoundingClientRect().width + 22;
  const hold = ms => { holdUntil = performance.now() + ms; };

  function frame(t) {
    if (!running) return;
    const dt = last ? Math.min(t - last, 50) : 0;
    last = t;
    const w = loopWidth();
    if (!paused && !hovering && t > holdUntil) {
      pos += dt * SPEED;
      if (pos >= w) pos -= w;
      priceViewport.scrollLeft = pos;
    } else {
      pos = priceViewport.scrollLeft;
      if (t > holdUntil && pos >= w) { pos -= w; priceViewport.scrollLeft = pos; }
    }
    requestAnimationFrame(frame);
  }
  const start = () => { if (!running) { running = true; last = 0; requestAnimationFrame(frame); } };
  const stop = () => { running = false; };

  function setPaused(value) {
    paused = value;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? 'Play the pricing carousel' : 'Pause the pricing carousel');
  }
  setPaused(paused);
  toggle.addEventListener('click', () => setPaused(!paused));

  function nudge(direction) {
    hold(4000);
    let x = priceViewport.scrollLeft;
    const w = loopWidth();
    if (direction < 0 && x < step()) { x += w; priceViewport.scrollLeft = x; }
    if (direction > 0 && x >= w) { x -= w; priceViewport.scrollLeft = x; }
    priceViewport.scrollTo({ left: x + direction * step(), behavior: 'smooth' });
  }
  document.querySelector('.price-prev').addEventListener('click', () => nudge(-1));
  document.querySelector('.price-next').addEventListener('click', () => nudge(1));

  priceViewport.addEventListener('mouseenter', () => { hovering = true; });
  priceViewport.addEventListener('mouseleave', () => { hovering = false; hold(600); });
  priceViewport.addEventListener('pointerdown', () => hold(4000));
  priceViewport.addEventListener('touchstart', () => hold(4000), { passive: true });
  priceViewport.addEventListener('wheel', () => hold(2500), { passive: true });
  priceViewport.addEventListener('focusin', () => { hovering = true; });
  priceViewport.addEventListener('focusout', () => { hovering = false; });
  priceViewport.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); nudge(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-1); }
  });

  // Only animate while the carousel is on screen and the tab is visible.
  let inView = !('IntersectionObserver' in window);
  if (!inView) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) start(); else stop();
    }).observe(priceViewport);
  } else {
    start();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (inView) start();
  });
}

// "Book a Call": the free Google Calendar booking page set in booking.js.
// Until that link is set (or if it isn't a valid https link), the buttons open an email instead.
const BOOKING_URL = (window.VENUS_BOOKING_URL || '').trim();
const BOOKING_EMAIL = 'mailto:hello@venusdigital.org?subject=' + encodeURIComponent('Book a call with Venus Digital');
function isHttpsUrl(value) {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}
document.querySelectorAll('[data-contact]').forEach(button => button.addEventListener('click', (e) => {
  e.preventDefault();
  if (isHttpsUrl(BOOKING_URL)) window.open(BOOKING_URL, '_blank', 'noopener');
  else window.location.href = BOOKING_EMAIL;
}));
const yearEl = document.querySelector('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
