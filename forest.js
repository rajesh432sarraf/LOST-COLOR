/**
 * forest.js - Level 3: "WATER REALM -> FOREST OF LIFE (EMERALD GROVE)"
 * Completely dedicated magical woodland realm.
 * 
 * Features:
 * - Towering Elder World Tree at center (0, 0, 0) with hollow sanctuary and opening root doors.
 * - 4 Themed Clearings with Ancient Overgrown Shrines:
 *     🌱 SEED   ("All great forests begin asleep within a humble seed.")
 *     🌿 SPROUT ("Nourished by the soil, life pushes through into the light.")
 *     🌳 TREE   ("Deepening its roots, life grows strong to shelter the world.")
 *     🌸 BLOOM  ("In full blossom, life shares its gifts and renews the cycle.")
 * - Living Vine Conduits connecting SEED ➔ SPROUT ➔ TREE ➔ BLOOM with blooming leaf particles.
 * - Golden Firefly Swarms (Wisps / Jugnu) guiding players along winding paths.
 * - Bioluminescent mushroom clusters pulsing along path borders.
 * - Grand Climax: Roots of Elder Tree part open, Green Life Crystal descends with emerald shockwave!
 */

class ForestLevel {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.colliders = [];
    this.interactables = [];
    this.animatedVines = [];
    this.mushrooms = [];
    this.fireflies = [];

    // Puzzle State
    this.connectionStep = 0; // 0: None, 1: Seed, 2: Sprout, 3: Tree, 4: Bloom (Solved)
    this.connectedShrines = [];
    this.puzzleSolved = false;
    this.crystalRevealed = false;
    this.crystalCollected = false;

    // Cinematic & Root Door Animation State
    this.cutsceneActive = false;
    this.rootDoorProgress = 0.0; // 0.0 = closed, 1.0 = fully open

    // Radial Nature Shockwave
    this.pulseMesh = null;
    this.pulseRadius = 0;
    this.pulseActive = false;

    // 4 Forest Shrine Configurations
    this.shrineConfigs = {
      seed: {
        id: 'seed',
        name: 'Shrine of the Seed',
        icon: '🌱',
        pos: new THREE.Vector3(0, 0, -16.0),
        clue: 'All great forests begin asleep within a humble seed.'
      },
      sprout: {
        id: 'sprout',
        name: 'Shrine of the Sprout',
        icon: '🌿',
        pos: new THREE.Vector3(16.0, 0, 0),
        clue: 'Nourished by the soil, life pushes through into the light.'
      },
      tree: {
        id: 'tree',
        name: 'Shrine of the Tree',
        icon: '🌳',
        pos: new THREE.Vector3(0, 0, 16.0),
        clue: 'Deepening its roots, life grows strong to shelter the world.'
      },
      bloom: {
        id: 'bloom',
        name: 'Shrine of the Bloom',
        icon: '🌸',
        pos: new THREE.Vector3(-16.0, 0, 0),
        clue: 'In full blossom, life shares its gifts and renews the cycle.'
      }
    };

    this.shrines = {};
    this.shrineOrder = ['seed', 'sprout', 'tree', 'bloom'];

