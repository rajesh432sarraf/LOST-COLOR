/**
 * lake.js - Level 2: "WATER REALM - The Dried Lake"
 * Completely dedicated open-world dried lake environment.
 * Zero temple assets, zero dungeon assets, zero ancient ruins, zero fire assets.
 * 
 * Features:
 * - Vast cracked lake bed with detailed dry earth textures and bright daylight atmosphere.
 * - Scattered rocks, natural stone formations, boundary dead trees, distant mountains.
 * - Guided navigation: circular pathway, natural stone walking paths, wooden direction signs,
 *   soft blue guiding ground lights, invisible map boundary colliders.
 * - Central Main Puzzle: Large circular stone platform with 4 Ancient Stone Pillars:
 *   Pillar 1: ☁️ CLOUD
 *   Pillar 2: 🌧️ RAIN
 *   Pillar 3: 🏞️ LAKE
 *   Pillar 4: 🌊 OCEAN
 * - Pillar inspection with clues, clue discovery tracker, and auto-save.
 * - Puzzle activation mode and symbol connection mechanic (CLOUD ➔ RAIN ➔ LAKE ➔ OCEAN).
 * - Blue energy traveling between stones, water particles, rising stone pathway, activating rune lights, water SFX.
 * - Red flash error feedback on wrong order (resets attempt without resetting clues).
 * - Cinematic crystal reveal cutscene: ground trembles, illuminating cracks, converging energy, rising Blue Water Crystal.
 * - Crystal collection interaction with flight animation, radial water pulse wave, +200 score, and Level 2 Complete screen.
 */

class LakeLevel {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.colliders = [];
    this.interactables = [];
    this.guidingLights = [];
    this.animatedChannels = [];
    this.risingPaths = [];

    // Puzzle connection state
    this.connectionStep = 0; // 0: None, 1: Cloud, 2: Rain, 3: Lake, 4: Ocean (Solved)
    this.connectedPillars = [];
    this.puzzleSolved = false;
    this.crystalRevealed = false;
    this.crystalCollected = false;

    // Cinematic state
    this.cutsceneActive = false;
    this.cutsceneTimer = 0;

    // Water pulse wave
    this.pulseMesh = null;
    this.pulseRadius = 0;
    this.pulseActive = false;

    // References
    this.pillars = {};
    this.pillarOrder = ['cloud', 'rain', 'lake', 'ocean'];
    this.pillarConfigs = {
      cloud: { id: 'cloud', name: 'Cloud Pillar', icon: '☁️', pos: new THREE.Vector3(0, 0, -8.8), clue: 'Water begins its journey in the sky.' },
      rain: { id: 'rain', name: 'Rain Pillar', icon: '🌧️', pos: new THREE.Vector3(8.8, 0, 0), clue: 'Clouds release water back to the earth.' },
      lake: { id: 'lake', name: 'Lake Pillar', icon: '🏞️', pos: new THREE.Vector3(0, 0, 8.8), clue: 'Rainwater gathers and forms lakes.' },
      ocean: { id: 'ocean', name: 'Ocean Pillar', icon: '🌊', pos: new THREE.Vector3(-8.8, 0, 0), clue: 'All waters eventually return to the ocean.' }
    };

