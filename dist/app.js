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
const CALENDLY_URL = 'https://calendly.com/send2sandaras/30min';
document.querySelectorAll('[data-contact]').forEach(button => button.addEventListener('click', (e) => {
  e.preventDefault();
  if (window.Calendly) {
    window.Calendly.initPopupWidget({url: CALENDLY_URL});
  } else {
    // Calendly's script didn't load (blocked or offline): open the booking page instead.
    window.open(CALENDLY_URL, '_blank', 'noopener');
  }
}));
const yearEl = document.querySelector('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
