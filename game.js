/**
 * game.js - Master Game Loop & Controller for "Temple of Red"
 * Orchestrates Scene, Camera, Renderer, PostProcessing, Player, Temple, Puzzles, and UI.
 */

class GameManager {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();
    this.hasKey = false;
    this.isStarted = false;
    this.currentLevel = 1;
    this.lake = null;

    this.initThree();
    this.initGameSystems();
    this.initStartScreen();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x9aa0a8); // High dynamic range daylight atmosphere

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      350
    );
    this.camera.position.set(0, 3, 54);

    // 3. Renderer with high visual fidelity
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    this.container.appendChild(this.renderer.domElement);

    // Window resize handler
    window.addEventListener('resize', () => this.onWindowResize());
  }

  initGameSystems() {
    // 1. Temple Level Geometry & Environment
    const sceneBeforeTemple = [...this.scene.children];
    this.temple = new TempleLevel(this.scene);
    this.templeObjects = this.scene.children.filter(c => !sceneBeforeTemple.includes(c));

    // 2. Player Adventurer & Camera
    this.player = new PlayerController(this.scene, this.camera, this.renderer.domElement);

    // 3. Post-Processing & Color Pass Shader
    this.postProcessing = new PostProcessingManager(this.renderer, this.scene, this.camera);
    window.postProcessing = this.postProcessing;

    // 4. UI Manager & Mini-Map
    this.ui = new UIManager(this.player, this.temple);
    window.uiManager = this.ui;

    // 5. Puzzle Manager
    this.puzzles = new PuzzleManager(this.temple, this.player);
    window.puzzleManager = this.puzzles;
    this.ui.questState = this.puzzles.questState;

    // 6. 3D Cinematic Introduction
    this.intro = new CinematicIntro(
      this.scene,
      this.camera,
      this.player,
      this.temple,
      this.postProcessing,
      () => this.onIntroComplete()
    );
    window.cinematicIntro = this.intro;
  }

  onIntroComplete() {
    if (this.player) {
      this.player.cutsceneActive = false;
      try {
        this.renderer.domElement.requestPointerLock();
      } catch (e) {}
    }
    // Soldier awakens in the Faded Palace to receive royal mission!
    this.transitionToPalace();
    if (window.soundSystem) {
      window.soundSystem.startAmbientSoundscape();
    }
  }

  initStartScreen() {
    const startScreen = document.getElementById('start-screen');
    if (!startScreen) return;

    const beginAdventure = () => {
      if (this.isStarted) return;
      this.isStarted = true;

      // Initialize Web Audio API on user gesture
      if (window.soundSystem) {
        window.soundSystem.init();
      }

      startScreen.classList.add('hidden');

      // Launch high-polish 3D Cinematic Introduction
      if (this.intro) {
        this.intro.start();
      } else {
        this.onIntroComplete();
      }
    };

    startScreen.addEventListener('click', beginAdventure);
    startScreen.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'Enter') beginAdventure();
    });

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autostart') === 'true') {
      beginAdventure();
    }
    if (urlParams.get('skipintro') === 'true' && this.intro) {
      setTimeout(() => this.intro.skip(), 100);
    }
    if (urlParams.get('scene') === 'palace') {
      beginAdventure();
      if (this.intro) this.intro.finish();
      setTimeout(() => {
        this.transitionToPalace();
      }, 150);
    }
    if (urlParams.get('level') === '1' || urlParams.get('scene') === 'temple') {
      beginAdventure();
      if (this.intro) this.intro.finish();
      setTimeout(() => {
        this.transitionToLevel1();
      }, 150);
    }
    if (urlParams.get('level') === '2') {
      beginAdventure();
      if (this.intro) this.intro.finish();
      setTimeout(() => {
        this.transitionToLevel2();
      }, 150);
    }
    if (urlParams.get('level') === '3') {
      beginAdventure();
      if (this.intro) this.intro.finish();
      setTimeout(() => {
        this.transitionToLevel3();
      }, 150);
    }
    if (urlParams.get('palace_stage')) {
      const stage = parseInt(urlParams.get('palace_stage'), 10);
      setTimeout(() => {
        if (this.palace) {
          if (stage >= 1) this.palace.socketCrystal('fire');
          if (stage >= 2) this.palace.socketCrystal('water');
          if (stage >= 3) this.palace.socketCrystal('life');
        }
      }, 350);
    }
  }

  // ==========================================
  // Level Transition: FADED PALACE HUB (Level 0)
  // ==========================================
  transitionToPalace() {
    if (this.ui) {
      this.ui.hidePrompt();
    }

    // 1. Hide Level 1 Temple meshes
    if (this.templeObjects && this.templeObjects.length > 0) {
      this.templeObjects.forEach(obj => {
        obj.visible = false;
        this.scene.remove(obj);
      });
    }
    if (this.temple && this.temple.group) {
      this.scene.remove(this.temple.group);
      this.temple.group.visible = false;
    }
    if (this.temple && this.temple.keyGroup) {
      this.scene.remove(this.temple.keyGroup);
      this.temple.keyGroup.visible = false;
    }

    // 2. Hide Level 2 Lake
    if (this.lake && this.lake.group) {
      this.scene.remove(this.lake.group);
      this.lake.group.visible = false;
    }

    // 3. Hide Level 3 Forest
    if (this.forest && this.forest.group) {
      this.scene.remove(this.forest.group);
      this.forest.group.visible = false;
    }

    // 4. Build Palace if needed
    if (!this.palace) {
      this.palace = new PalaceLevel(this.scene);
    } else {
      this.palace.group.visible = true;
      if (!this.scene.children.includes(this.palace.group)) {
        this.scene.add(this.palace.group);
      }
    }
    this.currentLevel = 0;

    // Atmospheric lighting & fog for Palace
    this.scene.background = new THREE.Color(0x10131a);
    this.scene.fog = new THREE.FogExp2(0x10131a, 0.015);
    if (this.postProcessing) {
      this.postProcessing.setWorldSaturation(1.0);
    }

    // 5. Reposition player at south runner aisle facing North toward Altar of Elements
    if (this.player) {
      this.player.position.set(0, 0.0, 16);
      this.player.velocity.set(0, 0, 0);
      this.player.verticalVelocity = 0;
      this.player.isGrounded = true;
      this.player.cameraYaw = Math.PI; // Face North toward Altar
      this.player.cameraPitch = 0.12;
      this.player.targetRotationY = Math.PI;
      this.player.rotationY = Math.PI;
      if (this.player.characterMesh) {
        this.player.characterMesh.rotation.y = Math.PI;
      }
      this.player.root.position.copy(this.player.position);
    }

    // 6. Update PuzzleManager & UIManager for Palace
    if (this.puzzles) {
      this.puzzles.setPalace(this.palace);
    }
    if (this.ui) {
      this.ui.setupPalaceUI(this.palace);
      if (this.puzzles) {
        this.ui.updateCrystalInventory(this.puzzles.inventory, this.puzzles.altarSockets);
      }
    }

    // 7. Display the Palace Mission Dashboard on first visit
    if (this.ui && (!this.puzzles || (!this.puzzles.inventory.red && !this.puzzles.altarSockets.fire))) {
      this.ui.showPalaceIntroDashboard();
    }
  }

  // ==========================================
  // Level Transition: CHAPTER I – TEMPLE OF RED
  // ==========================================
  transitionToLevel1() {
    // 0. Hide any active prompt
    if (this.ui) {
      this.ui.hidePrompt();
    }

    // 1. Hide Palace
    if (this.palace && this.palace.group) {
      this.scene.remove(this.palace.group);
      this.palace.group.visible = false;
    }
    // 2. Hide Lake
    if (this.lake && this.lake.group) {
      this.scene.remove(this.lake.group);
      this.lake.group.visible = false;
    }
    // 3. Hide Forest
    if (this.forest && this.forest.group) {
      this.scene.remove(this.forest.group);
      this.forest.group.visible = false;
    }

    // 4. Restore Temple
    if (!this.temple) {
      const sceneBeforeTemple = [...this.scene.children];
      this.temple = new TempleLevel(this.scene);
      this.templeObjects = this.scene.children.filter(c => !sceneBeforeTemple.includes(c));
    } else {
      if (this.temple.group) {
        this.temple.group.visible = true;
        if (!this.scene.children.includes(this.temple.group)) {
          this.scene.add(this.temple.group);
        }
      }
      if (this.templeObjects && this.templeObjects.length > 0) {
        this.templeObjects.forEach(obj => {
          obj.visible = true;
          if (!this.scene.children.includes(obj)) {
            this.scene.add(obj);
          }
        });
      }
      if (this.temple.keyGroup && this.temple.keySpawned && !this.temple.keyCollected) {
        this.temple.keyGroup.visible = true;
        if (!this.scene.children.includes(this.temple.keyGroup)) {
          this.scene.add(this.temple.keyGroup);
        }
      }
    }
    this.currentLevel = 1;

    // Reset Scene background and fog for Level 1 atmosphere
    this.scene.background = new THREE.Color(0x9aa0a8);
    this.scene.fog = new THREE.FogExp2(0x9aa0a8, 0.012);

    // Update Post-Processing for Level 1
    if (this.postProcessing) {
      this.postProcessing.setWorldSaturation(1.0);
      const isRedClaimed = this.puzzles && (this.puzzles.inventory.red || (this.puzzles.questState && this.puzzles.questState.gameCompleted));
      this.postProcessing.setRedRestoration(isRedClaimed ? 1.0 : 0.0);
    }

    // 5. Reposition player at south courtyard (y = 0.0, z = 48) facing North
    if (this.player) {
      this.player.position.set(0, 0.0, 48);
      this.player.velocity.set(0, 0, 0);
      this.player.verticalVelocity = 0;
      this.player.isGrounded = true;
      this.player.cameraYaw = Math.PI;
      this.player.cameraPitch = 0.14;
      this.player.targetRotationY = Math.PI;
      this.player.rotationY = Math.PI;
      if (this.player.characterMesh) {
        this.player.characterMesh.rotation.y = Math.PI;
      }
      this.player.root.position.copy(this.player.position);
    }

    if (this.puzzles) {
      this.puzzles.setLevel1(this.temple);
    }
    if (this.ui) {
      this.ui.setupLevel1UI(this.temple);
      this.ui.showNotification('⚔️ Chapter I: Temple of Red');
      if (this.puzzles) {
        this.ui.updateCrystalInventory(this.puzzles.inventory, this.puzzles.altarSockets);
      }
    }
  }

  // ==========================================
  // Level Transition: Level 1 -> LEVEL 2 – WATER REALM
  // ==========================================
  transitionToLevel2() {
    // 0. Hide UI prompt
    if (this.ui) {
      this.ui.hidePrompt();
    }

    // 0. Hide Palace if present
    if (this.palace && this.palace.group) {
      this.scene.remove(this.palace.group);
      this.palace.group.visible = false;
    }
    // Hide Forest if present
    if (this.forest && this.forest.group) {
      this.scene.remove(this.forest.group);
      this.forest.group.visible = false;
    }

    // 1. Completely remove Level 1 Red Temple from scene
    if (this.templeObjects && this.templeObjects.length > 0) {
      this.templeObjects.forEach(obj => {
        obj.visible = false;
        this.scene.remove(obj);
      });
    }
    if (this.temple && this.temple.group) {
      this.scene.remove(this.temple.group);
      this.temple.group.visible = false;
    }
    if (this.temple && this.temple.keyGroup) {
      this.scene.remove(this.temple.keyGroup);
      this.temple.keyGroup.visible = false;
    }

    // 2. Build or Restore Level 2: Water Realm - The Dried Lake
    if (!this.lake) {
      this.lake = new LakeLevel(this.scene);
    } else {
      this.lake.group.visible = true;
      if (!this.scene.children.includes(this.lake.group)) {
        this.scene.add(this.lake.group);
      }
      this.scene.fog = new THREE.FogExp2(0x94b4c8, 0.0065);
      this.scene.background = new THREE.Color(0xa2bed4);
    }
    this.currentLevel = 2;

    if (this.postProcessing) {
      this.postProcessing.setWorldSaturation(1.0);
      const isWaterClaimed = this.puzzles && (this.puzzles.inventory.water || (this.puzzles.altarSockets && this.puzzles.altarSockets.water));
      this.postProcessing.setBlueRestoration(isWaterClaimed ? 1.0 : 0.0);
    }

    // 3. Reposition player at south stone path (y = 0.0, z = 30) facing North toward central platform
    if (this.player) {
      this.player.position.set(0, 0.0, 30);
      this.player.velocity.set(0, 0, 0);
      this.player.verticalVelocity = 0;
      this.player.isGrounded = true;
      this.player.cameraYaw = Math.PI; // Face North toward central stone platform
      this.player.cameraPitch = 0.14;
      this.player.targetRotationY = Math.PI;
      this.player.rotationY = Math.PI;
      if (this.player.characterMesh) {
        this.player.characterMesh.rotation.y = Math.PI;
      }
      this.player.root.position.copy(this.player.position);
    }

    // 4. Update PuzzleManager & UIManager for Level 2
    if (this.puzzles) {
      this.puzzles.setLevel2(this.lake);
    }
    if (this.ui) {
      this.ui.setupLevel2UI(this.lake);
      if (this.puzzles) {
        this.ui.updateCrystalInventory(this.puzzles.inventory, this.puzzles.altarSockets);
      }
    }

    // 5. Display the clean full-screen LEVEL 2 INTRO DASHBOARD
    if (this.ui && (!this.puzzles || (!this.puzzles.inventory.water && !this.puzzles.altarSockets.water))) {
      this.ui.showLevel2IntroDashboard();
    }
  }

  // ==========================================
  // Level Transition: Level 2 -> LEVEL 3 – FOREST OF LIFE
  // ==========================================
  transitionToLevel3() {
    // 0. Hide UI prompt
    if (this.ui) {
      this.ui.hidePrompt();
    }

    // 0. Hide Palace if present
    if (this.palace && this.palace.group) {
      this.scene.remove(this.palace.group);
      this.palace.group.visible = false;
    }

    // 1. Completely remove Level 1 objects if any
    if (this.templeObjects && this.templeObjects.length > 0) {
      this.templeObjects.forEach(obj => {
        obj.visible = false;
        this.scene.remove(obj);
      });
    }
    if (this.temple && this.temple.group) {
      this.scene.remove(this.temple.group);
      this.temple.group.visible = false;
    }
    if (this.temple && this.temple.keyGroup) {
      this.scene.remove(this.temple.keyGroup);
      this.temple.keyGroup.visible = false;
    }

    // 2. Remove Level 2 Lake from scene
    if (this.lake && this.lake.group) {
      this.scene.remove(this.lake.group);
      this.lake.group.visible = false;
    }

    // 3. Build or Restore Level 3: Forest of Life
    if (!this.forest) {
      this.forest = new ForestLevel(this.scene);
    } else {
      this.forest.group.visible = true;
      if (!this.scene.children.includes(this.forest.group)) {
        this.scene.add(this.forest.group);
      }
      this.scene.fog = new THREE.FogExp2(0x1a3324, 0.0085);
      this.scene.background = new THREE.Color(0x1c3828);
    }
    this.currentLevel = 3;

    if (this.postProcessing) {
      this.postProcessing.setWorldSaturation(1.0);
      const isLifeClaimed = this.puzzles && (this.puzzles.inventory.life || (this.puzzles.altarSockets && this.puzzles.altarSockets.life));
      this.postProcessing.setGreenRestoration(isLifeClaimed ? 1.0 : 0.0);
    }

    // 4. Reposition player at south entry glade facing North toward Elder Tree
    if (this.player) {
      this.player.position.set(0, 0.0, 32);
      this.player.velocity.set(0, 0, 0);
      this.player.verticalVelocity = 0;
      this.player.isGrounded = true;
      this.player.cameraYaw = Math.PI; // Face North toward Elder Tree
      this.player.cameraPitch = 0.14;
      this.player.targetRotationY = Math.PI;
      this.player.rotationY = Math.PI;
      if (this.player.characterMesh) {
        this.player.characterMesh.rotation.y = Math.PI;
      }
      this.player.root.position.copy(this.player.position);
    }

    // 5. Update PuzzleManager & UIManager for Level 3
    if (this.puzzles) {
      this.puzzles.setLevel3(this.forest);
    }
    if (this.ui) {
      this.ui.setupLevel3UI(this.forest);
      if (this.puzzles) {
        this.ui.updateCrystalInventory(this.puzzles.inventory, this.puzzles.altarSockets);
      }
    }

    // 6. Display the clean full-screen LEVEL 3 INTRO DASHBOARD
    if (this.ui && (!this.puzzles || (!this.puzzles.inventory.life && !this.puzzles.altarSockets.life))) {
      this.ui.showLevel3IntroDashboard();
    }
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    if (this.postProcessing) {
      this.postProcessing.resize(width, height);
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(0.08, this.clock.getDelta());
    const time = this.clock.getElapsedTime();

    // 1. Cinematic Intro or Player Locomotion
    if (this.intro && this.intro.active) {
      this.intro.update(delta);
    } else {
      const colliders = (this.currentLevel === 0 || this.currentLevel === 'palace')
        ? (this.palace ? this.palace.colliders : [])
        : this.currentLevel === 1 
          ? (this.temple ? this.temple.colliders : []) 
          : this.currentLevel === 2
            ? (this.lake ? this.lake.colliders : [])
            : (this.forest ? this.forest.colliders : []);

      if (this.player) {
        this.player.update(delta, colliders);
      }
    }

    // 2. Update Active Level Dynamic Animations
    if ((this.currentLevel === 0 || this.currentLevel === 'palace') && this.palace) {
      this.palace.update(delta, time);
    } else if (this.currentLevel === 1 && this.temple) {
      this.temple.update(delta, time);
    } else if (this.currentLevel === 2 && this.lake) {
      this.lake.update(delta, time);
    } else if (this.currentLevel === 3 && this.forest) {
      this.forest.update(delta, time);
    }

    // 3. Update Puzzles & Climax Sequence
    if (this.puzzles) {
      this.puzzles.update(delta, time);
    }

    // 4. Update UI Mini-Map
    if (this.ui) {
      this.ui.updateMiniMap();
    }

    // 5. Render Scene through Post-Processing Pipeline
    if (this.postProcessing) {
      this.postProcessing.render(time);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

// Instantiate game on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.gameManager = new GameManager();
});
