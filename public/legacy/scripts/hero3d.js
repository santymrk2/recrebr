      import * as THREE from "three";
      import { FontLoader } from "three/addons/loaders/FontLoader.js";
      import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
      import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
      import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
      import * as RAPIER from "https://esm.sh/@dimforge/rapier3d-compat@0.12.0";

      const FONT_URL = "/legacy/fonts/Arial Rounded MT.json";
      const BALLOON_COLOR = 0x00b4d8;

      const sceneRoot = document.querySelector("#scene");
      const pinHit = document.getElementById("pinHit");
      const errorBox = document.querySelector("#error");

      let scene, camera, renderer, world;
      const letters = [];
      let dragged = null;

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const dragPoint = new THREE.Vector3();
      const dragOffset = new THREE.Vector3();
      const timer = new THREE.Timer();
      const wallBodies = {};

      const heroWrap = document.getElementById("hero-wrap");
      const PIN_TOP_MARGIN = 0.5;
      const PIN_SHRINK = 0.5;
      const PIN_SPREAD = 0.42;
      const PIN_FLOAT_Y = 0.075;
      const PIN_FLOAT_X = 0.024;
      const PIN_FLOAT_TILT = 0.017;
      const PIN_FLOAT_SPEED = 1.2;
      const HERO_FLOAT = 0.6;
      const PIN_TILT_DOWN = 0.4;
      const pinTiltEuler = new THREE.Euler();
      const COLLIDER_RADIUS = 0.015;
      const COLLIDER_FIT = 0.85;
      const FOOTER_SPREAD_RATIO = 0.84;
      const FOOTER_CAP_RATIO = 0.56;
      const BALLOON_END = 0.12;
      const reduceMotion = matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const footBrand = document.getElementById("footBrandText");
      const footerPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const footerTarget = new THREE.Vector3();
      const footerProbe = new THREE.Vector3();
      const IDENTITY_QUAT = new THREE.Quaternion();
      let footerProgress = 0;
      let footerScale = 1;
      let footerSpread = 0;
      let footerOriginX = 0;
      let pinTargetY = 2.1;
      let scrollRise = 0;
      let scrollRiseSmooth = 0;
      let mobileMenuOpen = false;

      document.addEventListener("br:menutoggle", (e) => {
        mobileMenuOpen = Boolean(e.detail && e.detail.open);
        sceneRoot.classList.toggle("menu-open", mobileMenuOpen);
      });

      function createMaterial() {
        return new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(BALLOON_COLOR),
          metalness: 0.0,
          roughness: 0.12,
          clearcoat: 0.95,
          clearcoatRoughness: 0.045,
          reflectivity: 0.5,
          sheen: 0.05,
          sheenColor: new THREE.Color(0x8fe6f5),
          sheenRoughness: 0.12,
          envMapIntensity: 0.42,
        });
      }

      function showError(error) {
        console.error("Error:", error);
        window.__loader?.hide();
        errorBox.textContent =
          "No se pudo iniciar la demo.\n\n" +
          (error?.stack || error?.message || String(error));
        errorBox.style.display = "block";
      }

      async function boot() {
        try {
          await RAPIER.init();
          scene = new THREE.Scene();

          camera = new THREE.PerspectiveCamera(
            34,
            innerWidth / innerHeight,
            0.1,
            100,
          );
          camera.position.set(0, 0.15, 9.2);
          camera.lookAt(0, 0, 0);

          renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          });
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.PCFShadowMap;
          renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
          renderer.setSize(innerWidth, innerHeight);
          renderer.outputColorSpace = THREE.SRGBColorSpace;
          renderer.toneMapping = THREE.NoToneMapping;
          renderer.toneMappingExposure = 1.0;
          sceneRoot.appendChild(renderer.domElement);

          const pmrem = new THREE.PMREMGenerator(renderer);
          const environment = new RoomEnvironment();
          const envTexture = pmrem.fromScene(environment, 0.035).texture;
          scene.environmentIntensity = 0.32;
          scene.environment = envTexture;
          environment.dispose();
          pmrem.dispose();

          const key = new THREE.DirectionalLight(0xffffff, 1.45);
          key.position.set(-4, 5, 6);
          key.castShadow = true;
          key.shadow.mapSize.width = 2048;
          key.shadow.mapSize.height = 2048;
          key.shadow.camera.near = 0.1;
          key.shadow.camera.far = 20;
          key.shadow.camera.left = -6;
          key.shadow.camera.right = 6;
          key.shadow.camera.top = 5;
          key.shadow.camera.bottom = -5;
          key.shadow.bias = -0.0005;
          key.shadow.normalBias = 0.035;
          scene.add(key);

          const fill = new THREE.DirectionalLight(0x78ffff, 0.22);
          fill.position.set(4, 1, 3);
          scene.add(fill);

          const rim = new THREE.PointLight(0xffffff, 2.0, 12, 2);
          rim.position.set(0, 4, 5);
          scene.add(rim);

          world = new RAPIER.World({ x: 0, y: 0, z: 0 });
          setupBoundaryWalls();

          const font = await new FontLoader().loadAsync(FONT_URL);

          const specs = [
            { text: "B", x: -0.82, y: 0.05, z: 0, rot: -0.06, scale: 0.6 },
            { text: "&", x: 0, y: -0.02, z: 0.03, rot: 0.04, scale: 0.5 },
            { text: "R", x: 0.82, y: 0.02, z: 0, rot: 0.07, scale: 0.6 },
          ];

          for (const spec of specs) createLetter(font, spec);

          setupPointerEvents();
          addEventListener("resize", onResize);
          computePinTarget();
          updateScrollProgress();
          addEventListener("scroll", updateScrollProgress, { passive: true });

          window.__loader?.complete();
          animate();
        } catch (error) {
          showError(error);
        }
      }

      function createLetter(font, spec) {
        const textGeo = new TextGeometry(spec.text, {
          font,
          size: spec.scale,
          depth: 0.2,
          curveSegments: 28,
          bevelEnabled: true,
          bevelThickness: 0.095,
          bevelSize: 0.065,
          bevelOffset: 0,
          bevelSegments: 16,
        });
        textGeo.center();
        const geometry = mergeVertices(textGeo, 1e-4);
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();

        const mesh = new THREE.Mesh(geometry, createMaterial());
        mesh.position.set(spec.x, spec.y, spec.z);
        mesh.rotation.z = spec.rot;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        const box = geometry.boundingBox;
        const hx = Math.max((box.max.x - box.min.x) / 2, 0.05);
        const hy = Math.max((box.max.y - box.min.y) / 2, 0.05);
        const hz = Math.max((box.max.z - box.min.z) / 2, 0.05);

        const initialQuaternion = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(0, 0, spec.rot),
        );

        const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(spec.x, spec.y, spec.z)
          .setRotation({
            x: initialQuaternion.x,
            y: initialQuaternion.y,
            z: initialQuaternion.z,
            w: initialQuaternion.w,
          })
          .setLinearDamping(1.0)
          .setAngularDamping(2.2)
          .setCcdEnabled(true)
          .enabledTranslations(true, true, false)
          .enabledRotations(false, false, true);

        const body = world.createRigidBody(bodyDesc);

        const colliderDesc = RAPIER.ColliderDesc.roundCuboid(
          hx * COLLIDER_FIT,
          hy * COLLIDER_FIT,
          hz,
          COLLIDER_RADIUS,
        )
          .setDensity(0.28)
          .setRestitution(0.32)
          .setFriction(0.22);
        const collider = world.createCollider(colliderDesc, body);

        const item = {
          mesh,
          body,
          collider,
          colliderHalf: { hx, hy, hz },
          colliderScale: 1,
          floatPhase: letters.length * 2.1,
          floatSpeed: 1 + letters.length * 0.14,
          baseHomeQuaternion: initialQuaternion.clone(),
          isDragging: false,
          returning: false,
          baseHomeX: spec.x,
          baseHomeY: spec.y,
          homePosition: new THREE.Vector3(spec.x, spec.y, spec.z),
          homeQuaternion: initialQuaternion.clone(),
          previousDragPoint: new THREE.Vector3(),
          dragVelocity: new THREE.Vector3(),
        };
        mesh.userData.letter = item;
        letters.push(item);
      }

      function computePinTarget() {
        pinTargetY = getViewportBounds().top - PIN_TOP_MARGIN;
      }

      function updateNavToggleHidden(max) {
        const navToggle = document.getElementById("navToggle");
        if (!navToggle) return;
        const footerShown = window.__footerShown === true;
        const isOpen = navToggle.classList.contains("is-open");
        navToggle.classList.toggle(
          "is-hidden",
          !isOpen && (scrollY < max || footerShown),
        );
      }

      function updateScrollProgress() {
        const max = Math.max(heroWrap.offsetHeight - innerHeight, 1);
        const t = Math.min(scrollY / (max * 0.9), 1);
        scrollRise = t * t * (3 - 2 * t);
        sceneRoot.classList.toggle("is-interactive", scrollY < max);
        updateNavToggleHidden(max);
      }

      function screenToWorld(sx, sy, out) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((sx - rect.left) / rect.width) * 2 - 1;
        pointer.y = -(((sy - rect.top) / rect.height) * 2 - 1);
        raycaster.setFromCamera(pointer, camera);
        return raycaster.ray.intersectPlane(footerPlane, out);
      }

      /* El viaje se ancla al FOOTER COMPLETO (no al texto): arranca cuando el
         footer asoma por abajo y completa cuando ya llena la pantalla. Si se
         anclara al span, el descenso entero quedaba comprimido en los últimos
         ~280px de scroll y las letras quedaban "volando a media altura". */
      const footerEl = document.querySelector("footer");
      function updateFooterTarget() {
        if (!footBrand || !letters.length || !footerEl) {
          footerProgress = 0;
          return;
        }
        const rect = footBrand.getBoundingClientRect();
        const footTop = footerEl.getBoundingClientRect().top;
        if (
          scrollY >=
          document.documentElement.scrollHeight - innerHeight - 4
        ) {
          footerProgress = 1;
        } else {
          footerProgress = THREE.MathUtils.clamp(
            (innerHeight - footTop) / (innerHeight * 0.75),
            0,
            1,
          );
        }
        if (footerProgress <= 0.001) return;

        screenToWorld(rect.left, rect.top + rect.height / 2, footerTarget);
        screenToWorld(rect.left, rect.top, footerProbe);
        const yTop = footerProbe.y;
        screenToWorld(rect.left, rect.bottom, footerProbe);
        const rectWorldH = Math.abs(yTop - footerProbe.y);

        const ref = letters[0];
        footerScale =
          (rectWorldH * FOOTER_CAP_RATIO) / (2 * ref.colliderHalf.hy);
        footerSpread = footerScale * FOOTER_SPREAD_RATIO;
        footerOriginX =
          footerTarget.x +
          Math.abs(ref.baseHomeX) * footerSpread +
          ref.colliderHalf.hx * footerScale;
      }

      function applyPinPosition() {
        const t = scrollRiseSmooth;
        const scaleA = 1 + (PIN_SHRINK - 1) * t;
        const spreadA = 1 + (PIN_SPREAD - 1) * t;

        let menuTargetX = 0;
        let menuTargetY = 0;
        if (mobileMenuOpen) {
          const drawerEl = document.getElementById("mobileMenu");
          if (drawerEl) {
            const r = drawerEl.getBoundingClientRect();
            const b = getViewportBounds();
            const vw = renderer.domElement.clientWidth || innerWidth;
            const vh = renderer.domElement.clientHeight || innerHeight;
            menuTargetX = ((r.left + r.width / 2) / vw) * 2 - 1;
            menuTargetX *= b.right;
            menuTargetY = 1 - ((r.top + 66) / vh) * 2;
            menuTargetY *= b.top;
          }
        }

        for (const item of letters) {
          const xA = item.baseHomeX * spreadA;
          const yA = item.baseHomeY + (pinTargetY - item.baseHomeY) * t;

          let x, y, scale, f;
          if (mobileMenuOpen) {
            x = xA + menuTargetX;
            y = menuTargetY;
            scale = scaleA;
            f = 0;
          } else if (footerProgress >= BALLOON_END) {
            x = footerOriginX + item.baseHomeX * footerSpread;
            y = footerTarget.y;
            scale = footerScale;
            f = 1;
          } else if (footerProgress > 0.001) {
            const b = Math.min(footerProgress / BALLOON_END, 1);
            const ease = b * b;
            const bounds = getViewportBounds();
            const flyY =
              bounds.top + item.colliderHalf.hy * scaleA + 1.2;
            y = yA + (flyY - yA) * ease;
            x = xA * (1 + 0.22 * ease);
            scale = scaleA * (1 + 0.1 * ease);
            f = 0;
          } else {
            x = xA;
            y = yA;
            scale = scaleA;
            f = 0;
          }

          if (f > 0) {
            item.homeQuaternion
              .copy(item.baseHomeQuaternion)
              .slerp(IDENTITY_QUAT, f);
          } else {
            item.homeQuaternion.copy(item.baseHomeQuaternion);
          }

          item.homePosition.x = x;
          item.homePosition.y = y;
          item.mesh.scale.setScalar(scale);
          if (Math.abs(scale - item.colliderScale) > 0.02) {
            item.colliderScale = scale;
            const { hx, hy, hz } = item.colliderHalf;
            item.collider.setShape(
              new RAPIER.RoundCuboid(
                hx * COLLIDER_FIT * scale,
                hy * COLLIDER_FIT * scale,
                hz * scale,
                COLLIDER_RADIUS * scale,
              ),
            );
          }
        }
      }

      function getViewportBounds() {
        const distance = camera.position.z;
        const vFov = THREE.MathUtils.degToRad(camera.fov);
        const height = 2 * Math.tan(vFov / 2) * distance;
        const width = height * camera.aspect;
        return {
          left: -width / 2,
          right: width / 2,
          bottom: -height / 2,
          top: height / 2,
        };
      }

      function setupBoundaryWalls() {
        const bounds = getViewportBounds();
        const thickness = 0.5;
        const walls = [
          {
            id: "left",
            x: bounds.left - thickness / 2,
            y: 0,
            hx: thickness / 2,
            hy: Math.abs(bounds.top - bounds.bottom) / 2 + thickness,
          },
          {
            id: "right",
            x: bounds.right + thickness / 2,
            y: 0,
            hx: thickness / 2,
            hy: Math.abs(bounds.top - bounds.bottom) / 2 + thickness,
          },
          {
            id: "top",
            x: 0,
            y: bounds.top + thickness / 2,
            hx: Math.abs(bounds.right - bounds.left) / 2 + thickness,
            hy: thickness / 2,
          },
          {
            id: "bottom",
            x: 0,
            y: bounds.bottom - thickness / 2,
            hx: Math.abs(bounds.right - bounds.left) / 2 + thickness,
            hy: thickness / 2,
          },
        ];
        for (const wall of walls) {
          const body = world.createRigidBody(
            RAPIER.RigidBodyDesc.fixed().setTranslation(wall.x, wall.y, 0),
          );
          const collider = RAPIER.ColliderDesc.cuboid(wall.hx, wall.hy, 10)
            .setRestitution(0.38)
            .setFriction(0.24);
          world.createCollider(collider, body);
          wallBodies[wall.id] = body;
        }
      }

      function updateBoundaryWalls() {
        if (!wallBodies.left) return;
        const bounds = getViewportBounds();
        const thickness = 0.5;
        wallBodies.left.setTranslation(
          { x: bounds.left - thickness / 2, y: 0, z: 0 },
          true,
        );
        wallBodies.right.setTranslation(
          { x: bounds.right + thickness / 2, y: 0, z: 0 },
          true,
        );
        wallBodies.top.setTranslation(
          { x: 0, y: bounds.top + thickness / 2, z: 0 },
          true,
        );
        wallBodies.bottom.setTranslation(
          { x: 0, y: bounds.bottom - thickness / 2, z: 0 },
          true,
        );
      }

      function setupPointerEvents() {
        const canvas = renderer.domElement;
        for (const el of [canvas, pinHit]) {
          el.addEventListener("pointerdown", onPointerDown);
          el.addEventListener("pointermove", onPointerMove);
          el.addEventListener("pointerup", onPointerUp);
          el.addEventListener("pointercancel", onPointerUp);
          el.addEventListener("dblclick", onDoubleClick);
        }
      }

      function updatePointer(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      }

      function pickLetter(event) {
        updatePointer(event);
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(
          letters.map((item) => item.mesh),
          false,
        );
        if (!hits.length) return null;
        return hits[0].object.userData.letter ?? null;
      }

      function onPointerDown(event) {
        const item = pickLetter(event);
        if (!item) return;
        dragged = item;
        item.isDragging = true;
        item.returning = false;
        dragPlane.constant = -item.mesh.position.z;
        raycaster.ray.intersectPlane(dragPlane, dragPoint);
        dragOffset.copy(item.mesh.position).sub(dragPoint);
        item.previousDragPoint.copy(dragPoint);
        item.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        item.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        event.currentTarget.classList.add("dragging");
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }

      function onPointerMove(event) {
        if (!dragged) return;
        updatePointer(event);
        raycaster.setFromCamera(pointer, camera);
        if (!raycaster.ray.intersectPlane(dragPlane, dragPoint)) return;
        const next = dragPoint.clone().add(dragOffset);
        next.z = 0;
        const current = dragged.body.translation();
        const vx = (next.x - current.x) * 22;
        const vy = (next.y - current.y) * 22;
        dragged.body.setLinvel({ x: vx, y: vy, z: 0 }, true);
        dragged.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        dragged.previousDragPoint.copy(next);
      }

      function onPointerUp(event) {
        if (!dragged) return;
        const item = dragged;
        item.isDragging = false;
        item.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        item.returning = true;
        dragged = null;
        event.currentTarget.releasePointerCapture?.(event.pointerId);
        event.currentTarget.classList.remove("dragging");
      }

      function onDoubleClick(event) {
        const item = pickLetter(event);
        if (!item) return;
        item.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        item.returning = true;
      }

      function updateReturningLetters(delta) {
        const SPRING = 8.5,
          RETURN_DAMPING = 2.8,
          MAX_RETURN_SPEED = 3.2;
        const ROTATION_SPRING = 3.5,
          ROTATION_DAMPING = 2.4,
          MAX_ANGULAR_SPEED = 5.0;

        for (const item of letters) {
          if (item.isDragging) continue;

          const current = item.body.translation();
          const dx = item.homePosition.x - current.x;
          const dy = item.homePosition.y - current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const velocity = item.body.linvel();

          let vx =
            velocity.x + (dx * SPRING - velocity.x * RETURN_DAMPING) * delta;
          let vy =
            velocity.y + (dy * SPRING - velocity.y * RETURN_DAMPING) * delta;

          const speed = Math.sqrt(vx * vx + vy * vy);
          const speedCap = Math.max(MAX_RETURN_SPEED, distance * 5.5);
          if (speed > speedCap) {
            const scale = speedCap / speed;
            vx *= scale;
            vy *= scale;
          }
          item.body.setLinvel({ x: vx, y: vy, z: 0 }, true);

          const rotation = item.body.rotation();
          const currentQuaternion = new THREE.Quaternion(
            rotation.x,
            rotation.y,
            rotation.z,
            rotation.w,
          );
          const euler = new THREE.Euler().setFromQuaternion(
            currentQuaternion,
            "XYZ",
          );
          const currentAngle = euler.z;
          const homeEuler = new THREE.Euler().setFromQuaternion(
            item.homeQuaternion,
            "XYZ",
          );
          const homeAngle = homeEuler.z;

          let angleDifference = homeAngle - currentAngle;
          while (angleDifference > Math.PI) angleDifference -= Math.PI * 2;
          while (angleDifference < -Math.PI) angleDifference += Math.PI * 2;

          const angularVelocity = item.body.angvel();
          let angularZ =
            angularVelocity.z +
            (angleDifference * ROTATION_SPRING -
              angularVelocity.z * ROTATION_DAMPING) *
              delta;
          angularZ = THREE.MathUtils.clamp(
            angularZ,
            -MAX_ANGULAR_SPEED,
            MAX_ANGULAR_SPEED,
          );
          item.body.setAngvel({ x: 0, y: 0, z: angularZ }, true);

          if (
            distance < 0.012 &&
            Math.abs(angleDifference) < 0.01 &&
            Math.abs(vx) < 0.08 &&
            Math.abs(vy) < 0.08 &&
            Math.abs(angularZ) < 0.08
          ) {
            item.body.setTranslation(
              {
                x: item.homePosition.x,
                y: item.homePosition.y,
                z: item.homePosition.z,
              },
              true,
            );
            item.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
            item.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
            item.returning = false;
          }
        }
      }

      /* En el footer las letras las manda el scroll, sin resorte de por medio:
         si no, llegan tarde y el texto ya se borró cuando todavía están lejos. */
      function driveFooterLetters() {
        if (footerProgress <= 0.001 || mobileMenuOpen) return;
        for (const item of letters) {
          if (item.isDragging) continue;
          item.body.setTranslation(
            {
              x: item.homePosition.x,
              y: item.homePosition.y,
              z: item.homePosition.z,
            },
            true,
          );
          item.body.setRotation(
            {
              x: item.homeQuaternion.x,
              y: item.homeQuaternion.y,
              z: item.homeQuaternion.z,
              w: item.homeQuaternion.w,
            },
            true,
          );
          item.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
          item.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }
      }

      function syncPhysics() {
        for (const item of letters) {
          const translation = item.body.translation();
          const rotation = item.body.rotation();
          item.mesh.position.set(translation.x, translation.y, translation.z);
          item.mesh.quaternion.set(
            rotation.x,
            rotation.y,
            rotation.z,
            rotation.w,
          );
        }
      }

      function updatePinHit() {
        const pinned =
          scrollRiseSmooth > 0.999 &&
          footerProgress < 0.02 &&
          !mobileMenuOpen;
        if (!letters.length || !pinned) {
          pinHit.classList.remove("active");
          return;
        }
        const probe = new THREE.Vector3();
        const viewportHalfH =
          Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
          camera.position.z;
        const h = renderer.domElement.clientHeight || innerHeight;
        const pad = 12 / h;
        let top = 1,
          bottom = -1;
        for (const item of letters) {
          probe.copy(item.mesh.position).project(camera);
          const halfH =
            (item.colliderHalf.hy * item.colliderScale) / viewportHalfH;
          top = Math.min(top, probe.y - halfH - pad);
          bottom = Math.max(bottom, probe.y + halfH + pad);
        }
        const pxTop = Math.max(((1 - bottom) / 2) * h, 0);
        const pxHeight = Math.max(((1 - top) / 2) * h - pxTop, 0);
        pinHit.style.top = pxTop + "px";
        pinHit.style.height = pxHeight + "px";
        pinHit.classList.add("active");
      }

      function applyFloat(elapsed) {
        const amp = reduceMotion
          ? 0
          : (HERO_FLOAT + (1 - HERO_FLOAT) * scrollRiseSmooth) *
            (1 - footerProgress);
        if (amp < 0.001) return;
        for (const item of letters) {
          const w =
            elapsed * PIN_FLOAT_SPEED * item.floatSpeed + item.floatPhase;
          item.mesh.position.y += Math.sin(w) * PIN_FLOAT_Y * amp;
          item.mesh.position.x += Math.cos(w * 0.73) * PIN_FLOAT_X * amp;
          item.mesh.rotateZ(Math.sin(w * 0.61) * PIN_FLOAT_TILT * amp);
        }
      }

      function applyPinnedTilt() {
        const amp = reduceMotion
          ? 0
          : scrollRiseSmooth * (1 - footerProgress);
        if (amp < 0.001) return;
        const tilt = PIN_TILT_DOWN * amp;
        for (const item of letters) {
          pinTiltEuler.setFromQuaternion(item.mesh.quaternion, "XYZ");
          pinTiltEuler.x += tilt;
          item.mesh.quaternion.setFromEuler(pinTiltEuler);
        }
      }

      function animate() {
        requestAnimationFrame(animate);
        timer.update();
        const delta = Math.min(timer.getDelta(), 0.033);
        scrollRiseSmooth +=
          (scrollRise - scrollRiseSmooth) * Math.min(1, delta * 7);
        updateFooterTarget();
        if (footBrand) {
          footBrand.style.opacity = String(
            Math.max(0, 1 - footerProgress / 0.8),
          );
        }
        applyPinPosition();
        updateReturningLetters(delta);
        world.timestep = delta;
        world.step();
        driveFooterLetters();
        syncPhysics();
        applyFloat(timer.getElapsed());
        applyPinnedTilt();
        updatePinHit();
        renderer.render(scene, camera);
      }

      function onResize() {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        updateBoundaryWalls();
        computePinTarget();
        updateScrollProgress();
      }

      boot();
