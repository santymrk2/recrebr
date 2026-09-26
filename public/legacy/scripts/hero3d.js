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
      const heroPin = document.querySelector(".hero-pin");
      const errorBox = document.querySelector("#error");

      let scene, camera, renderer, world;
      const letters = [];
      let dragged = null;

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const dragPoint = new THREE.Vector3();
      const dragOffset = new THREE.Vector3();
      const dragTarget = new THREE.Vector3();
      const timer = new THREE.Timer();
      const wallBodies = {};

      /* Paso fijo de física + interpolación al render ("Fix Your Timestep"):
         con world.timestep = delta del frame, cada paso duraba distinto (60/120
         Hz, frames perdidos) y las letras avanzaban a saltos irregulares. */
      const STEP = 1 / 120;
      const MAX_STEPS = 8;
      let accumulator = 0;
      // El drag sigue al puntero con un filtro exponencial por paso, no con la
      // velocidad del último pointermove (que se quedaba pegada si en un frame
      // no llegaba evento y la letra se pasaba de largo).
      const DRAG_RESPONSE = 32;
      const DRAG_MAX_SPEED = 45;
      const RELEASE_KEEP = 0.55;
      const RELEASE_MAX_SPEED = 5;
      let menuWasOpen = false;
      const tmpQuat = new THREE.Quaternion();
      const tmpEuler = new THREE.Euler();
      const tmpPos = new THREE.Vector3();

      const heroWrap = document.getElementById("hero-wrap");
      const PIN_TOP_MARGIN = 0.5;
      const PIN_TOP_MARGIN_COARSE = 1.15;
      const PIN_SHRINK = 0.5;
      const PIN_SPREAD = 0.42;
      const PIN_FLOAT_Y = 0.034;
      const PIN_FLOAT_X = 0.011;
      const PIN_FLOAT_TILT = 0.008;
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
      // En táctil la banda de drag se agranda y las letras parkadas bajan
      // para caer en zona de dedo (y no bajo la barra del navegador).
      const coarsePointer = matchMedia("(hover: none)").matches;

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
          world.timestep = STEP;
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
          text: spec.text,
          colliderHalf: { hx, hy, hz },
          colliderScale: 1,
          floatPhase: letters.length * 2.1,
          floatSpeed: 1 + letters.length * 0.14,
          baseHomeQuaternion: initialQuaternion.clone(),
          isDragging: false,
          returning: false,
          // true mientras el scroll del footer maneja la letra (sin física).
          scripted: false,
          // Peso del flotado: baja a 0 al agarrarla para que no "nade" bajo el dedo.
          floatMix: 1,
          baseHomeX: spec.x,
          baseHomeY: spec.y,
          homePosition: new THREE.Vector3(spec.x, spec.y, spec.z),
          homeQuaternion: initialQuaternion.clone(),
          lastHome: new THREE.Vector3(spec.x, spec.y, spec.z),
          prevPos: new THREE.Vector3(spec.x, spec.y, spec.z),
          prevQuat: initialQuaternion.clone(),
        };
        mesh.userData.letter = item;
        letters.push(item);
      }

      function computePinTarget() {
        // En móvil las letras se parkean más abajo: arriba quedan debajo de
        // la barra del navegador y no se pueden tocar.
        pinTargetY =
          getViewportBounds().top -
          (coarsePointer ? PIN_TOP_MARGIN_COARSE : PIN_TOP_MARGIN);
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

        screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2, footerTarget);
        screenToWorld(rect.left, rect.top, footerProbe);
        const yTop = footerProbe.y;
        screenToWorld(rect.left, rect.bottom, footerProbe);
        const rectWorldH = Math.abs(yTop - footerProbe.y);

        const ref = letters[0];
        footerScale =
          (rectWorldH * FOOTER_CAP_RATIO) / (2 * ref.colliderHalf.hy);
        footerSpread = footerScale * FOOTER_SPREAD_RATIO;

        /* El borde izquierdo de la B va alineado con el texto del footer
           ("Experiencias..."). Antes se centraba el trio y encima se restaba
           media B, así que la B quedaba corrida a la izquierda del párrafo.
           El borde se mide en el plano de la CARA FRONTAL de la letra: con
           perspectiva, esa cara (z > 0) se proyecta más afuera que el plano
           z = 0 y la B se veía ~10px más a la izquierda de lo calculado. */
        footerPlane.constant = -ref.colliderHalf.hz * footerScale;
        screenToWorld(rect.left, rect.top + rect.height / 2, footerProbe);
        footerPlane.constant = 0;
        footerOriginX =
          footerProbe.x +
          ref.colliderHalf.hx * footerScale -
          ref.baseHomeX * footerSpread;
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
              bounds.top + item.colliderHalf.hy * scaleA + 0.45;
            y = yA + (flyY - yA) * ease;
            x = xA * (1 + 0.09 * ease);
            scale = scaleA * (1 + 0.04 * ease);
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
        // El offset se toma del cuerpo físico, no del mesh: el mesh lleva el
        // flotado encima y la letra pegaba un saltito de unos px al agarrarla.
        const t = item.body.translation();
        dragPlane.constant = -t.z;
        raycaster.ray.intersectPlane(dragPlane, dragPoint);
        dragOffset.set(t.x - dragPoint.x, t.y - dragPoint.y, 0);
        dragTarget.set(t.x, t.y, 0);
        item.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        item.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        // Aviso real de "agarraron una letra" (no de cualquier toque): lo usa
        // la nubecita "Moveme" para esconderse.
        document.dispatchEvent(
          new CustomEvent("br:lettersgrab", { detail: { text: item.text } }),
        );
        event.currentTarget.classList.add("dragging");
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }

      function onPointerMove(event) {
        if (!dragged) return;
        updatePointer(event);
        raycaster.setFromCamera(pointer, camera);
        if (!raycaster.ray.intersectPlane(dragPlane, dragPoint)) return;
        // Solo se guarda el objetivo: la velocidad se calcula en cada paso de
        // física (applyDragVelocity), llegue o no un evento en ese frame.
        dragTarget.set(dragPoint.x + dragOffset.x, dragPoint.y + dragOffset.y, 0);
      }

      function applyDragVelocity(dt) {
        if (!dragged) return;
        const current = dragged.body.translation();
        // Filtro exponencial independiente del framerate: en cada paso recorre
        // la misma fracción del camino al puntero, sea 60 o 120 Hz.
        const gain = (1 - Math.exp(-DRAG_RESPONSE * dt)) / dt;
        let vx = (dragTarget.x - current.x) * gain;
        let vy = (dragTarget.y - current.y) * gain;
        const speed = Math.hypot(vx, vy);
        if (speed > DRAG_MAX_SPEED) {
          vx *= DRAG_MAX_SPEED / speed;
          vy *= DRAG_MAX_SPEED / speed;
        }
        dragged.body.setLinvel({ x: vx, y: vy, z: 0 }, true);
        dragged.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }

      function onPointerUp(event) {
        if (!dragged) return;
        const item = dragged;
        item.isDragging = false;
        /* Al soltar se conserva parte de la inercia: frenarla en seco a 0 y
           que después el resorte la arranque era el "tirón" al soltar. */
        const v = item.body.linvel();
        const keep = Math.min(
          RELEASE_KEEP,
          RELEASE_MAX_SPEED / Math.max(Math.hypot(v.x, v.y), 1e-6),
        );
        item.body.setLinvel({ x: v.x * keep, y: v.y * keep, z: 0 }, true);
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

      /* Resorte de retorno. Antes había tres atajos que se veían como saltos:
         - teletransporte a casa si la letra estaba a más de 2.4 (si la
           arrastrabas lejos y soltabas, desaparecía y aparecía en su lugar);
         - un "drenaje" de velocidad que se activaba de golpe a 0.3 de casa
           (frenazo visible en el último tramo);
         - un tope duro de velocidad que la cortaba en un solo paso.
         Ahora: resorte críticamente amortiguado más rígido (w = 5 rad/s, llega
         en ~1s sin rebote) y un tope suave que solo actúa en tiros violentos.
         El seguimiento del scroll ya no depende del resorte (carryWithHome),
         así que no hace falta "clavar" la letra cerca de casa. */
      function updateReturningLetters(dt) {
        const SPRING = 25,
          RETURN_DAMPING = 10,
          MAX_RETURN_SPEED = 3.2;
        const ROTATION_SPRING = 16,
          ROTATION_DAMPING = 8,
          MAX_ANGULAR_SPEED = 5.0;

        for (const item of letters) {
          if (item.isDragging || item.scripted) continue;

          const current = item.body.translation();
          const dx = item.homePosition.x - current.x;
          const dy = item.homePosition.y - current.y;
          const distance = Math.hypot(dx, dy);
          const velocity = item.body.linvel();

          let vx = velocity.x + (dx * SPRING - velocity.x * RETURN_DAMPING) * dt;
          let vy = velocity.y + (dy * SPRING - velocity.y * RETURN_DAMPING) * dt;

          const speed = Math.hypot(vx, vy);
          const speedCap = Math.max(MAX_RETURN_SPEED, distance * 5.5);
          if (speed > speedCap) {
            // Se acerca al tope de a poco en vez de recortarlo en un paso.
            const k = 1 - (1 - speedCap / speed) * Math.min(1, dt * 12);
            vx *= k;
            vy *= k;
          }
          item.body.setLinvel({ x: vx, y: vy, z: 0 }, true);

          const rotation = item.body.rotation();
          tmpQuat.set(rotation.x, rotation.y, rotation.z, rotation.w);
          const currentAngle = tmpEuler.setFromQuaternion(tmpQuat, "XYZ").z;
          const homeAngle = tmpEuler.setFromQuaternion(item.homeQuaternion, "XYZ").z;

          let angleDifference = homeAngle - currentAngle;
          while (angleDifference > Math.PI) angleDifference -= Math.PI * 2;
          while (angleDifference < -Math.PI) angleDifference += Math.PI * 2;

          const angularVelocity = item.body.angvel();
          let angularZ =
            angularVelocity.z +
            (angleDifference * ROTATION_SPRING -
              angularVelocity.z * ROTATION_DAMPING) *
              dt;
          angularZ = THREE.MathUtils.clamp(
            angularZ,
            -MAX_ANGULAR_SPEED,
            MAX_ANGULAR_SPEED,
          );
          item.body.setAngvel({ x: 0, y: 0, z: angularZ }, true);

          // Asentado final sub-píxel (~1px): corta la simulación residual.
          if (
            distance < 0.006 &&
            Math.abs(angleDifference) < 0.004 &&
            Math.hypot(vx, vy) < 0.05 &&
            Math.abs(angularZ) < 0.05
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

      /* Mueve el cuerpo a una pose sin interpolar: el render no dibuja un
         "barrido" desde la posición anterior. */
      function placeBody(item, pos, quat) {
        item.body.setTranslation({ x: pos.x, y: pos.y, z: pos.z }, true);
        item.body.setRotation(
          { x: quat.x, y: quat.y, z: quat.z, w: quat.w },
          true,
        );
        item.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        item.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        item.prevPos.copy(pos);
        item.prevQuat.copy(quat);
      }

      /* Cuando el "casa" de la letra se mueve con el scroll (el pin sube al
         tope), la letra se mueve EXACTAMENTE lo mismo. Antes lo hacía el
         resorte, que llega tarde, y para taparlo se la clavaba a casa cuando
         estaba a menos de 0.14 (~20px): ese clavado era un salto visible al
         soltar una letra, y peleaba con las colisiones cuando arrastrabas una
         contra otra. Así el resorte solo corrige lo que movió el usuario.
         Con el menú móvil no se arrastra: el vuelo al drawer lo anima el resorte. */
      function carryWithHome() {
        const menuToggled = mobileMenuOpen !== menuWasOpen;
        menuWasOpen = mobileMenuOpen;
        for (const item of letters) {
          const dx = item.homePosition.x - item.lastHome.x;
          const dy = item.homePosition.y - item.lastHome.y;
          item.lastHome.copy(item.homePosition);
          if (item.isDragging || item.scripted) continue;
          if (mobileMenuOpen || menuToggled) continue;
          if (dx === 0 && dy === 0) continue;
          const t = item.body.translation();
          item.body.setTranslation({ x: t.x + dx, y: t.y + dy, z: t.z }, true);
          item.prevPos.x += dx;
          item.prevPos.y += dy;
        }
      }

      /* En el footer las letras las manda el scroll, sin resorte de por medio:
         si no, llegan tarde y el texto ya se borró cuando todavía están lejos.
         Al volver al hero, una letra que venía guiada por el scroll se deja
         directo en su casa (el trayecto también lo definía el scroll); una
         que tiró el usuario vuelve siempre con el resorte, nunca teletransportada. */
      function driveFooterLetters() {
        if (mobileMenuOpen) return;
        const scripted = footerProgress > 0.001;
        for (const item of letters) {
          if (item.isDragging) continue;
          if (!scripted) {
            if (item.scripted) {
              item.scripted = false;
              placeBody(item, item.homePosition, item.homeQuaternion);
            }
            continue;
          }
          item.scripted = true;
          placeBody(item, item.homePosition, item.homeQuaternion);
        }
      }

      function capturePrevious() {
        for (const item of letters) {
          const t = item.body.translation();
          const r = item.body.rotation();
          item.prevPos.set(t.x, t.y, t.z);
          item.prevQuat.set(r.x, r.y, r.z, r.w);
        }
      }

      // Interpola entre el paso anterior y el actual según lo que sobró del
      // acumulador: movimiento continuo aunque el monitor no vaya a 120 Hz.
      function syncPhysics(alpha) {
        for (const item of letters) {
          const translation = item.body.translation();
          const rotation = item.body.rotation();
          tmpPos.set(translation.x, translation.y, translation.z);
          tmpQuat.set(rotation.x, rotation.y, rotation.z, rotation.w);
          item.mesh.position.lerpVectors(item.prevPos, tmpPos, alpha);
          item.mesh.quaternion.slerpQuaternions(item.prevQuat, tmpQuat, alpha);
        }
      }

      function updatePinHit() {
        const viewportHalfH =
          Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
          camera.position.z;
        const viewportHalfW = viewportHalfH * camera.aspect;
        const w = renderer.domElement.clientWidth || innerWidth;
        const h = renderer.domElement.clientHeight || innerHeight;
        // El margen se normaliza por eje: compartido, en un viewport angosto
        // el horizontal quedaba en la mitad de píxeles.
        const padY = (coarsePointer ? 18 : 12) / h;
        const padX = (coarsePointer ? 18 : 12) / w;
        // El ancla de la nubecita se actualiza siempre: al inicio de la
        // página el hero todavía no cuenta como "pinned".
        if (letters.length) updateThinkAnchor(viewportHalfH, padY, h);
        // La banda se queda apagada en el footer y con el menú abierto: es
        // touch-action: none, así que taparla bloquearía el scroll de esa zona.
        if (!letters.length || footerProgress >= 0.02 || mobileMenuOpen) {
          pinHit.classList.remove("active");
          return;
        }
        const probe = new THREE.Vector3();
        let top = 1,
          bottom = -1,
          left = 1,
          right = -1;
        for (const item of letters) {
          probe.copy(item.mesh.position).project(camera);
          const halfH = (item.colliderHalf.hy * item.colliderScale) / viewportHalfH;
          const halfW = (item.colliderHalf.hx * item.colliderScale) / viewportHalfW;
          top = Math.min(top, probe.y - halfH - padY);
          bottom = Math.max(bottom, probe.y + halfH + padY);
          left = Math.min(left, probe.x - halfW - padX);
          right = Math.max(right, probe.x + halfW + padX);
        }
        const pxTop = Math.max(((1 - bottom) / 2) * h, 0);
        const pxHeight = Math.max(((1 - top) / 2) * h - pxTop, 0);
        const pxLeft = Math.max(((left + 1) / 2) * w, 0);
        const pxRight = ((right + 1) / 2) * w;
        pinHit.style.top = pxTop + "px";
        pinHit.style.height = pxHeight + "px";
        // Caja angosta sobre las letras: afuera de ella el scroll funciona
        // siempre, adentro la letra se agarra en 2D.
        pinHit.style.left = pxLeft + "px";
        pinHit.style.width = Math.max(pxRight - pxLeft, 0) + "px";
        pinHit.classList.add("active");
      }

      // La nubecita "Moveme" se ancla sobre la letra R: le pasamos su
      // posición en pantalla para que siga a la letra si se mueve sola.
      function updateThinkAnchor(viewportHalfH, pad, h) {
        if (!heroPin) return;
        const rLetter = letters.find((item) => item.text === "R");
        if (!rLetter) return;
        const probe = new THREE.Vector3()
          .copy(rLetter.mesh.position)
          .project(camera);
        const halfH = (rLetter.colliderHalf.hy * rLetter.colliderScale) / viewportHalfH;
        const w = renderer.domElement.clientWidth || innerWidth;
        heroPin.style.setProperty(
          "--r-x",
          (((probe.x + 1) / 2) * w).toFixed(1) + "px",
        );
        heroPin.style.setProperty(
          "--r-top",
          (((1 - (probe.y + halfH + pad)) / 2) * h).toFixed(1) + "px",
        );
      }

      function applyFloat(elapsed, dt) {
        // El flotado nunca llega a 0 en el footer: las letras quedan vivas
        // pero sin movimiento notorio.
        const amp = reduceMotion
          ? 0
          : (HERO_FLOAT + (1 - HERO_FLOAT) * scrollRiseSmooth) *
            (1 - footerProgress * 0.82);
        const ease = Math.min(1, dt * 4);
        for (const item of letters) {
          // La letra agarrada deja de flotar de a poco (y retoma al soltarla):
          // si no, se mecía unos px respecto del dedo durante todo el drag.
          item.floatMix += ((item.isDragging ? 0 : 1) - item.floatMix) * ease;
          const a = amp * item.floatMix;
          if (a < 0.001) continue;
          const w =
            elapsed * PIN_FLOAT_SPEED * item.floatSpeed + item.floatPhase;
          item.mesh.position.y += Math.sin(w) * PIN_FLOAT_Y * a;
          item.mesh.position.x += Math.cos(w * 0.73) * PIN_FLOAT_X * a;
          item.mesh.rotateZ(Math.sin(w * 0.61) * PIN_FLOAT_TILT * a);
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
        const delta = Math.min(timer.getDelta(), 0.1);
        scrollRiseSmooth +=
          (scrollRise - scrollRiseSmooth) * Math.min(1, delta * 7);
        updateFooterTarget();
        applyPinPosition();
        carryWithHome();

        accumulator += delta;
        let steps = 0;
        while (accumulator >= STEP && steps < MAX_STEPS) {
          capturePrevious();
          applyDragVelocity(STEP);
          updateReturningLetters(STEP);
          world.step();
          accumulator -= STEP;
          steps++;
        }
        // Si el frame vino muy atrasado (pestaña oculta, GC) se descarta el
        // resto en vez de encadenar pasos y entrar en espiral.
        if (accumulator >= STEP) accumulator = 0;

        driveFooterLetters();
        syncPhysics(accumulator / STEP);
        applyFloat(timer.getElapsed(), delta);
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
