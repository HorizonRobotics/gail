// Start and loop each comparison as a pair, holding the shorter video's last
// frame. Each scene has its own restart control, and only visible pairs play.
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const pairs = [...document.querySelectorAll('.scene-videos')].map((element) => {
    const videos = [...element.querySelectorAll('video')];
    const restartButton = element.closest('.scene-card').querySelector('[data-scene-restart]');
    let visible = false;
    let revision = 0;
    let starting = false;
    let loading;
    let optedIn = false;
    let blocked = false;

    videos.forEach((video) => {
      video.muted = true;
      video.loop = false;
      video.autoplay = false;
      video.defaultPlaybackRate = Number(video.dataset.playbackRate);
      video.playbackRate = video.defaultPlaybackRate;
    });

    const shouldPlay = () => visible && !blocked &&
      (!reducedMotion.matches || optedIn) && !document.hidden;
    const stop = () => {
      revision++;
      starting = false;
      videos.forEach((video) => video.pause());
    };

    // Buffer both clips before releasing either one, including on a new loop.
    const ready = (video) => new Promise((resolve, reject) => {
      if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        resolve();
        return;
      }
      const cleanup = () => {
        video.removeEventListener('canplay', onReady);
        video.removeEventListener('error', onError);
      };
      const onReady = () => { cleanup(); resolve(); };
      const onError = () => { cleanup(); reject(video.error); };
      video.addEventListener('canplay', onReady);
      video.addEventListener('error', onError);
      if (video.error) onError();
    });

    const start = async () => {
      if (!shouldPlay() || starting) return;
      const token = ++revision;
      starting = true;
      try {
        if (!loading) {
          loading = Promise.all(videos.map((video) => {
            const buffered = ready(video);
            video.preload = 'auto';
            video.load();
            return buffered;
          }));
        }
        await loading;
        await Promise.all(videos.filter((video) => !video.ended).map(ready));
        if (token !== revision || !shouldPlay()) return;
        // Queue both play requests in the same turn after the readiness barrier.
        await Promise.all(videos.filter((video) => !video.ended).map((video) => video.play()));
      } catch (error) {
        if (token !== revision) return;
        stop();
        // Restart can retry a failed load or browser-blocked autoplay.
        blocked = true;
        loading = undefined;
      } finally {
        if (token === revision) starting = false;
      }
    };

    const restart = () => {
      stop();
      videos.forEach((clip) => { clip.currentTime = 0; });
      start();
    };

    videos.forEach((video) => video.addEventListener('ended', () => {
      // Leave an ended clip alone so its last frame stays visible.
      if (!videos.every((clip) => clip.ended)) return;
      restart();
    }));

    restartButton.hidden = false;
    restartButton.addEventListener('click', () => {
      // Explicit playback is allowed for this scene under reduced motion.
      optedIn = true;
      blocked = false;
      restart();
    });

    return {
      element,
      update() { if (shouldPlay()) start(); else stop(); },
      setVisible(value) { visible = value; this.update(); },
      resetMotionPreference() { optedIn = false; this.update(); }
    };
  });

  function update() {
    pairs.forEach((pair) => pair.update());
  }

  if ('IntersectionObserver' in window) {
    const byElement = new Map(pairs.map((pair) => [pair.element, pair]));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        byElement.get(target).setVisible(isIntersecting);
      });
    }, { threshold: 0.05 });
    pairs.forEach((pair) => observer.observe(pair.element));
  } else {
    pairs.forEach((pair) => pair.setVisible(true));
  }

  reducedMotion.addEventListener('change', () => {
    pairs.forEach((pair) => pair.resetMotionPreference());
  });
  document.addEventListener('visibilitychange', update);
  update();
})();
