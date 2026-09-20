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

    // Persistent scratch vectors for zero-allocation cinematic camera updates
    this._scratchCamPos = new THREE.Vector3();
    this._scratchLookTarget = new THREE.Vector3();
    this._scratchV1 = new THREE.Vector3();
    this._scratchV2 = new THREE.Vector3();
    this._scratchLookB = new THREE.Vector3(0, 1.8, 20);

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
        },
        update: (progress) => {
          // Dynamic smooth desaturation shockwave
          const drain = Math.pow(progress, 1.3) * 1.5;
          const sat = Math.max(0.0, 1.0 - drain);
          if (this.postProcessing) {
            this.postProcessing.setWorldSaturation(sat);
          }
        },
        teardown: () => {
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
          if (this.player) {
            this.player.position.set(0, 0, 46);
            this.player.root.position.set(0, 0, 46);
            this.player.characterMesh.rotation.y = Math.PI;
            this.player.root.visible = true;
          }
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

    // Glowing dual orbital energy rings (smooth celestial gyroscopes)
    const ringGeo = new THREE.TorusGeometry(1.02, 0.038, 12, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.2;
    group.add(ring);

    const ring2Geo = new THREE.TorusGeometry(1.15, 0.030, 12, 48);
    const ring2 = new THREE.Mesh(ring2Geo, ringMat);
    ring2.rotation.y = Math.PI / 3.0;
    ring2.rotation.z = Math.PI / 4.0;
    group.add(ring2);

    // Dynamic colored point light illuminating surroundings
    const light = new THREE.PointLight(colorHex, 3.8, 12, 1.4);
    group.add(light);

    group.userData = { mesh, core, ring, ring2, light, initialY: y };
    return group;
  }

  // ==========================================
  // 3D Visual Entity: Color Thief Dark Vortex
  // ==========================================
  initColorThiefVortex() {
    this.colorThiefVortex = new THREE.Group();
    this.colorThiefVortex.position.set(0, 26, 20);
    this.colorThiefVortex.visible = false;

    // Accretion Disks (Dark void concentric energy rings)
    this.vortexRings = [];
    const ringColors = [0x2c003e, 0x150024, 0x4a0e4e, 0x220033, 0x5a1262];
    const ringRadii = [3.5, 5.8, 8.2, 10.5, 13.0];

    ringRadii.forEach((r, idx) => {
      const ringGeo = new THREE.TorusGeometry(r, 0.28, 8, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: ringColors[idx % ringColors.length],
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2 + (idx * 0.14);
      this.colorThiefVortex.add(ringMesh);
      this.vortexRings.push(ringMesh);
    });

    // Void Center Light
    this.vortexLight = new THREE.PointLight(0x8822ff, 5.0, 35);
    this.colorThiefVortex.add(this.vortexLight);

    this.scene.add(this.colorThiefVortex);
  }

  // ==========================================
  // Atmospheric Particles (Pure Cinematic Clarity)
  // ==========================================
  initAtmosphericParticles() {
    // No artificial square pixel billboards - pristine filmic atmosphere
    this.cinematicMotes = null;
    this.fallingAsh = null;
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

    let camPos = this._scratchCamPos;
    let lookTarget = this._scratchLookTarget;
    let roll = 0;

    switch (current.curveType) {
      // Act I: Crane Swoop & Bank
      case 'crane_bank': {
        camPos = this.bezierQuadratic(current.p0, current.p1, current.p2, ease, camPos);
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
        const orbitAngle = Math.PI - ease * (Math.PI * 0.95);
        const dist = 3.2 - Math.sin(progress * Math.PI) * 0.5;
        camPos.set(
          current.target.x + Math.sin(orbitAngle) * dist,
          1.45 + ease * 0.75,
          current.target.z + Math.cos(orbitAngle) * dist
        );
        this._scratchV1.set(current.target.x, current.target.y + 0.12, current.target.z);
        lookTarget.lerpVectors(
          this._scratchV1,
          this._scratchLookB,
          Math.max(0, (progress - 0.55) * 2.22)
        );
        roll = -Math.sin(progress * Math.PI) * 0.025;
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

    // Pure, butter-smooth cinematic gimbal motion without camera jitter or vibration
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

    // 1. Animate Holographic Crystals (Dual Celestial Gyroscope Rings)
    if (this.crystalsGroup && this.crystalsGroup.visible && this.crystals) {
      this.crystals.forEach((c, idx) => {
        c.userData.mesh.rotation.y += delta * (1.6 + idx * 0.45);
        c.userData.mesh.rotation.x = Math.sin(this.totalTimer * 2.2 + idx) * 0.2;
        c.userData.core.rotation.y -= delta * 2.2;
        c.userData.ring.rotation.z += delta * 2.4;
        if (c.userData.ring2) {
          c.userData.ring2.rotation.x += delta * 1.8;
          c.userData.ring2.rotation.y += delta * 1.2;
        }
        c.position.y = c.userData.initialY + Math.sin(this.totalTimer * 2.8 + idx * 1.4) * 0.09;
        c.userData.light.intensity = 3.4 + Math.sin(this.totalTimer * 4.0 + idx) * 0.8;
      });
    }

    // 2. Animate Color Thief Dark Vortex in Act III (Accretion Disks)
    if (this.colorThiefVortex && this.colorThiefVortex.visible) {
      if (this.vortexRings) {
        this.vortexRings.forEach((r, idx) => {
          r.rotation.z += delta * (2.8 - idx * 0.7);
          r.rotation.x = Math.PI / 2 + Math.sin(this.totalTimer * 2.5 + idx) * 0.12;
        });
      }
      if (this.vortexLight) {
        this.vortexLight.intensity = 4.0 + Math.sin(this.totalTimer * 12) * 2.0;
      }
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
  bezierQuadratic(p0, p1, p2, t, out = this._scratchCamPos) {
    const inv = 1 - t;
    return out.set(
      inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x,
      inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y,
      inv * inv * p0.z + 2 * inv * t * p1.z + t * t * p2.z
    );
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  getHandheldSteadicamNoise(t) {
    return this._scratchV2.set(0, 0, 0);
  }

  skip() {
    if (!this.active) return;
    this.finish();
  }

  finish() {
    this.active = false;

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
