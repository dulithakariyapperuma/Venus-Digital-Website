// --- Hero Video Boomerang Engine ---
const video = document.querySelector('#planet-video');
const displayCanvas = document.querySelector('#planet-canvas');
const motionButton = document.querySelector('.motion-toggle');

if (video && motionButton) {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = motionPreference.matches;

  // Boomerang State
  const MAX_WIDTH = 960;
  let targetWidth = 960;
  let targetHeight = 540;
  const frames = [];
  let isCapturing = true;
  let isBoomerangReady = false;
  let isBoomerangRunning = false;
  let frameIndex = 0;
  let direction = -1; // When forward play ends, boomerang starts backwards
  let lastTimestamp = 0;
  const FPS_INTERVAL = 1000 / 30; // 30 FPS target interval (~33.33ms)
  let animationId = null;

  // Video settings for initial forward capture
  video.removeAttribute('loop');
  video.muted = true;
  video.playsInline = true;

  function updateDimensions() {
    if (video.videoWidth > 0) {
      if (video.videoWidth > MAX_WIDTH) {
        targetWidth = MAX_WIDTH;
        targetHeight = Math.round((video.videoHeight / video.videoWidth) * MAX_WIDTH);
      } else {
        targetWidth = video.videoWidth;
        targetHeight = video.videoHeight;
      }
      if (displayCanvas) {
        displayCanvas.width = targetWidth;
        displayCanvas.height = targetHeight;
      }
    }
  }

  video.addEventListener('loadedmetadata', updateDimensions);

  // Capture frame into offscreen canvas
  function captureNextFrame() {
    if (!isCapturing || !video) return;

    if (video.readyState >= 2) {
      if (video.videoWidth > 0 && targetWidth === 960 && targetHeight === 540) {
        updateDimensions();
      }

      const offscreen = document.createElement('canvas');
      offscreen.width = targetWidth;
      offscreen.height = targetHeight;
      const offCtx = offscreen.getContext('2d');
      offCtx.drawImage(video, 0, 0, targetWidth, targetHeight);
      frames.push(offscreen);
    }

    if (isCapturing) {
      if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
        video.requestVideoFrameCallback(captureNextFrame);
      } else {
        requestAnimationFrame(captureNextFrame);
      }
    }
  }

  // 30 FPS Boomerang Render Loop
  function boomerangRenderLoop(timestamp) {
    if (!isBoomerangRunning || frames.length === 0 || !displayCanvas) return;

    const elapsed = timestamp - lastTimestamp;
    if (elapsed >= FPS_INTERVAL) {
      lastTimestamp = timestamp - (elapsed % FPS_INTERVAL);

      const ctx = displayCanvas.getContext('2d');
      if (ctx && frames[frameIndex]) {
        ctx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
        ctx.drawImage(frames[frameIndex], 0, 0, displayCanvas.width, displayCanvas.height);
      }

      frameIndex += direction;
      if (frameIndex >= frames.length - 1) {
        direction = -1;
        frameIndex = frames.length - 1;
      } else if (frameIndex <= 0) {
        direction = 1;
        frameIndex = 0;
      }
    }

    animationId = requestAnimationFrame(boomerangRenderLoop);
  }

  function startBoomerang() {
    if (frames.length === 0) return;
    isBoomerangRunning = true;
    lastTimestamp = performance.now();
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(boomerangRenderLoop);
    updateMotionButton();
  }

  function pauseBoomerang() {
    isBoomerangRunning = false;
    cancelAnimationFrame(animationId);
    updateMotionButton();
  }

  // On ended event: stop capturing, switch from video to displayCanvas, run boomerang loop
  video.addEventListener('ended', () => {
    isCapturing = false;
    if (frames.length > 0) {
      isBoomerangReady = true;
      video.style.display = 'none';
      if (displayCanvas) {
        displayCanvas.style.display = 'block';
      }
      frameIndex = frames.length - 1;
      direction = -1;
      if (!userPaused) {
        startBoomerang();
      }
    } else {
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  });

  function updateMotionButton() {
    const isPaused = isBoomerangReady ? !isBoomerangRunning : video.paused;
    motionButton.setAttribute('aria-pressed', String(isPaused));
    motionButton.setAttribute('aria-label', isPaused ? 'Play background animation' : 'Pause background animation');
    const label = motionButton.querySelector('.motion-label');
    if (label) label.textContent = isPaused ? 'Play motion' : 'Pause motion';
  }

  async function playActiveMotion() {
    if (isBoomerangReady) {
      startBoomerang();
    } else {
      try {
        await video.play();
        if (isCapturing) {
          if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
            video.requestVideoFrameCallback(captureNextFrame);
          } else {
            requestAnimationFrame(captureNextFrame);
          }
        }
      } catch (err) {}
    }
    updateMotionButton();
  }

  function pauseActiveMotion() {
    if (isBoomerangReady) {
      pauseBoomerang();
    } else {
      video.pause();
    }
    updateMotionButton();
  }

  // Initial startup
  if (userPaused) {
    video.removeAttribute('autoplay');
    video.pause();
    updateMotionButton();
  } else {
    playActiveMotion();
  }

  video.addEventListener('play', () => {
    if (isCapturing) {
      if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
        video.requestVideoFrameCallback(captureNextFrame);
      } else {
        requestAnimationFrame(captureNextFrame);
      }
    }
    updateMotionButton();
  });
  video.addEventListener('pause', updateMotionButton);

  motionButton.addEventListener('click', () => {
    userPaused = !userPaused;
    if (userPaused) {
      pauseActiveMotion();
    } else {
      playActiveMotion();
    }
  });

  motionPreference.addEventListener('change', event => {
    userPaused = event.matches;
    if (userPaused) {
      pauseActiveMotion();
    } else {
      playActiveMotion();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (isBoomerangReady) pauseBoomerang();
      else video.pause();
    } else if (!userPaused) {
      playActiveMotion();
    }
  });

  updateMotionButton();
}
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
function closeMenu() { nav.classList.remove('is-open'); menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open navigation'); }
menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; nav.classList.toggle('is-open', open); menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); });
nav.querySelectorAll('a,button').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
const dialog = document.querySelector('#contact-dialog');
document.querySelectorAll('[data-contact]').forEach(button => button.addEventListener('click', () => {
  const bookingUrl = window.VENUS_BOOKING_URL;
  if (bookingUrl) {
    window.open(bookingUrl, '_blank', 'noopener,noreferrer');
    return;
  }
  dialog.showModal();
}));
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
document.querySelector('.dialog-services').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { const rect = dialog.getBoundingClientRect(); if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close(); });
document.querySelector('#year').textContent = new Date().getFullYear();
