      (function initLoader() {
        const overlay = document.getElementById("loading");
        if (!overlay) return;
        document.body.classList.add("is-loading");
        const pctEl = overlay.querySelector("#loaderPct");
        const start = performance.now();
        const RAMP_MS = 3200;
        const MIN_MS = 1600;
        let progress = 0;
        let ready = false;
        let readyAt = 0;
        let popped = false;

        function render() {
          pctEl.textContent = String(Math.round(progress * 100));
        }

        function pop() {
          if (popped) return;
          popped = true;
          overlay.classList.add("popping");
          document.body.classList.remove("is-loading");
          setTimeout(() => overlay.classList.add("hidden"), 800);
        }

        function loop(now) {
          if (popped) return;
          if (!ready) {
            const target = Math.min(0.92, (now - start) / RAMP_MS);
            progress += (target - progress) * 0.06 + 0.0015;
            if (progress > 0.92) progress = 0.92;
          } else {
            progress = Math.min(1, 0.92 + ((now - readyAt) / 500) * 0.08);
            if (progress >= 1) {
              progress = 1;
              render();
              pop();
              return;
            }
          }
          render();
          requestAnimationFrame(loop);
        }

        window.__loader = {
          get progress() {
            return progress;
          },
          complete() {
            if (ready) return;
            const elapsed = performance.now() - start;
            const wait = Math.max(0, MIN_MS - elapsed);
            setTimeout(() => {
              ready = true;
              readyAt = performance.now();
            }, wait);
          },
          hide() {
            progress = 1;
            render();
            document.body.classList.remove("is-loading");
            overlay.classList.add("hidden");
          },
        };

        requestAnimationFrame(loop);
      })();
