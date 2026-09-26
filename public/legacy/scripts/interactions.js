      document.getElementById("year").textContent = new Date().getFullYear();

      /* -------- La nubecita de las letras cambia de texto al moverlas -------- */
      (function thinkBubble() {
        const bubble = document.getElementById("thinkBubble");
        const text = bubble?.querySelector(".think-bubble-text");
        if (!bubble || !text) return;
        const swap = () => {
          if (bubble.classList.contains("is-moved")) return;
          text.textContent = "¡Podés jugar y divertirte!";
          bubble.classList.add("is-moved");
        };
        // pinHit y el canvas del #scene son los que enganchan el drag 3D.
        for (const id of ["pinHit", "scene"]) {
          document
            .getElementById(id)
            ?.addEventListener("pointerdown", swap, { passive: true });
        }
      })();

      /* -------- El hint "Desliza" del hero desaparece al primer scroll -------- */
      (function hideScrollCue() {
        const cue = document.querySelector(".scroll-cue");
        if (!cue) return;
        addEventListener(
          "scroll",
          () => {
            if (scrollY > 40) cue.classList.add("is-hidden");
          },
          { passive: true, once: true },
        );
      })();

      /* -------- Ocultar el navbar al llegar al footer -------- */
      (function hideNavOnFooter() {
        const hud = document.querySelector(".hud");
        const navToggle = document.getElementById("navToggle");
        const footer = document.getElementById("contacto");
        if (!hud || !footer) return;
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const footerIn = entry.isIntersecting;
              window.__footerShown = footerIn;
              hud.classList.toggle("is-hidden", footerIn);
              if (!navToggle) return;
              const heroH =
                document.querySelector(".hero-wrap")?.offsetHeight ?? 0;
              const max = Math.max(heroH - innerHeight, 1);
              const isOpen = navToggle.classList.contains("is-open");
              navToggle.classList.toggle(
                "is-hidden",
                !isOpen && (scrollY < max || footerIn),
              );
            });
          },
          { threshold: 0 },
        );
        observer.observe(footer);
      })();

      /* -------- Menú hamburguesa (móvil) -------- */
      (function setupMobileMenu() {
        const toggle = document.getElementById("navToggle");
        const drawer = document.getElementById("mobileMenu");
        const backdrop = document.getElementById("navBackdrop");
        if (!toggle || !drawer || !backdrop) return;

        const close = () => {
          toggle.classList.remove("is-open");
          drawer.classList.remove("is-open");
          backdrop.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
          toggle.setAttribute("aria-label", "Abrir menú");
          document.body.style.overflow = "";
          document.dispatchEvent(
            new CustomEvent("br:menutoggle", { detail: { open: false } }),
          );
        };

        const open = () => {
          toggle.classList.add("is-open");
          drawer.classList.add("is-open");
          backdrop.classList.add("is-open");
          toggle.setAttribute("aria-expanded", "true");
          toggle.setAttribute("aria-label", "Cerrar menú");
          document.body.style.overflow = "hidden";
          document.dispatchEvent(
            new CustomEvent("br:menutoggle", { detail: { open: true } }),
          );
        };

        toggle.addEventListener("click", () => {
          drawer.classList.contains("is-open") ? close() : open();
        });
        backdrop.addEventListener("click", close);
        document.getElementById("navClose")?.addEventListener("click", close);

        drawer.querySelectorAll("a").forEach((a) =>
          a.addEventListener("click", close),
        );

        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape") close();
        });

        window.addEventListener("resize", () => {
          if (matchMedia("(min-width: 721px)").matches) close();
        });
      })();

      /* -------- Texto que se resalta "en partes" al hacer scroll -------- */
      (function setupHighlightText() {
        const el = document.getElementById("highlightText");
        if (!el) return;
        const words = el.textContent.trim().split(/\s+/);
        el.innerHTML = words
          .map((w) => `<span class="word">${w}</span>`)
          .join(" ");
      })();

      if (window.gsap && window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);

        // Disolución del hero al hacer scroll
        gsap.to(".hero-pin", {
          opacity: 0,
          scale: 1.06,
          ease: "none",
          scrollTrigger: {
            trigger: "#hero-wrap",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });

        // Reveal general de bloques. Los nodos con .reveal que aparecen
        // DESPUÉS del load (las tarjetas de juegos que React portaliza
        // en #catalog-root) también se animan: sin esto quedan en
        // opacity: 0 y no se ven nunca.
        const revealed = new WeakSet();
        let revealIndex = 0;
        const revealNode = (el) => {
          if (!(el instanceof Element) || revealed.has(el)) return;
          revealed.add(el);
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: (revealIndex++ % 6) * 0.06,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          });
        };
        document.querySelectorAll(".reveal").forEach(revealNode);
        new MutationObserver((entries) => {
          for (const entry of entries) {
            for (const node of entry.addedNodes) {
              if (!(node instanceof Element)) continue;
              if (node.classList.contains("reveal")) revealNode(node);
              node.querySelectorAll(".reveal").forEach(revealNode);
            }
          }
        }).observe(document.body, { childList: true, subtree: true });

        // Texto que se resalta en partes a medida que se scrollea
        const textColor = getComputedStyle(document.documentElement)
          .getPropertyValue("--text")
          .trim();
        gsap.to("#highlightText .word", {
          opacity: 1,
          color: textColor,
          ease: "none",
          stagger: 0.06,
          scrollTrigger: {
            trigger: "#highlightText",
            start: "top 78%",
            end: "bottom 45%",
            scrub: true,
          },
        });

        // Sección de proceso: número + barra + bloque activo
        const stepsNum = document.getElementById("stepsNum");
        const stepsBar = document.getElementById("stepsBar");
        const stepBlocks = gsap.utils.toArray(".step-block");

        stepBlocks.forEach((block, i) => {
          ScrollTrigger.create({
            trigger: block,
            start: "top 65%",
            end: "bottom 35%",
            onToggle: (self) => {
              block.classList.toggle("active", self.isActive);
              if (self.isActive) {
                stepsNum.textContent = String(i + 1).padStart(2, "0");
                stepsBar.style.height = `${((i + 1) / stepBlocks.length) * 100}%`;
              }
            },
          });
        });

        // Estado activo del nav flotante
        const navLinks = document.querySelectorAll(
          ".bottom-nav a, .drawer-nav a",
        );
        ["hero-wrap", "nosotros", "proceso", "servicios", "juegos"].forEach(
          (id) => {
            const target = document.getElementById(id);
            if (!target) return;
            ScrollTrigger.create({
              trigger: target,
              start: "top center",
              end: "bottom center",
              onToggle: (self) => {
                if (!self.isActive) return;
                navLinks.forEach((a) =>
                  a.classList.toggle("active", a.dataset.nav === id),
                );
              },
            });
          },
        );
      }
