/**
 * lake.js - Level 2: "WATER REALM – THE DRIED LAKE"
 * Completely dedicated open dried lake environment.
 * 
 * Strict Design Specifications:
 * - NO temples, NO fire theme, NO ruins, NO pillars, NO towers, NO vertical structures.
 * - NO elevated platforms. Flat playable terrain (y = 0.0).
 * - Large open dried lake bed with detailed cracked dry ground textures.
 * - Center area is completely open.
 * - Distant mountains encircling the horizon.
 * - Small rocks only around the edges.
 * - Dead weathered trees only at far outer boundaries.
 * - Bright daylight with light blue atmosphere.
 * - 4 Stone Tablets placed DIRECTLY ON THE GROUND arranged in a large circle:
 *     Stone 1: ☁️ CLOUD ("Water begins its journey in the sky.")
 *     Stone 2: 🌧️ RAIN  ("Clouds release water back to the earth.")
 *     Stone 3: 🏞️ LAKE  ("Rainwater gathers and forms lakes.")
 *     Stone 4: 🌊 RIVER ("Water flows through rivers and continues the cycle.")
 * - Player movement: Walkable route, cannot get stuck, cannot fall into gaps, cannot walk through walls or leave map.
 * - Puzzle: Connect CLOUD ➔ RAIN ➔ LAKE ➔ RIVER.
 * - FX: Blue glowing ground paths, water particles, ground energy effects.
 * - Crystal Reveal: Center of dried lake cracks open, blue light emerges, glowing Blue Water Crystal rises.
 */

class LakeLevel {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.colliders = [];
    this.interactables = [];
    this.animatedChannels = [];
    this.fissurePlates = [];
    this.waterParticlesSystems = [];

    // Puzzle connection state
    this.connectionStep = 0; // 0: None, 1: Cloud, 2: Rain, 3: Lake, 4: River (Solved)
    this.connectedTablets = [];
    this.puzzleSolved = false;
    this.crystalRevealed = false;
    this.crystalCollected = false;

    // Cinematic & Reveal state
    this.cutsceneActive = false;
    this.cutsceneTimer = 0;
    this.fissureCrackProgress = 0.0; // 0.0 closed to 1.0 fully cracked open

    // Radial water pulse wave
    this.pulseMesh = null;
    this.pulseRadius = 0;
    this.pulseActive = false;

    // 4 Ground Stone Tablet Configurations
    // Arranged in a circle of radius 14m on the flat lake bed:
    // Cloud (North: 0, 0, -14)
    // Rain  (East:  14, 0, 0)
    // Lake  (South: 0, 0, 14)
    // River (West: -14, 0, 0)
    this.tablets = {};
    this.tabletOrder = ['cloud', 'rain', 'lake', 'river'];
    this.tabletConfigs = {
      cloud: {
        id: 'cloud',
        name: 'Cloud Tablet',
        icon: '☁️',
        pos: new THREE.Vector3(0, 0.04, -14.0),
        clue: 'Water begins its journey in the sky.'
      },
      rain: {
        id: 'rain',
        name: 'Rain Tablet',
        icon: '🌧️',
        pos: new THREE.Vector3(14.0, 0.04, 0),
        clue: 'Clouds release water back to the earth.'
      },
      lake: {
        id: 'lake',
        name: 'Lake Tablet',
        icon: '🏞️',
        pos: new THREE.Vector3(0, 0.04, 14.0),
        clue: 'Rainwater gathers and forms lakes.'
      },
      river: {
        id: 'river',
        name: 'River Tablet',
        icon: '🌊',
        pos: new THREE.Vector3(-14.0, 0.04, 0),
        clue: 'Water flows through rivers and continues the cycle.'
      }
    };

    // Backward-compatibility alias for puzzle manager references
    this.pillarConfigs = this.tabletConfigs;
    this.pillars = this.tablets;

