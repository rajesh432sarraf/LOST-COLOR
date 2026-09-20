/**
 * intro.js - Film-Grade 3D Cinematic Introduction for "LOST COLOR"
 * 
 * Directs a photorealistic Hollywood-grade opening sequence:
 * - Act I: The Realm of Luminaria (Sweeping high-altitude crane swoop & banking curve over sunlit kingdom)
 * - Act II: The Sacred Trinity (180° orbital dolly with dynamic depth around floating Fire, Water, and Life crystals)
 * - Act III: The Color Thief Strikes (Worm's-eye view into 3D dark vortex cataclysm with violent camera trauma & real-time desaturation shockwave)
 * - Act IV: The Silent Sanctum (Somber eye-level tracking glide through the monochrome ruins with falling cold ash)
 * - Act V: The Royal Guardian (Cinematic hero reveal: spiral Dutch-angle orbit up to an over-the-shoulder gaze past the Soldier)
 * - Act VI: LOST COLOR (Grand crane boom reveal with gilded title card, transitioning directly into the Royal Palace Hub)
 */

class CinematicIntro {
  constructor(scene, camera, player, temple, postProcessing, onComplete) {
    this.scene = scene;
    this.camera = camera;
    this.player = player;
    this.temple = temple;
    this.postProcessing = postProcessing;
    this.onComplete = onComplete;

    this.active = false;
    this.currentSceneIndex = 0;
    this.sceneTimer = 0;
    this.totalTimer = 0;

    this.currentLookAt = new THREE.Vector3(0, 5, 20);
    this.targetLookAt = new THREE.Vector3(0, 5, 20);
    this.cameraTrauma = 0;
    this.cameraRoll = 0;

    // DOM References
    this.container = document.getElementById('intro-overlay');
    this.subtitleTitle = document.getElementById('intro-scene-title');
    this.subtitleText = document.getElementById('intro-subtitle-text');
    this.skipBtn = document.getElementById('btn-skip-intro');
    this.titleScreen = document.getElementById('intro-title-slate');

    // 3D Visual Entities
    this.crystalsGroup = null;
    this.initHolographicCrystals();

    this.colorThiefVortex = null;
    this.initColorThiefVortex();

    this.cinematicMotes = null;
    this.fallingAsh = null;
    this.initAtmosphericParticles();

    // 6 Master Cinematic Acts
    this.scenes = [
      {
        id: 'world_harmony',
        act: 'ACT I',
        name: 'THE REALM OF LUMINARIA',
        text: 'Once, the kingdom of Luminaria flourished in vibrant color and harmony, governed by three sacred primal forces.',
        duration: 7.2,
        curveType: 'crane_bank',
        p0: new THREE.Vector3(32, 28, 86),
        p1: new THREE.Vector3(18, 16, 62),
        p2: new THREE.Vector3(8, 7.5, 46),
        look0: new THREE.Vector3(0, 6.0, 24),
        look1: new THREE.Vector3(0, 4.0, 26),
        setup: () => {
          if (this.postProcessing) this.postProcessing.setWorldSaturation(1.0);
          if (window.soundSystem) window.soundSystem.startIntroMusic();
          if (this.cinematicMotes) this.cinematicMotes.visible = true;
          if (this.fallingAsh) this.fallingAsh.visible = false;
          if (this.colorThiefVortex) this.colorThiefVortex.visible = false;
        }
      },
      {
        id: 'sacred_crystals',
        act: 'ACT II',
        name: 'THE THREE SACRED CRYSTALS',
        text: '🔴 Red granted Passion and Courage, 🔵 Blue brought Serenity and Peace, and 🟢 Green breathed Life into the realm.',
        duration: 7.6,
        curveType: 'crystal_orbit',
        center: new THREE.Vector3(0, 2.4, 23.5),
        setup: () => {
          if (this.postProcessing) this.postProcessing.setWorldSaturation(1.0);
          if (this.crystalsGroup) this.crystalsGroup.visible = true;
          if (window.soundSystem) window.soundSystem.playCrystalVisionChimes();
        },
        teardown: () => {
          if (this.crystalsGroup) this.crystalsGroup.visible = false;
        }
      },
      {
        id: 'color_thief_invasion',
        act: 'ACT III',
        name: 'THE COLOR THIEF STRIKES',
        text: 'A malevolent shadow tore open the heavens — the Color Thief devoured every color in the kingdom and scattered the crystals into peril!',
        duration: 7.0,
        curveType: 'cataclysm_low',
        startPos: new THREE.Vector3(0, 1.4, 48),
        endPos: new THREE.Vector3(0, 2.8, 54),
        look0: new THREE.Vector3(0, 32, 18),
        look1: new THREE.Vector3(0, 36, 15),
        setup: () => {
          if (this.colorThiefVortex) this.colorThiefVortex.visible = true;
          if (window.soundSystem) window.soundSystem.playTheftVortexSound();
          this.cameraTrauma = 0.85;
          document.body.classList.add('screen-rumble');
        },
        update: (progress) => {
          // Dynamic desaturation shockwave with pulsing shudder
          const drain = Math.pow(progress, 1.35) * 1.5;
          const wobble = Math.sin(progress * Math.PI * 8) * (1.0 - progress) * 0.12;
          const sat = Math.max(0.0, 1.0 - drain + wobble);
          if (this.postProcessing) {
            this.postProcessing.setWorldSaturation(sat);
          }
          this.cameraTrauma = Math.max(0.15, (1.0 - progress * 0.5) * 0.8);
        },
        teardown: () => {
          document.body.classList.remove('screen-rumble');
          if (this.colorThiefVortex) this.colorThiefVortex.visible = false;
        }
      },
      {
        id: 'faded_palace',
        act: 'ACT IV',
        name: 'THE SILENT SANCTUM',
        text: 'The Royal Palace was plunged into silence. Velvet runners turned to ash, warm braziers grew cold, and the royal fountains went dry.',
        duration: 6.8,
        curveType: 'somber_track',
        startPos: new THREE.Vector3(0, 2.2, 48),
        endPos: new THREE.Vector3(0, 2.2, 28),
        lookAt: new THREE.Vector3(0, 2.4, 12),
        setup: () => {
          if (this.postProcessing) this.postProcessing.setWorldSaturation(0.0);
          if (this.fallingAsh) this.fallingAsh.visible = true;
          if (this.cinematicMotes) this.cinematicMotes.visible = false;
        }
      },
      {
        id: 'royal_soldier',
        act: 'ACT V',
        name: 'THE ROYAL GUARDIAN',
        text: 'Awakening in the faded throne room, one loyal Soldier takes up the royal decree: explore the 3 realms and recover the lost crystals!',
        duration: 7.2,
        curveType: 'hero_spiral',
        target: new THREE.Vector3(0, 1.45, 46.0),
        setup: () => {
          if (this.postProcessing) this.postProcessing.setWorldSaturation(1.0);
          if (window.soundSystem) window.soundSystem.playHeroTheme();
        }
      },
      {
        id: 'title_reveal',
        act: 'PROLOGUE',
        name: 'LOST COLOR',
        text: 'The Royal Awakening · Enter the Portals · Restore the Kingdom of Color',
        duration: 5.5,
        curveType: 'crane_boom',
        startPos: new THREE.Vector3(0, 2.8, 52),
        endPos: new THREE.Vector3(0, 7.5, 64),
        look0: new THREE.Vector3(0, 2.0, 38),
        look1: new THREE.Vector3(0, 1.8, 30),
        setup: () => {
          if (this.postProcessing) this.postProcessing.setWorldSaturation(1.0);
          if (this.titleScreen) {
            this.titleScreen.classList.add('visible');
          }
        }
      }
    ];

    this.initInputListeners();
  }

