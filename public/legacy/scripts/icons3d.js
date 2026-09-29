      import * as THREE from "three";
      import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
      import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

      const ICON_CDN = "https://cdn.jsdelivr.net/npm/iconoir@7.12.1/icons/solid";
      const ICON_COLOR = "#ff7a00";
      const EYE = { fov: 28 };
      const CAMERA_DISTANCE =
        (1 / Math.sin(THREE.MathUtils.degToRad(EYE.fov / 2))) * 1.18;

      const reduceMotion = matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const slots = Array.from(
        document.querySelectorAll(".icon3d[data-icon]"),
      );
      const bgSlots = Array.from(
        document.querySelectorAll(".section-bg[data-bg-icon]"),
      );

      const svgLoader = new SVGLoader();
      const geometryCache = new Map();
      let envTexture = null;

      if (slots.length || bgSlots.length) {
        initIconLayer().catch((err) => console.warn("icon3d:", err));
      }

      // Cada ícono se dibuja en un <canvas> 2D DENTRO de su tarjeta, así se
      // mueve con el scroll nativo. Antes era un canvas fixed de pantalla
      // completa que seguía a las tarjetas con getBoundingClientRect en cada
      // frame: en el celular el scroll lo mueve el compositor antes de que
      // corra JS, y los íconos llegaban un frame tarde (tirones).
      // Un solo WebGLRenderer offscreen dibuja cada ícono y se copia con
      // drawImage: los móviles limitan la cantidad de contextos WebGL.
      async function initIconLayer() {
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setClearColor(0x000000, 0);

        const pmrem = new THREE.PMREMGenerator(renderer);
        envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        pmrem.dispose();

        const items = [];
        for (const el of slots) {
          const geometry = await loadIconGeometry(el.dataset.icon);
          const { scene, camera, group } = makeIconScene(
            geometry,
            el.dataset.color || ICON_COLOR,
            envTexture,
          );
          const canvas = document.createElement("canvas");
          canvas.className = "icon3d-canvas";
          canvas.setAttribute("aria-hidden", "true");
          el.appendChild(canvas);
          items.push({
            el,
            canvas,
            ctx: canvas.getContext("2d"),
            scene,
            camera,
            group,
            visible: false,
            w: 0,
            h: 0,
            phase: Math.random() * Math.PI * 2,
            tiltX: 0.34 + (Math.random() - 0.5) * 0.12,
            tiltY: 0.5 + (Math.random() - 0.5) * 0.3,
          });
        }

        document.body.classList.add("has-icon3d");

        if (bgSlots.length) {
          try {
            renderSectionBackgrounds();
          } catch (err) {
            console.warn("icon3d bg:", err);
          }
        }

        if (!items.length) return;

        const byEl = new Map(items.map((item) => [item.el, item]));
        const pixelRatio = () => Math.min(devicePixelRatio, 2);
        let dirty = true;

        // Tamaños por ResizeObserver y visibilidad por IntersectionObserver:
        // nada de leer layout dentro del loop.
        const sizeObserver = new ResizeObserver((entries) => {
          const pr = pixelRatio();
          for (const entry of entries) {
            const item = byEl.get(entry.target);
            item.w = entry.contentRect.width;
            item.h = entry.contentRect.height;
            item.canvas.width = Math.round(item.w * pr);
            item.canvas.height = Math.round(item.h * pr);
          }
          // El buffer compartido tiene que alcanzar para el ícono más grande.
          const maxW = Math.max(...items.map((item) => item.w));
          const maxH = Math.max(...items.map((item) => item.h));
          renderer.setPixelRatio(pr);
          renderer.setSize(maxW, maxH, false);
          dirty = true;
        });
        const viewObserver = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            byEl.get(entry.target).visible = entry.isIntersecting;
          }
          dirty = true;
        });
        for (const item of items) {
          sizeObserver.observe(item.el);
          viewObserver.observe(item.el);
        }

        const timer = new THREE.Timer();
        requestAnimationFrame(tick);

        function tick() {
          requestAnimationFrame(tick);
          // Sin movimiento, se redibuja solo si cambió tamaño o visibilidad.
          if (reduceMotion && !dirty) return;
          dirty = false;
          timer.update();
          const t = timer.getElapsed();
          const pr = pixelRatio();
          const source = renderer.domElement;

          for (const item of items) {
            if (!item.visible || item.w < 2 || item.h < 2) continue;

            if (reduceMotion) {
              item.group.rotation.set(item.tiltX, item.tiltY, 0);
            } else {
              item.group.rotation.x =
                item.tiltX + Math.cos(t * 0.55 + item.phase) * 0.1;
              item.group.rotation.y =
                item.tiltY + Math.sin(t * 0.7 + item.phase) * 0.26;
            }

            item.camera.aspect = item.w / item.h;
            item.camera.updateProjectionMatrix();

            // El viewport de WebGL arranca abajo a la izquierda; drawImage
            // mide desde arriba, por eso el recorte sale del fondo del buffer.
            renderer.setViewport(0, 0, item.w, item.h);
            renderer.render(item.scene, item.camera);

            const sw = item.w * pr;
            const sh = item.h * pr;
            item.ctx.clearRect(0, 0, item.canvas.width, item.canvas.height);
            item.ctx.drawImage(
              source,
              0,
              source.height - sh,
              sw,
              sh,
              0,
              0,
              item.canvas.width,
              item.canvas.height,
            );
          }
        }
      }

      function renderSectionBackgrounds() {
        const SIZE = 640;
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
        });
        renderer.setPixelRatio(1);
        renderer.setSize(SIZE, SIZE);
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        const pmrem = new THREE.PMREMGenerator(renderer);
        const bgEnv = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        pmrem.dispose();

        const paint = async (el) => {
          try {
            const geometry = await loadIconGeometry(el.dataset.bgIcon);
            const { scene, camera, group } = makeIconScene(
              geometry,
              el.dataset.bgColor || ICON_COLOR,
              bgEnv,
            );
            group.rotation.set(0.36, 0.55, 0.08);
            camera.aspect = 1;
            camera.updateProjectionMatrix();
            renderer.render(scene, camera);
            el.style.backgroundImage = `url(${renderer.domElement.toDataURL("image/png")})`;
          } catch (err) {
            console.warn("icon3d bg:", err);
          }
        };

        Promise.all(bgSlots.map(paint)).then(() => renderer.dispose());
      }

      function makeIconScene(geometry, color, env) {
        const material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(color),
          metalness: 0,
          roughness: 0.16,
          clearcoat: 0.9,
          clearcoatRoughness: 0.08,
          sheen: 0.06,
          envMapIntensity: 0.6,
          side: THREE.DoubleSide,
        });

        const group = new THREE.Group();
        group.add(new THREE.Mesh(geometry, material));

        const scene = new THREE.Scene();
        scene.environment = env;
        scene.environmentIntensity = 0.55;
        scene.add(new THREE.AmbientLight(0xffffff, 0.65));

        const key = new THREE.DirectionalLight(0xffffff, 2.1);
        key.position.set(-3, 4, 6);
        scene.add(key);

        const fill = new THREE.DirectionalLight(0x8fe6f5, 0.45);
        fill.position.set(4, -1, 4);
        scene.add(fill);

        scene.add(group);

        const camera = new THREE.PerspectiveCamera(EYE.fov, 1, 0.1, 50);
        camera.position.set(0, 0, CAMERA_DISTANCE);
        camera.lookAt(0, 0, 0);

        return { scene, camera, group, material };
      }

      function loadIconGeometry(name) {
        if (!geometryCache.has(name)) {
          const promise = buildIconGeometry(name).catch((err) => {
            geometryCache.delete(name);
            throw err;
          });
          geometryCache.set(name, promise);
        }
        return geometryCache.get(name);
      }

      async function buildIconGeometry(name) {
        const svgText = await fetch(`${ICON_CDN}/${name}.svg`).then((res) =>
          res.text(),
        );
        const svg = svgLoader.parse(
          svgText.replace(/currentColor/gi, "#000000"),
        );
        const shapes = [];
        for (const path of svg.paths) shapes.push(...path.toShapes());

        const geometry = new THREE.ExtrudeGeometry(shapes, {
          depth: 3.6,
          bevelEnabled: true,
          bevelThickness: 1.1,
          bevelSize: 0.85,
          bevelOffset: 0,
          bevelSegments: 6,
          curveSegments: 18,
        });
        geometry.scale(1, -1, 1);
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();

        const radius = geometry.boundingSphere?.radius || 1;
        geometry.scale(1 / radius, 1 / radius, 1 / radius);
        geometry.computeBoundingBox();
        const center = geometry.boundingBox.getCenter(new THREE.Vector3());
        geometry.translate(-center.x, -center.y, -center.z);
        return geometry;
      }
