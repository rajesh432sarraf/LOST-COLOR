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
    if (this.ui) {
      this.ui.showNotification('⚔️ Chapter I: Temple of Red');
      this.ui.setObjective('Align the 3 Guardian Statues using the stone tablet clues.');
    }
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
    if (urlParams.get('level') === '2') {
      beginAdventure();
      if (this.intro) this.intro.finish();
      setTimeout(() => {
        this.transitionToLevel2();
      }, 150);
    }
  }

  // ==========================================
  // Level Transition: Level 1 -> LEVEL 2 – WATER REALM
  // ==========================================
  transitionToLevel2() {
    // 1. Completely remove Level 1 Red Temple from scene so no Level 1 assets are visible
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

    // 2. Build Level 2: Water Realm - The Dried Lake
    this.lake = new LakeLevel(this.scene);
    this.currentLevel = 2;

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
      this.player.characterMesh.rotation.y = Math.PI;
      this.player.root.position.copy(this.player.position);
    }

    // 4. Update PuzzleManager & UIManager for Level 2
    if (this.puzzles) {
      this.puzzles.setLevel2(this.lake);
    }
    if (this.ui) {
      this.ui.setupLevel2UI(this.lake);
    }

    // 5. Display the clean full-screen LEVEL 2 INTRO DASHBOARD
    if (this.ui) {
      this.ui.showLevel2IntroDashboard();
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
      const colliders = this.currentLevel === 1 
        ? (this.temple ? this.temple.colliders : []) 
        : (this.lake ? this.lake.colliders : []);

      if (this.player) {
        this.player.update(delta, colliders);
      }
    }

    // 2. Update Active Level Dynamic Animations
    if (this.currentLevel === 1 && this.temple) {
      this.temple.update(delta, time);
    } else if (this.currentLevel === 2 && this.lake) {
      this.lake.update(delta, time);
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