    this.initMaterials();
    this.buildLighting();
    this.buildAtmosphere();
    this.buildDryLakeBed();
    this.buildDistantMountains();
    this.buildEdgeRocks();
    this.buildBoundaryDeadTrees();
    this.buildFourGroundStoneTablets();
    this.buildGroundEnergyChannels();
    this.buildCenterCrackingFissureAndCrystal();
    this.buildWindParticles();
    this.buildMapBoundaries();
  }

  initMaterials() {
    // 1. Cracked dry ground texture
    const crackedTex = window.textureGen.getCrackedEarth(512, 512);
    crackedTex.repeat.set(24, 24);

    // 2. Weathered basalt / slate stone texture for flat tablets
    const stoneTex = window.textureGen.getAncientStone(512, 512);
    stoneTex.repeat.set(2, 2);

    this.matLakeBed = new THREE.MeshStandardMaterial({
      map: crackedTex,
      roughness: 0.94,
      metalness: 0.02,
      color: 0x8b857d // Warm dry earth tone
    });

    this.matStoneTablet = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.82,
      metalness: 0.12,
      color: 0x3d434d // Dark ancient slate stone
    });

    this.matTabletRim = new THREE.MeshStandardMaterial({
      roughness: 0.75,
      metalness: 0.25,
      color: 0x2a303a
    });

    this.matRock = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.9,
      metalness: 0.05,
      color: 0x62666d
    });

    this.matDeadWood = new THREE.MeshStandardMaterial({
      color: 0x383127,
      roughness: 0.96,
      metalness: 0.02
    });

    // Glowing ground conduit material
    this.matEnergyConduit = new THREE.MeshStandardMaterial({
      color: 0x00e1ff,
      emissive: 0x0088ee,
      emissiveIntensity: 0.12,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.65
    });
  }

  buildLighting() {
    // Bright natural daylight
    this.ambientLight = new THREE.AmbientLight(0xcde1f2, 1.05);
    this.group.add(this.ambientLight);

    // Directional Sun Light casting crisp ground shadows
    this.dirLight = new THREE.DirectionalLight(0xfff6e8, 1.45);
    this.dirLight.position.set(40, 85, 30);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1536;
    this.dirLight.shadow.mapSize.height = 1536;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 280;
    const d = 85;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0004;
    this.group.add(this.dirLight);

    // Soft sky fill light
    this.skyFill = new THREE.DirectionalLight(0x75bfe8, 0.45);
    this.skyFill.position.set(-35, 55, -35);
    this.group.add(this.skyFill);
  }

  buildAtmosphere() {
    // Bright daylight with light blue atmosphere
    this.scene.fog = new THREE.FogExp2(0x94b4c8, 0.0065);
    this.scene.background = new THREE.Color(0xa2bed4);

    // Light blue sky dome
    const skyGeo = new THREE.SphereGeometry(260, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x90b5cf,
      side: THREE.BackSide
    });
    this.group.add(new THREE.Mesh(skyGeo, skyMat));
  }

  buildDryLakeBed() {
    // Large, flat open circular dried lake bed at y = 0.0
    // Perfectly flat so player can never get stuck or fall into gaps
    const bedGeo = new THREE.PlaneGeometry(280, 280);
    const bedMesh = new THREE.Mesh(bedGeo, this.matLakeBed);
    bedMesh.rotation.x = -Math.PI / 2;
    bedMesh.position.y = 0.0;
    bedMesh.receiveShadow = true;
    this.group.add(bedMesh);

    // Faint natural dried lake rim ring on ground (radius 18m) framing the wide circle
    const ringGeo = new THREE.RingGeometry(17.4, 18.2, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x7a746c,
      roughness: 0.95,
      metalness: 0.02,
      transparent: true,
      opacity: 0.65
    });
    const lakeRing = new THREE.Mesh(ringGeo, ringMat);
    lakeRing.rotation.x = -Math.PI / 2;
    lakeRing.position.y = 0.01;
    lakeRing.receiveShadow = true;
    this.group.add(lakeRing);
  }

  buildDistantMountains() {
    // Distant mountain ridges encircling the horizon far from playable area (r ~ 130m)
    const mountainGroup = new THREE.Group();
    const count = 24;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = 125 + ((i * 17) % 22);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      const h = 38 + ((i * 7) % 28);
      const r = 22 + ((i * 5) % 16);

      const mGeo = new THREE.ConeGeometry(r, h, 6);
      const mMesh = new THREE.Mesh(mGeo, this.matRock);
      mMesh.position.set(x, h / 2 - 4, z);
      mMesh.receiveShadow = true;
      mountainGroup.add(mMesh);
    }
    this.group.add(mountainGroup);
  }

  buildEdgeRocks() {
    // Small rocks located strictly around edges (radius 50m to 70m)
    // Center area (radius < 20m) remains completely open!
    const rockPositions = [
      { x: -48, z: 24, s: 1.1 }, { x: -54, z: 28, s: 0.8 }, { x: -44, z: 38, s: 0.9 },
      { x: 46, z: 26, s: 1.2 },  { x: 52, z: 32, s: 0.8 }, { x: 42, z: 42, s: 0.7 },
      { x: -48, z: -28, s: 1.3 }, { x: -42, z: -44, s: 1.0 }, { x: -55, z: -20, s: 0.7 },
      { x: 48, z: -26, s: 1.2 },  { x: 42, z: -46, s: 0.9 }, { x: 54, z: -22, s: 0.8 },
      { x: 0, z: -62, s: 1.4 },   { x: -16, z: -60, s: 1.0 }, { x: 18, z: -58, s: 0.9 },
      { x: 0, z: 62, s: 1.4 },    { x: -18, z: 58, s: 1.1 },  { x: 20, z: 60, s: 0.9 }
    ];

    rockPositions.forEach(cfg => {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(cfg.s, 1), this.matRock);
      rock.position.set(cfg.x, cfg.s * 0.48, cfg.z);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.group.add(rock);

      if (cfg.s >= 1.0) {
        this.colliders.push({
          type: 'box',
          box: new THREE.Box3().setFromObject(rock)
        });
      }
    });

    // Small pebbles scattered near boundaries
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 40 + Math.random() * 32;
      const px = Math.cos(a) * r;
      const pz = Math.sin(a) * r;
      const pebble = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2 + Math.random() * 0.2), this.matRock);
      pebble.position.set(px, 0.08, pz);
      pebble.receiveShadow = true;
      this.group.add(pebble);
    }
  }

  buildBoundaryDeadTrees() {
    // Dead weathered trees located ONLY at far boundaries (radius 62m to 72m)
    const treePositions = [
      [-58, 30], [-48, 52], [48, 50], [60, 28],
      [-62, -24], [-46, -56], [46, -54], [62, -26],
      [-26, 64], [28, 64], [-24, -66], [26, -68]
    ];

    treePositions.forEach(([tx, tz], idx) => {
      const tree = new THREE.Group();
      tree.position.set(tx, 0, tz);

      const h = 4.8 + (idx % 3) * 0.8;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.44, h, 6), this.matDeadWood);
      trunk.position.y = h / 2;
      trunk.castShadow = true;
      tree.add(trunk);

      // Bare gnarled branches
      [0.3, 2.4, 4.5].forEach(a => {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.14, 2.5, 5), this.matDeadWood);
        b.position.set(Math.cos(a) * 0.5, h * 0.72, Math.sin(a) * 0.5);
        b.rotation.z = Math.cos(a) * 0.65;
        b.rotation.x = Math.sin(a) * 0.65;
        b.castShadow = true;
        tree.add(b);
      });

      this.group.add(tree);

      this.colliders.push({
        type: 'box',
        box: new THREE.Box3(
          new THREE.Vector3(tx - 0.8, 0, tz - 0.8),
          new THREE.Vector3(tx + 0.8, 5.0, tz + 0.8)
        )
      });
    });
  }

  buildFourGroundStoneTablets() {
    // Four Stone Tablets placed DIRECTLY ON THE GROUND arranged in a large circle (radius 14.0m)
    // NO PILLARS, NO TOWERS, NO VERTICAL OBSTACLES, NO ELEVATED PLATFORMS!
    // The player simply walks up to them on the flat cracked earth.
    //
    // Stone 1: ☁️ CLOUD (North: 0, 0, -14.0)
    // Stone 2: 🌧️ RAIN  (East:  14.0, 0, 0)
    // Stone 3: 🏞️ LAKE  (South: 0, 0, 14.0)
    // Stone 4: 🌊 RIVER (West: -14.0, 0, 0)

    Object.keys(this.tabletConfigs).forEach(key => {
      const cfg = this.tabletConfigs[key];
      const tGroup = new THREE.Group();
      tGroup.position.set(cfg.pos.x, 0, cfg.pos.z);

      // 1. Flat Carved Slate Ground Tablet (height: 0.06m, flush on ground)
      const tabletGeo = new THREE.BoxGeometry(2.4, 0.06, 2.4);
      const tabletMesh = new THREE.Mesh(tabletGeo, this.matStoneTablet);
      tabletMesh.position.y = 0.03;
      tabletMesh.receiveShadow = true;
      tabletMesh.castShadow = true;
      tGroup.add(tabletMesh);

      // 2. Chamfered outer stone rim border
      const rimGeo = new THREE.RingGeometry(1.65, 1.85, 32);
      const rimMesh = new THREE.Mesh(rimGeo, this.matTabletRim);
      rimMesh.rotation.x = -Math.PI / 2;
      rimMesh.position.y = 0.062;
      rimMesh.receiveShadow = true;
      tGroup.add(rimMesh);

      // 3. High-definition Symbol & Glyph Inscription on top surface of tablet
      const { canvas, ctx } = window.textureGen.createCanvas(512, 512);
      // Slate background
      ctx.fillStyle = '#1c222c';
      ctx.fillRect(0, 0, 512, 512);

      // Carved concentric circular rune border
      ctx.strokeStyle = '#00a2ff';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(256, 256, 226, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(256, 256, 206, 0, Math.PI * 2);
      ctx.stroke();

      // Emoji Symbol Icon
      ctx.font = '160px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cfg.icon, 256, 210);

      // Carved Rune Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 50px "Cinzel", Georgia, serif';
      ctx.fillText(key.toUpperCase(), 256, 375);

      // Subtitle
      ctx.fillStyle = '#7ad7ff';
      ctx.font = 'bold 24px "Cinzel", Georgia, serif';
      ctx.fillText('WATER CYCLE', 256, 430);

      const symTex = new THREE.CanvasTexture(canvas);
      const symMat = new THREE.MeshStandardMaterial({
        map: symTex,
        roughness: 0.35,
        metalness: 0.2,
        emissive: 0x0088ee,
        emissiveIntensity: 0.6
      });
      const symMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.1), symMat);
      symMesh.rotation.x = -Math.PI / 2;
      symMesh.position.y = 0.065; // Lying flat directly on top of the stone slab
      symMesh.receiveShadow = true;
      tGroup.add(symMesh);

      // 4. Soft faint blue ambient point light hovering above the tablet
      const tLight = new THREE.PointLight(0x00aaff, 1.2, 8.0, 1.8);
      tLight.position.set(0, 0.45, 0);
      tGroup.add(tLight);

      // 5. Glowing ground rune ring on the cracked earth surrounding the tablet
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0x00a2ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35
      });
      const aura = new THREE.Mesh(new THREE.RingGeometry(1.85, 2.4, 32), auraMat);
      aura.rotation.x = -Math.PI / 2;
      aura.position.y = 0.015;
      tGroup.add(aura);

      this.group.add(tGroup);

      // Save tablet reference
      this.tablets[key] = {
        config: cfg,
        group: tGroup,
        symMat: symMat,
        light: tLight,
        auraMat: auraMat,
        activated: false
      };

      // Register Interactable
      // Generous interaction radius (3.8m) so player can comfortably inspect & connect directly from the ground
      this.interactables.push({
        type: 'water_pillar',
        id: key,
        name: `${cfg.icon} ${cfg.name}`,
        icon: cfg.icon,
        position: new THREE.Vector3(cfg.pos.x, 0.2, cfg.pos.z),
        radius: 3.8,
        isCollected: false,
        getPrompt: () => {
          if (!window.puzzleManager) return `Inspect ${cfg.name}`;
          if (window.puzzleManager.allCluesDiscovered) {
            return `Connect Symbol: ${cfg.icon} ${key.toUpperCase()}`;
          }
          return `Inspect Tablet: ${cfg.icon} ${key.toUpperCase()}`;
        }
      });
    });
  }

  buildGroundEnergyChannels() {
    // 4 Flat Ground Energy Channels connecting:
    // CLOUD (N) ➔ RAIN (E) ➔ LAKE (S) ➔ RIVER (W) ➔ CLOUD (N)
    const connections = [
      { from: this.tabletConfigs.cloud.pos, to: this.tabletConfigs.rain.pos, id: 'cloud_to_rain' },
      { from: this.tabletConfigs.rain.pos,  to: this.tabletConfigs.lake.pos,  id: 'rain_to_lake' },
      { from: this.tabletConfigs.lake.pos,  to: this.tabletConfigs.river.pos, id: 'lake_to_river' },
      { from: this.tabletConfigs.river.pos, to: this.tabletConfigs.cloud.pos, id: 'river_to_cloud' }
    ];

    connections.forEach((conn, idx) => {
      const start = conn.from;
      const end = conn.to;
      const dist = start.distanceTo(end);
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

      // 1. Etched ground path indentation
      const pathGeo = new THREE.BoxGeometry(1.2, 0.02, dist);
      const pathMat = new THREE.MeshStandardMaterial({
        color: 0x5a564e,
        roughness: 0.9,
        metalness: 0.04
      });
      const pathMesh = new THREE.Mesh(pathGeo, pathMat);
      pathMesh.position.set(mid.x, 0.015, mid.z);
      pathMesh.lookAt(end.x, 0.015, end.z);
      pathMesh.receiveShadow = true;
      this.group.add(pathMesh);

      // 2. Glowing central water energy conduit line
      const lineGeo = new THREE.BoxGeometry(0.35, 0.03, dist * 0.96);
      const lineMat = new THREE.MeshStandardMaterial({
        color: 0x00e1ff,
        emissive: 0x0077cc,
        emissiveIntensity: 0.1, // Dormant until activated
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.5
      });
      const lineMesh = new THREE.Mesh(lineGeo, lineMat);
      lineMesh.position.set(mid.x, 0.022, mid.z);
      lineMesh.lookAt(end.x, 0.022, end.z);
      this.group.add(lineMesh);

      // 3. Water particles travelling along active path
      const pCount = 35;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount; i++) {
        const t = i / pCount;
        pPos[i * 3]     = THREE.MathUtils.lerp(start.x, end.x, t);
        pPos[i * 3 + 1] = 0.08 + Math.random() * 0.15;
        pPos[i * 3 + 2] = THREE.MathUtils.lerp(start.z, end.z, t);
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({
        color: 0x6be0ff,
        size: 0.25,
        transparent: true,
        opacity: 0.0, // Invisible until channel activates
        blending: THREE.AdditiveBlending
      });
      const particleSystem = new THREE.Points(pGeo, pMat);
      this.group.add(particleSystem);

      this.animatedChannels.push({
        id: conn.id,
        mesh: lineMesh,
        mat: lineMat,
        pathMesh: pathMesh,
        particleSystem: particleSystem,
        pMat: pMat,
        active: false,
        pulseOffset: idx * 0.5,
        startPos: start.clone(),
        endPos: end.clone()
      });
    });
  }

  buildCenterCrackingFissureAndCrystal() {
    // Center Area: Completely open and flat ground!
    // At center (0, 0, 0), four flat quadrant fissure plates sit flush with the dried lake bed.
    // Upon puzzle completion, these plates crack open and slide outward, allowing the Blue Water Crystal to rise!
    this.fissureGroup = new THREE.Group();
    this.fissureGroup.position.set(0, 0, 0);

    // 4 Flat Quadrant Fissure Plates (forming a sealed circular 4.6m diameter crack)
    const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    angles.forEach((a, i) => {
      const plateGeo = new THREE.CircleGeometry(2.3, 16, a, Math.PI / 2);
      const plateMat = new THREE.MeshStandardMaterial({
        map: window.textureGen.getCrackedEarth(512, 512),
        roughness: 0.94,
        metalness: 0.04,
        color: 0x8b857d
      });
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.rotation.x = -Math.PI / 2;
      plate.position.y = 0.018;
      plate.receiveShadow = true;
      this.fissureGroup.add(plate);

      this.fissurePlates.push({
        mesh: plate,
        angle: a + Math.PI / 4, // Direction to slide open
        origX: plate.position.x,
        origZ: plate.position.z
      });
    });

    // Intense Subterranean Blue Light (beneath the crack)
    this.subterraneanLight = new THREE.PointLight(0x00b4ff, 0.0, 30, 1.4);
    this.subterraneanLight.position.set(0, -0.2, 0);
    this.fissureGroup.add(this.subterraneanLight);

    // Glowing crack fissure lines
    const crackRings = new THREE.Mesh(
      new THREE.RingGeometry(0.1, 2.35, 32),
      new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide
      })
    );
    crackRings.rotation.x = -Math.PI / 2;
    crackRings.position.y = 0.02;
    this.fissureGroup.add(crackRings);
    this.crackGlowMesh = crackRings;

    this.group.add(this.fissureGroup);

    // ========================================================
    // The Sacred Blue Water Crystal (rises from beneath the lake)
    // ========================================================
    this.crystalGroup = new THREE.Group();
    this.crystalGroup.position.set(0, -2.0, 0); // Hidden beneath the ground initially
    this.crystalGroup.visible = false;

    // Sculpted Water Crystal
    const crystalGeo = new THREE.OctahedronGeometry(1.2, 0);
    crystalGeo.scale(0.8, 1.65, 0.8);

    this.crystalMat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      emissive: 0x0099ff,
      emissiveIntensity: 2.2,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.95
    });
    this.blueCrystal = new THREE.Mesh(crystalGeo, this.crystalMat);
    this.crystalGroup.add(this.blueCrystal);

    this.crystalLight = new THREE.PointLight(0x00d4ff, 3.6, 25, 1.2);
    this.crystalGroup.add(this.crystalLight);

    // Orbiting water mist particles around the crystal
    const pCount = 70;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const a = (i / pCount) * Math.PI * 6;
      const r = 0.7 + (i / pCount) * 1.5;
      pPos[i * 3]     = Math.cos(a) * r;
      pPos[i * 3 + 1] = ((i / pCount) - 0.5) * 2.6;
      pPos[i * 3 + 2] = Math.sin(a) * r;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    this.crystalParticles = new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: 0x99eaff,
      size: 0.22,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    }));
    this.crystalGroup.add(this.crystalParticles);

    // Upward beam of light emerging from the crack
    const beamGeo = new THREE.CylinderGeometry(1.5, 2.8, 100, 20, 1, true);
    this.beamMat = new THREE.MeshBasicMaterial({
      color: 0x00a2ff,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.lightBeam = new THREE.Mesh(beamGeo, this.beamMat);
    this.lightBeam.position.set(0, 50, 0);
    this.group.add(this.lightBeam);

    this.group.add(this.crystalGroup);

    // Radial expanding water pulse wave
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
    this.pulseMesh.position.y = 0.03;
    this.group.add(this.pulseMesh);
  }

  buildWindParticles() {
    // Gentle ambient wind motes drifting across the dried lake
    const pCount = 300;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3]     = (Math.random() - 0.5) * 150;
      pPos[i * 3 + 1] = 0.4 + Math.random() * 6.0;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 150;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xd8e8f5,
      size: 0.16,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    this.windSystem = new THREE.Points(pGeo, pMat);
    this.group.add(this.windSystem);
  }

  buildMapBoundaries() {
    // Invisible map boundary blockers around the entire level (radius 75m)
    // Prevents player from wandering off or leaving playable dried lake
    const segs = 32;
    const boundaryRadius = 75;
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
    // stepIndex: 1 = Cloud, 2 = Rain, 3 = Lake, 4 = River
    this.connectionStep = stepIndex;

    const currentKey = this.tabletOrder[stepIndex - 1];

    // 1. Tablet glows with intense cyan aura
    if (this.tablets[currentKey]) {
      const t = this.tablets[currentKey];
      t.activated = true;
      t.symMat.emissiveIntensity = 2.4;
      t.light.intensity = 3.6;
      t.auraMat.opacity = 0.95;
    }

    // 2. Ground conduit path connecting previous to current tablet activates
    if (stepIndex >= 2) {
      const channelIdx = stepIndex - 2;
      if (this.animatedChannels[channelIdx]) {
        const c = this.animatedChannels[channelIdx];
        c.active = true;
        c.mat.emissiveIntensity = 2.4;
        c.mat.opacity = 0.95;
        if (c.pMat) c.pMat.opacity = 0.85;
      }
    }
  }

  resetConnectionAttempt() {
    this.connectionStep = 0;
    this.connectedTablets = [];

    // Reset tablets back to dormant soft glow
    Object.keys(this.tablets).forEach(key => {
      const t = this.tablets[key];
      t.activated = false;
      t.symMat.emissiveIntensity = 0.6;
      t.light.intensity = 1.2;
      t.auraMat.opacity = 0.35;
    });

    // Reset ground energy conduits
    this.animatedChannels.forEach(c => {
      c.active = false;
      c.mat.emissiveIntensity = 0.1;
      c.mat.opacity = 0.5;
      if (c.pMat) c.pMat.opacity = 0.0;
    });
  }

  // ==========================================
  // Cinematic Crystal Reveal Cutscene
  // ==========================================
  triggerCrystalRevealCinematic() {
    this.puzzleSolved = true;
    this.cutsceneActive = true;
    this.cutsceneTimer = 0;

    // Connect final channel (River to Cloud completing the water cycle!)
    if (this.animatedChannels[3]) {
      this.animatedChannels[3].active = true;
      this.animatedChannels[3].mat.emissiveIntensity = 2.6;
      this.animatedChannels[3].mat.opacity = 0.95;
      if (this.animatedChannels[3].pMat) this.animatedChannels[3].pMat.opacity = 0.85;
    }

    // 1. Camera focus on center (0, 1.8, 0) + ground rumble shake
    if (window.gameManager && window.gameManager.player) {
      window.gameManager.player.triggerCutsceneFocus(new THREE.Vector3(0, 1.8, 0), 4.5);
      window.gameManager.player.addCameraShake(0.45, 3.0);
    }

    // 2. Play sound effects
    if (window.soundSystem) {
      window.soundSystem.playBlueShrineBeam();
    }

    // 3. Make crystal visible and begin rising from beneath cracked ground
    this.crystalGroup.visible = true;
    this.crystalRevealed = true;

    // 4. Register Crystal Collection Interactable after emergence
    setTimeout(() => {
      this.interactables.push({
        type: 'water_crystal',
        id: 'water_crystal',
        name: 'Blue Water Crystal',
        icon: '💎',
        position: new THREE.Vector3(0, 2.2, 0),
        radius: 3.8,
        isCollected: false,
        getPrompt: () => 'Collect Sacred Water Crystal'
      });
    }, 3800);
  }

  // Radial water pulse wave across the lake bed
  triggerWaterPulseWave() {
    this.pulseActive = true;
    this.pulseRadius = 1.0;
    if (this.pulseMesh) {
      this.pulseMesh.scale.set(1, 1, 1);
      this.pulseMat.opacity = 0.85;
    }
  }

  update(delta, time) {
    // 1. Animate ambient wind particles
    if (this.windSystem) {
      const pos = this.windSystem.geometry.attributes.position.array;
      const count = pos.length / 3;
      for (let i = 0; i < count; i++) {
        pos[i * 3] += delta * 6.0;
        if (pos[i * 3] > 75) pos[i * 3] = -75;
        pos[i * 3 + 1] += Math.sin(time * 2.0 + i) * 0.01;
      }
      this.windSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Animate active energy channels and flowing water particles
    this.animatedChannels.forEach((c) => {
      if (c.active) {
        c.mat.emissiveIntensity = 2.0 + Math.sin(time * 6.0 + c.pulseOffset) * 0.6;

        if (c.particleSystem) {
          const pPos = c.particleSystem.geometry.attributes.position.array;
          const pLen = pPos.length / 3;
          for (let i = 0; i < pLen; i++) {
            // Flow along the direction
            let t = ((time * 0.6 + (i / pLen)) % 1.0);
            pPos[i * 3]     = THREE.MathUtils.lerp(c.startPos.x, c.endPos.x, t);
            pPos[i * 3 + 1] = 0.08 + Math.sin(time * 8.0 + i) * 0.06;
            pPos[i * 3 + 2] = THREE.MathUtils.lerp(c.startPos.z, c.endPos.z, t);
          }
          c.particleSystem.geometry.attributes.position.needsUpdate = true;
        }
      }
    });

    // 3. Animate ground fissure cracking open & crystal rising
    if (this.crystalRevealed) {
      // Crack open ground plates
      if (this.fissureCrackProgress < 1.0) {
        this.fissureCrackProgress = Math.min(1.0, this.fissureCrackProgress + delta * 0.45);
        const slide = this.fissureCrackProgress * 1.3;
        this.fissurePlates.forEach(p => {
          p.mesh.position.x = Math.cos(p.angle) * slide;
          p.mesh.position.z = Math.sin(p.angle) * slide;
        });

        // Subterranean light flares
        if (this.subterraneanLight) {
          this.subterraneanLight.intensity = this.fissureCrackProgress * 4.0;
        }
        if (this.crackGlowMesh) {
          this.crackGlowMesh.material.opacity = this.fissureCrackProgress * 0.85;
        }
      }

      // Smoothly rise crystal from y = -2.0 up to y = 2.2
      if (this.crystalGroup) {
        if (this.crystalGroup.position.y < 2.2) {
          this.crystalGroup.position.y += delta * 0.9;
        } else {
          this.crystalGroup.position.y = 2.2 + Math.sin(time * 2.5) * 0.12;
        }

        // Crystal rotation
        if (this.blueCrystal) {
          this.blueCrystal.rotation.y += delta * 1.2;
          this.blueCrystal.rotation.x = Math.sin(time * 1.8) * 0.12;
        }

        // Particle halo orbit
        if (this.crystalParticles) {
          this.crystalParticles.rotation.y += delta * 1.6;
        }

        // Vertical light beam fade-in
        if (this.lightBeam && this.beamMat) {
          if (this.beamMat.opacity < 0.85) {
            this.beamMat.opacity = Math.min(0.85, this.beamMat.opacity + delta * 0.5);
          }
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