    this.initMaterials();
    this.buildLighting();
    this.buildAtmosphere();
    this.buildForestTerrain();
    this.buildElderWorldTree();
    this.buildFourForestShrines();
    this.buildVineConduits();
    this.buildForestFoliageAndMushrooms();
    this.buildFireflySwarm();
    this.buildDensePerimeterBoundary();
    this.buildSacredLifeCrystal();
  }

  initMaterials() {
    // 1. Forest loam ground
    const groundTex = window.textureGen.getForestGround(512, 512);
    groundTex.repeat.set(18, 18);

    // 2. Weathered oak tree bark
    const barkTex = window.textureGen.getAncientMossyBark(512, 512);
    barkTex.repeat.set(2, 6);

    // 3. Ancient shrine stone
    const shrineTex = window.textureGen.getOvergrownShrineTexture(512, 512);

    // 4. Cobblestone paver
    const stoneTex = window.textureGen.getAncientStone(512, 512);
    stoneTex.repeat.set(3, 3);

    this.matGround = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.92,
      metalness: 0.02,
      color: 0x3d352c
    });

    this.matBark = new THREE.MeshStandardMaterial({
      map: barkTex,
      roughness: 0.88,
      metalness: 0.05,
      color: 0x4a3a2a
    });

    this.matFoliage = new THREE.MeshStandardMaterial({
      color: 0x27ae60,
      roughness: 0.75,
      metalness: 0.05
    });

    this.matFoliageDark = new THREE.MeshStandardMaterial({
      color: 0x1e824c,
      roughness: 0.8,
      metalness: 0.02
    });

    this.matShrine = new THREE.MeshStandardMaterial({
      map: shrineTex,
      roughness: 0.82,
      metalness: 0.1
    });

    this.matPath = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.86,
      metalness: 0.08,
      color: 0x4b4e54
    });

    // Glowing living vine conduit material
    this.matVineActive = new THREE.MeshStandardMaterial({
      color: 0x2ecc71,
      emissive: 0x00b894,
      emissiveIntensity: 0.15,
      roughness: 0.25,
      metalness: 0.7,
      transparent: true,
      opacity: 0.75
    });
  }

  buildLighting() {
    // Dappled canopy ambient light with soft emerald tint
    this.ambientLight = new THREE.AmbientLight(0xd4eed8, 1.15);
    this.group.add(this.ambientLight);

    // Warm sunbeams filtering through tree branches
    this.sunLight = new THREE.DirectionalLight(0xfff6dd, 1.45);
    this.sunLight.position.set(38, 80, 28);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 260;
    const d = 80;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0004;
    this.group.add(this.sunLight);

    // Soft emerald skylight fill
    this.emeraldFill = new THREE.DirectionalLight(0x44bb77, 0.5);
    this.emeraldFill.position.set(-30, 60, -30);
    this.group.add(this.emeraldFill);
  }

  buildAtmosphere() {
    // Enchanted woodland fog with teal/emerald glow
    this.scene.fog = new THREE.FogExp2(0x1a3324, 0.0085);
    this.scene.background = new THREE.Color(0x1c3828);

    // Forest canopy sky dome
    const skyGeo = new THREE.SphereGeometry(260, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x1f3f2d,
      side: THREE.BackSide
    });
    this.group.add(new THREE.Mesh(skyGeo, skyMat));
  }

  buildForestTerrain() {
    // 1. Flat forest ground plane at y = 0.0
    const bedGeo = new THREE.PlaneGeometry(280, 280);
    const bedMesh = new THREE.Mesh(bedGeo, this.matGround);
    bedMesh.rotation.x = -Math.PI / 2;
    bedMesh.position.y = 0.0;
    bedMesh.receiveShadow = true;
    this.group.add(bedMesh);

    // 2. Winding mossy cobblestone pathways connecting the 4 clearings
    const pathGroup = new THREE.Group();

    // Cross paths (Center to N, E, S, W)
    const arms = [
      { startZ: 3.5, endZ: 15.0, x: 0, rot: 0 },         // South to Tree
      { startZ: -15.0, endZ: -3.5, x: 0, rot: 0 },       // North to Seed
      { startZ: 3.5, endZ: 15.0, x: 0, rot: Math.PI / 2 }, // East to Sprout
      { startZ: -15.0, endZ: -3.5, x: 0, rot: Math.PI / 2 } // West to Bloom
    ];

    arms.forEach(arm => {
      const p = new THREE.Group();
      p.rotation.y = arm.rot;
      for (let z = arm.startZ; z <= arm.endZ; z += 1.6) {
        const step = new THREE.Mesh(
          new THREE.BoxGeometry(2.2 + Math.sin(z) * 0.2, 0.02, 1.2),
          this.matPath
        );
        step.position.set(Math.sin(z * 0.7) * 0.15, 0.015, z);
        step.receiveShadow = true;
        p.add(step);
      }
      pathGroup.add(p);
    });

    // Circular connection trail linking the outer clearings (radius 16m)
    const ringTrail = new THREE.Mesh(
      new THREE.RingGeometry(15.2, 16.8, 48),
      new THREE.MeshStandardMaterial({
        color: 0x484b50,
        roughness: 0.9,
        metalness: 0.05,
        transparent: true,
        opacity: 0.6
      })
    );
    ringTrail.rotation.x = -Math.PI / 2;
    ringTrail.position.y = 0.012;
    ringTrail.receiveShadow = true;
    pathGroup.add(ringTrail);

    this.group.add(pathGroup);
  }

  buildElderWorldTree() {
    // The Majestic Elder Oak at Center (0, 0, 0)
    const treeGroup = new THREE.Group();
    treeGroup.position.set(0, 0, 0);

    // 1. Great Trunk (Hollow cylinder)
    const trunkGeo = new THREE.CylinderGeometry(2.8, 4.2, 18, 16, 4, true);
    const trunk = new THREE.Mesh(trunkGeo, this.matBark);
    trunk.position.y = 9.0;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);

    // 2. Trunk Interior Cavity
    const interiorGeo = new THREE.CylinderGeometry(2.5, 3.8, 17.8, 16, 1, true);
    const interiorMat = new THREE.MeshStandardMaterial({
      color: 0x1d2e22,
      roughness: 0.85,
      side: THREE.BackSide
    });
    const interior = new THREE.Mesh(interiorGeo, interiorMat);
    interior.position.y = 9.0;
    treeGroup.add(interior);

    // 3. Opening Root Door (Left & Right)
    const doorGeo = new THREE.BoxGeometry(1.4, 3.8, 0.4);
    this.rootDoorLeft = new THREE.Mesh(doorGeo, this.matBark);
    this.rootDoorLeft.position.set(-0.7, 1.9, 3.8);
    this.rootDoorLeft.castShadow = true;
    treeGroup.add(this.rootDoorLeft);

    this.rootDoorRight = new THREE.Mesh(doorGeo, this.matBark);
    this.rootDoorRight.position.set(0.7, 1.9, 3.8);
    this.rootDoorRight.castShadow = true;
    treeGroup.add(this.rootDoorRight);

    // 4. Gnarled Ground Buttress Roots
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      const root = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 1.2, 5.5, 6), this.matBark);
      root.position.set(Math.cos(a) * 3.6, 0.8, Math.sin(a) * 3.6);
      root.rotation.z = Math.cos(a) * 0.55;
      root.rotation.x = Math.sin(a) * 0.55;
      root.castShadow = true;
      root.receiveShadow = true;
      treeGroup.add(root);
    }

    // 5. Grand Foliage Canopy Spheres
    const canopyClusters = [
      { x: 0, y: 19, z: 0, r: 8.5 },
      { x: -5, y: 17, z: -4, r: 6.5 },
      { x: 5, y: 17, z: -3, r: 6.8 },
      { x: -4, y: 16, z: 5, r: 6.2 },
      { x: 4, y: 16, z: 4, r: 6.5 }
    ];

    canopyClusters.forEach((c, idx) => {
      const mat = idx % 2 === 0 ? this.matFoliage : this.matFoliageDark;
      const leafGeo = new THREE.DodecahedronGeometry(c.r, 1);
      const leafMesh = new THREE.Mesh(leafGeo, mat);
      leafMesh.position.set(c.x, c.y, c.z);
      leafMesh.castShadow = true;
      leafMesh.receiveShadow = true;
      treeGroup.add(leafMesh);
    });

    this.group.add(treeGroup);

    // Trunk Collider (so player cannot walk through the solid tree bark)
    this.colliders.push({
      type: 'box',
      box: new THREE.Box3(
        new THREE.Vector3(-3.2, 0, -3.2),
        new THREE.Vector3(3.2, 12.0, 3.2)
      )
    });
  }

  buildFourForestShrines() {
    // Four Overgrown Shrines placed in 4 clearings at radius 16m:
    // 🌱 SEED   (North: 0, 0, -16)
    // 🌿 SPROUT (East:  16, 0, 0)
    // 🌳 TREE   (South: 0, 0, 16)
    // 🌸 BLOOM  (West: -16, 0, 0)

    Object.keys(this.shrineConfigs).forEach(key => {
      const cfg = this.shrineConfigs[key];
      const sGroup = new THREE.Group();
      sGroup.position.copy(cfg.pos);

      // 1. Carved Overgrown Stone Altar Plinth (height: 0.75m)
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.9, 0.45, 8), this.matShrine);
      base.position.y = 0.225;
      base.castShadow = true;
      base.receiveShadow = true;
      sGroup.add(base);

      const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 1.5), this.matShrine);
      plinth.position.y = 0.7;
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      sGroup.add(plinth);

      // 2. High-resolution Symbol & Glyph Faceplate on Top Surface
      const { canvas, ctx } = window.textureGen.createCanvas(512, 512);
      ctx.fillStyle = '#1e2b22';
      ctx.fillRect(0, 0, 512, 512);

      // Carved vine border
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 10;
      ctx.strokeRect(16, 16, 480, 480);

      // Emoji Icon
      ctx.font = '160px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cfg.icon, 256, 210);

      // Carved Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 50px "Cinzel", Georgia, serif';
      ctx.fillText(key.toUpperCase(), 256, 375);

      // Subtitle
      ctx.fillStyle = '#55efc4';
      ctx.font = 'bold 24px "Cinzel", Georgia, serif';
      ctx.fillText('CYCLE OF LIFE', 256, 430);

      const symTex = new THREE.CanvasTexture(canvas);
      const symMat = new THREE.MeshStandardMaterial({
        map: symTex,
        roughness: 0.3,
        metalness: 0.2,
        emissive: 0x00b894,
        emissiveIntensity: 0.6
      });
      const symMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), symMat);
      symMesh.rotation.x = -Math.PI / 2;
      symMesh.position.y = 0.96;
      symMesh.receiveShadow = true;
      sGroup.add(symMesh);

      // 3. Ambient emerald glow light
      const sLight = new THREE.PointLight(0x2ecc71, 1.5, 9, 1.8);
      sLight.position.set(0, 1.4, 0);
      sGroup.add(sLight);

      // 4. Ground rune circle
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0x2ecc71,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35
      });
      const aura = new THREE.Mesh(new THREE.RingGeometry(2.0, 2.6, 32), auraMat);
      aura.rotation.x = -Math.PI / 2;
      aura.position.y = 0.02;
      sGroup.add(aura);

      this.group.add(sGroup);

      // Altar Collider
      this.colliders.push({
        type: 'box',
        box: new THREE.Box3(
          new THREE.Vector3(cfg.pos.x - 1.2, 0, cfg.pos.z - 1.2),
          new THREE.Vector3(cfg.pos.x + 1.2, 1.5, cfg.pos.z + 1.2)
        )
      });

      // Save shrine reference
      this.shrines[key] = {
        config: cfg,
        group: sGroup,
        symMat: symMat,
        light: sLight,
        auraMat: auraMat,
        activated: false
      };

      // Register Interactable
      this.interactables.push({
        type: 'forest_shrine',
        id: key,
        name: cfg.name,
        icon: cfg.icon,
        position: new THREE.Vector3(cfg.pos.x, 1.0, cfg.pos.z),
        radius: 3.8,
        isCollected: false,
        getPrompt: () => {
          if (!window.puzzleManager) return `Inspect ${cfg.name}`;
          if (window.puzzleManager.allForestCluesDiscovered) {
            return `Awaken Life Force: ${cfg.icon} ${key.toUpperCase()}`;
          }
          return `Inspect Shrine: ${cfg.icon} ${key.toUpperCase()}`;
        }
      });
    });
  }

  buildVineConduits() {
    // Connect SEED (N) ➔ SPROUT (E) ➔ TREE (S) ➔ BLOOM (W) ➔ SEED (N)
    const connections = [
      { from: this.shrineConfigs.seed.pos,   to: this.shrineConfigs.sprout.pos, id: 'seed_to_sprout' },
      { from: this.shrineConfigs.sprout.pos, to: this.shrineConfigs.tree.pos,   id: 'sprout_to_tree' },
      { from: this.shrineConfigs.tree.pos,   to: this.shrineConfigs.bloom.pos,  id: 'tree_to_bloom' },
      { from: this.shrineConfigs.bloom.pos,  to: this.shrineConfigs.seed.pos,   id: 'bloom_to_seed' }
    ];

    connections.forEach((conn, idx) => {
      const start = conn.from;
      const end = conn.to;
      const dist = start.distanceTo(end);
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

      // Living ground vine line
      const vineGeo = new THREE.BoxGeometry(0.38, 0.04, dist * 0.98);
      const vineMat = new THREE.MeshStandardMaterial({
        color: 0x27ae60,
        emissive: 0x00b894,
        emissiveIntensity: 0.1, // Dormant initially
        roughness: 0.3,
        metalness: 0.5,
        transparent: true,
        opacity: 0.55
      });
      const vineMesh = new THREE.Mesh(vineGeo, vineMat);
      vineMesh.position.set(mid.x, 0.024, mid.z);
      vineMesh.lookAt(end.x, 0.024, end.z);
      this.group.add(vineMesh);

      // Emerald pollen particles flowing along active vine
      const pCount = 35;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount; i++) {
        const t = i / pCount;
        pPos[i * 3]     = THREE.MathUtils.lerp(start.x, end.x, t);
        pPos[i * 3 + 1] = 0.08 + Math.random() * 0.18;
        pPos[i * 3 + 2] = THREE.MathUtils.lerp(start.z, end.z, t);
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({
        color: 0x55efc4,
        size: 0.28,
        transparent: true,
        opacity: 0.0, // Invisible until activated
        blending: THREE.AdditiveBlending
      });
      const particleSystem = new THREE.Points(pGeo, pMat);
      this.group.add(particleSystem);

      this.animatedVines.push({
        id: conn.id,
        mesh: vineMesh,
        mat: vineMat,
        particleSystem: particleSystem,
        pMat: pMat,
        active: false,
        pulseOffset: idx * 0.5,
        startPos: start.clone(),
        endPos: end.clone()
      });
    });
  }

  buildForestFoliageAndMushrooms() {
    // 1. Bioluminescent mushroom clusters along pathways
    const mushroomClusters = [
      [-5, 8], [5, 8], [-8, -6], [8, -6],
      [12, 10], [-12, 10], [10, -12], [-10, -12]
    ];

    mushroomClusters.forEach(([mx, mz]) => {
      const cluster = new THREE.Group();
      cluster.position.set(mx, 0, mz);

      for (let i = 0; i < 4; i++) {
        const h = 0.35 + Math.random() * 0.3;
        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.08, h, 6),
          new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.5 })
        );
        stem.position.set((i % 2) * 0.25 - 0.12, h / 2, Math.floor(i / 2) * 0.25 - 0.12);
        cluster.add(stem);

        const cap = new THREE.Mesh(
          new THREE.SphereGeometry(0.18 + Math.random() * 0.08, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2),
          new THREE.MeshStandardMaterial({
            color: 0x00b894,
            emissive: 0x55efc4,
            emissiveIntensity: 1.8,
            roughness: 0.2
          })
        );
        cap.position.set(stem.position.x, h, stem.position.z);
        cluster.add(cap);
      }

      // Soft point light
      const mLight = new THREE.PointLight(0x00b894, 0.85, 4.5, 1.8);
      mLight.position.y = 0.5;
      cluster.add(mLight);

      this.group.add(cluster);
      this.mushrooms.push(mLight);
    });
  }

  buildFireflySwarm() {
    // Golden & Emerald Firefly swarm (Wisps) gently dancing near path forks
    const pCount = 200;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3]     = (Math.random() - 0.5) * 55;
      pPos[i * 3 + 1] = 0.6 + Math.random() * 3.5;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 55;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xffeaa7,
      size: 0.25,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.fireflySystem = new THREE.Points(pGeo, pMat);
    this.group.add(this.fireflySystem);
  }

  buildDensePerimeterBoundary() {
    // Impassable ancient tree wall & briars around perimeter (radius 68m to 76m)
    const count = 36;
    const boundaryRadius = 72;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const tx = Math.cos(a) * boundaryRadius;
      const tz = Math.sin(a) * boundaryRadius;

      // Tall boundary pine/oak
      const tree = new THREE.Group();
      tree.position.set(tx, 0, tz);

      const h = 12 + (i % 4) * 2;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, h, 6), this.matBark);
      trunk.position.y = h / 2;
      tree.add(trunk);

      const foliage = new THREE.Mesh(new THREE.ConeGeometry(3.5, 9, 6), this.matFoliageDark);
      foliage.position.y = h * 0.75;
      tree.add(foliage);

      this.group.add(tree);

      // Boundary box collider
      this.colliders.push({
        type: 'box',
        box: new THREE.Box3(
          new THREE.Vector3(tx - 3.5, 0, tz - 3.5),
          new THREE.Vector3(tx + 3.5, 15, tz + 3.5)
        )
      });
    }
  }

  buildSacredLifeCrystal() {
    // The Sacred Green Life Crystal (hidden inside Elder Oak trunk initially)
    this.crystalGroup = new THREE.Group();
    this.crystalGroup.position.set(0, 1.8, 0);
    this.crystalGroup.visible = false;

    // Sculpted Life Crystal
    const crystalGeo = new THREE.OctahedronGeometry(1.2, 0);
    crystalGeo.scale(0.85, 1.6, 0.85);

    this.crystalMat = new THREE.MeshStandardMaterial({
      color: 0x2ecc71,
      emissive: 0x00b894,
      emissiveIntensity: 2.4,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.95
    });
    this.greenCrystal = new THREE.Mesh(crystalGeo, this.crystalMat);
    this.crystalGroup.add(this.greenCrystal);

    this.crystalLight = new THREE.PointLight(0x2ecc71, 3.8, 25, 1.2);
    this.crystalGroup.add(this.crystalLight);

    // Orbiting emerald pollen halo
    const pCount = 60;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const a = (i / pCount) * Math.PI * 6;
      const r = 0.8 + (i / pCount) * 1.5;
      pPos[i * 3]     = Math.cos(a) * r;
      pPos[i * 3 + 1] = ((i / pCount) - 0.5) * 2.5;
      pPos[i * 3 + 2] = Math.sin(a) * r;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    this.crystalParticles = new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: 0xa8ff78,
      size: 0.22,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    }));
    this.crystalGroup.add(this.crystalParticles);

    // Vertical emerald light beam
    const beamGeo = new THREE.CylinderGeometry(1.5, 2.8, 90, 20, 1, true);
    this.beamMat = new THREE.MeshBasicMaterial({
      color: 0x2ecc71,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.lightBeam = new THREE.Mesh(beamGeo, this.beamMat);
    this.lightBeam.position.set(0, 45, 0);
    this.group.add(this.lightBeam);

    this.group.add(this.crystalGroup);

    // Radial expanding nature wave mesh
    const pulseGeo = new THREE.RingGeometry(0.5, 1.8, 48);
    this.pulseMat = new THREE.MeshBasicMaterial({
      color: 0x2ecc71,
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

  // ==========================================
  // Connection Mechanics & Visual Progression
  // ==========================================

  activateConnectionStep(stepIndex) {
    // stepIndex: 1 = Seed, 2 = Sprout, 3 = Tree, 4 = Bloom
    this.connectionStep = stepIndex;
    const currentKey = this.shrineOrder[stepIndex - 1];

    // 1. Shrine glows with brilliant emerald energy
    if (this.shrines[currentKey]) {
      const s = this.shrines[currentKey];
      s.activated = true;
      s.symMat.emissiveIntensity = 2.4;
      s.light.intensity = 3.6;
      s.auraMat.opacity = 0.95;
    }

    // 2. Connecting living vine activates
    if (stepIndex >= 2) {
      const vineIdx = stepIndex - 2;
      if (this.animatedVines[vineIdx]) {
        const v = this.animatedVines[vineIdx];
        v.active = true;
        v.mat.emissiveIntensity = 2.4;
        v.mat.opacity = 0.95;
        if (v.pMat) v.pMat.opacity = 0.85;
      }
    }
  }

  resetConnectionAttempt() {
    this.connectionStep = 0;
    this.connectedShrines = [];

    // Reset shrines to dormant soft glow
    Object.keys(this.shrines).forEach(key => {
      const s = this.shrines[key];
      s.activated = false;
      s.symMat.emissiveIntensity = 0.6;
      s.light.intensity = 1.5;
      s.auraMat.opacity = 0.35;
    });

    // Reset vines
    this.animatedVines.forEach(v => {
      v.active = false;
      v.mat.emissiveIntensity = 0.1;
      v.mat.opacity = 0.55;
      if (v.pMat) v.pMat.opacity = 0.0;
    });
  }

  // Trigger Elder Oak Awakening & Life Crystal Reveal
  triggerCrystalRevealCinematic() {
    this.puzzleSolved = true;
    this.cutsceneActive = true;

    // Connect final vine completing life cycle
    if (this.animatedVines[3]) {
      this.animatedVines[3].active = true;
      this.animatedVines[3].mat.emissiveIntensity = 2.6;
      this.animatedVines[3].mat.opacity = 0.95;
      if (this.animatedVines[3].pMat) this.animatedVines[3].pMat.opacity = 0.85;
    }

    // Camera focus on Elder Oak trunk + camera shake
    if (window.gameManager && window.gameManager.player) {
      window.gameManager.player.triggerCutsceneFocus(new THREE.Vector3(0, 2.2, 3.8), 4.5);
      window.gameManager.player.addCameraShake(0.42, 2.8);
    }

    // Sound effect
    if (window.soundSystem) {
      window.soundSystem.playBlueShrineBeam();
    }

    // Reveal crystal
    this.crystalGroup.visible = true;
    this.crystalRevealed = true;

    // Register Crystal Collection Interactable
    setTimeout(() => {
      this.interactables.push({
        type: 'life_crystal',
        id: 'life_crystal',
        name: 'Green Life Crystal',
        icon: '💎',
        position: new THREE.Vector3(0, 2.2, 3.8),
        radius: 3.8,
        isCollected: false,
        getPrompt: () => 'Collect Sacred Life Crystal'
      });
    }, 3800);
  }

  triggerNaturePulseWave() {
    this.pulseActive = true;
    this.pulseRadius = 1.0;
    if (this.pulseMesh) {
      this.pulseMesh.scale.set(1, 1, 1);
      this.pulseMat.opacity = 0.85;
    }
  }

  update(delta, time) {
    // 1. Animate fireflies
    if (this.fireflySystem) {
      const pos = this.fireflySystem.geometry.attributes.position.array;
      const count = pos.length / 3;
      for (let i = 0; i < count; i++) {
        pos[i * 3]     += Math.sin(time * 1.5 + i) * delta * 1.2;
        pos[i * 3 + 1] += Math.cos(time * 2.0 + i) * delta * 0.8;
        pos[i * 3 + 2] += Math.sin(time * 1.8 + i) * delta * 1.2;
      }
      this.fireflySystem.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Animate active vines and flowing leaf pollen
    this.animatedVines.forEach(v => {
      if (v.active) {
        v.mat.emissiveIntensity = 2.0 + Math.sin(time * 6.0 + v.pulseOffset) * 0.6;
        if (v.particleSystem) {
          const pPos = v.particleSystem.geometry.attributes.position.array;
          const pLen = pPos.length / 3;
          for (let i = 0; i < pLen; i++) {
            let t = ((time * 0.5 + (i / pLen)) % 1.0);
            pPos[i * 3]     = THREE.MathUtils.lerp(v.startPos.x, v.endPos.x, t);
            pPos[i * 3 + 1] = 0.08 + Math.sin(time * 7.0 + i) * 0.06;
            pPos[i * 3 + 2] = THREE.MathUtils.lerp(v.startPos.z, v.endPos.z, t);
          }
          v.particleSystem.geometry.attributes.position.needsUpdate = true;
        }
      }
    });

    // 3. Animate root doors parting open and crystal hover
    if (this.crystalRevealed) {
      if (this.rootDoorProgress < 1.0) {
        this.rootDoorProgress = Math.min(1.0, this.rootDoorProgress + delta * 0.5);
        if (this.rootDoorLeft) this.rootDoorLeft.position.x = -0.7 - this.rootDoorProgress * 1.2;
        if (this.rootDoorRight) this.rootDoorRight.position.x = 0.7 + this.rootDoorProgress * 1.2;
      }

      // Crystal emerges forward from trunk
      if (this.crystalGroup) {
        if (this.crystalGroup.position.z < 3.8) {
          this.crystalGroup.position.z += delta * 1.1;
        }
        this.crystalGroup.position.y = 2.2 + Math.sin(time * 2.5) * 0.12;

        if (this.greenCrystal) {
          this.greenCrystal.rotation.y += delta * 1.2;
          this.greenCrystal.rotation.x = Math.sin(time * 1.6) * 0.12;
        }
        if (this.crystalParticles) {
          this.crystalParticles.rotation.y += delta * 1.6;
        }
        if (this.lightBeam && this.beamMat) {
          if (this.beamMat.opacity < 0.85) {
            this.beamMat.opacity = Math.min(0.85, this.beamMat.opacity + delta * 0.5);
          }
        }
      }
    }

    // 4. Animate expanding nature pulse wave
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

window.ForestLevel = ForestLevel;