  // ==========================================
  // 3D Visual Entity: Holographic Crystals
  // ==========================================
  initHolographicCrystals() {
    this.crystalsGroup = new THREE.Group();
    this.crystalsGroup.position.set(0, 2.4, 23.5);
    this.crystalsGroup.visible = false;

    // 1. Red Fire Crystal (Passion)
    const redCrystal = this.createFloatingCrystal(0xff2244, 0xff3344, -2.4, 0.2, 0);
    // 2. Blue Water Crystal (Peace)
    const blueCrystal = this.createFloatingCrystal(0x00c8ff, 0x38b6ff, 0.0, 0.9, -0.6);
    // 3. Green Life Crystal (Life)
    const greenCrystal = this.createFloatingCrystal(0x38ef7d, 0x11998e, 2.4, 0.2, 0);

    this.crystalsGroup.add(redCrystal, blueCrystal, greenCrystal);
    this.scene.add(this.crystalsGroup);
    this.crystals = [redCrystal, blueCrystal, greenCrystal];
  }

  createFloatingCrystal(colorHex, emissiveHex, x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Faceted octahedral crystal geometry
    const geo = new THREE.OctahedronGeometry(0.65, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: emissiveHex,
      emissiveIntensity: 2.4,
      roughness: 0.1,
      metalness: 0.92,
      transparent: true,
      opacity: 0.95
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(0.95, 1.7, 0.95);
    mesh.castShadow = true;
    group.add(mesh);

    // Inner brilliant core
    const coreGeo = new THREE.OctahedronGeometry(0.36, 0);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.scale.set(0.75, 1.45, 0.75);
    group.add(core);

    // Glowing orbital energy ring
    const ringGeo = new THREE.TorusGeometry(1.02, 0.045, 10, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.2;
    group.add(ring);

    // Sparkling particle halo
    const pCount = 36;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const a = (i / pCount) * Math.PI * 2;
      const r = 0.85 + Math.random() * 0.45;
      pPos[i * 3]     = Math.cos(a) * r;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 1.8;
      pPos[i * 3 + 2] = Math.sin(a) * r;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const sparkles = new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: colorHex,
      size: 0.24,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending
    }));
    group.add(sparkles);

