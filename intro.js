/**
 * intro.js - Vibrant, Realistic 3D Cinematic Introduction for "LOST COLOR: Temple of Red"
 * 
 * Orchestrates a colorful, realistic story experience:
 * 1. Scene 1: The World of Harmony (Sweeping high-altitude aerial flyover showing realistic mountains, courtyard, and warm sunlight)
 * 2. Scene 2: The Three Sacred Crystals (Vibrant 3D showcase of floating Fire 🔴, Water 🔵, and Life 🟢 crystals with energy halos)
 * 3. Scene 3: The Shadow's Threat (Dramatic upward temple vista with atmospheric contrast and rumbling energy)
 * 4. Scene 4: The Lone Explorer (Cinematic hero showcase highlighting detailed leather jacket, denim pants, and flowing red scarf)
 * 5. Scene 5: The Temple of Red (Smooth ground glide past crackling fire braziers, mossy pavers, and 3 glowing Guardian Statues)
 * 6. Scene 6: Title Reveal & Seamless Handover directly into Level 1 gameplay in 100% full rich color!
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
    this.camStartPos = new THREE.Vector3();
    this.camEndPos = new THREE.Vector3();
    this.lookAtStart = new THREE.Vector3();
    this.lookAtEnd = new THREE.Vector3();

    // DOM References
    this.container = document.getElementById('intro-overlay');
    this.subtitleTitle = document.getElementById('intro-scene-title');
    this.subtitleText = document.getElementById('intro-subtitle-text');
    this.skipBtn = document.getElementById('btn-skip-intro');
    this.titleScreen = document.getElementById('intro-title-slate');

    // Holographic Crystals Group for Scene 2
    this.crystalsGroup = null;
    this.initHolographicCrystals();

    // Ambient floating golden & cyan particles
    this.initCinematicAtmosphere();

    // 6 Full-Color, Realistic Cinematic Scenes
    this.scenes = [
      {
        id: 'world_harmony',
        name: 'THE REALM OF HARMONY',
        text: 'Once, the ancient world flourished in rich, vibrant beauty under the harmony of three sacred forces.',
        duration: 6.8,
        camStart: new THREE.Vector3(34, 30, 88),
        camEnd: new THREE.Vector3(10, 16, 62),
        lookStart: new THREE.Vector3(0, 7, 24),
        lookEnd: new THREE.Vector3(0, 5, 26),
        setup: () => {
          if (this.postProcessing) this.postProcessing.setWorldSaturation(1.0);
          if (window.soundSystem) window.soundSystem.startIntroMusic();
          if (this.cinematicMotes) this.cinematicMotes.visible = true;
        }
      },
      {
        id: 'sacred_crystals',
        name: 'THE THREE SACRED CRYSTALS',
        text: '🔴 Red represents Passion, 🔵 Blue brings Peace, and 🟢 Green breathes Life into all creation.',
        duration: 7.2,
        camStart: new THREE.Vector3(-6.5, 3.6, 26.5),
        camEnd: new THREE.Vector3(6.5, 4.0, 26.5),
        lookStart: new THREE.Vector3(0, 2.4, 23.5),
        lookEnd: new THREE.Vector3(0, 2.4, 23.5),
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
        id: 'shadow_threat',
        name: 'THE ANCIENT PROPHECY',
        text: 'When a mysterious dark entity threatens the land, the sacred crystals must be protected within the elemental temples.',
        duration: 6.4,
        camStart: new THREE.Vector3(0, 3.8, 52),
        camEnd: new THREE.Vector3(0, 14.0, 44),
        lookStart: new THREE.Vector3(0, 16, 24),
        lookEnd: new THREE.Vector3(0, 38, 12),
        setup: () => {
          if (this.postProcessing) this.postProcessing.setWorldSaturation(1.0);
          if (window.soundSystem) window.soundSystem.playTheftVortexSound();
        }
      },
      {
        id: 'lone_explorer',
        name: 'THE LONE EXPLORER',
        text: 'One courageous adventurer answered the call to explore the ancient ruins and claim the sacred crystals.',
        duration: 6.6,
        camStart: new THREE.Vector3(-2.2, 1.8, 43.5),
        camEnd: new THREE.Vector3(2.2, 1.9, 43.5),
        lookStart: new THREE.Vector3(0, 1.35, 46.0),
        lookEnd: new THREE.Vector3(0, 1.35, 46.0),
        setup: () => {
          if (this.postProcessing) this.postProcessing.setWorldSaturation(1.0);
          if (window.soundSystem) window.soundSystem.playHeroTheme();
        }
      },
      {
        id: 'temple_reveal',
        name: 'THE TEMPLE OF RED',
        text: 'Chapter I: Temple of Red. Three Guardian Statues hold the alignment secret to unlock the sacred gate.',
        duration: 7.2,
        camStart: new THREE.Vector3(-14, 4.2, 42),
        camEnd: new THREE.Vector3(0, 3.4, 26),
        lookStart: new THREE.Vector3(0, 5.0, 20),
        lookEnd: new THREE.Vector3(0, 4.5, 20),
        setup: () => {
          if (this.postProcessing) this.postProcessing.setWorldSaturation(1.0);
        }
      },
      {
        id: 'title_reveal',
        name: 'COLOR THIEF',
        text: 'Temple of Red · Ancient Sacred Ruins · Begin Adventure',
        duration: 4.8,
        camStart: new THREE.Vector3(0, 3.2, 51.5),
        camEnd: new THREE.Vector3(0, 2.6, 52.8),
        lookStart: new THREE.Vector3(0, 2.0, 40),
        lookEnd: new THREE.Vector3(0, 1.8, 44),
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

  initHolographicCrystals() {
    this.crystalsGroup = new THREE.Group();
    this.crystalsGroup.position.set(0, 2.4, 23.5);
    this.crystalsGroup.visible = false;

    // 1. Red Fire Crystal (Passion)
    const redCrystal = this.createFloatingCrystal(0xff2244, 0xff3344, -2.4, 0.2, 0, '🔥');
    // 2. Blue Water Crystal (Peace)
    const blueCrystal = this.createFloatingCrystal(0x00c8ff, 0x38b6ff, 0.0, 0.9, -0.6, '💧');
    // 3. Green Life Crystal (Life)
    const greenCrystal = this.createFloatingCrystal(0x38ef7d, 0x11998e, 2.4, 0.2, 0, '🌿');

    this.crystalsGroup.add(redCrystal, blueCrystal, greenCrystal);
    this.scene.add(this.crystalsGroup);
    this.crystals = [redCrystal, blueCrystal, greenCrystal];
  }

  createFloatingCrystal(colorHex, emissiveHex, x, y, z, symbol) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Faceted octahedral crystal geometry
    const geo = new THREE.OctahedronGeometry(0.62, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: emissiveHex,
      emissiveIntensity: 2.2,
      roughness: 0.12,
      metalness: 0.9,
      transparent: true,
      opacity: 0.94
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(0.9, 1.6, 0.9);
    mesh.castShadow = true;
    group.add(mesh);

    // Inner bright core
    const coreGeo = new THREE.OctahedronGeometry(0.35, 0);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.scale.set(0.7, 1.4, 0.7);
    group.add(core);

    // Glowing orbital energy ring
    const ringGeo = new THREE.TorusGeometry(0.95, 0.04, 10, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.2;
    group.add(ring);

    // Sparkling particle halo
    const pCount = 28;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const a = (i / pCount) * Math.PI * 2;
      const r = 0.8 + Math.random() * 0.4;
      pPos[i * 3]     = Math.cos(a) * r;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 1.6;
      pPos[i * 3 + 2] = Math.sin(a) * r;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const sparkles = new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: colorHex,
      size: 0.22,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    }));
    group.add(sparkles);

    // Dynamic colored point light illuminating the environment
    const light = new THREE.PointLight(colorHex, 3.2, 10, 1.4);
    group.add(light);

    group.userData = { mesh, core, ring, sparkles, light };
    return group;
  }

  initCinematicAtmosphere() {
    // Warm golden and cyan magical floating motes drifting in the air
    const pCount = 220;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3]     = (Math.random() - 0.5) * 60;
      pPos[i * 3 + 1] = 1.0 + Math.random() * 18.0;
      pPos[i * 3 + 2] = 10 + Math.random() * 70;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xffe899,
      size: 0.22,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    this.cinematicMotes = new THREE.Points(pGeo, pMat);
    this.scene.add(this.cinematicMotes);
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
        // Clicking during title screen immediately finishes
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

    // Ensure 100% full vibrant saturation throughout intro
    if (this.postProcessing) {
      this.postProcessing.setWorldSaturation(1.0);
    }

    // Show Letterbox & Intro UI
    document.body.classList.add('cinematic-active');
    if (this.container) {
      this.container.classList.add('visible');
    }
    if (this.titleScreen) {
      this.titleScreen.classList.remove('visible');
    }

    // Disable player movement input during intro
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

    this.camStartPos.copy(scene.camStart);
    this.camEndPos.copy(scene.camEnd);
    this.lookAtStart.copy(scene.lookStart);
    this.lookAtEnd.copy(scene.lookEnd);

    this.camera.position.copy(this.camStartPos);
    this.currentLookAt.copy(this.lookAtStart);
    this.camera.lookAt(this.currentLookAt);

    // Update Subtitles
    if (this.subtitleTitle && this.subtitleText) {
      this.subtitleTitle.textContent = scene.name;
      this.subtitleText.textContent = scene.text;

      // Animate subtitle card
      const box = document.getElementById('intro-subtitle-box');
      if (box) {
        box.classList.remove('fade-in');
        void box.offsetWidth; // Trigger reflow
        box.classList.add('fade-in');
      }
    }

    if (scene.setup) scene.setup();
  }

  update(delta) {
    if (!this.active) return;

    this.sceneTimer += delta;
    this.totalTimer += delta;
    const current = this.scenes[this.currentSceneIndex];

    const progress = Math.min(1.0, this.sceneTimer / current.duration);
    const ease = this.easeInOutCubic(progress);

    // Smooth Camera Interpolation
    this.camera.position.lerpVectors(this.camStartPos, this.camEndPos, ease);
    this.currentLookAt.lerpVectors(this.lookAtStart, this.lookAtEnd, ease);
    this.camera.lookAt(this.currentLookAt);

    // Custom Scene Update Hook
    if (current.update) {
      current.update(progress);
    }

    // Animate Holographic Crystals if active
    if (this.crystalsGroup && this.crystalsGroup.visible && this.crystals) {
      this.crystals.forEach((c, idx) => {
        c.userData.mesh.rotation.y += delta * (1.6 + idx * 0.4);
        c.userData.mesh.rotation.x = Math.sin(this.totalTimer * 2.0 + idx) * 0.2;
        c.userData.core.rotation.y -= delta * 2.0;
        c.userData.ring.rotation.z += delta * 2.2;
        c.userData.sparkles.rotation.y += delta * 1.2;
        c.position.y += Math.sin(this.totalTimer * 3.0 + idx * 1.5) * 0.003;
      });
    }

    // Animate floating atmospheric motes
    if (this.cinematicMotes && this.cinematicMotes.geometry) {
      const pos = this.cinematicMotes.geometry.attributes.position.array;
      const count = pos.length / 3;
      for (let i = 0; i < count; i++) {
        pos[i * 3 + 1] += Math.sin(this.totalTimer + i) * 0.006;
      }
      this.cinematicMotes.geometry.attributes.position.needsUpdate = true;
    }

    // Advance to next scene
    if (this.sceneTimer >= current.duration) {
      if (current.teardown) current.teardown();
      this.loadScene(this.currentSceneIndex + 1);
    }
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  skip() {
    if (!this.active) return;
    this.finish();
  }

  finish() {
    this.active = false;

    // Cleanup intro state
    if (this.scenes[this.currentSceneIndex] && this.scenes[this.currentSceneIndex].teardown) {
      this.scenes[this.currentSceneIndex].teardown();
    }
    if (this.crystalsGroup) {
      this.crystalsGroup.visible = false;
    }
    if (this.cinematicMotes) {
      this.cinematicMotes.visible = false;
    }

    // Ensure 100% full rich colors for active gameplay
    if (this.postProcessing) {
      this.postProcessing.setWorldSaturation(1.0);
    }

    // Stop intro pad music
    if (window.soundSystem) {
      window.soundSystem.stopIntroMusic();
    }

    // Hide intro UI
    if (this.container) {
      this.container.classList.remove('visible');
    }
    if (this.titleScreen) {
      this.titleScreen.classList.remove('visible');
    }
    document.body.classList.remove('cinematic-active');

    // Smoothly hand off camera to player
    if (this.player) {
      this.player.cutsceneActive = false;
      this.player.position.set(0, 0.0, 46);
      this.player.cameraYaw = Math.PI; // Face North (-Z) toward temple
      this.player.cameraPitch = 0.22;
      this.player.root.position.copy(this.player.position);
    }

    // Complete callback (shows HUD, starts Level 1 quest)
    if (this.onComplete) {
      this.onComplete();
    }
  }
}

window.CinematicIntro = CinematicIntro;