    this.initMaterials();
    this.buildLighting();
    this.buildAtmosphere();
    this.buildDryLakeBed();
    this.buildDistantMountains();
    this.buildNaturalFormations();
    this.buildBoundaryDeadTrees();
    this.buildPlayerGuidance();
    this.buildCentralCircularPlatform();
    this.buildFourStonePillars();
    this.buildEnergyChannels();
    this.buildCentralAltarAndCrystal();
    this.buildWindParticles();
    this.buildMapBoundaries();
  }

  initMaterials() {
    // High-fidelity procedural textures
    const crackedTex = window.textureGen.getCrackedEarth(512, 512);
    crackedTex.repeat.set(16, 16);

    const stoneTex = window.textureGen.getAncientStone(512, 512);
    stoneTex.repeat.set(4, 4);

    const floorTex = window.textureGen.getTempleFloor(512, 512);
    floorTex.repeat.set(2, 2);

    // Dry lake bed cracked earth
    this.matLakeBed = new THREE.MeshStandardMaterial({
      map: crackedTex,
      roughness: 0.94,
      metalness: 0.04,
      color: 0x8a847c // Warm dry earth tone
    });

    // Natural stone formations & boulders
    this.matRock = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.88,
      metalness: 0.06,
      color: 0x6e6d72
    });

    // Circular stone platform
    this.matPlatform = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.76,
      metalness: 0.1,
      color: 0x7e8692
    });

    // Weathered dead tree wood
    this.matDeadWood = new THREE.MeshStandardMaterial({
      color: 0x3a332a,
      roughness: 0.95,
      metalness: 0.02
    });

    // Wooden direction signs
    this.matSignWood = new THREE.MeshStandardMaterial({
      color: 0x564734,
      roughness: 0.85,
      metalness: 0.05
    });

    // Soft faint blue pillar rune
    this.matPillarRune = new THREE.MeshStandardMaterial({
      color: 0x48b6ff,
      emissive: 0x0077dd,
      emissiveIntensity: 0.8,
      roughness: 0.25,
      metalness: 0.3
    });

    // Activated energetic blue channel material
    this.matEnergyConduit = new THREE.MeshStandardMaterial({
      color: 0x00e1ff,
      emissive: 0x0099ff,
      emissiveIntensity: 0.1, // Dormant initially
      roughness: 0.15,
      metalness: 0.8,
      transparent: true,
      opacity: 0.65
    });

    // Guiding blue lights
    this.matGuidingLantern = new THREE.MeshStandardMaterial({
      color: 0x7ad7ff,
      emissive: 0x00b4ff,
      emissiveIntensity: 2.2,
      roughness: 0.1,
      metalness: 0.9
    });
  }

  buildLighting() {
    // Bright daylight atmosphere
    this.ambientLight = new THREE.AmbientLight(0xc2d6e8, 0.95);
    this.group.add(this.ambientLight);

    // Directional Sun Light
    this.dirLight = new THREE.DirectionalLight(0xfff6e5, 1.3);
    this.dirLight.position.set(45, 90, 35);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 300;
    const d = 90;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0003;
    this.group.add(this.dirLight);

    // Faint atmospheric blue skylight fill
    this.skyFill = new THREE.DirectionalLight(0x6bb3e8, 0.45);
    this.skyFill.position.set(-30, 60, -40);
    this.group.add(this.skyFill);

    // Central Sanctuary Beacon
    this.centerBeacon = new THREE.PointLight(0x00aaff, 2.0, 45, 1.4);
    this.centerBeacon.position.set(0, 3.2, 0);
    this.group.add(this.centerBeacon);
  }

  buildAtmosphere() {
    // Clean bright daylight sky with light atmospheric blue fog
    this.scene.fog = new THREE.FogExp2(0x94b4c8, 0.0065);
    this.scene.background = new THREE.Color(0xa2bed4);

    // Sky Dome
    const skyGeo = new THREE.SphereGeometry(260, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x90b5cf,
      side: THREE.BackSide
    });
    this.group.add(new THREE.Mesh(skyGeo, skyMat));
  }

  buildDryLakeBed() {
    // Vast flat cracked lake bed at y = 0.0
    const bedGeo = new THREE.PlaneGeometry(280, 280);
    const bedMesh = new THREE.Mesh(bedGeo, this.matLakeBed);
    bedMesh.rotation.x = -Math.PI / 2;
    bedMesh.position.y = 0.0;
    bedMesh.receiveShadow = true;
    this.group.add(bedMesh);
  }

  buildDistantMountains() {
    const mountainGroup = new THREE.Group();
    const count = 22;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = 125 + ((i * 13) % 25);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      const h = 40 + ((i * 7) % 30);
      const r = 24 + ((i * 5) % 18);

      const mGeo = new THREE.ConeGeometry(r, h, 6);
      const mMesh = new THREE.Mesh(mGeo, this.matRock);
      mMesh.position.set(x, h / 2 - 4, z);
      mMesh.receiveShadow = true;
      mountainGroup.add(mMesh);
    }
    this.group.add(mountainGroup);
  }

  buildNaturalFormations() {
    // Natural stone formations & small scattered rocks around the dried lake
    const rockClusters = [
      { x: -28, z: 22, s: 1.4 }, { x: -34, z: 26, s: 0.9 }, { x: -25, z: 18, s: 0.7 },
      { x: 30, z: 24, s: 1.6 }, { x: 36, z: 28, s: 1.1 }, { x: 26, z: 30, s: 0.8 },
      { x: -32, z: -25, s: 1.8 }, { x: -26, z: -32, s: 1.2 }, { x: -38, z: -20, s: 0.8 },
      { x: 28, z: -26, s: 1.5 }, { x: 34, z: -22, s: 1.0 }, { x: 32, z: -34, s: 0.9 },
      { x: -18, z: -44, s: 2.2 }, { x: 18, z: -46, s: 2.0 },
      { x: -48, z: 0, s: 2.5 }, { x: 48, z: 0, s: 2.4 }
    ];

    rockClusters.forEach(cfg => {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(cfg.s, 1), this.matRock);
      rock.position.set(cfg.x, cfg.s * 0.55, cfg.z);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.group.add(rock);

      // Colliders for larger formations
      if (cfg.s >= 1.2) {
        this.colliders.push({
          type: 'box',
          box: new THREE.Box3().setFromObject(rock)
        });
      }
    });

    // Tiny scattered pebbles across the bed
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 12 + Math.random() * 55;
      const px = Math.cos(a) * r;
      const pz = Math.sin(a) * r;
      const pebble = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25 + Math.random() * 0.25), this.matRock);
      pebble.position.set(px, 0.12, pz);
      pebble.receiveShadow = true;
      this.group.add(pebble);
    }
  }

  buildBoundaryDeadTrees() {
    // Weathered dead trees near boundaries
    const treePositions = [
      [-52, 28], [-44, 46], [42, 45], [54, 26],
      [-56, -22], [-42, -50], [40, -48], [55, -24],
      [-22, 58], [24, 58], [-20, -60], [22, -62]
    ];

    treePositions.forEach(([tx, tz], idx) => {
      const tree = new THREE.Group();
      tree.position.set(tx, 0, tz);

      const h = 5.2 + (idx % 3) * 0.9;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.48, h, 6), this.matDeadWood);
      trunk.position.y = h / 2;
      trunk.castShadow = true;
      tree.add(trunk);

      // 3 gnarled bare branches
      [0.2, 2.2, 4.3].forEach(a => {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 2.8, 5), this.matDeadWood);
        b.position.set(Math.cos(a) * 0.6, h * 0.72, Math.sin(a) * 0.6);
        b.rotation.z = Math.cos(a) * 0.7;
        b.rotation.x = Math.sin(a) * 0.7;
        b.castShadow = true;
        tree.add(b);
      });

      this.group.add(tree);

      this.colliders.push({
        type: 'box',
        box: new THREE.Box3(
          new THREE.Vector3(tx - 0.9, 0, tz - 0.9),
          new THREE.Vector3(tx + 0.9, 5.5, tz + 0.9)
        )
      });
    });
  }

  buildPlayerGuidance() {
    // 1. Clearly visible Circular Pathway around the central platform (radius 13.5m)
    const circlePathGeo = new THREE.RingGeometry(12.6, 14.8, 48);
    const circlePathMat = new THREE.MeshStandardMaterial({
      color: 0x6a6660,
      roughness: 0.92,
      metalness: 0.05
    });
    const circlePath = new THREE.Mesh(circlePathGeo, circlePathMat);
    circlePath.rotation.x = -Math.PI / 2;
    circlePath.position.y = 0.02;
    circlePath.receiveShadow = true;
    this.group.add(circlePath);

    // 2. Natural stone walking paths leading from southern spawn point (0, 0, 32) to central platform
    const pathGroup = new THREE.Group();
    for (let z = 14.5; z <= 32.0; z += 1.8) {
      const stepW = 2.4 + Math.sin(z) * 0.2;
      const stepL = 1.3;
      const step = new THREE.Mesh(new THREE.BoxGeometry(stepW, 0.06, stepL), this.matPlatform);
      step.position.set((Math.sin(z * 0.8) * 0.15), 0.03, z);
      step.receiveShadow = true;
      pathGroup.add(step);
    }
    this.group.add(pathGroup);

    // 3. Weathered wooden direction signs pointing toward the main puzzle
    this.createDirectionSign(0, 30.5, 0.0, '➔ WATER SANCTUARY');
    this.createDirectionSign(-15.5, 14.0, 0.7, '➔ CENTRAL ALTAR');
    this.createDirectionSign(15.5, 14.0, -0.7, '➔ CENTRAL ALTAR');

    // 4. Soft blue guiding lights along the pathways
    const lanternPositions = [
      [1.6, 28], [-1.6, 28],
      [1.6, 21], [-1.6, 21],
      [1.6, 15], [-1.6, 15],
      // Around circular path
      [13.8, 0], [-13.8, 0],
      [0, -13.8], [9.8, 9.8], [-9.8, 9.8],
      [9.8, -9.8], [-9.8, -9.8]
    ];

    lanternPositions.forEach(([lx, lz]) => {
      const post = new THREE.Group();
      post.position.set(lx, 0, lz);

      // Wooden stake
      const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.75, 6), this.matSignWood);
      stake.position.y = 0.38;
      stake.castShadow = true;
      post.add(stake);

      // Glowing blue luminescent crystal lantern
      const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), this.matGuidingLantern);
      lantern.position.y = 0.82;
      post.add(lantern);

      // Soft blue point light
      const light = new THREE.PointLight(0x0099ff, 0.85, 6.5, 1.8);
      light.position.y = 0.85;
      post.add(light);
      this.guidingLights.push(light);

      this.group.add(post);
    });
  }

  createDirectionSign(x, z, rotY, text) {
    const signGroup = new THREE.Group();
    signGroup.position.set(x, 0, z);
    signGroup.rotation.y = rotY;

    // Wooden post
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 2.0, 6), this.matSignWood);
    post.position.y = 1.0;
    post.castShadow = true;
    signGroup.add(post);

    // Direction board with carved arrow
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.1), this.matSignWood);
    board.position.set(0, 1.75, 0.1);
    board.castShadow = true;
    signGroup.add(board);

    // Direction label canvas
    const { canvas, ctx } = window.textureGen.createCanvas(256, 64);
    ctx.fillStyle = '#4a3d2e';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#00e1ff';
    ctx.font = 'bold 20px "Cinzel", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);

    const labelTex = new THREE.CanvasTexture(canvas);
    const labelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.4),
      new THREE.MeshBasicMaterial({ map: labelTex, transparent: true })
    );
    labelMesh.position.set(0, 1.75, 0.16);
    signGroup.add(labelMesh);

    this.group.add(signGroup);

    this.colliders.push({
      type: 'box',
      box: new THREE.Box3(
        new THREE.Vector3(x - 0.6, 0, z - 0.6),
        new THREE.Vector3(x + 0.6, 2.2, z + 0.6)
      )
    });
  }

  buildCentralCircularPlatform() {
    // Large circular stone platform at center (radius 12m, height 0.25m)
    const platformGroup = new THREE.Group();
    platformGroup.position.set(0, 0, 0);

    // 1. Raised Stone Dais
    const dais = new THREE.Mesh(
      new THREE.CylinderGeometry(11.8, 12.2, 0.25, 48),
      this.matPlatform
    );
    dais.position.y = 0.125;
    dais.receiveShadow = true;
    platformGroup.add(dais);

    // 2. Concentric Engraved Rune Rings
    this.runeRingOuter = new THREE.Mesh(
      new THREE.RingGeometry(10.2, 10.9, 48),
      new THREE.MeshStandardMaterial({
        color: 0x00aaff,
        emissive: 0x0077dd,
        emissiveIntensity: 0.35,
        roughness: 0.3,
        metalness: 0.4
      })
    );
    this.runeRingOuter.rotation.x = -Math.PI / 2;
    this.runeRingOuter.position.y = 0.26;
    platformGroup.add(this.runeRingOuter);

    this.runeRingInner = new THREE.Mesh(
      new THREE.RingGeometry(5.2, 5.8, 36),
      new THREE.MeshStandardMaterial({
        color: 0x00c8ff,
        emissive: 0x0088ee,
        emissiveIntensity: 0.45,
        roughness: 0.3,
        metalness: 0.4
      })
    );
    this.runeRingInner.rotation.x = -Math.PI / 2;
    this.runeRingInner.position.y = 0.26;
    platformGroup.add(this.runeRingInner);

    this.group.add(platformGroup);
  }

  buildFourStonePillars() {
    // 4 Ancient Stone Pillars placed evenly around the circular platform (radius 8.8m)
    // Pillar 1: ☁️ CLOUD (North: 0, 0, -8.8)
    // Pillar 2: 🌧️ RAIN  (East:  8.8, 0, 0)
    // Pillar 3: 🏞️ LAKE  (South: 0, 0, 8.8)
    // Pillar 4: 🌊 OCEAN (West:  -8.8, 0, 0)

    Object.keys(this.pillarConfigs).forEach(key => {
      const cfg = this.pillarConfigs[key];
      const pGroup = new THREE.Group();
      pGroup.position.copy(cfg.pos);

      // Plinth Base
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 0.4, 8), this.matPlatform);
      plinth.position.y = 0.2;
      plinth.receiveShadow = true;
      pGroup.add(plinth);

      // Carved Monolithic Stone Pillar
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.4, 0.8), this.matRock);
      shaft.position.y = 1.9;
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      pGroup.add(shaft);

      // Pillar Head Cap
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 1.0), this.matRock);
      cap.position.y = 3.65;
      cap.castShadow = true;
      pGroup.add(cap);

      // Carved Symbol Face Plate (faces center 0,0,0)
      const lookAngle = Math.atan2(-cfg.pos.x, -cfg.pos.z);
      const symbolGroup = new THREE.Group();
      symbolGroup.rotation.y = lookAngle;

      const { canvas, ctx } = window.textureGen.createCanvas(256, 256);
      ctx.fillStyle = '#1c222c';
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = '#00a2ff';
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, 236, 236);

      // Draw Emoji / Icon
      ctx.font = '96px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cfg.icon, 128, 110);

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px "Cinzel", Georgia, serif';
      ctx.fillText(key.toUpperCase(), 128, 195);

      const symTex = new THREE.CanvasTexture(canvas);
      const symMat = new THREE.MeshStandardMaterial({
        map: symTex,
        roughness: 0.35,
        metalness: 0.2,
        emissive: 0x0088ee,
        emissiveIntensity: 0.7
      });
      const symMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), symMat);
      symMesh.position.set(0, 2.1, 0.42);
      symbolGroup.add(symMesh);
      pGroup.add(symbolGroup);

      // Soft faint blue point light on each pillar
      const pLight = new THREE.PointLight(0x0099ff, 1.2, 9, 1.8);
      pLight.position.set(0, 2.4, 0);
      pGroup.add(pLight);

      // Glowing rune ring on ground at pillar base
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0x00a2ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35
      });
      const aura = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.8, 16), auraMat);
      aura.rotation.x = -Math.PI / 2;
      aura.position.y = 0.26;
      pGroup.add(aura);

      this.group.add(pGroup);

      // Pillar Collider
      this.colliders.push({
        type: 'box',
        box: new THREE.Box3(
          new THREE.Vector3(cfg.pos.x - 1.0, 0, cfg.pos.z - 1.0),
          new THREE.Vector3(cfg.pos.x + 1.0, 3.8, cfg.pos.z + 1.0)
        )
      });

      // Save pillar reference
      this.pillars[key] = {
        config: cfg,
        group: pGroup,
        symMat: symMat,
        light: pLight,
        auraMat: auraMat,
        activated: false
      };

      // Register Interactable
      this.interactables.push({
        type: 'water_pillar',
        id: key,
        name: cfg.name,
        icon: cfg.icon,
        position: new THREE.Vector3(cfg.pos.x, 1.8, cfg.pos.z),
        radius: 3.6,
        isCollected: false,
        getPrompt: () => {
          if (!window.puzzleManager) return 'Inspect Pillar';
          if (window.puzzleManager.allCluesDiscovered) {
            return `Connect Symbol: ${cfg.icon} ${key.toUpperCase()}`;
          }
          return `Inspect Pillar: ${cfg.icon} ${key.toUpperCase()}`;
        }
      });
    });
  }

  buildEnergyChannels() {
    // Connect Cloud(N) -> Rain(E) -> Lake(S) -> Ocean(W)
    const connections = [
      { from: this.pillarConfigs.cloud.pos, to: this.pillarConfigs.rain.pos, id: 'cloud_to_rain' },
      { from: this.pillarConfigs.rain.pos, to: this.pillarConfigs.lake.pos, id: 'rain_to_lake' },
      { from: this.pillarConfigs.lake.pos, to: this.pillarConfigs.ocean.pos, id: 'lake_to_ocean' },
      { from: this.pillarConfigs.ocean.pos, to: this.pillarConfigs.cloud.pos, id: 'ocean_to_cloud' }
    ];

    connections.forEach((conn, idx) => {
      const start = conn.from;
      const end = conn.to;
      const dist = start.distanceTo(end);
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

      // 1. Rising stone pathway segment
      const pathGeo = new THREE.BoxGeometry(1.6, 0.12, dist);
      const pathMat = new THREE.MeshStandardMaterial({
        color: 0x6e7884,
        roughness: 0.8,
        metalness: 0.05
      });
      const pathMesh = new THREE.Mesh(pathGeo, pathMat);
      pathMesh.position.set(mid.x, 0.22, mid.z);
      pathMesh.lookAt(end.x, 0.22, end.z);
      pathMesh.receiveShadow = true;
      this.group.add(pathMesh);
      this.risingPaths.push(pathMesh);

      // 2. Engraved central water energy conduit line
      const lineGeo = new THREE.BoxGeometry(0.32, 0.16, dist * 0.98);
      const lineMat = new THREE.MeshStandardMaterial({
        color: 0x00e1ff,
        emissive: 0x0077cc,
        emissiveIntensity: 0.1, // Dormant
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.5
      });
      const lineMesh = new THREE.Mesh(lineGeo, lineMat);
      lineMesh.position.set(mid.x, 0.26, mid.z);
      lineMesh.lookAt(end.x, 0.26, end.z);
      this.group.add(lineMesh);

      this.animatedChannels.push({
        id: conn.id,
        mesh: lineMesh,
        mat: lineMat,
        pathMesh: pathMesh,
        active: false,
        pulseOffset: idx * 0.5
      });
    });
  }

  buildCentralAltarAndCrystal() {
    // Central Circular Altar at (0, 0, 0)
    const altarGroup = new THREE.Group();
    altarGroup.position.set(0, 0, 0);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.9, 0.8, 24), this.matPlatform);
    base.position.y = 0.4;
    base.castShadow = true;
    base.receiveShadow = true;
    altarGroup.add(base);

    // Circular Altar Ring with water symbols
    const rim = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.18, 12, 32), this.matPillarRune);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.82;
    altarGroup.add(rim);

    // Altar Center Basin
    const basin = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 0.3, 24),
      new THREE.MeshStandardMaterial({ color: 0x112233, roughness: 0.2, metalness: 0.8 })
    );
    basin.position.y = 0.75;
    altarGroup.add(basin);

    this.group.add(altarGroup);

    this.colliders.push({
      type: 'box',
      box: new THREE.Box3(
        new THREE.Vector3(-2.6, 0, -2.6),
        new THREE.Vector3(2.6, 1.2, 2.6)
      )
    });

    // Hidden until reveal cutscene: The Sacred Blue Water Crystal
    this.crystalGroup = new THREE.Group();
    this.crystalGroup.position.set(0, -1.0, 0); // Beneath altar initially
    this.crystalGroup.visible = false;

    const crystalGeo = new THREE.OctahedronGeometry(1.3, 0);
    crystalGeo.scale(0.85, 1.6, 0.85);

    this.crystalMat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      emissive: 0x0099ff,
      emissiveIntensity: 2.2,
      roughness: 0.12,
      metalness: 0.9,
      transparent: true,
      opacity: 0.94
    });
    this.blueCrystal = new THREE.Mesh(crystalGeo, this.crystalMat);
    this.crystalGroup.add(this.blueCrystal);

    this.crystalLight = new THREE.PointLight(0x00d4ff, 3.5, 22, 1.2);
    this.crystalGroup.add(this.crystalLight);

    // Sparkling water particles around crystal
    const pCount = 60;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const a = (i / pCount) * Math.PI * 6;
      const r = 0.8 + (i / pCount) * 1.6;
      pPos[i * 3] = Math.cos(a) * r;
      pPos[i * 3 + 1] = ((i / pCount) - 0.5) * 2.8;
      pPos[i * 3 + 2] = Math.sin(a) * r;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    this.crystalParticles = new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: 0x99eaff,
      size: 0.24,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    }));
    this.crystalGroup.add(this.crystalParticles);

    // Rising Light Beam
    const beamGeo = new THREE.CylinderGeometry(1.8, 3.2, 120, 20, 1, true);
    this.beamMat = new THREE.MeshBasicMaterial({
      color: 0x00a2ff,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.lightBeam = new THREE.Mesh(beamGeo, this.beamMat);
    this.lightBeam.position.set(0, 60, 0);
    this.group.add(this.lightBeam);

    this.group.add(this.crystalGroup);

    // Radial expanding water pulse wave mesh
    const pulseGeo = new THREE.RingGeometry(0.5, 1.8, 48);
    this.pulseMat = new THREE.MeshBasicMaterial({
      color: 0x00e1ff,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    this.pulseMesh = new THREE.Mesh(pulseGeo, this.pulseMat);
    this.pulseMesh.rotation.x = -Math.PI / 2;
    this.pulseMesh.position.y = 0.08;
    this.group.add(this.pulseMesh);
  }

  buildWindParticles() {
    // Calm ambient wind particles gently drifting across the lake bed
    const pCount = 350;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 160;
      pPos[i * 3 + 1] = 0.5 + Math.random() * 8.0;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 160;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xd8e8f5,
      size: 0.18,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    this.windSystem = new THREE.Points(pGeo, pMat);
    this.group.add(this.windSystem);
  }

  buildMapBoundaries() {
    // Invisible map boundary circle at radius 85m to keep player safely inside the playable lake
    // Prevents player from wandering into unreachable terrain or missing objectives
    const segs = 32;
    const boundaryRadius = 82;
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const nx = Math.cos(a) * boundaryRadius;
      const nz = Math.sin(a) * boundaryRadius;
      this.colliders.push({
        type: 'box',
        box: new THREE.Box3(
          new THREE.Vector3(nx - 4.5, 0, nz - 4.5),
          new THREE.Vector3(nx + 4.5, 12, nz + 4.5)
        )
      });
    }
  }

  // ==========================================
  // Connection Mechanics & Visual Progression
  // ==========================================

  activateConnectionStep(stepIndex) {
    // stepIndex: 1 = Cloud, 2 = Rain, 3 = Lake, 4 = Ocean
    this.connectionStep = stepIndex;

    const orderKeys = ['cloud', 'rain', 'lake', 'ocean'];
    const currentKey = orderKeys[stepIndex - 1];

    // 1. Pillar glows brighter
    if (this.pillars[currentKey]) {
      const p = this.pillars[currentKey];
      p.activated = true;
      p.symMat.emissiveIntensity = 2.4;
      p.light.intensity = 3.5;
      p.auraMat.opacity = 0.9;
    }

    // 2. Channel connecting previous to current activates and stone path rises
    if (stepIndex >= 2) {
      const channelIdx = stepIndex - 2;
      if (this.animatedChannels[channelIdx]) {
        const c = this.animatedChannels[channelIdx];
        c.active = true;
        c.mat.emissiveIntensity = 2.2;
        c.mat.opacity = 0.95;
        // Stone pathway elevates slightly
        if (c.pathMesh) {
          c.pathMesh.position.y = 0.32;
        }
      }
    }

    // 3. Platform brightness scales with progress
    if (this.runeRingOuter) {
      this.runeRingOuter.material.emissiveIntensity = 0.35 + stepIndex * 0.4;
    }
    if (this.runeRingInner) {
      this.runeRingInner.material.emissiveIntensity = 0.45 + stepIndex * 0.5;
    }
  }

  resetConnectionAttempt() {
    this.connectionStep = 0;
    this.connectedPillars = [];

    // Reset pillar glow to dormant faint blue
    Object.keys(this.pillars).forEach(key => {
      const p = this.pillars[key];
      p.activated = false;
      p.symMat.emissiveIntensity = 0.7;
      p.light.intensity = 1.2;
      p.auraMat.opacity = 0.35;
    });

    // Reset channels
    this.animatedChannels.forEach(c => {
      c.active = false;
      c.mat.emissiveIntensity = 0.1;
      c.mat.opacity = 0.5;
      if (c.pathMesh) {
        c.pathMesh.position.y = 0.22;
      }
    });

    // Reset platform glow
    if (this.runeRingOuter) this.runeRingOuter.material.emissiveIntensity = 0.35;
    if (this.runeRingInner) this.runeRingInner.material.emissiveIntensity = 0.45;
  }

  // Trigger Crystal Reveal Cutscene
  triggerCrystalRevealCinematic() {
    this.puzzleSolved = true;
    this.cutsceneActive = true;
    this.cutsceneTimer = 0;

    // Connect final channel (Ocean to Cloud completing circuit)
    if (this.animatedChannels[3]) {
      this.animatedChannels[3].active = true;
      this.animatedChannels[3].mat.emissiveIntensity = 2.5;
      this.animatedChannels[3].mat.opacity = 0.95;
    }

    // 1. Camera focus on center altar & shake
    if (window.gameManager && window.gameManager.player) {
      window.gameManager.player.triggerCutsceneFocus(new THREE.Vector3(0, 2.5, 0), 4.5);
      window.gameManager.player.addCameraShake(0.42, 2.8);
    }

    // 2. Play sound effects
    if (window.soundSystem) {
      window.soundSystem.playBlueShrineBeam();
    }

    // 3. Reveal crystal and raise it
    this.crystalGroup.visible = true;
    this.crystalRevealed = true;

    // 4. Register Crystal Collection Interactable after reveal
    setTimeout(() => {
      this.interactables.push({
        type: 'water_crystal',
        id: 'water_crystal',
        name: 'Water Crystal',
        icon: '💎',
        position: new THREE.Vector3(0, 2.5, 0),
        radius: 3.8,
        isCollected: false,
        getPrompt: () => 'Collect Water Crystal'
      });
    }, 3800);
  }

  // Trigger Water Pulse Wave upon Crystal Collection
  triggerWaterPulseWave() {
    this.pulseActive = true;
    this.pulseRadius = 1.0;
    if (this.pulseMesh) {
      this.pulseMesh.scale.set(1, 1, 1);
      this.pulseMat.opacity = 0.85;
    }
  }

  update(delta, time) {
    // 1. Animate wind particles
    if (this.windSystem) {
      const pos = this.windSystem.geometry.attributes.position.array;
      const count = pos.length / 3;
      for (let i = 0; i < count; i++) {
        pos[i * 3] += delta * 6.5; // Wind blowing East
        if (pos[i * 3] > 80) pos[i * 3] = -80;
        pos[i * 3 + 1] += Math.sin(time * 2.0 + i) * 0.01;
      }
      this.windSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Animate active energy channels
    this.animatedChannels.forEach((c) => {
      if (c.active) {
        c.mat.emissiveIntensity = 2.0 + Math.sin(time * 6.0 + c.pulseOffset) * 0.6;
      }
    });

    // 3. Animate crystal emergence and hover
    if (this.crystalRevealed && this.crystalGroup) {
      // Rise from beneath altar up to eye level y = 2.6
      if (this.crystalGroup.position.y < 2.6) {
        this.crystalGroup.position.y += delta * 0.85;
      } else {
        this.crystalGroup.position.y = 2.6 + Math.sin(time * 2.5) * 0.15;
      }

      // Rotate slowly
      if (this.blueCrystal) {
        this.blueCrystal.rotation.y += delta * 1.1;
        this.blueCrystal.rotation.x = Math.sin(time * 1.6) * 0.12;
      }

      // Particle orbit
      if (this.crystalParticles) {
        this.crystalParticles.rotation.y += delta * 1.5;
      }

      // Pillar of light beam fade
      if (this.lightBeam && this.beamMat) {
        if (this.beamMat.opacity < 0.85) {
          this.beamMat.opacity = Math.min(0.85, this.beamMat.opacity + delta * 0.6);
        }
      }
    }

    // 4. Animate expanding water pulse wave
    if (this.pulseActive && this.pulseMesh) {
      this.pulseRadius += delta * 45;
      const scale = this.pulseRadius;
      this.pulseMesh.scale.set(scale, scale, 1);
      this.pulseMat.opacity = Math.max(0, 0.85 - this.pulseRadius / 75);
      if (this.pulseRadius > 75) {
        this.pulseActive = false;
        this.pulseMat.opacity = 0;
      }
    }
  }
}

window.LakeLevel = LakeLevel;
