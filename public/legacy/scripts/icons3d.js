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

      async function initIconLayer() {
        const canvas = document.createElement("canvas");
        canvas.id = "icon3d-layer";
        document.body.appendChild(canvas);

        const renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.setSize(innerWidth, innerHeight);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.autoClear = false;

        const pmrem = new THREE.PMREMGenerator(renderer);
        envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        pmrem.dispose();

        const items = [];
        for (const el of slots) {
          const geometry = await loadIconGeometry(el.dataset.icon);
          const { scene, camera, group, material } = makeIconScene(
            geometry,
            el.dataset.color || ICON_COLOR,
            envTexture,
          );
          items.push({
            el,
            scene,
            camera,
            group,
            material,
            reveal: el.closest(".reveal, .step-block"),
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

        addEventListener("resize", onResize);
        requestAnimationFrame(tick);

        function onResize() {
          renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
          renderer.setSize(innerWidth, innerHeight);
        }

        const timer = new THREE.Timer();

        function tick() {
          requestAnimationFrame(tick);
          timer.update();
          const t = timer.getElapsed();

          renderer.setScissorTest(false);
          renderer.setViewport(0, 0, innerWidth, innerHeight);
          renderer.clear();
          renderer.setScissorTest(true);

          const canvasRect = renderer.domElement.getBoundingClientRect();

          for (const item of items) {
            const rect = item.el.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;
            if (w < 2 || h < 2) continue;
            if (
              rect.bottom <= 0 ||
              rect.top >= innerHeight ||
              rect.right <= 0 ||
              rect.left >= innerWidth
            ) {
              continue;
            }

            let opacity = 1;
            if (item.reveal) {
              const o = parseFloat(getComputedStyle(item.reveal).opacity);
              opacity = Number.isFinite(o) ? o : 1;
            }
            if (opacity <= 0.02) continue;

            item.group.visible = true;
            item.group.scale.setScalar(0.72 + 0.28 * opacity);
            item.material.opacity = opacity;
            item.material.transparent = opacity < 0.99;

            if (reduceMotion) {
              item.group.rotation.set(item.tiltX, item.tiltY, 0);
            } else {
              item.group.rotation.x =
                item.tiltX + Math.cos(t * 0.55 + item.phase) * 0.1;
              item.group.rotation.y =
                item.tiltY + Math.sin(t * 0.7 + item.phase) * 0.26;
            }

            const left = rect.left - canvasRect.left;
            const bottom = innerHeight - (rect.bottom - canvasRect.top);

            item.camera.aspect = w / h;
            item.camera.updateProjectionMatrix();

            renderer.setViewport(left, bottom, w, h);
            renderer.setScissor(left, bottom, w, h);
            renderer.render(item.scene, item.camera);
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
