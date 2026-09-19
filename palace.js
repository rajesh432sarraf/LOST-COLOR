/**
 * palace.js - The Royal Palace of Luminaria (The Faded Sanctum Hub)
 * 
 * Features:
 * - Grand Faded Throne Room: Marble checkerboard floor, fluted pillars, vaulted gothic ceiling, stained-glass windows, and royal dais with throne.
 * - Central Altar of Elements: 3 pedestal sockets (Fire, Water, Life) with elemental runic bowls and master prism.
 * - Dynamic Palace Color Restoration:
 *     🔴 Red Restored: Red velvet runner, throne drapery, flame tapestries, and wall braziers ignite in rich crimson!
 *     🔵 Water Restored: Marble fountains begin flowing with blue water, and sapphire stained-glass windows glow!
 *     🟢 Life Restored: Ivy on pillars and royal garden planters bloom with lush emerald green and nature spores!
 *     🌈 Grand Finale: Master Prism ignites a rainbow celestial beacon, celebrating total world restoration!
 * - 3 Realm Portals:
 *     Gate 1: 🔴 Temple of Red (Chapter I)
 *     Gate 2: 🔵 The Dried Lake (Chapter II)
 *     Gate 3: 🟢 Forest of Life (Chapter III)
 */

class PalaceLevel {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.colliders = [];
    this.interactables = [];
    this.animatedTorches = [];
    this.animatedPortals = [];
    this.animatedFountains = [];

    // Color restoration states
    this.redRestored = false;
    this.waterRestored = false;
    this.lifeRestored = false;
    this.grandFinale = false;

    // Sockets state
    this.sockets = {
      fire: { placed: false, mesh: null, beam: null, light: null, pos: new THREE.Vector3(-2.2, 1.4, 0.8) },
      water: { placed: false, mesh: null, beam: null, light: null, pos: new THREE.Vector3(2.2, 1.4, 0.8) },
      life: { placed: false, mesh: null, beam: null, light: null, pos: new THREE.Vector3(0, 1.4, -2.0) }
    };

    // Dynamic material references for smooth transition
    this.dynamicMaterials = {
      carpet: null,
      throneVelvet: null,
      throneGold: null,
      tapestries: [],
      stainedGlass: [],
      fountains: [],
      ivy: [],
      pillarGilding: []
    };

