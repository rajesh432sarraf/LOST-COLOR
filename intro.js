/**
 * intro.js - Cinematic 3D Introduction for "LOST COLOR: Temple of Red"
 * Orchestrates:
 * 1. Scene 1: The World Before (Vibrant full-color aerial sweep over sunny mountains)
 * 2. Scene 2: The Color Theft (Sky vortex, camera shake, real-time desaturation wave)
 * 3. Scene 3: The Lone Hope (Hero silhouette on cliff edge, solitary emotional theme)
 * 4. Scene 4: Temple Reveal (Flythrough past colonnade pillars & 3 Guardian Statues)
 * 5. Scene 5: The Three Crystals Vision (Rotating holographic Fire, Water, Life crystals)
 * 6. Scene 6: Title Reveal & Smooth Handover directly into Level 1 gameplay!
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

    // Holographic Crystals Group for Scene 5
    this.crystalsGroup = null;
    this.initHolographicCrystals();

    // 6 Cinematic Scenes Configuration
    this.scenes = [
      {
        id: 'world_before',
        name: 'THE WORLD BEFORE',
        text: 'Once, the world thrived in the harmony of three sacred forces: Passion, Peace, and Life.',
        duration: 6.8,
        camStart: new THREE.Vector3(38, 38, 95),
        camEnd: new THREE.Vector3(12, 22, 68),
        lookStart: new THREE.Vector3(0, 8, 20),
        lookEnd: new THREE.Vector3(0, 6, 25),
        setup: () => {
          if (this.postProcessing) this.postProcessing.setWorldSaturation(1.0);
          if (window.soundSystem) window.soundSystem.startIntroMusic();
        }
      },
      {
        id: 'color_theft',
        name: 'THE COLOR THEFT',
        text: 'Until a mysterious shadow devoured them all, trapping the world in eternal monochrome...',
        duration: 7.8,
        camStart: new THREE.Vector3(0, 10, 52),
        camEnd: new THREE.Vector3(0, 18, 48),
        lookStart: new THREE.Vector3(0, 22, 20),
        lookEnd: new THREE.Vector3(0, 55, 0), // Look up into storm sky
        setup: () => {
          if (window.soundSystem) window.soundSystem.playTheftVortexSound();
        },
        update: (progress) => {
          // Real-time desaturation wave draining colors into B&W noir
          const desat = Math.max(0.0, 1.0 - progress * 1.5);
          if (this.postProcessing) this.postProcessing.setWorldSaturation(desat);
          // Add subtle atmospheric vortex tremor
          this.camera.position.x += (Math.random() - 0.5) * 0.08 * progress;
          this.camera.position.y += (Math.random() - 0.5) * 0.08 * progress;
        }
      },
      {
        id: 'lone_hope',
        name: 'THE LAST HOPE',
        text: 'The world fell into grayscale despair. Only one hope remains to face the ancient ruins.',
        duration: 6.2,
        camStart: new THREE.Vector3(0, 0.7, 51.5),
        camEnd: new THREE.Vector3(0, 2.4, 48.0),
        lookStart: new THREE.Vector3(0, 1.5, 42),
        lookEnd: new THREE.Vector3(0, 3.2, 22),
        setup: () => {
          if (this.postProcessing) this.postProcessing.setWorldSaturation(0.0);
          if (window.soundSystem) window.soundSystem.playHeroTheme();
        }
      },
      {
        id: 'temple_reveal',
        name: 'THE TEMPLE OF RED',
        text: 'Chapter I: The Temple of Red. Three Guardian Statues guard the sealed sacred gate.',
        duration: 7.5,
        camStart: new THREE.Vector3(-14, 4.5, 44),
        camEnd: new THREE.Vector3(0, 3.8, 26),
        lookStart: new THREE.Vector3(0, 6, 20),
        lookEnd: new THREE.Vector3(0, 5.5, 20),
        setup: () => {
          if (this.postProcessing) this.postProcessing.setWorldSaturation(0.0);
        }
      },
      {
        id: 'crystal_vision',
        name: 'THE THREE CRYSTALS',
        text: 'Recover the lost crystals: 🔴 Fire, 🔵 Water, 🟢 Life. Restore the stolen colors.',
        duration: 6.8,
        camStart: new THREE.Vector3(-6, 3.2, 24),
        camEnd: new THREE.Vector3(6, 3.6, 24),
        lookStart: new THREE.Vector3(0, 2.5, 23.5),
        lookEnd: new THREE.Vector3(0, 2.5, 23.5),
        setup: () => {
          if (this.crystalsGroup) this.crystalsGroup.visible = true;
          if (window.soundSystem) window.soundSystem.playCrystalVisionChimes();
        },
        teardown: () => {
          if (this.crystalsGroup) this.crystalsGroup.visible = false;
        }
      },
      {
        id: 'title_reveal',
        name: 'COLOR THIEF',
        text: 'Temple of Red · Ancient Sacred Ruins',
        duration: 4.8,
        camStart: new THREE.Vector3(0, 3.5, 49),
        camEnd: new THREE.Vector3(0, 2.8, 51.2),
        lookStart: new THREE.Vector3(0, 2.2, 38),
        lookEnd: new THREE.Vector3(0, 1.8, 42),
        setup: () => {
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
    this.crystalsGroup.position.set(0, 2.2, 23.5);
    this.crystalsGroup.visible = false;

    // 1. Red Fire Crystal
    const redCrystal = this.createFloatingCrystal(0xff2244, 0xff3344, -2.2, 0.2, 0);
    // 2. Blue Water Crystal
    const blueCrystal = this.createFloatingCrystal(0x00c8ff, 0x38b6ff, 0.0, 0.8, -0.6);
    // 3. Green Life Crystal
    const greenCrystal = this.createFloatingCrystal(0x38ef7d, 0x11998e, 2.2, 0.2, 0);

    this.crystalsGroup.add(redCrystal, blueCrystal, greenCrystal);
    this.scene.add(this.crystalsGroup);
    this.crystals = [redCrystal, blueCrystal, greenCrystal];
  }

  createFloatingCrystal(colorHex, emissiveHex, x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const geo = new THREE.OctahedronGeometry(0.55, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: emissiveHex,
      emissiveIntensity: 1.6,
      roughness: 0.15,
      metalness: 0.85,
      transparent: true,
      opacity: 0.92
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(1.0, 1.5, 1.0);
    group.add(mesh);

    // Glowing energy torus ring
    const ringGeo = new THREE.TorusGeometry(0.85, 0.03, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    // Dynamic light
    const light = new THREE.PointLight(colorHex, 2.0, 8);
    group.add(light);

    group.userData = { mesh, ring };
    return group;
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

    // Show Letterbox & Intro UI
    document.body.classList.add('cinematic-active');
    if (this.container) {
      this.container.classList.add('visible');
    }
    if (this.titleScreen) {
      this.titleScreen.classList.remove('visible');
    }

    // Disable player movement input
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
        c.userData.ring.rotation.z += delta * 2.2;
        c.position.y += Math.sin(this.totalTimer * 3.0 + idx * 1.5) * 0.003;
      });
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

    // Reset postprocessing to noir
    if (this.postProcessing) {
      this.postProcessing.setWorldSaturation(0.0);
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
      this.player.cameraPitch = 0.26;
      this.player.root.position.copy(this.player.position);
    }

    // Complete callback (shows HUD, starts Level 1 quest)
    if (this.onComplete) {
      this.onComplete();
    }
  }
}

window.CinematicIntro = CinematicIntro;
