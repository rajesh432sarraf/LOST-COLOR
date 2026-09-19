/**
 * temple.js - Ancient Temple Architecture, Guardian Statues, Clue Plaques & Colliders
 * Features:
 * - 3 Guardian Statues (Sun, Moon, Star) with glowing emblems & direction halos
 * - 3 Stone Clue Plaques near the entrance
 * - Center Pedestal with particle fountain for Ancient Red Key spawning
 * - Locked Temple Door requiring E-press with key to unlock
 * - Unobstructed interior path to the Sacred Red Crystal
 */

class TempleLevel {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.interactables = [];
    this.redColorObjects = [];

    // References
    this.templeGateLeft = null;
    this.templeGateRight = null;
    this.templeGateCollider = null;
    this.templeGateOpening = false;
    this.templeGateUnlocked = false;

    this.pedestalGroup = null;
    this.keyGroup = null;
    this.keySpawned = false;
    this.particleFountain = null;

    this.redCrystalMesh = null;
    this.crystalRings = [];
    this.floatingMonoliths = [];

    this.initMaterials();
    this.buildLighting();
    this.buildSkyAndAtmosphere();
    this.buildExteriorCourtyard();
    this.buildTempleFacadeAndGate();
    this.buildEntranceStatuesPuzzle();
    this.buildCluePlaques();
    this.buildKeyPedestal();
    this.buildTempleInterior();
    this.buildSacredCrystalChamber();
  }

  initMaterials() {
    const stoneTex = window.textureGen.getAncientStone(512, 512);
    stoneTex.repeat.set(3, 3);

    const floorTex = window.textureGen.getTempleFloor(512, 512);
    floorTex.repeat.set(6, 6);

    this.matStone = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.85,
      metalness: 0.05
    });

    this.matFloor = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.8,
      metalness: 0.02
    });

    this.matPillar = new THREE.MeshStandardMaterial({
      color: 0x757880,
      roughness: 0.75,
      metalness: 0.08
    });

    this.matDarkBasalt = new THREE.MeshStandardMaterial({
      color: 0x22242a,
      roughness: 0.7,
      metalness: 0.2
    });

    this.matGoldTrim = new THREE.MeshStandardMaterial({
      color: 0xbfa054,
      roughness: 0.35,
      metalness: 0.8
    });

    // Color Thief Restorable Materials
    this.matRedBanner = new THREE.MeshStandardMaterial({
      map: window.textureGen.getSacredBanner(),
      roughness: 0.65,
      metalness: 0.1
    });
    this.matRedBanner.userData = { isRedRestorable: true };

    this.matRedCrystal = new THREE.MeshStandardMaterial({
      color: 0xff1e38,
      roughness: 0.1,
      metalness: 0.15,
      emissive: 0xaa0015,
      emissiveIntensity: 0.95
    });
    this.matRedCrystal.userData = { isRedRestorable: true };

    this.matGlowRedRune = new THREE.MeshStandardMaterial({
      color: 0xff3344,
      emissive: 0xff2233,
      emissiveIntensity: 1.4,
      roughness: 0.3
    });
    this.matGlowRedRune.userData = { isRedRestorable: true };
  }

  buildLighting() {
    const ambientLight = new THREE.AmbientLight(0xdde3ea, 1.0);
    this.scene.add(ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfff5e6, 1.65);
    this.sunLight.position.set(32, 50, 36);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 180;
    this.sunLight.shadow.camera.left = -45;
    this.sunLight.shadow.camera.right = 45;
    this.sunLight.shadow.camera.top = 45;
    this.sunLight.shadow.camera.bottom = -45;
    this.sunLight.shadow.bias = -0.0008;
    this.scene.add(this.sunLight);

    // Volumetric Sunlight Beams
    const beamGeo = new THREE.CylinderGeometry(0.8, 4.5, 32, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfffae8,
      transparent: true,
      opacity: 0.13,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const beamPositions = [
      { x: -10, y: 16, z: 28, rx: 0.4, rz: -0.25 },
      { x: 10, y: 16, z: 28, rx: 0.4, rz: -0.25 },
      { x: 0, y: 18, z: 20, rx: 0.45, rz: -0.28 },
      { x: 0, y: 18, z: -15, rx: 0.35, rz: -0.15 },
      { x: 0, y: 20, z: -65, rx: 0.15, rz: 0.0 }
    ];

    beamPositions.forEach(b => {
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(b.x, b.y, b.z);
      beam.rotation.x = b.rx;
      beam.rotation.z = b.rz;
      this.scene.add(beam);
    });
  }

  buildSkyAndAtmosphere() {
    this.scene.fog = new THREE.FogExp2(0x9aa0a8, 0.012);

    const mountainGeo = new THREE.ConeGeometry(45, 60, 6);
    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x585c64,
      roughness: 0.95
    });

    const angles = [0.2, 0.7, 1.4, 2.1, 2.8, 3.6, 4.5, 5.2, 5.9];
    angles.forEach(a => {
      const dist = 110 + Math.random() * 20;
      const m = new THREE.Mesh(mountainGeo, mountainMat);
      m.position.set(Math.cos(a) * dist, 15 + Math.random() * 8, Math.sin(a) * dist);
      m.scale.set(1 + Math.random() * 0.6, 1 + Math.random() * 0.5, 1);
      this.scene.add(m);
    });
  }

  buildExteriorCourtyard() {
    // Bedrock foundation plane underneath entire temple map to ensure zero visual gaps
    const bedrock = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), this.matStone);
    bedrock.rotation.x = -Math.PI / 2;
    bedrock.position.set(0, -0.25, 0);
    bedrock.receiveShadow = true;
    this.scene.add(bedrock);

    // Continuous solid stone floor for courtyard & statue plaza (top surface at y = 0.0)
    // Spans x in [-30, 30], z in [20, 62]
    const courtyardFloor = new THREE.Mesh(
      new THREE.BoxGeometry(60, 0.4, 42),
      this.matFloor
    );
    courtyardFloor.position.set(0, -0.2, 41);
    courtyardFloor.receiveShadow = true;
    this.scene.add(courtyardFloor);

    // Flush ceremonial flagstone walkway runner leading towards temple entrance
    const runnerGeo = new THREE.BoxGeometry(6.0, 0.015, 42);
    const runnerMesh = new THREE.Mesh(runnerGeo, this.matDarkBasalt);
    runnerMesh.position.set(0, 0.008, 41);
    runnerMesh.receiveShadow = true;
    this.scene.add(runnerMesh);

    // Thick boundary walls around courtyard
    this.createWall(0, 3, 62, 60, 6, 4, true);
    this.createWall(-30, 3, 41, 4, 6, 42, true);
    this.createWall(30, 3, 41, 4, 6, 42, true);

    // Colonnade flanking the approach walkway
    for (let z = 48; z >= 36; z -= 6) {
      this.createMonumentalPillar(-12, 0, z, 1.2, 12);
      this.createMonumentalPillar(12, 0, z, 1.2, 12);
    }

    this.createBrazier(-5, 0, 42);
    this.createBrazier(5, 0, 42);

    // Plaza low stone balustrades at boundaries (framing the plaza without obstructing movement)
    this.createWall(-18, 0.8, 29, 1.5, 1.6, 18, true);
    this.createWall(18, 0.8, 29, 1.5, 1.6, 18, true);
  }

  buildTempleFacadeAndGate() {
    // Left facade wall (x from -24 to -4.5)
    this.createWall(-14.25, 8, 20, 19.5, 16, 3.5, true);
    // Right facade wall (x from 4.5 to 24)
    this.createWall(14.25, 8, 20, 19.5, 16, 3.5, true);

    // High Archway Lintel above entrance (centered at y = 14, height 4)
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(12, 4, 3.5), this.matStone);
    lintel.position.set(0, 14, 20);
    lintel.castShadow = true;
    this.scene.add(lintel);

    // Monumental pillars flanking the gate
    this.createMonumentalPillar(-6.5, 0, 20.5, 1.3, 16);
    this.createMonumentalPillar(6.5, 0, 20.5, 1.3, 16);

    // Triangular Pediment
    const pedimentGeo = new THREE.ConeGeometry(13, 5, 4);
    const pediment = new THREE.Mesh(pedimentGeo, this.matStone);
    pediment.rotation.y = Math.PI / 4;
    pediment.scale.set(1.4, 1, 0.4);
    pediment.position.set(0, 18.5, 20);
    pediment.castShadow = true;
    this.scene.add(pediment);

    // Temple Entrance Gate (Double stone doors at z = 20, sitting directly on floor at y = 0.0)
    const doorTex = window.textureGen.getRedDoorTexture();
    const doorMat = new THREE.MeshStandardMaterial({
      map: doorTex,
      roughness: 0.65,
      metalness: 0.25
    });

    const leftDoorGeo = new THREE.BoxGeometry(4.2, 10.5, 0.8);
    this.templeGateLeft = new THREE.Mesh(leftDoorGeo, doorMat);
    this.templeGateLeft.position.set(-2.1, 5.25, 20);
    this.templeGateLeft.castShadow = true;

    const rightDoorGeo = new THREE.BoxGeometry(4.2, 10.5, 0.8);
    this.templeGateRight = new THREE.Mesh(rightDoorGeo, doorMat);
    this.templeGateRight.position.set(2.1, 5.25, 20);
    this.templeGateRight.castShadow = true;

    this.scene.add(this.templeGateLeft, this.templeGateRight);

    // Gate solid collider
    this.templeGateCollider = {
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(0, 5.25, 20),
        new THREE.Vector3(8.4, 10.5, 1.4)
      ),
      isOpen: false
    };
    this.colliders.push(this.templeGateCollider);

    // Register door interactable
    this.interactables.push({
      type: 'door',
      position: new THREE.Vector3(0, 0.0, 20.8),
      radius: 3.5,
      getPrompt: () => {
        if (window.puzzleManager && window.puzzleManager.questState.hasKey) {
          return 'Press [E] to unlock Temple Door with Ancient Red Key';
        }
        return 'The Temple Gate is sealed by ancient magic';
      }
    });
  }

  buildEntranceStatuesPuzzle() {
    // 3 Guardian Statues placed directly on the continuous temple floor (y = 0.0):
    // Sun Guardian:  at (-7.0, 0.0, 26)  Target: East (+X, angle Math.PI/2)
    // Moon Guardian: at (0.0, 0.0, 29.5) Target: Temple Entrance / North (-Z, angle Math.PI)
    // Star Guardian: at (7.0, 0.0, 26)   Target: West (-X, angle -Math.PI/2)

    this.statues = [];

    const statueConfigs = [
      {
        id: 0,
        name: 'Sun Guardian',
        symbol: 'SUN',
        icon: '☀',
        pos: new THREE.Vector3(-7.0, 0.0, 26),
        targetAngle: Math.PI / 2, // East
        initialAngle: 0,          // South
        color: 0xffaa22
      },
      {
        id: 1,
        name: 'Moon Guardian',
        symbol: 'MOON',
        icon: '🌙',
        pos: new THREE.Vector3(0.0, 0.0, 29.5),
        targetAngle: Math.PI,     // North (Temple Entrance)
        initialAngle: 0,          // South
        color: 0x99bbff
      },
      {
        id: 2,
        name: 'Star Guardian',
        symbol: 'STAR',
        icon: '⭐',
        pos: new THREE.Vector3(7.0, 0.0, 26),
        targetAngle: -Math.PI / 2,// West
        initialAngle: 0,          // South
        color: 0xffd700
      }
    ];

    statueConfigs.forEach((cfg) => {
      const group = new THREE.Group();
      group.position.copy(cfg.pos);

      // Rotating Pedestal Base (sits directly on floor at y = 0.0, height 0.5)
      const pedBase = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 1.8, 0.5, 24),
        this.matDarkBasalt
      );
      pedBase.position.y = 0.25;
      pedBase.castShadow = true;
      pedBase.receiveShadow = true;
      group.add(pedBase);

      // Carved pointer on base (points along statue local +Z)
      const pointer = new THREE.Mesh(
        new THREE.ConeGeometry(0.24, 0.55, 3),
        this.matGoldTrim
      );
      pointer.rotation.x = -Math.PI / 2;
      pointer.position.set(0, 0.52, 1.4);
      group.add(pointer);

      // Glowing aura ring around pedestal that illuminates when correctly aligned!
      const auraGeo = new THREE.TorusGeometry(1.7, 0.08, 12, 32);
      const auraMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0.2,
        roughness: 0.3
      });
      const auraMesh = new THREE.Mesh(auraGeo, auraMat);
      auraMesh.rotation.x = Math.PI / 2;
      auraMesh.position.y = 0.28;
      group.add(auraMesh);

      // Guardian Statue Figure standing directly on top of pedestal
      const statueFigure = this.createGuardianFigure(cfg);
      statueFigure.position.y = 0.5;
      group.add(statueFigure);

      group.rotation.y = cfg.initialAngle;
      this.scene.add(group);

      const statueData = {
        group,
        config: cfg,
        auraMesh,
        auraMat,
        currentAngle: cfg.initialAngle,
        targetAngle: cfg.targetAngle,
        isRotating: false,
        isAligned: false
      };

      this.statues.push(statueData);

      // Register interaction
      this.interactables.push({
        type: 'statue',
        id: cfg.id,
        position: cfg.pos,
        radius: 3.2,
        data: statueData,
        getPrompt: () => `Press [E] to rotate ${cfg.icon} ${cfg.name}`
      });

      // Box collider for statue pedestal (bottom at y = 0.0, height 3.0)
      const colBox = new THREE.Box3();
      colBox.setFromCenterAndSize(
        new THREE.Vector3(cfg.pos.x, 1.5, cfg.pos.z),
        new THREE.Vector3(3.0, 3.0, 3.0)
      );
      this.colliders.push({ box: colBox });
    });
  }

  createGuardianFigure(cfg) {
    const guardian = new THREE.Group();

    const torsoGeo = new THREE.CylinderGeometry(0.55, 0.7, 1.8, 12);
    const torso = new THREE.Mesh(torsoGeo, this.matStone);
    torso.position.y = 0.9;
    torso.castShadow = true;
    guardian.add(torso);

    const pLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.5), this.matStone);
    pLeft.position.set(0.65, 1.65, 0);
    const pRight = pLeft.clone();
    pRight.position.x = -0.65;
    guardian.add(pLeft, pRight);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.55), this.matDarkBasalt);
    head.position.y = 2.05;
    head.castShadow = true;
    guardian.add(head);

    // Glowing Chest Emblem
    const shieldGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.1, 16);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      emissive: cfg.color,
      emissiveIntensity: 0.9,
      metalness: 0.6,
      roughness: 0.3
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.rotation.x = Math.PI / 2;
    shield.position.set(0, 1.2, 0.55);
    shield.castShadow = true;
    guardian.add(shield);

    // Greatsword
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 0.05), this.matStone);
    blade.position.set(0, 1.1, 0.65);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.12, 0.1), this.matGoldTrim);
    cross.position.set(0, 2.0, 0.65);
    guardian.add(blade, cross);

    return guardian;
  }

  buildCluePlaques() {
    // 3 Stone Plaques containing clues near the entrance:
    // Plaque 1 (near Sun statue): "The Sun watches the rising light."
    // Plaque 2 (near Moon statue): "The Moon guards the sacred gate."
    // Plaque 3 (near Star statue): "The Stars fade into the western sky."

    const plaques = [
      {
        title: '☀️ SUN TABLET',
        text: 'The Sun watches the rising light.',
        pos: new THREE.Vector3(-11.5, 0.0, 26),
        rotY: Math.PI / 4
      },
      {
        title: '🌙 MOON TABLET',
        text: 'The Moon guards the sacred gate.',
        pos: new THREE.Vector3(-4.0, 0.0, 31),
        rotY: 0
      },
      {
        title: '⭐ STAR TABLET',
        text: 'The Stars fade into the western sky.',
        pos: new THREE.Vector3(11.5, 0.0, 26),
        rotY: -Math.PI / 4
      }
    ];

    plaques.forEach((p) => {
      const group = new THREE.Group();
      group.position.copy(p.pos);
      group.rotation.y = p.rotY;

      const tablet = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 2.6, 0.35),
        this.matDarkBasalt
      );
      tablet.position.y = 1.3;
      tablet.castShadow = true;
      group.add(tablet);

      const plaqueFace = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 2.2, 0.08),
        this.matStone
      );
      plaqueFace.position.set(0, 1.3, 0.2);
      group.add(plaqueFace);

      this.scene.add(group);

      // Register interaction
      this.interactables.push({
        type: 'clue',
        position: p.pos,
        radius: 3.2,
        getPrompt: () => `Press [E] to read ${p.title}`,
        data: {
          title: p.title,
          desc: `"${p.text}"`
        }
      });

      // Box collider (resting on floor at y = 0.0)
      const colBox = new THREE.Box3();
      colBox.setFromCenterAndSize(
        new THREE.Vector3(p.pos.x, 1.3, p.pos.z),
        new THREE.Vector3(2.6, 2.6, 1.2)
      );
      this.colliders.push({ box: colBox });
    });
  }

  buildKeyPedestal() {
    // Located between the statues in front of the gate at x = 0, z = 23.5
    // Sits directly on the floor at y = 0.0
    this.pedestalGroup = new THREE.Group();
    this.pedestalGroup.position.set(0, 0.0, 23.5);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.5, 0.9, 16),
      this.matDarkBasalt
    );
    base.position.y = 0.45;
    base.castShadow = true;
    base.receiveShadow = true;
    this.pedestalGroup.add(base);

    const dish = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.1, 0.25, 16),
      this.matGoldTrim
    );
    dish.position.y = 1.0;
    dish.castShadow = true;
    this.pedestalGroup.add(dish);

    this.scene.add(this.pedestalGroup);

    const colBox = new THREE.Box3();
    colBox.setFromCenterAndSize(
      new THREE.Vector3(0, 0.6, 23.5),
      new THREE.Vector3(2.4, 1.2, 2.4)
    );
    this.colliders.push({ box: colBox });
  }

  spawnAncientRedKey() {
    if (this.keySpawned) return;
    this.keySpawned = true;

    const x = 0;
    const y = 1.6; // Floats right above the gold dish (dish top at y = 1.125)
    const z = 23.5;

    this.keyGroup = new THREE.Group();
    this.keyGroup.position.set(x, y, z);

    const keyMat = new THREE.MeshStandardMaterial({
      color: 0xff3344,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0xaa1122,
      emissiveIntensity: 0.8
    });

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.07, 12, 24), keyMat);
    ring.castShadow = true;

    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 1),
      new THREE.MeshStandardMaterial({
        color: 0xff1128,
        emissive: 0xff3344,
        emissiveIntensity: 1.5,
        roughness: 0.1
      })
    );
    gem.scale.set(1, 1.4, 0.8);
    ring.add(gem);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.9, 12), keyMat);
    shaft.position.y = -0.55;
    shaft.castShadow = true;
    this.keyGroup.add(shaft);

    const bit = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.35, 0.08), keyMat);
    bit.position.set(0.12, -0.85, 0);
    bit.castShadow = true;
    this.keyGroup.add(bit);

    this.keyGroup.add(ring);

    const aura = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0xff2233,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
      })
    );
    this.keyGroup.add(aura);

    const keyLight = new THREE.PointLight(0xff2238, 2.5, 12);
    this.keyGroup.add(keyLight);

    // Red Particle Fountain
    const pCount = 60;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i += 3) {
      pPos[i] = (Math.random() - 0.5) * 1.5;
      pPos[i + 1] = Math.random() * 2.5 - 1.0;
      pPos[i + 2] = (Math.random() - 0.5) * 1.5;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xff2244,
      size: 0.14,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    this.particleFountain = new THREE.Points(pGeo, pMat);
    this.keyGroup.add(this.particleFountain);

    this.scene.add(this.keyGroup);

    // Register Key pickup
    this.interactables.push({
      type: 'key',
      position: new THREE.Vector3(x, 0.0, z),
      radius: 2.8,
      getPrompt: () => 'Press [E] to collect Ancient Red Key',
      isCollected: false
    });
  }

  buildTempleInterior() {
    // Grand unobstructed ceremonial nave and chamber floor:
    // ONE continuous flat stone floor slab from entrance (z = 20) down to back wall (z = -80)
    // Width 32, depth 100, height 0.4. Center: x = 0, y = -0.2, z = -30.
    // Top surface sits at exactly y = 0.0, perfectly flush with the courtyard floor!
    const interiorFloor = new THREE.Mesh(
      new THREE.BoxGeometry(32, 0.4, 100),
      this.matFloor
    );
    interiorFloor.position.set(0, -0.2, -30);
    interiorFloor.receiveShadow = true;
    this.scene.add(interiorFloor);

    // Ceremonial central runner aisle
    const interiorRunner = new THREE.Mesh(
      new THREE.BoxGeometry(6.0, 0.015, 100),
      this.matDarkBasalt
    );
    interiorRunner.position.set(0, 0.008, -30);
    interiorRunner.receiveShadow = true;
    this.scene.add(interiorRunner);

    // Nave Boundary walls (z from 20 down to -55)
    this.createWall(-14, 8, -17.5, 2.0, 16, 75, true);
    this.createWall(14, 8, -17.5, 2.0, 16, 75, true);

    const ceil = new THREE.Mesh(new THREE.BoxGeometry(28, 1, 75), this.matStone);
    ceil.position.set(0, 16, -17.5);
    this.scene.add(ceil);

    // Flanking pillars leaving an open 16-meter central aisle
    for (let z = 14; z >= -48; z -= 8) {
      this.createMonumentalPillar(-8.5, 0, z, 1.0, 16);
      this.createMonumentalPillar(8.5, 0, z, 1.0, 16);

      this.createSacredBanner(-13.0, 6.5, z);
      this.createSacredBanner(13.0, 6.5, z);
    }

    // Glowing crimson runes on walls
    for (let z = 12; z >= -48; z -= 12) {
      const runeL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.4, 1.4), this.matGlowRedRune);
      runeL.position.set(-12.9, 4.5, z);
      this.scene.add(runeL);
      this.redColorObjects.push(runeL);

      const runeR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.4, 1.4), this.matGlowRedRune);
      runeR.position.set(12.9, 4.5, z);
      this.scene.add(runeR);
      this.redColorObjects.push(runeR);
    }
  }

  buildSacredCrystalChamber() {
    // Sacred Sanctum walls: z from -55 down to -79, x expands to 16
    this.createWall(-16, 8, -67, 2.0, 16, 24, true);
    this.createWall(16, 8, -67, 2.0, 16, 24, true);
    this.createWall(0, 8, -79, 32, 16, 2.0, true); // North back wall

    const ceil = new THREE.Mesh(new THREE.BoxGeometry(32, 1, 24), this.matStone);
    ceil.position.set(0, 16, -67);
    this.scene.add(ceil);

    // Sacred Sanctuary Dais: Flush decorative concentric stone rings on the floor
    const ring1 = new THREE.Mesh(
      new THREE.CylinderGeometry(4.8, 5.0, 0.08, 32),
      this.matDarkBasalt
    );
    ring1.position.set(0, 0.04, -65);
    ring1.receiveShadow = true;
    this.scene.add(ring1);

    const ring2 = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.4, 0.08, 24),
      this.matStone
    );
    ring2.position.set(0, 0.08, -65);
    ring2.receiveShadow = true;
    this.scene.add(ring2);

    // Grand Altar Pedestal sitting directly on the floor (top at y = 1.2)
    const altar = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.9, 1.1, 16),
      this.matDarkBasalt
    );
    altar.position.set(0, 0.65, -65);
    altar.castShadow = true;
    altar.receiveShadow = true;
    this.scene.add(altar);

    // Altar pedestal collider
    const altarCol = new THREE.Box3();
    altarCol.setFromCenterAndSize(
      new THREE.Vector3(0, 0.65, -65),
      new THREE.Vector3(3.6, 1.3, 3.6)
    );
    this.colliders.push({ box: altarCol });

    // Floating Ancient Monoliths (floating in chamber air)
    for (let m = 0; m < 4; m++) {
      const angle = (m * Math.PI) / 2;
      const mono = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.2, 0.8), this.matStone);
      mono.position.set(Math.cos(angle) * 7.5, 4.8, -65 + Math.sin(angle) * 7.5);
      mono.castShadow = true;
      this.scene.add(mono);
      this.floatingMonoliths.push({
        mesh: mono,
        baseY: 4.8,
        phase: m * 1.5
      });
    }

    // Sacred Red Crystal floats cleanly at y = 2.8 (well above altar top at y = 1.2)
    this.buildSacredRedCrystal(0, 2.8, -65);
  }

  buildSacredRedCrystal(x, y, z) {
    this.crystalGroup = new THREE.Group();
    this.crystalGroup.position.set(x, y, z);

    const crystalGeo = new THREE.OctahedronGeometry(1.15, 1);
    this.redCrystalMesh = new THREE.Mesh(crystalGeo, this.matRedCrystal);
    this.redCrystalMesh.scale.set(1.0, 1.45, 1.0);
    this.crystalGroup.add(this.redCrystalMesh);
    this.redColorObjects.push(this.redCrystalMesh);

    const ringColors = [0xff3344, 0xff5566, 0xdd1128];
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.8 + i * 0.45, 0.045, 12, 36),
        new THREE.MeshStandardMaterial({
          color: ringColors[i],
          emissive: 0xaa1122,
          emissiveIntensity: 0.9,
          roughness: 0.2
        })
      );
      this.crystalGroup.add(ring);
      this.crystalRings.push(ring);
      this.redColorObjects.push(ring);
    }

    const particleCount = 120;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      const r = 0.5 + Math.random() * 2.8;
      const th = Math.random() * Math.PI * 2;
      pPositions[i] = Math.cos(th) * r;
      pPositions[i + 1] = (Math.random() - 0.5) * 3.5;
      pPositions[i + 2] = Math.sin(th) * r;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

    const pMat = new THREE.PointsMaterial({
      color: 0xff3344,
      size: 0.12,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.crystalParticles = new THREE.Points(pGeo, pMat);
    this.crystalGroup.add(this.crystalParticles);

    this.crystalLight = new THREE.PointLight(0xff2238, 2.5, 30);
    this.crystalGroup.add(this.crystalLight);

    this.scene.add(this.crystalGroup);

    this.interactables.push({
      type: 'crystal',
      position: new THREE.Vector3(x, 0.0, z),
      radius: 3.5,
      getPrompt: () => 'Press [E] to claim the Red Crystal & Restore Color',
      isClaimed: false
    });
  }

  createSacredBanner(x, y, z) {
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 7.0), this.matRedBanner);
    banner.position.set(x, y, z);
    banner.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2;
    banner.castShadow = true;
    this.scene.add(banner);
    this.redColorObjects.push(banner);
  }

  createWall(x, y, z, w, h, d, solid = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.matStone);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    if (solid) {
      const box = new THREE.Box3().setFromObject(mesh);
      this.colliders.push({ box });
    }
    return mesh;
  }

  createMonumentalPillar(x, y, z, radius, height) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(radius * 2.4, 0.8, radius * 2.4),
      this.matStone
    );
    plinth.position.y = 0.4;
    plinth.castShadow = true;
    group.add(plinth);

    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.88, radius, height - 1.8, 16),
      this.matPillar
    );
    shaft.position.y = (height - 1.8) / 2 + 0.8;
    shaft.castShadow = true;
    group.add(shaft);

    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(radius * 2.4, 1.0, radius * 2.4),
      this.matStone
    );
    cap.position.y = height - 0.5;
    cap.castShadow = true;
    group.add(cap);

    this.scene.add(group);

    const colBox = new THREE.Box3();
    colBox.setFromCenterAndSize(
      new THREE.Vector3(x, y + height / 2, z),
      new THREE.Vector3(radius * 2.2, height, radius * 2.2)
    );
    this.colliders.push({ box: colBox });
  }

  createBrazier(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.2, 8), this.matDarkBasalt);
    base.position.y = 0.6;
    base.castShadow = true;
    group.add(base);

    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.4, 0.5, 12), this.matGoldTrim);
    bowl.position.y = 1.35;
    bowl.castShadow = true;
    group.add(bowl);

    const flameLight = new THREE.PointLight(0xff7722, 1.4, 12);
    flameLight.position.set(0, 1.8, 0);
    group.add(flameLight);

    this.scene.add(group);
  }

  update(delta, time) {
    // Animate Key & Particle fountain
    if (this.keyGroup && !this.keyGroup.userData.collected) {
      this.keyGroup.rotation.y += delta * 1.6;
      this.keyGroup.position.y = 1.6 + Math.sin(time * 2.5) * 0.18;

      if (this.particleFountain) {
        this.particleFountain.rotation.y += delta * 1.2;
      }
    }

    // Animate Red Crystal & Rings
    if (this.crystalGroup) {
      this.redCrystalMesh.rotation.y += delta * 1.2;
      this.redCrystalMesh.rotation.x = Math.sin(time * 1.8) * 0.15;
      this.crystalGroup.position.y = 2.8 + Math.sin(time * 2.0) * 0.15;

      if (this.crystalRings[0]) this.crystalRings[0].rotation.x += delta * 2.0;
      if (this.crystalRings[1]) this.crystalRings[1].rotation.y += delta * 1.7;
      if (this.crystalRings[2]) this.crystalRings[2].rotation.z += delta * 2.4;

      if (this.crystalParticles) {
        this.crystalParticles.rotation.y += delta * 0.8;
      }
    }

    // Animate floating monoliths
    if (this.floatingMonoliths) {
      this.floatingMonoliths.forEach(m => {
        m.mesh.position.y = m.baseY + Math.sin(time * 1.5 + m.phase) * 0.4;
        m.mesh.rotation.y += delta * 0.4;
      });
    }

    // Temple Gate smooth sliding opening
    if (this.templeGateOpening && this.templeGateLeft && this.templeGateRight) {
      this.templeGateLeft.position.x = THREE.MathUtils.lerp(
        this.templeGateLeft.position.x,
        -6.5,
        delta * 1.8
      );
      this.templeGateRight.position.x = THREE.MathUtils.lerp(
        this.templeGateRight.position.x,
        6.5,
        delta * 1.8
      );
    }
  }

  openTempleGate() {
    this.templeGateOpening = true;
    this.templeGateUnlocked = true;
    if (this.templeGateCollider) {
      this.templeGateCollider.isOpen = true;
    }
    if (window.soundSystem) {
      window.soundSystem.playDoorOpen();
    }
  }
}

window.TempleLevel = TempleLevel;
