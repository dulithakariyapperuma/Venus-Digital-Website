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
  let direction = -1;
  let lastTimestamp = 0;
  let lastPresentedFrame = -1;
  let lastMediaTime = -1;
  let isCallbackScheduled = false;
  const FPS_INTERVAL = 1000 / 30; // 30 FPS target interval (~33.33ms)
  let animationId = null;

  // Video settings
  video.removeAttribute('loop');
  video.muted = true;
  video.playsInline = true;

  function updateDimensions() {
    const vWidth = video.videoWidth || 1920;
    const vHeight = video.videoHeight || 1080;
    if (vWidth > MAX_WIDTH) {
      targetWidth = MAX_WIDTH;
      targetHeight = Math.round((vHeight / vWidth) * MAX_WIDTH);
    } else {
      targetWidth = vWidth;
      targetHeight = vHeight;
    }
    if (displayCanvas) {
      displayCanvas.width = targetWidth;
      displayCanvas.height = targetHeight;
    }
  }

  // Initialize dimensions immediately
  if (video.readyState >= 1) {
    updateDimensions();
  }
  video.addEventListener('loadedmetadata', updateDimensions);
  video.addEventListener('canplay', updateDimensions);

  // Single guarded capture callback
  function scheduleCapture() {
    if (!isCapturing || isCallbackScheduled || !video) return;
    isCallbackScheduled = true;

    if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
      video.requestVideoFrameCallback((now, metadata) => {
        isCallbackScheduled = false;
        handleFrameCapture(metadata);
      });
    } else {
      requestAnimationFrame(() => {
        isCallbackScheduled = false;
        handleFrameCapture(null);
      });
    }
  }

  function handleFrameCapture(metadata) {
    if (!isCapturing || !video) return;

    // Check for end of playback during capture
    if (video.duration && video.currentTime >= video.duration - 0.12) {
      finishCaptureAndStartBoomerang();
      return;
    }

    if (video.readyState >= 2) {
      // Check for unique frame
      let isUnique = true;
      if (metadata && typeof metadata.presentedFrames === 'number') {
        if (metadata.presentedFrames === lastPresentedFrame) {
          isUnique = false;
        } else {
          lastPresentedFrame = metadata.presentedFrames;
        }
      } else {
        if (Math.abs(video.currentTime - lastMediaTime) < 0.015) {
          isUnique = false;
        } else {
          lastMediaTime = video.currentTime;
        }
      }

      if (isUnique) {
        if (targetWidth === 960 && video.videoWidth > 0 && targetHeight === 540) {
          updateDimensions();
        }

        const offscreen = document.createElement('canvas');
        offscreen.width = targetWidth;
        offscreen.height = targetHeight;
        const offCtx = offscreen.getContext('2d', { alpha: false });
        if (offCtx) {
          offCtx.drawImage(video, 0, 0, targetWidth, targetHeight);
          frames.push(offscreen);
        }
      }
    }

    if (isCapturing) {
      scheduleCapture();
    }
  }

  // Finish capture and transition smoothly into 30 FPS Boomerang
  let isFinished = false;
  function finishCaptureAndStartBoomerang() {
    if (isFinished) return;
    isFinished = true;
    isCapturing = false;

    if (frames.length > 5) {
      isBoomerangReady = true;
      frameIndex = frames.length - 1;
      direction = -1;

      if (displayCanvas) {
        displayCanvas.width = targetWidth;
        displayCanvas.height = targetHeight;
        const ctx = displayCanvas.getContext('2d');
        if (ctx && frames[frameIndex]) {
          ctx.drawImage(frames[frameIndex], 0, 0, targetWidth, targetHeight);
        }
        displayCanvas.style.display = 'block';
        video.style.display = 'none';
      }

      if (!userPaused) {
        startBoomerang();
      }
    } else {
      // If frames failed to capture, loop the video natively so it never freezes
      video.loop = true;
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  }

  // Listen to multiple indicators of video finish
  video.addEventListener('ended', finishCaptureAndStartBoomerang);
  video.addEventListener('timeupdate', () => {
    if (isCapturing && video.duration && video.currentTime >= video.duration - 0.12) {
      finishCaptureAndStartBoomerang();
    }
  });

  // 30 FPS Boomerang Render Loop
  function boomerangRenderLoop(timestamp) {
    if (!isBoomerangRunning || frames.length === 0 || !displayCanvas) return;

    const elapsed = timestamp - lastTimestamp;
    if (elapsed >= FPS_INTERVAL) {
      lastTimestamp = timestamp - (elapsed % FPS_INTERVAL);

      const ctx = displayCanvas.getContext('2d');
      if (ctx && frames[frameIndex]) {
        ctx.drawImage(frames[frameIndex], 0, 0, displayCanvas.width, displayCanvas.height);
      }

      // Step frame index and bounce direction
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
        scheduleCapture();
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
    if (isCapturing) scheduleCapture();
    updateMotionButton();
  });
  video.addEventListener('pause', updateMotionButton);

  motionButton.addEventListener('click', () => {
    userPaused = !userPaused;
    if (userPaused) pauseActiveMotion();
    else playActiveMotion();
  });

  motionPreference.addEventListener('change', event => {
    userPaused = event.matches;
    if (userPaused) pauseActiveMotion();
    else playActiveMotion();
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