    this.buildPalace();
    this.buildAltar();
    this.buildPortals();
    this.buildLighting();
  }

  buildPalace() {
    const texGen = window.textureGen;

    // 1. Grand Floor (Marble checkerboard)
    const floorTex = texGen ? texGen.getPalaceMarbleFloor(512, 512, true) : null;
    if (floorTex) floorTex.repeat.set(6, 12);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.28,
      metalness: 0.15
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(34, 68), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Central Runner Carpet (Aisle to Throne)
    const carpetTex = texGen ? texGen.getPalaceRunnerCarpet(256, 512, true) : null;
    if (carpetTex) carpetTex.repeat.set(1, 10);
    this.dynamicMaterials.carpet = new THREE.MeshStandardMaterial({
      map: carpetTex,
      color: 0x57606f, // Starts faded slate-gray
      roughness: 0.8,
      metalness: 0.05
    });
    const carpet = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 60), this.dynamicMaterials.carpet);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(0, 0.02, 0);
    carpet.receiveShadow = true;
    this.group.add(carpet);

    // 2. High Vaulted Ceiling & Outer Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1e222b,
      roughness: 0.75,
      metalness: 0.1
    });

    // Back Wall (North - behind throne, Z = -32)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(34, 18, 1.5), wallMat);
    backWall.position.set(0, 9, -32.5);
    backWall.receiveShadow = true;
    this.group.add(backWall);
    this.colliders.push({ box: new THREE.Box3().setFromObject(backWall) });

    // Front Wall (South - entrance, Z = +32)
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(34, 18, 1.5), wallMat);
    frontWall.position.set(0, 9, 32.5);
    frontWall.receiveShadow = true;
    this.group.add(frontWall);
    this.colliders.push({ box: new THREE.Box3().setFromObject(frontWall) });

    // Left Wall (West - X = -17)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1.5, 18, 68), wallMat);
    leftWall.position.set(-17, 9, 0);
    leftWall.receiveShadow = true;
    this.group.add(leftWall);
    this.colliders.push({ box: new THREE.Box3().setFromObject(leftWall) });

    // Right Wall (East - X = +17)
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1.5, 18, 68), wallMat);
    rightWall.position.set(17, 9, 0);
    rightWall.receiveShadow = true;
    this.group.add(rightWall);
    this.colliders.push({ box: new THREE.Box3().setFromObject(rightWall) });

    // Ceiling Vault
    const ceilMat = new THREE.MeshStandardMaterial({
      color: 0x161920,
      roughness: 0.85
    });
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(34, 68), ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 17.5;
    this.group.add(ceiling);

    // 3. Colonnade of Fluted Marble Pillars (6 on Left, 6 on Right)
    const pillarTex = texGen ? texGen.getPalacePillarTexture(256, 512, true) : null;
    if (pillarTex) pillarTex.repeat.set(1, 4);
    const pillarMat = new THREE.MeshStandardMaterial({
      map: pillarTex,
      roughness: 0.35,
      metalness: 0.1
    });

    const pillarZ = [-24, -16, -8, 8, 16, 24];
    pillarZ.forEach(pz => {
      // Left pillar (X = -9.5)
      this.createPillar(-9.5, pz, pillarMat);
      // Right pillar (X = +9.5)
      this.createPillar(9.5, pz, pillarMat);
    });

    // 4. Stained Glass Windows along Side Walls
    const windowZ = [-20, -12, 12, 20];
    windowZ.forEach((wz, idx) => {
      const elemType = idx === 0 ? 'fire' : idx === 1 ? 'water' : idx === 2 ? 'life' : 'all';
      this.createStainedGlassWindow(-16.1, 7.5, wz, Math.PI / 2, elemType);
      this.createStainedGlassWindow(16.1, 7.5, wz, -Math.PI / 2, elemType);
    });

    // 5. Royal Tapestries (Banners on walls)
    const tapZ = [-22, -14, 14, 22];
    tapZ.forEach((tz, idx) => {
      const type = idx % 3 === 0 ? 'fire' : idx % 3 === 1 ? 'water' : 'life';
      this.createTapestry(-16.05, 7.0, tz, Math.PI / 2, type);
      this.createTapestry(16.05, 7.0, tz, -Math.PI / 2, type);
    });

    // 6. Royal Dais & King's Throne (North end: Z = -25)
    this.buildRoyalThrone();

    // 7. Wall Torches / Braziers along Colonnade
    pillarZ.forEach(pz => {
      this.createWallTorch(-8.5, 4.0, pz, 1);
      this.createWallTorch(8.5, 4.0, pz, -1);
    });

    // 8. Fountains of the Palace (Aisle sides: Z = 0)
    this.createFountain(-12, 0, 0);
    this.createFountain(12, 0, 0);
  }

  createPillar(x, z, mat) {
    const pillarGroup = new THREE.Group();
    pillarGroup.position.set(x, 0, z);

    // Fluted Column Shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 17, 18), mat);
    shaft.position.y = 8.5;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    pillarGroup.add(shaft);

    // Ornate Capital (Top)
    const cap = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 2.4), mat);
    cap.position.y = 17;
    pillarGroup.add(cap);

    // Ornate Base (Bottom)
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 2.5), mat);
    base.position.y = 0.4;
    pillarGroup.add(base);

    // Creeping Ivy Mesh on Pillar (starts dead gray, blossoms on Life Restored)
    const ivyMat = new THREE.MeshStandardMaterial({
      color: 0x3d434f, // Dead gray-green
      roughness: 0.9,
      wireframe: false
    });
    this.dynamicMaterials.ivy.push(ivyMat);

    const ivyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.96, 1.05, 12, 12, 1, true), ivyMat);
    ivyMesh.position.y = 6.0;
    pillarGroup.add(ivyMesh);

    this.group.add(pillarGroup);
    this.colliders.push({ box: new THREE.Box3().setFromObject(base) });
  }

  createStainedGlassWindow(x, y, z, rotY, elemType) {
    const texGen = window.textureGen;
    const glassTex = texGen ? texGen.getStainedGlassWindow(elemType, false, 256, 512) : null;
    const glassMat = new THREE.MeshStandardMaterial({
      map: glassTex,
      color: 0x485460, // Starts dark
      emissive: 0x000000,
      roughness: 0.2,
      metalness: 0.1
    });
    this.dynamicMaterials.stainedGlass.push({ mat: glassMat, elem: elemType });

    const winMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 8.5), glassMat);
    winMesh.position.set(x, y, z);
    winMesh.rotation.y = rotY;
    this.group.add(winMesh);
  }

  createTapestry(x, y, z, rotY, type) {
    const texGen = window.textureGen;
    const tapTex = texGen ? texGen.getPalaceTapestry(type, true, 256, 512) : null;
    const tapMat = new THREE.MeshStandardMaterial({
      map: tapTex,
      color: 0x57606f,
      roughness: 0.85
    });
    this.dynamicMaterials.tapestries.push({ mat: tapMat, type });

    const tapMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 5.2), tapMat);
    tapMesh.position.set(x, y, z);
    tapMesh.rotation.y = rotY;
    this.group.add(tapMesh);
  }

  buildRoyalThrone() {
    const daisGroup = new THREE.Group();
    daisGroup.position.set(0, 0, -25);

    // 3-Tier Marble Dais
    const step1 = new THREE.Mesh(new THREE.BoxGeometry(14, 0.35, 10), new THREE.MeshStandardMaterial({ color: 0x222733, roughness: 0.4 }));
    step1.position.y = 0.18;
    daisGroup.add(step1);

    const step2 = new THREE.Mesh(new THREE.BoxGeometry(11, 0.35, 8), new THREE.MeshStandardMaterial({ color: 0x222733, roughness: 0.4 }));
    step2.position.y = 0.52;
    daisGroup.add(step2);

    const step3 = new THREE.Mesh(new THREE.BoxGeometry(8, 0.35, 6), new THREE.MeshStandardMaterial({ color: 0x222733, roughness: 0.4 }));
    step3.position.y = 0.86;
    daisGroup.add(step3);

    // King's Royal Throne
    const throneGroup = new THREE.Group();
    throneGroup.position.set(0, 1.05, -1.5);

    // Gold/Faded Frame
    this.dynamicMaterials.throneGold = new THREE.MeshStandardMaterial({
      color: 0x57606f, // Starts faded steel
      metalness: 0.85,
      roughness: 0.25
    });
    const throneBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 2.0), this.dynamicMaterials.throneGold);
    throneBase.position.y = 0.3;
    throneGroup.add(throneBase);

    const throneBack = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.8, 0.4), this.dynamicMaterials.throneGold);
    throneBack.position.set(0, 2.3, -0.9);
    throneGroup.add(throneBack);

    // Velvet Cushion & Backrest
    this.dynamicMaterials.throneVelvet = new THREE.MeshStandardMaterial({
      color: 0x2f3542, // Starts dark gray
      roughness: 0.75
    });
    const cushion = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 1.6), this.dynamicMaterials.throneVelvet);
    cushion.position.set(0, 0.7, 0.05);
    throneGroup.add(cushion);

    const backCushion = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.0, 0.2), this.dynamicMaterials.throneVelvet);
    backCushion.position.set(0, 2.1, -0.75);
    throneGroup.add(backCushion);

    daisGroup.add(throneGroup);
    this.group.add(daisGroup);

    // Dais Collider
    this.colliders.push({ box: new THREE.Box3().setFromObject(step1) });
    this.colliders.push({ box: new THREE.Box3().setFromObject(throneGroup) });
  }

  createWallTorch(x, y, z, dirX) {
    const torchGroup = new THREE.Group();
    torchGroup.position.set(x, y, z);

    // Sconce arm
    const armMat = new THREE.MeshStandardMaterial({ color: 0x333a46, metalness: 0.8, roughness: 0.4 });
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8), armMat);
    arm.rotation.z = dirX * Math.PI / 3;
    arm.position.set(dirX * 0.3, 0, 0);
    torchGroup.add(arm);

    // Brazier bowl
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.15, 0.4, 8), armMat);
    bowl.position.set(dirX * 0.6, 0.3, 0);
    torchGroup.add(bowl);

    // Flame Core (starts dimmed/unlit)
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x2f3542,
      transparent: true,
      opacity: 0.4
    });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.55, 8), flameMat);
    flame.position.set(dirX * 0.6, 0.65, 0);
    torchGroup.add(flame);

    // Torch Light
    const light = new THREE.PointLight(0xff6b35, 0.0, 10);
    light.position.set(dirX * 0.6, 0.75, 0);
    torchGroup.add(light);

    this.group.add(torchGroup);
    this.animatedTorches.push({ flame, flameMat, light, baseX: x });
  }

  createFountain(x, y, z) {
    const fGroup = new THREE.Group();
    fGroup.position.set(x, y, z);

    // Basin Stone
    const basinMat = new THREE.MeshStandardMaterial({ color: 0x2a303c, roughness: 0.5 });
    const outerRing = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.8, 16), basinMat);
    outerRing.position.y = 0.4;
    fGroup.add(outerRing);

    // Center Pedestal
    const centerPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 2.2, 12), basinMat);
    centerPillar.position.y = 1.1;
    fGroup.add(centerPillar);

    // Water Surface (starts dry/stone)
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1e242d,
      roughness: 0.8,
      metalness: 0.1,
      transparent: true,
      opacity: 0.95
    });
    this.dynamicMaterials.fountains.push(waterMat);

    const waterMesh = new THREE.Mesh(new THREE.CircleGeometry(2.1, 16), waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = 0.75;
    fGroup.add(waterMesh);

    this.group.add(fGroup);
    this.colliders.push({ box: new THREE.Box3().setFromObject(outerRing) });
  }

  // ==========================================
  // Central Altar of Elements & Crystal Sockets
  // ==========================================
  buildAltar() {
    this.altarGroup = new THREE.Group();
    this.altarGroup.position.set(0, 0, 0);

    const altarStoneMat = new THREE.MeshStandardMaterial({
      color: 0x272d38,
      roughness: 0.4,
      metalness: 0.25
    });

    // 1. Lower Tier Base
    const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.6, 0.35, 24), altarStoneMat);
    tier1.position.y = 0.18;
    tier1.receiveShadow = true;
    this.altarGroup.add(tier1);

    // 2. Middle Tier Pedestal
    const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.4, 0.4, 20), altarStoneMat);
    tier2.position.y = 0.55;
    tier2.receiveShadow = true;
    this.altarGroup.add(tier2);

    // 3. Central Altar Stone
    const tier3 = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.2, 0.5, 18), altarStoneMat);
    tier3.position.y = 1.0;
    tier3.receiveShadow = true;
    this.altarGroup.add(tier3);

    // 4. Center Master Prism (Awaits all 3 crystals)
    const prismGeo = new THREE.OctahedronGeometry(0.75, 0);
    this.masterPrismMat = new THREE.MeshStandardMaterial({
      color: 0x485460, // Gray stone until all 3 placed
      metalness: 0.9,
      roughness: 0.15,
      transparent: true,
      opacity: 0.7
    });
    this.masterPrism = new THREE.Mesh(prismGeo, this.masterPrismMat);
    this.masterPrism.position.set(0, 2.6, 0);
    this.altarGroup.add(this.masterPrism);

    // 5. The 3 Elemental Sockets
    this.createSocket('fire', -2.0, 1.25, 0.8, 0xff4757, '🔴 Fire Crystal');
    this.createSocket('water', 2.0, 1.25, 0.8, 0x00d2d3, '🔵 Water Crystal');
    this.createSocket('life', 0, 1.25, -1.8, 0x2ed573, '🟢 Life Crystal');

    this.group.add(this.altarGroup);
    this.colliders.push({ box: new THREE.Box3().setFromObject(tier1) });
  }

  createSocket(element, x, y, z, colorHex, label) {
    const texGen = window.textureGen;
    const socketGroup = new THREE.Group();
    socketGroup.position.set(x, y, z);

    // Pedestal Bowl
    const bowlMat = new THREE.MeshStandardMaterial({ color: 0x1c212a, roughness: 0.45 });
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.55, 0.4, 14), bowlMat);
    bowl.position.y = 0.2;
    socketGroup.add(bowl);

    // Rune Inlay Dish
    const runeTex = texGen ? texGen.getAltarSocketRune(element, false, 256, 256) : null;
    const runeMat = new THREE.MeshStandardMaterial({
      map: runeTex,
      roughness: 0.35,
      metalness: 0.3
    });
    const runeDish = new THREE.Mesh(new THREE.CircleGeometry(0.55, 14), runeMat);
    runeDish.rotation.x = -Math.PI / 2;
    runeDish.position.y = 0.41;
    socketGroup.add(runeDish);

    // Crystal 3D Mesh (Hidden until socketed)
    const crystalGeo = new THREE.OctahedronGeometry(0.48, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.85,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.95
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    crystalMesh.position.y = 0.95;
    crystalMesh.scale.set(0.001, 0.001, 0.001); // starts scaled down to 0
    crystalMesh.visible = false;
    socketGroup.add(crystalMesh);

    // Vertical Light Beam from Socket
    const beamGeo = new THREE.CylinderGeometry(0.25, 0.35, 16, 12, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 8.0;
    socketGroup.add(beam);

    // PointLight
    const pointLight = new THREE.PointLight(colorHex, 0.0, 10);
    pointLight.position.y = 1.0;
    socketGroup.add(pointLight);

    this.altarGroup.add(socketGroup);

    this.sockets[element] = {
      placed: false,
      group: socketGroup,
      mesh: crystalMesh,
      beam: beam,
      beamMat: beamMat,
      light: pointLight,
      runeMat: runeMat,
      worldPos: new THREE.Vector3(x, y + 0.5, z),
      colorHex: colorHex
    };

    // Register Interactable for Player
    this.interactables.push({
      id: `altar_${element}`,
      type: 'altar_socket',
      element: element,
      position: new THREE.Vector3(x, y + 0.5, z),
      interactionDistance: 3.4,
      isPlaced: false,
      getPrompt: () => {
        if (this.sockets[element].placed) {
          return `✨ ${label} (Socketed)`;
        }
        return `[E] Place ${label} into Altar of Elements`;
      }
    });
  }

  // ==========================================
  // Realm Portal Gateways (Left, Right, Entrance)
  // ==========================================
  buildPortals() {
    // Portal 1: Temple of Red (West wall, X = -15.5, Z = 8)
    this.createPortal('fire', -15.5, 0, 8, Math.PI / 2, 0xff4757, 'Chapter I: Temple of Red', true);

    // Portal 2: The Dried Lake (East wall, X = 15.5, Z = 8)
    this.createPortal('water', 15.5, 0, 8, -Math.PI / 2, 0x00d2d3, 'Chapter II: The Dried Lake', false);

    // Portal 3: Forest of Life (South wall, X = 0, Z = 30.5)
    this.createPortal('life', 0, 0, 30.5, Math.PI, 0x2ed573, 'Chapter III: Forest of Life', false);
  }

  createPortal(element, x, y, z, rotY, colorHex, realmName, isOpenDefault = false) {
    const portalGroup = new THREE.Group();
    portalGroup.position.set(x, y, z);
    portalGroup.rotation.y = rotY;

    // Stone Archway Frame
    const archMat = new THREE.MeshStandardMaterial({ color: 0x1e242d, roughness: 0.5, metalness: 0.3 });
    const postL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6.0, 0.8), archMat);
    postL.position.set(-2.2, 3.0, 0);
    portalGroup.add(postL);

    const postR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6.0, 0.8), archMat);
    postR.position.set(2.2, 3.0, 0);
    portalGroup.add(postR);

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.8, 1.0), archMat);
    lintel.position.set(0, 6.0, 0);
    portalGroup.add(lintel);

    // Swirling Energy Veil (Plane)
    const veilGeo = new THREE.PlaneGeometry(3.6, 5.4);
    const veilMat = new THREE.MeshBasicMaterial({
      color: isOpenDefault ? colorHex : 0x222733,
      transparent: true,
      opacity: isOpenDefault ? 0.65 : 0.2,
      side: THREE.DoubleSide
    });
    const veil = new THREE.Mesh(veilGeo, veilMat);
    veil.position.set(0, 3.0, 0);
    portalGroup.add(veil);

    // Portal Glow Light
    const portalLight = new THREE.PointLight(colorHex, isOpenDefault ? 2.5 : 0.0, 8);
    portalLight.position.set(0, 3.0, 0.5);
    portalGroup.add(portalLight);

    this.group.add(portalGroup);

    const portalData = {
      element,
      group: portalGroup,
      veil,
      veilMat,
      light: portalLight,
      isOpen: isOpenDefault,
      colorHex,
      realmName,
      targetLevel: element === 'fire' ? 1 : element === 'water' ? 2 : 3
    };
    this.animatedPortals.push(portalData);

    // Register Portal Interactable
    this.interactables.push({
      id: `portal_${element}`,
      type: 'palace_portal',
      element: element,
      portalData: portalData,
      position: new THREE.Vector3(x, 1.5, z),
      interactionDistance: 4.2,
      getPrompt: () => {
        if (!portalData.isOpen) {
          return `🔒 ${realmName} (Restoration Required)`;
        }
        return `[E] Enter ${realmName}`;
      }
    });
  }

  buildLighting() {
    // Ambient light - starts dim & moody
    this.ambientLight = new THREE.AmbientLight(0x4a5568, 0.85);
    this.group.add(this.ambientLight);

    // Directional light from high vaulted stained-glass
    this.dirLight = new THREE.DirectionalLight(0xa0aec0, 1.1);
    this.dirLight.position.set(10, 25, 10);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.group.add(this.dirLight);
  }

  // ==========================================
  // Dynamic Color Restoration Pipeline
  // ==========================================

  restoreRed(smooth = true) {
    if (this.redRestored) return;
    this.redRestored = true;

    // 1. Runner Carpet & Velvet Throne
    if (this.dynamicMaterials.carpet) {
      this.dynamicMaterials.carpet.color.setHex(0xb22222); // Royal Crimson
    }
    if (this.dynamicMaterials.throneVelvet) {
      this.dynamicMaterials.throneVelvet.color.setHex(0x990000);
    }
    if (this.dynamicMaterials.throneGold) {
      this.dynamicMaterials.throneGold.color.setHex(0xd4af37);
    }

    // 2. Tapestries of Fire
    this.dynamicMaterials.tapestries.forEach(t => {
      if (t.type === 'fire') {
        t.mat.color.setHex(0xffffff); // Full vivid canvas texture colors
      }
    });

    // 3. Stained Glass Windows of Fire
    this.dynamicMaterials.stainedGlass.forEach(w => {
      if (w.elem === 'fire' || w.elem === 'all') {
        w.mat.color.setHex(0xffffff);
        w.mat.emissive.setHex(0xff4757);
        w.mat.emissiveIntensity = 0.6;
      }
    });

    // 4. Ignite Wall Torches
    this.animatedTorches.forEach(t => {
      t.flameMat.color.setHex(0xff6b35);
      t.flameMat.opacity = 0.95;
      t.light.intensity = 2.4;
    });

    // 5. Unlock Chapter II: The Dried Lake Portal
    const waterPortal = this.animatedPortals.find(p => p.element === 'water');
    if (waterPortal) {
      waterPortal.isOpen = true;
      waterPortal.veilMat.color.setHex(waterPortal.colorHex);
      waterPortal.veilMat.opacity = 0.7;
      waterPortal.light.intensity = 2.8;
    }
  }

  restoreWater(smooth = true) {
    if (this.waterRestored) return;
    this.waterRestored = true;

    // 1. Activate Fountains with deep blue water
    this.dynamicMaterials.fountains.forEach(mat => {
      mat.color.setHex(0x00a8ff);
      mat.roughness = 0.1;
      mat.metalness = 0.8;
      mat.opacity = 0.85;
    });

    // 2. Tapestries of Water
    this.dynamicMaterials.tapestries.forEach(t => {
      if (t.type === 'water') {
        t.mat.color.setHex(0xffffff);
      }
    });

    // 3. Stained Glass Windows of Water
    this.dynamicMaterials.stainedGlass.forEach(w => {
      if (w.elem === 'water') {
        w.mat.color.setHex(0xffffff);
        w.mat.emissive.setHex(0x00d2d3);
        w.mat.emissiveIntensity = 0.75;
      }
    });

    // 4. Unlock Chapter III: Forest of Life Portal
    const lifePortal = this.animatedPortals.find(p => p.element === 'life');
    if (lifePortal) {
      lifePortal.isOpen = true;
      lifePortal.veilMat.color.setHex(lifePortal.colorHex);
      lifePortal.veilMat.opacity = 0.7;
      lifePortal.light.intensity = 2.8;
    }
  }

  restoreLife(smooth = true) {
    if (this.lifeRestored) return;
    this.lifeRestored = true;

    // 1. Pillar Ivy blooms into lush green
    this.dynamicMaterials.ivy.forEach(mat => {
      mat.color.setHex(0x2ecc71);
    });

    // 2. Tapestries of Life
    this.dynamicMaterials.tapestries.forEach(t => {
      if (t.type === 'life') {
        t.mat.color.setHex(0xffffff);
      }
    });

    // 3. Stained Glass Windows of Life
    this.dynamicMaterials.stainedGlass.forEach(w => {
      if (w.elem === 'life') {
        w.mat.color.setHex(0xffffff);
        w.mat.emissive.setHex(0x2ed573);
        w.mat.emissiveIntensity = 0.75;
      }
    });

    // 4. Throne Gold Trim shines bright
    if (this.dynamicMaterials.throneGold) {
      this.dynamicMaterials.throneGold.color.setHex(0xffd700);
      this.dynamicMaterials.throneGold.metalness = 0.95;
    }
  }

  triggerGrandFinale() {
    this.grandFinale = true;
    this.restoreRed(false);
    this.restoreWater(false);
    this.restoreLife(false);

    // Master Prism ignites into brilliant celestial multi-color
    if (this.masterPrismMat) {
      this.masterPrismMat.color.setHex(0xffffff);
      this.masterPrismMat.emissive = new THREE.Color(0xffffff);
      this.masterPrismMat.emissiveIntensity = 2.5;
    }

    // Sky beam from Master Prism
    const rainbowBeamGeo = new THREE.CylinderGeometry(0.6, 1.2, 22, 16, 1, true);
    const rainbowBeamMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    const rainbowBeam = new THREE.Mesh(rainbowBeamGeo, rainbowBeamMat);
    rainbowBeam.position.set(0, 11, 0);
    this.altarGroup.add(rainbowBeam);

    // Warm golden ambient illumination throughout palace
    if (this.ambientLight) {
      this.ambientLight.color.setHex(0xfff5ea);
      this.ambientLight.intensity = 1.4;
    }
    if (this.dirLight) {
      this.dirLight.color.setHex(0xffecc2);
      this.dirLight.intensity = 1.6;
    }
  }

  // Socket mounting animation
  socketCrystal(element) {
    const s = this.sockets[element];
    if (!s || s.placed) return;

    s.placed = true;
    s.mesh.visible = true;
    s.mesh.scale.set(1.0, 1.0, 1.0);
    s.beamMat.opacity = 0.75;
    s.light.intensity = 3.5;

    // Trigger corresponding color return
    if (element === 'fire') {
      this.restoreRed();
    } else if (element === 'water') {
      this.restoreWater();
    } else if (element === 'life') {
      this.restoreLife();
    }

    // Check if all 3 are mounted
    if (this.sockets.fire.placed && this.sockets.water.placed && this.sockets.life.placed) {
      setTimeout(() => {
        this.triggerGrandFinale();
      }, 1500);
    }
  }

  update(delta, time) {
    // 1. Animate Crystal floating, spinning, and beam pulsation
    ['fire', 'water', 'life'].forEach((elem, idx) => {
      const s = this.sockets[elem];
      if (s && s.placed && s.mesh) {
        s.mesh.rotation.y += delta * 1.8;
        s.mesh.rotation.x = Math.sin(time * 2 + idx) * 0.2;
        s.mesh.position.y = 0.95 + Math.sin(time * 2.5 + idx) * 0.08;

        if (s.beam) {
          s.beam.rotation.y += delta * 0.5;
          s.beamMat.opacity = 0.6 + Math.sin(time * 3 + idx) * 0.15;
        }
      }
    });

    // 2. Animate Master Prism
    if (this.masterPrism) {
      this.masterPrism.rotation.y += delta * 0.8;
      this.masterPrism.rotation.z = Math.sin(time) * 0.1;
      if (this.grandFinale) {
        const hue = (time * 0.2) % 1.0;
        this.masterPrismMat.emissive.setHSL(hue, 1.0, 0.6);
      }
    }

    // 3. Animate Torches
    this.animatedTorches.forEach((t, i) => {
      if (this.redRestored) {
        const flick = 0.85 + Math.sin(time * 12 + i * 2) * 0.15;
        t.flame.scale.set(flick, 1 + Math.cos(time * 15 + i) * 0.2, flick);
        t.light.intensity = 2.2 + Math.sin(time * 10 + i) * 0.4;
      }
    });

    // 4. Animate Portals
    this.animatedPortals.forEach((p, i) => {
      if (p.isOpen && p.veil) {
        p.veilMat.opacity = 0.55 + Math.sin(time * 3 + i) * 0.15;
      }
    });
  }
}

window.PalaceLevel = PalaceLevel;