    // Dynamic colored point light illuminating surroundings
    const light = new THREE.PointLight(colorHex, 3.8, 12, 1.4);
    group.add(light);

    group.userData = { mesh, core, ring, sparkles, light, initialY: y };
    return group;
  }

  // ==========================================
  // 3D Visual Entity: Color Thief Dark Vortex
  // ==========================================
  initColorThiefVortex() {
    this.colorThiefVortex = new THREE.Group();
    this.colorThiefVortex.position.set(0, 26, 20);
    this.colorThiefVortex.visible = false;

    // 1. Accretion Disks (Dark void rings)
    this.vortexRings = [];
    const ringColors = [0x2c003e, 0x150024, 0x4a0e4e];
    const ringRadii = [4.2, 7.5, 11.0];

    ringRadii.forEach((r, idx) => {
      const ringGeo = new THREE.TorusGeometry(r, 0.28, 8, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: ringColors[idx],
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2 + (idx * 0.12);
      this.colorThiefVortex.add(ringMesh);
      this.vortexRings.push(ringMesh);
    });

    // 2. Swirling Dark Void Particles
    const pCount = 380;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pSpeeds = [];

    for (let i = 0; i < pCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.0 + Math.random() * 12.0;
      pPos[i * 3]     = Math.cos(angle) * radius;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 4.0;
      pPos[i * 3 + 2] = Math.sin(angle) * radius;
      pSpeeds.push({ angle, radius, speed: 1.2 + Math.random() * 2.5, ySpeed: (Math.random() - 0.5) * 0.8 });
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xaa22ee,
      size: 0.35,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.vortexParticles = new THREE.Points(pGeo, pMat);
    this.vortexParticles.userData = { speeds: pSpeeds };
    this.colorThiefVortex.add(this.vortexParticles);

    // 3. Void Center Light
    this.vortexLight = new THREE.PointLight(0x8822ff, 5.0, 35);
    this.colorThiefVortex.add(this.vortexLight);

    this.scene.add(this.colorThiefVortex);
  }

  // ==========================================
  // Atmospheric Particles: Motes & Falling Ash
  // ==========================================
  initAtmosphericParticles() {
    // 1. Warm Golden Firefly Motes (Acts I-II)
    const mCount = 240;
    const mGeo = new THREE.BufferGeometry();
    const mPos = new Float32Array(mCount * 3);
    for (let i = 0; i < mCount; i++) {
      mPos[i * 3]     = (Math.random() - 0.5) * 60;
      mPos[i * 3 + 1] = 1.0 + Math.random() * 20.0;
      mPos[i * 3 + 2] = 10 + Math.random() * 70;
    }
    mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
    this.cinematicMotes = new THREE.Points(mGeo, new THREE.PointsMaterial({
      color: 0xffdf88,
      size: 0.24,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    }));
    this.scene.add(this.cinematicMotes);

    // 2. Somber Falling Gray Ash (Acts IV-V)
    const aCount = 280;
    const aGeo = new THREE.BufferGeometry();
    const aPos = new Float32Array(aCount * 3);
    for (let i = 0; i < aCount; i++) {
      aPos[i * 3]     = (Math.random() - 0.5) * 45;
      aPos[i * 3 + 1] = Math.random() * 18.0;
      aPos[i * 3 + 2] = 15 + Math.random() * 55;
    }
    aGeo.setAttribute('position', new THREE.BufferAttribute(aPos, 3));
    this.fallingAsh = new THREE.Points(aGeo, new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 0.22,
      transparent: true,
      opacity: 0.55
    }));
    this.fallingAsh.visible = false;
    this.scene.add(this.fallingAsh);
  }

  initInputListeners() {
    if (this.skipBtn) {
      this.skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.skip();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (!this.active) return;
      if (e.code === 'Space' || e.code === 'Escape' || e.code === 'Enter') {
        e.preventDefault();
        this.skip();
      }
    });

    if (this.container) {
      this.container.addEventListener('click', () => {
        if (this.currentSceneIndex >= this.scenes.length - 1) {
          this.finish();
        }
      });
    }
  }

  start() {
    this.active = true;
    this.currentSceneIndex = 0;
    this.sceneTimer = 0;
    this.totalTimer = 0;

    if (this.postProcessing) {
      this.postProcessing.setWorldSaturation(1.0);
    }

    document.body.classList.add('cinematic-active');
    if (this.container) {
      this.container.classList.add('visible');
    }
    if (this.titleScreen) {
      this.titleScreen.classList.remove('visible');
    }

    if (this.player) {
      this.player.cutsceneActive = true;
    }

    this.loadScene(0);
  }

  loadScene(index) {
    if (index >= this.scenes.length) {
      this.finish();
      return;
    }

    this.currentSceneIndex = index;
    this.sceneTimer = 0;
    const scene = this.scenes[index];

    // Subtitles Update
    if (this.subtitleTitle && this.subtitleText) {
      this.subtitleTitle.textContent = `${scene.act || ''} · ${scene.name}`;
      this.subtitleText.textContent = scene.text;

      const box = document.getElementById('intro-subtitle-box');
      if (box) {
        box.classList.remove('fade-in');
        void box.offsetWidth;
        box.classList.add('fade-in');
      }
    }

    if (scene.setup) scene.setup();
  }

  // ==========================================
  // Cinematic Choreography & Curved Camera Paths
  // ==========================================
  update(delta) {
    if (!this.active) return;

    this.sceneTimer += delta;
    this.totalTimer += delta;
    const current = this.scenes[this.currentSceneIndex];
    const progress = Math.min(1.0, this.sceneTimer / current.duration);
    const ease = this.easeInOutCubic(progress);

    let camPos = new THREE.Vector3();
    let lookTarget = new THREE.Vector3();
    let roll = 0;

    switch (current.curveType) {
      // Act I: Crane Swoop & Bank
      case 'crane_bank': {
        camPos = this.bezierQuadratic(current.p0, current.p1, current.p2, ease);
        lookTarget.lerpVectors(current.look0, current.look1, ease);
        // Realistic camera banking (Dutch angle) during the arc turn
        roll = Math.sin(progress * Math.PI) * 0.045;
        break;
      }

      // Act II: 180° Orbital Dolly with Zoom Depth
      case 'crystal_orbit': {
        const angle = -1.1 + ease * 2.2;
        const radius = 4.2 - Math.sin(progress * Math.PI) * 0.65;
        camPos.set(
          current.center.x + Math.sin(angle) * radius,
          1.85 + ease * 1.35,
          current.center.z + Math.cos(angle) * radius
        );
        lookTarget.copy(current.center);
        roll = Math.sin(progress * Math.PI * 2) * 0.015;
        break;
      }

      // Act III: Worm's-Eye Cataclysm View looking into the vortex
      case 'cataclysm_low': {
        camPos.lerpVectors(current.startPos, current.endPos, ease);
        lookTarget.lerpVectors(current.look0, current.look1, ease);
        break;
      }

      // Act IV: Somber Eye-Level Central Aisle Tracking Shot
      case 'somber_track': {
        camPos.lerpVectors(current.startPos, current.endPos, ease);
        lookTarget.copy(current.lookAt);
        break;
      }

      // Act V: Hero Awakening Dutch Orbit to Over-the-Shoulder
      case 'hero_spiral': {
        const spiralAngle = -1.4 + ease * 2.4;
        const dist = 3.6 - Math.sin(progress * Math.PI) * 0.8;
        camPos.set(
          current.target.x + Math.sin(spiralAngle) * dist,
          0.9 + ease * 1.1,
          current.target.z - Math.cos(spiralAngle) * dist
        );
        lookTarget.lerpVectors(
          new THREE.Vector3(current.target.x, current.target.y + 0.1, current.target.z),
          new THREE.Vector3(0, 1.8, 28),
          Math.max(0, (progress - 0.6) * 2.5)
        );
        roll = -Math.sin(progress * Math.PI) * 0.035;
        break;
      }

      // Act VI: Grand Crane Pull-back Reveal
      case 'crane_boom': {
        camPos.lerpVectors(current.startPos, current.endPos, ease);
        lookTarget.lerpVectors(current.look0, current.look1, ease);
        break;
      }

      default: {
        camPos.lerpVectors(current.camStart, current.camEnd, ease);
        lookTarget.lerpVectors(current.lookStart, current.lookEnd, ease);
      }
    }

    // Add subtle organic handheld steadicam breathing noise
    const noise = this.getHandheldSteadicamNoise(this.totalTimer);
    camPos.add(noise);

    // Add camera trauma jitter during violent events (Act III Cataclysm)
    if (this.cameraTrauma > 0.01) {
      const shakeAmt = this.cameraTrauma * this.cameraTrauma * 0.65;
      camPos.x += (Math.random() - 0.5) * shakeAmt;
      camPos.y += (Math.random() - 0.5) * shakeAmt;
      camPos.z += (Math.random() - 0.5) * shakeAmt;
    }

    this.camera.position.copy(camPos);
    this.currentLookAt.copy(lookTarget);
    this.camera.lookAt(this.currentLookAt);

    // Apply Dutch roll
    if (Math.abs(roll) > 0.001) {
      this.camera.rotation.z += roll;
    }

    // Custom Scene Update Hook
    if (current.update) {
      current.update(progress);
    }

    // 1. Animate Holographic Crystals
    if (this.crystalsGroup && this.crystalsGroup.visible && this.crystals) {
      this.crystals.forEach((c, idx) => {
        c.userData.mesh.rotation.y += delta * (1.6 + idx * 0.45);
        c.userData.mesh.rotation.x = Math.sin(this.totalTimer * 2.2 + idx) * 0.2;
        c.userData.core.rotation.y -= delta * 2.2;
        c.userData.ring.rotation.z += delta * 2.4;
        c.userData.sparkles.rotation.y += delta * 1.3;
        c.position.y = c.userData.initialY + Math.sin(this.totalTimer * 2.8 + idx * 1.4) * 0.09;
        c.userData.light.intensity = 3.4 + Math.sin(this.totalTimer * 4.0 + idx) * 0.8;
      });
    }

    // 2. Animate Color Thief Dark Vortex in Act III
    if (this.colorThiefVortex && this.colorThiefVortex.visible) {
      if (this.vortexRings) {
        this.vortexRings.forEach((r, idx) => {
          r.rotation.z += delta * (2.8 - idx * 0.9);
          r.rotation.x = Math.PI / 2 + Math.sin(this.totalTimer * 3.0 + idx) * 0.15;
        });
      }
      if (this.vortexParticles && this.vortexParticles.geometry) {
        const pos = this.vortexParticles.geometry.attributes.position.array;
        const speeds = this.vortexParticles.userData.speeds;
        for (let i = 0; i < speeds.length; i++) {
          const s = speeds[i];
          s.angle += delta * s.speed;
          s.radius -= delta * 1.5;
          if (s.radius < 0.8) s.radius = 11.5;
          pos[i * 3]     = Math.cos(s.angle) * s.radius;
          pos[i * 3 + 1] = Math.sin(s.angle * 2.0) * 1.8;
          pos[i * 3 + 2] = Math.sin(s.angle) * s.radius;
        }
        this.vortexParticles.geometry.attributes.position.needsUpdate = true;
      }
      if (this.vortexLight) {
        this.vortexLight.intensity = 4.0 + Math.sin(this.totalTimer * 16) * 2.5;
      }
    }

    // 3. Animate Golden Motes
    if (this.cinematicMotes && this.cinematicMotes.visible && this.cinematicMotes.geometry) {
      const pos = this.cinematicMotes.geometry.attributes.position.array;
      const count = pos.length / 3;
      for (let i = 0; i < count; i++) {
        pos[i * 3 + 1] += Math.sin(this.totalTimer * 1.5 + i) * 0.008;
      }
      this.cinematicMotes.geometry.attributes.position.needsUpdate = true;
    }

    // 4. Animate Falling Cold Ash (Acts IV-V)
    if (this.fallingAsh && this.fallingAsh.visible && this.fallingAsh.geometry) {
      const pos = this.fallingAsh.geometry.attributes.position.array;
      const count = pos.length / 3;
      for (let i = 0; i < count; i++) {
        pos[i * 3 + 1] -= delta * 1.4;
        pos[i * 3]     += Math.sin(this.totalTimer + i) * 0.015;
        if (pos[i * 3 + 1] < 0.2) {
          pos[i * 3 + 1] = 16.0;
        }
      }
      this.fallingAsh.geometry.attributes.position.needsUpdate = true;
    }

    // Advance to next scene
    if (this.sceneTimer >= current.duration) {
      if (current.teardown) current.teardown();
      this.loadScene(this.currentSceneIndex + 1);
    }
  }

  // ==========================================
  // Mathematics & Interpolation Helpers
  // ==========================================
  bezierQuadratic(p0, p1, p2, t) {
    const inv = 1 - t;
    return new THREE.Vector3(
      inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x,
      inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y,
      inv * inv * p0.z + 2 * inv * t * p1.z + t * t * p2.z
    );
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  getHandheldSteadicamNoise(t) {
    return new THREE.Vector3(
      Math.sin(t * 1.6) * 0.045 + Math.sin(t * 3.2) * 0.02,
      Math.cos(t * 1.3) * 0.035 + Math.cos(t * 2.7) * 0.015,
      Math.sin(t * 2.1) * 0.025
    );
  }

  skip() {
    if (!this.active) return;
    this.finish();
  }

  finish() {
    this.active = false;
    document.body.classList.remove('screen-rumble');

    if (this.scenes[this.currentSceneIndex] && this.scenes[this.currentSceneIndex].teardown) {
      this.scenes[this.currentSceneIndex].teardown();
    }
    if (this.crystalsGroup) {
      this.crystalsGroup.visible = false;
    }
    if (this.colorThiefVortex) {
      this.colorThiefVortex.visible = false;
    }
    if (this.cinematicMotes) {
      this.cinematicMotes.visible = false;
    }
    if (this.fallingAsh) {
      this.fallingAsh.visible = false;
    }

    if (this.postProcessing) {
      this.postProcessing.setWorldSaturation(1.0);
    }

    if (window.soundSystem) {
      window.soundSystem.stopIntroMusic();
    }

    if (this.container) {
      this.container.classList.remove('visible');
    }
    if (this.titleScreen) {
      this.titleScreen.classList.remove('visible');
    }
    document.body.classList.remove('cinematic-active');

    if (this.player) {
      this.player.cutsceneActive = false;
      this.player.position.set(0, 0.0, 16);
      this.player.cameraYaw = Math.PI;
      this.player.cameraPitch = 0.16;
      this.player.root.position.copy(this.player.position);
    }

    if (this.onComplete) {
      this.onComplete();
    }
  }
}

window.CinematicIntro = CinematicIntro;
