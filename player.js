/**
 * player.js - Unified Humanoid Adventurer & Third-Person Controller
 * Architecture:
 * - ONE root player object (`this.root`) containing character mesh, camera follow target, and collider
 * - 100% Grounded: Boot soles sit precisely at y = 0.0; entire body stays strictly above ground
 * - Unified seamless humanoid adventurer model: No detached limbs or split body parts
 * - Predictable movement: W=forward, S=backward, A=left, D=right strictly relative to camera gaze
 * - Smooth camera follow with wall-clipping prevention raycast
 */

class PlayerController {
  constructor(scene, camera, domElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;

    // 1. ONE Root Player Object in the scene
    this.root = new THREE.Group();
    this.position = new THREE.Vector3(0, 0, 46); // Start on courtyard ground
    this.root.position.copy(this.position);
    this.scene.add(this.root);

    // 2. Camera follow target attached directly to player root
    this.cameraTarget = new THREE.Object3D();
    this.cameraTarget.position.set(0, 1.45, 0); // Eye/chest level
    this.root.add(this.cameraTarget);

    // Kinematics & state
    this.velocity = new THREE.Vector3();
    this.rotationY = Math.PI; // Face North (-Z)
    this.targetRotationY = Math.PI;

    this.walkSpeed = 6.8;
    this.runSpeed = 11.2;
    this.isSprinting = false;
    this.isGrounded = true;
    this.jumpForce = 8.5;
    this.verticalVelocity = 0;
    this.gravity = -26.0;

    // Input keys
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      jump: false,
      interact: false
    };

    // Camera parameters
    this.cameraDistance = 5.2;
    this.cameraTargetDistance = 5.2;
    this.cameraYaw = Math.PI;
    this.cameraPitch = 0.26;
    this.mouseSensitivity = 0.0024;
    this.isPointerLocked = false;
    this.cinematicMode = false;

    this.cameraTrauma = 0;
    this.traumaDecay = 1.2;
    this.cutsceneActive = false;
    this.cutsceneTarget = null;
    this.cutsceneDuration = 0;
    this.cutsceneTimer = 0;

    this.animTime = 0;
    this.isMoving = false;
    this.footstepTimer = 0;

    // 3. Build unified character mesh attached to player root
    this.characterMesh = new THREE.Group();
    this.buildCharacterMesh();
    this.root.add(this.characterMesh);

    // Camera pivot scratch vector
    this.cameraPivot = new THREE.Vector3();

    this.initEventListeners();
  }

  buildCharacterMesh() {
    // High-Fidelity Procedural Canvas Textures
    const jacketTex = window.textureGen.getLeatherJacketTexture();
    const pantsTex = window.textureGen.getPantsTexture();
    const bootsTex = window.textureGen.getBootTexture();
    const skinTex = window.textureGen.getSkinTexture();
    const hatTex = window.textureGen.getFedoraTexture();
    const scarfTex = window.textureGen.getScarfTexture();

    // PBR-Ready Materials with Realistic Subsurface & Specular Qualities
    const skinMat = new THREE.MeshStandardMaterial({
      map: skinTex,
      color: 0xc49372, // Warm sun-tanned heroic complexion
      roughness: 0.56,
      metalness: 0.02
    });

    const faceFeatureMat = new THREE.MeshStandardMaterial({
      color: 0xb88564, // Anatomical facial shading
      roughness: 0.54,
      metalness: 0.02
    });

    const lipMat = new THREE.MeshStandardMaterial({
      color: 0x9e5c50,
      roughness: 0.44,
      metalness: 0.0
    });

    const eyeWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xfcfcfe,
      roughness: 0.20,
      metalness: 0.0
    });

    const irisMat = new THREE.MeshStandardMaterial({
      color: 0x482c19, // Deep amber / chestnut iris
      roughness: 0.15,
      metalness: 0.0
    });

    const pupilMat = new THREE.MeshStandardMaterial({
      color: 0x070605,
      roughness: 0.10,
      metalness: 0.0
    });

    const eyeGlintMat = new THREE.MeshBasicMaterial({
      color: 0xffffff
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x241710, // Dark espresso hair
      roughness: 0.88,
      metalness: 0.04
    });

    const hatMat = new THREE.MeshStandardMaterial({
      map: hatTex,
      color: 0x3d2c20, // Brushed wool felt
      roughness: 0.74,
      metalness: 0.08
    });

    const jacketMat = new THREE.MeshStandardMaterial({
      map: jacketTex,
      color: 0x503524, // Distressed explorer leather
      roughness: 0.58,
      metalness: 0.14
    });

    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0xeee7db, // Cream linen
      roughness: 0.85,
      metalness: 0.0
    });

    const pantsMat = new THREE.MeshStandardMaterial({
      map: pantsTex,
      color: 0x363b40, // Cargo twill
      roughness: 0.75,
      metalness: 0.06
    });

    const bootsMat = new THREE.MeshStandardMaterial({
      map: bootsTex,
      color: 0x221812, // Oiled leather boots
      roughness: 0.50,
      metalness: 0.16
    });

    const soleMat = new THREE.MeshStandardMaterial({
      color: 0x0e0a07, // Rubber tread outsole
      roughness: 0.88,
      metalness: 0.04
    });

    const gloveMat = new THREE.MeshStandardMaterial({
      map: bootsTex,
      color: 0x261b14, // Reinforced adventurer gloves
      roughness: 0.54,
      metalness: 0.12
    });

    const beltMat = new THREE.MeshStandardMaterial({
      color: 0x1a120c,
      roughness: 0.44,
      metalness: 0.18
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xdfb252, // Antique polished brass
      metalness: 0.86,
      roughness: 0.24
    });

    const scarfMat = new THREE.MeshStandardMaterial({
      map: scarfTex,
      color: 0xb51e2f,
      roughness: 0.70,
      metalness: 0.02
    });

    // =========================================================================
    // HIGH-FIDELITY REALISTIC HUMANOID ADVENTURER ANATOMY
    // =========================================================================

    // A. Pelvis / Hips (y = 0.95 to 1.05)
    this.pelvis = new THREE.Group();
    this.pelvis.position.set(0, 1.0, 0);
    this.characterMesh.add(this.pelvis);

    const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.17, 0.22, 16), pantsMat);
    hips.scale.set(1.15, 1.0, 0.88);
    hips.castShadow = true;
    this.pelvis.add(hips);

    // Heavy utility explorer belt
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.075, 18), beltMat);
    belt.scale.set(1.18, 1.0, 0.90);
    belt.position.y = 0.08;

    // Polished heavy brass buckle with prong
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.078, 0.035), brassMat);
    buckle.position.set(0, 0, 0.195);
    belt.add(buckle);

    const buckleProng = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.06, 0.015), brassMat);
    buckleProng.position.set(0, 0, 0.21);
    belt.add(buckleProng);

    // Multi-compartment explorer pouches
    const pouchL = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.10, 0.065), jacketMat);
    pouchL.position.set(-0.21, -0.02, 0.04);
    pouchL.rotation.y = 0.25;
    const pouchLSnap = new THREE.Mesh(new THREE.SphereGeometry(0.010, 6, 6), brassMat);
    pouchLSnap.position.set(0, 0.02, 0.035);
    pouchL.add(pouchLSnap);
    belt.add(pouchL);

    const pouchR = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.10, 0.065), jacketMat);
    pouchR.position.set(0.21, -0.02, 0.04);
    pouchR.rotation.y = -0.25;
    const pouchRSnap = new THREE.Mesh(new THREE.SphereGeometry(0.010, 6, 6), brassMat);
    pouchRSnap.position.set(0, 0.02, 0.035);
    pouchR.add(pouchRSnap);
    belt.add(pouchR);

    // Brass field canteen with screw-cap
    const canteen = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.13, 14), brassMat);
    canteen.rotation.z = 0.35;
    canteen.position.set(0.18, -0.03, -0.08);
    const canteenCap = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.025, 10), brassMat);
    canteenCap.position.y = 0.075;
    canteen.add(canteenCap);
    belt.add(canteen);

    // Ancient Map Scroll Canister with brass caps
    const mapScroll = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.25, 12), jacketMat);
    mapScroll.rotation.x = Math.PI / 2;
    mapScroll.rotation.z = 0.38;
    mapScroll.position.set(-0.16, -0.02, -0.09);
    [-0.125, 0.125].forEach((endY) => {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.02, 10), brassMat);
      cap.position.y = endY;
      mapScroll.add(cap);
    });
    belt.add(mapScroll);

    this.pelvis.add(belt);

    // B. Torso (y = 1.08 to 1.54)
    this.torso = new THREE.Group();
    this.torso.position.set(0, 0.10, 0);
    this.pelvis.add(this.torso);

    // Athletic V-tapered contoured leather jacket
    const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.185, 0.46, 16), jacketMat);
    torsoMesh.scale.set(1.18, 1.0, 0.86);
    torsoMesh.position.y = 0.23;
    torsoMesh.castShadow = true;
    this.torso.add(torsoMesh);

    // Deltoid shoulder caps giving smooth natural shoulder silhouette
    [-1, 1].forEach((side) => {
      const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.088, 12, 10), jacketMat);
      shoulderCap.scale.set(1.0, 0.85, 0.90);
      shoulderCap.position.set(side * 0.26, 0.40, 0);
      shoulderCap.castShadow = true;
      this.torso.add(shoulderCap);
    });

    // 3D Notched Jacket Lapels
    const lapelGeo = new THREE.BoxGeometry(0.10, 0.30, 0.035);
    const lapelL = new THREE.Mesh(lapelGeo, jacketMat);
    lapelL.position.set(-0.08, 0.28, 0.165);
    lapelL.rotation.z = -0.16;
    lapelL.rotation.y = -0.10;
    const lapelR = new THREE.Mesh(lapelGeo, jacketMat);
    lapelR.position.set(0.08, 0.28, 0.165);
    lapelR.rotation.z = 0.16;
    lapelR.rotation.y = 0.10;
    this.torso.add(lapelL, lapelR);

    // Inner linen explorer shirt with open V-neck
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.02), shirtMat);
    shirt.position.set(0, 0.285, 0.155);
    // Tiny shirt buttons
    [0.36, 0.31, 0.26].forEach((by) => {
      const btn = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 6), beltMat);
      btn.position.set(0, by, 0.168);
      this.torso.add(btn);
    });
    this.torso.add(shirt);

    // Chest pocket flaps with brass snap buttons
    [-1, 1].forEach((side) => {
      const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.03, 0.025), jacketMat);
      pocket.position.set(side * 0.12, 0.26, 0.165);
      const snap = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 6), brassMat);
      snap.position.set(0, -0.005, 0.012);
      pocket.add(snap);
      this.torso.add(pocket);
    });

    // Shoulder Epaulets with brass snaps
    [-1, 1].forEach((side) => {
      const epaulet = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.025, 0.065), jacketMat);
      epaulet.position.set(side * 0.22, 0.44, 0);
      const snap = new THREE.Mesh(new THREE.SphereGeometry(0.013, 6, 6), brassMat);
      snap.position.set(side * 0.038, 0.016, 0);
      epaulet.add(snap);
      this.torso.add(epaulet);
    });

    // Flowing Crimson Scarf with dynamic animated tails
    const scarfCollar = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.055, 12, 24), scarfMat);
    scarfCollar.rotation.x = Math.PI / 2;
    scarfCollar.position.set(0, 0.47, 0);
    this.torso.add(scarfCollar);

    // Scarf knot detail
    const scarfKnot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), scarfMat);
    scarfKnot.scale.set(1.2, 0.8, 1.0);
    scarfKnot.position.set(0.06, 0.46, 0.13);
    this.torso.add(scarfKnot);

    // Dynamic Hanging Scarf Tail (animated during movement & idle breathing)
    this.scarfTail = new THREE.Group();
    this.scarfTail.position.set(0.06, 0.44, 0.14);
    const tailMesh = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.28, 0.018), scarfMat);
    tailMesh.position.y = -0.14;
    // Fringed bottom edge
    const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.02, 0.02), brassMat);
    fringe.position.y = -0.27;
    tailMesh.add(fringe);
    this.scarfTail.add(tailMesh);
    this.torso.add(this.scarfTail);

    // Explorer Backpack (sitting neatly on mid-back, completely below shoulders)
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.14), hatMat);
    pack.position.set(0, 0.18, -0.19);
    pack.castShadow = true;

    // Rolled explorer bedroll strapped horizontally across the bottom of the backpack
    const bedroll = new THREE.Mesh(new THREE.CylinderGeometry(0.050, 0.050, 0.30, 14), pantsMat);
    bedroll.rotation.z = Math.PI / 2;
    bedroll.position.set(0, -0.16, 0.02);
    [-0.09, 0.09].forEach((strapX) => {
      const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.053, 0.053, 0.018, 12), beltMat);
      strap.rotation.z = Math.PI / 2;
      strap.position.set(strapX, -0.16, 0.02);
      pack.add(strap);
    });
    pack.add(bedroll);
    this.torso.add(pack);

    // =========================================================================
    // C. REALISTIC HUMAN HEAD & ADVENTURER FEDORA
    // =========================================================================
    this.neck = new THREE.Group();
    this.neck.position.set(0, 0.48, 0);
    this.torso.add(this.neck);

    // Muscular neck column
    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.076, 0.12, 16), faceFeatureMat);
    neckMesh.position.y = 0.06;
    neckMesh.castShadow = true;
    this.neck.add(neckMesh);

    // Head container
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.13, 0);
    this.neck.add(this.headGroup);

    // 1. Contoured Cranium / Skull with procedural skin texture
    const craniumGeo = new THREE.SphereGeometry(0.108, 24, 20);
    const cranium = new THREE.Mesh(craniumGeo, skinMat);
    cranium.scale.set(0.92, 1.15, 1.02);
    cranium.position.set(0, 0.02, -0.01);
    cranium.castShadow = true;
    this.headGroup.add(cranium);

    // 2. Defined Athletic Jawline and Chin
    const jawGeo = new THREE.CylinderGeometry(0.088, 0.058, 0.12, 16);
    const jaw = new THREE.Mesh(jawGeo, faceFeatureMat);
    jaw.scale.set(0.95, 1.0, 0.88);
    jaw.position.set(0, -0.04, 0.015);
    this.headGroup.add(jaw);

    const chinGeo = new THREE.SphereGeometry(0.026, 12, 10);
    const chin = new THREE.Mesh(chinGeo, faceFeatureMat);
    chin.scale.set(1.15, 0.75, 1.10);
    chin.position.set(0, -0.088, 0.048);
    this.headGroup.add(chin);

    // 3. Subtle Sculpted Nose (Bridge & Tip)
    const noseBridge = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.052, 8), faceFeatureMat);
    noseBridge.rotation.x = 0.22;
    noseBridge.position.set(0, 0.010, 0.088);
    noseBridge.castShadow = true;
    this.headGroup.add(noseBridge);

    const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.010, 8, 8), faceFeatureMat);
    noseTip.position.set(0, -0.015, 0.098);
    this.headGroup.add(noseTip);

    // 4. Expressive 3D Eyes & Eyebrows
    [-1, 1].forEach((side) => {
      // Natural dark eyebrow
      const eyebrow = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.007, 0.012), hairMat);
      eyebrow.position.set(side * 0.036, 0.040, 0.092);
      eyebrow.rotation.z = side * 0.07;
      this.headGroup.add(eyebrow);

      // Eye assembly
      const eye = new THREE.Group();
      eye.position.set(side * 0.036, 0.016, 0.082);

      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 10), eyeWhiteMat);
      eye.add(sclera);

      const iris = new THREE.Mesh(new THREE.CylinderGeometry(0.0062, 0.0062, 0.003, 12), irisMat);
      iris.rotation.x = Math.PI / 2;
      iris.position.set(0, 0, 0.010);
      eye.add(iris);

      const pupil = new THREE.Mesh(new THREE.CylinderGeometry(0.0032, 0.0032, 0.004, 10), pupilMat);
      pupil.rotation.x = Math.PI / 2;
      pupil.position.set(0, 0, 0.011);
      eye.add(pupil);

      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.0016, 4, 4), eyeGlintMat);
      glint.position.set(0.002, 0.002, 0.013);
      eye.add(glint);

      this.headGroup.add(eye);
    });

    // 5. Natural Contoured Lips
    const upperLip = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.006, 0.010), lipMat);
    upperLip.position.set(0, -0.052, 0.080);
    const lowerLip = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.007, 0.012), lipMat);
    lowerLip.position.set(0, -0.062, 0.078);
    this.headGroup.add(upperLip, lowerLip);

    // 6. Natural Hair Locks (Sides, Temples, Nape)
    [-1, 1].forEach((side) => {
      // Sideburns framing the jawline
      const sideburn = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.070, 0.028), hairMat);
      sideburn.position.set(side * 0.088, 0.012, 0.018);
      this.headGroup.add(sideburn);

      // Anatomical Ears
      const earGroup = new THREE.Group();
      earGroup.position.set(side * 0.095, 0.006, -0.008);
      earGroup.rotation.y = side * 0.25;

      const auricle = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.006, 8, 14, Math.PI * 1.35), faceFeatureMat);
      auricle.rotation.z = -side * 0.15;
      earGroup.add(auricle);

      const lobe = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), faceFeatureMat);
      lobe.position.set(0, -0.020, 0);
      earGroup.add(lobe);

      this.headGroup.add(earGroup);
    });

    // Forehead bangs peeking under the hat
    const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.020, 0.026), hairMat);
    bangs.position.set(0, 0.062, 0.078);
    this.headGroup.add(bangs);

    // Back of neck hair sweep
    const napeHair = new THREE.Mesh(new THREE.CylinderGeometry(0.090, 0.080, 0.085, 14, 1, false, Math.PI * 0.6, Math.PI * 1.8), hairMat);
    napeHair.position.set(0, -0.018, -0.028);
    this.headGroup.add(napeHair);

    // =========================================================================
    // 5. AUTHENTIC CURVED ADVENTURER FEDORA HAT
    // =========================================================================
    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, 0.125, 0.005);
    hatGroup.rotation.x = -0.07; // Rakish explorer tilt

    // Curved Oval Brim
    const brimGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.018, 28);
    const hatBrim = new THREE.Mesh(brimGeo, hatMat);
    hatBrim.scale.set(1.06, 1.0, 1.22);
    hatBrim.castShadow = true;
    hatGroup.add(hatBrim);

    // Pinched Fedora Crown
    const crownGeo = new THREE.CylinderGeometry(0.120, 0.155, 0.140, 20);
    const hatCrown = new THREE.Mesh(crownGeo, hatMat);
    hatCrown.scale.set(0.93, 1.0, 1.12);
    hatCrown.position.y = 0.075;
    hatCrown.castShadow = true;
    hatGroup.add(hatCrown);

    // Top crown center crease valley
    const topCrease = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.024, 0.18), hatMat);
    topCrease.position.set(0, 0.145, 0);
    hatGroup.add(topCrease);

    // Front-left and front-right pinch indentations
    [-1, 1].forEach((side) => {
      const pinch = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), hatMat);
      pinch.scale.set(0.55, 1.0, 0.75);
      pinch.position.set(side * 0.082, 0.090, 0.078);
      hatGroup.add(pinch);
    });

    // Dark leather hatband with miniature golden brass buckle
    const bandGeo = new THREE.CylinderGeometry(0.158, 0.158, 0.030, 22);
    const hatBand = new THREE.Mesh(bandGeo, beltMat);
    hatBand.scale.set(0.94, 1.0, 1.13);
    hatBand.position.y = 0.020;
    hatGroup.add(hatBand);

    const hatBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.036, 0.016), brassMat);
    hatBuckle.position.set(-0.155, 0.020, 0.010);
    hatGroup.add(hatBuckle);

    this.headGroup.add(hatGroup);

    // =========================================================================
    // D. ARTICULATED ARMS WITH DETAILED HANDS & 5 ARTICULATED FINGERS
    // =========================================================================
    this.leftArm = this.createArm(skinMat, jacketMat, gloveMat, brassMat, true);
    this.leftArm.position.set(0.29, 0.40, 0);
    this.torso.add(this.leftArm);

    this.rightArm = this.createArm(skinMat, jacketMat, gloveMat, brassMat, false);
    this.rightArm.position.set(-0.29, 0.40, 0);
    this.torso.add(this.rightArm);

    // =========================================================================
    // E. ARTICULATED LEGS & HIGH-DETAIL COMBAT BOOTS
    // =========================================================================
    this.leftLeg = this.createLeg(pantsMat, bootsMat, soleMat, brassMat, true);
    this.leftLeg.position.set(0.11, -0.05, 0);
    this.pelvis.add(this.leftLeg);

    this.rightLeg = this.createLeg(pantsMat, bootsMat, soleMat, brassMat, false);
    this.rightLeg.position.set(-0.11, -0.05, 0);
    this.pelvis.add(this.rightLeg);
  }

  createArm(skinMat, jacketMat, gloveMat, brassMat, isLeft) {
    const shoulder = new THREE.Group();

    // Contoured upper arm in jacket leather
    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.062, 0.26, 14), jacketMat);
    upperArm.position.y = -0.13;
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    // Articulated Elbow Joint
    const elbow = new THREE.Group();
    elbow.position.y = -0.26;
    shoulder.add(elbow);

    // Rolled leather jacket sleeve cuff
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.076, 0.074, 0.048, 14), jacketMat);
    cuff.position.y = -0.02;
    elbow.add(cuff);

    // Muscular forearm in natural skin tone
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.050, 0.22, 14), skinMat);
    forearm.position.y = -0.12;
    forearm.castShadow = true;
    elbow.add(forearm);

    // Leather adventurer wrist bracer
    const bracer = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.052, 0.055, 14), gloveMat);
    bracer.position.y = -0.195;
    const bracerBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.020, 0.010), brassMat);
    bracerBuckle.position.set(isLeft ? 0.055 : -0.055, -0.195, 0);
    elbow.add(bracer, bracerBuckle);

    // =========================================================================
    // REALISTIC SCULPTED HAND WITH PALM, THUMB & 4 ARTICULATED FINGERS
    // =========================================================================
    const handGroup = new THREE.Group();
    handGroup.position.set(0, -0.255, 0.005);

    // Contoured Palm Block with metacarpal curve
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.065, 0.038), gloveMat);
    palm.position.set(0, -0.032, 0);
    palm.castShadow = true;
    handGroup.add(palm);

    // Padded knuckle ridge
    const knucklePad = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.012, 0.042), gloveMat);
    knucklePad.position.set(0, -0.058, 0.004);
    handGroup.add(knucklePad);

    // Opposable Thumb with natural angle & proximal/distal phalanges
    const thumbGroup = new THREE.Group();
    thumbGroup.position.set(isLeft ? -0.026 : 0.026, -0.025, 0.018);
    thumbGroup.rotation.x = 0.40;
    thumbGroup.rotation.z = isLeft ? -0.55 : 0.55;
    thumbGroup.rotation.y = isLeft ? 0.28 : -0.28;

    const thumbProximal = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.008, 0.032, 8), gloveMat);
    thumbProximal.position.y = -0.016;
    thumbGroup.add(thumbProximal);

    const thumbTip = new THREE.Mesh(new THREE.SphereGeometry(0.0085, 8, 8), gloveMat);
    thumbTip.position.y = -0.032;
    thumbGroup.add(thumbTip);
    handGroup.add(thumbGroup);

    // 4 Distinct Articulated Fingers (Index, Middle, Ring, Pinky)
    const fingerLengths = [0.050, 0.056, 0.052, 0.040];
    const fingerRadii   = [0.0075, 0.0080, 0.0075, 0.0068];
    const fingerSpans   = isLeft ? [-0.018, -0.006, 0.006, 0.018] : [0.018, 0.006, -0.006, -0.018];

    for (let i = 0; i < 4; i++) {
      const fLen = fingerLengths[i];
      const fRad = fingerRadii[i];
      const fX   = fingerSpans[i];

      const fingerGroup = new THREE.Group();
      fingerGroup.position.set(fX, -0.065, 0.005);
      fingerGroup.rotation.x = 0.24; // Relaxed natural curvature

      const fingerMesh = new THREE.Mesh(new THREE.CylinderGeometry(fRad, fRad * 0.85, fLen, 8), gloveMat);
      fingerMesh.position.y = -fLen * 0.48;
      fingerMesh.castShadow = true;
      fingerGroup.add(fingerMesh);

      const fingerTip = new THREE.Mesh(new THREE.SphereGeometry(fRad * 0.85, 6, 6), gloveMat);
      fingerTip.position.y = -fLen * 0.96;
      fingerGroup.add(fingerTip);

      handGroup.add(fingerGroup);
    }

    elbow.add(handGroup);

    shoulder.userData = { elbow };
    return shoulder;
  }

  createLeg(pantsMat, bootsMat, soleMat, brassMat, isLeft) {
    const hipJoint = new THREE.Group();

    // Contoured Thigh with cargo twill
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.082, 0.45, 16), pantsMat);
    thigh.position.y = -0.225;
    thigh.castShadow = true;
    hipJoint.add(thigh);

    // Outer Cargo Pocket with flap & brass snap
    const cargoPocket = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.12, 0.095), pantsMat);
    cargoPocket.position.set(isLeft ? 0.092 : -0.092, -0.20, 0);
    const snap = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 6), brassMat);
    snap.position.set(isLeft ? 0.026 : -0.026, 0.035, 0);
    cargoPocket.add(snap);
    hipJoint.add(cargoPocket);

    // Knee joint at y = -0.45
    const knee = new THREE.Group();
    knee.position.y = -0.45;
    hipJoint.add(knee);

    // Double-layer reinforced knee patch
    const kneePatch = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.086, 0.11, 14, 1, false, -Math.PI * 0.5, Math.PI), bootsMat);
    kneePatch.position.set(0, 0, 0.012);
    knee.add(kneePatch);

    // Tapered Shin & Calf: length 0.36
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.080, 0.068, 0.36, 16), pantsMat);
    shin.position.y = -0.18;
    shin.castShadow = true;
    knee.add(shin);

    // =========================================================================
    // HIGH-DETAIL LACED COMBAT / EXPEDITION BOOT (STRICTLY GROUNDED AT Y = 0.0)
    // =========================================================================
    const bootGroup = new THREE.Group();
    bootGroup.position.set(0, -0.42, 0.02);

    // 1. Boot Shaft with padded collar
    const bootShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.076, 0.079, 0.125, 14), bootsMat);
    bootShaft.position.y = 0.062;
    bootShaft.castShadow = true;
    bootGroup.add(bootShaft);

    const bootCollar = new THREE.Mesh(new THREE.TorusGeometry(0.076, 0.012, 8, 16), bootsMat);
    bootCollar.rotation.x = Math.PI / 2;
    bootCollar.position.y = 0.122;
    bootGroup.add(bootCollar);

    // 2. Leather Tongue & Criss-Crossed Laces
    const bootTongue = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.115, 0.016), bootsMat);
    bootTongue.position.set(0, 0.062, 0.075);
    bootGroup.add(bootTongue);

    // Brass eyelets & leather cross-laces
    [0.025, 0.055, 0.085, 0.110].forEach((ly) => {
      [-0.022, 0.022].forEach((lx) => {
        const eyelet = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 6, 6), brassMat);
        eyelet.position.set(lx, ly, 0.084);
        bootGroup.add(eyelet);
      });
      const laceCross = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.004, 0.004), brassMat);
      laceCross.position.set(0, ly, 0.085);
      bootGroup.add(laceCross);
    });

    // 3. Anatomical Foot: Heel Counter, Midfoot Arch & Rounded Toe Box
    const heelCounter = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.068, 0.088, 14), bootsMat);
    heelCounter.position.set(0, 0.008, -0.038);
    heelCounter.castShadow = true;
    bootGroup.add(heelCounter);

    const midfoot = new THREE.Mesh(new THREE.BoxGeometry(0.102, 0.082, 0.125), bootsMat);
    midfoot.position.set(0, 0.008, 0.022);
    midfoot.castShadow = true;
    bootGroup.add(midfoot);

    const toeBox = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.064, 0.076, 14), bootsMat);
    toeBox.scale.set(1.02, 1.0, 0.88);
    toeBox.position.set(0, 0.006, 0.098);
    toeBox.castShadow = true;
    bootGroup.add(toeBox);

    // Reinforced rounded toe cap with subtle walking rocker curve
    const toeCap = new THREE.Mesh(new THREE.SphereGeometry(0.040, 12, 10), bootsMat);
    toeCap.scale.set(1.18, 0.65, 1.10);
    toeCap.position.set(0, 0.002, 0.118);
    toeCap.castShadow = true;
    bootGroup.add(toeCap);

    // 4. Distinct Raised Stacked Heel (Rear)
    const stackedHeel = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.066, 0.032, 14), soleMat);
    stackedHeel.position.set(0, -0.044, -0.038);
    bootGroup.add(stackedHeel);

    // 5. Heavy Lugged Rubber Traction Sole (Treads)
    const rubberSole = new THREE.Mesh(new THREE.BoxGeometry(0.112, 0.020, 0.25), soleMat);
    rubberSole.position.set(0, -0.050, 0.038);
    bootGroup.add(rubberSole);

    // Traction cleats under outsole
    [-0.04, 0.01, 0.06, 0.11].forEach((tZ) => {
      const cleat = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.008, 0.014), soleMat);
      cleat.position.set(0, -0.064, tZ);
      bootGroup.add(cleat);
    });

    knee.add(bootGroup);

    hipJoint.userData = { knee };
    return hipJoint;
  }

  initEventListeners() {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.keys.forward = true; break;
        case 'KeyS': case 'ArrowDown': this.keys.backward = true; break;
        case 'KeyA': case 'ArrowLeft': this.keys.left = true; break;
        case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
        case 'ShiftLeft': case 'ShiftRight': this.keys.sprint = true; break;
        case 'Space':
          if (this.isGrounded) {
            this.verticalVelocity = this.jumpForce;
            this.isGrounded = false;
          }
          break;
        case 'KeyE':
          if (window.puzzleManager) window.puzzleManager.handleInteract();
          break;
        case 'KeyC':
          this.toggleCinematicMode();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.keys.forward = false; break;
        case 'KeyS': case 'ArrowDown': this.keys.backward = false; break;
        case 'KeyA': case 'ArrowLeft': this.keys.left = false; break;
        case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
        case 'ShiftLeft': case 'ShiftRight': this.keys.sprint = false; break;
      }
    });

    window.addEventListener('blur', () => {
      this.keys.forward = false;
      this.keys.backward = false;
      this.keys.left = false;
      this.keys.right = false;
      this.keys.sprint = false;
    });

    this.isMouseDown = false;
    this.domElement.addEventListener('mousedown', () => {
      this.isMouseDown = true;
      if (!this.isPointerLocked) {
        this.domElement.requestPointerLock();
      }
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    this.domElement.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        this.domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.domElement;
    });

    window.addEventListener('mousemove', (e) => {
      if ((!this.isPointerLocked && !this.isMouseDown) || this.cutsceneActive) return;
      this.cameraYaw -= e.movementX * this.mouseSensitivity;
      this.cameraPitch = Math.max(
        -0.2,
        Math.min(1.1, this.cameraPitch + e.movementY * this.mouseSensitivity)
      );
    });

    window.addEventListener('wheel', (e) => {
      this.cameraTargetDistance = Math.max(3.0, Math.min(8.5, this.cameraTargetDistance + e.deltaY * 0.005));
    }, { passive: true });
  }

  toggleCinematicMode() {
    this.cinematicMode = !this.cinematicMode;
    document.body.classList.toggle('cinematic-active', this.cinematicMode);
  }

  addCameraShake(intensity = 0.35, duration = 1.0) {
    this.cameraTrauma = Math.min(1.0, this.cameraTrauma + intensity);
    this.traumaDecay = intensity / Math.max(0.1, duration);
  }

  triggerCutsceneFocus(targetPos, duration = 2.5) {
    this.cutsceneActive = true;
    this.cutsceneTarget = targetPos.clone();
    this.cutsceneDuration = duration;
    this.cutsceneTimer = 0;
  }

  update(delta, collisionObjects = []) {
    // 1. Precise camera-relative movement vectors on horizontal XZ plane
    const sinYaw = Math.sin(this.cameraYaw);
    const cosYaw = Math.cos(this.cameraYaw);

    // Forward vector on XZ plane:
    // With cameraYaw = Math.PI (initial view looking North into temple towards -Z):
    // sin(PI) = 0, cos(PI) = -1. fwd = (0, -1).
    const fwdX = sinYaw;
    const fwdZ = cosYaw;

    // Right vector on XZ plane (90 degrees clockwise from forward):
    // With cameraYaw = Math.PI: right = (+1, 0) (East).
    const rightX = -cosYaw;
    const rightZ = sinYaw;

    // Directional inputs
    let inputForward = 0; // +1 for W, -1 for S
    let inputRight = 0;   // +1 for D, -1 for A

    if (this.keys.forward) inputForward += 1;
    if (this.keys.backward) inputForward -= 1;
    if (this.keys.right) inputRight += 1;
    if (this.keys.left) inputRight -= 1;

    const inputMag = Math.sqrt(inputForward * inputForward + inputRight * inputRight);
    this.isMoving = inputMag > 0.001;

    let moveX = 0;
    let moveZ = 0;

    if (this.isMoving && !this.cutsceneActive) {
      // Normalize input so diagonal movement speed is strictly uniform
      const normFwd = inputForward / inputMag;
      const normRight = inputRight / inputMag;

      // Composite exact movement vector on XZ plane
      moveX = fwdX * normFwd + rightX * normRight;
      moveZ = fwdZ * normFwd + rightZ * normRight;

      const speed = this.keys.sprint ? this.runSpeed : this.walkSpeed;
      this.velocity.x = moveX * speed;
      this.velocity.z = moveZ * speed;

      // Character mesh faces direction of travel
      this.targetRotationY = Math.atan2(moveX, moveZ);
      this.rotationY = this.targetRotationY;
      this.characterMesh.rotation.y = this.rotationY;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    // 2. Lock Y position strictly to ground level
    this.position.y = 0.0;
    this.verticalVelocity = 0;
    this.isGrounded = true;

    // 3. Collision Resolution & Position update (XZ plane only)
    if (this.isMoving) {
      const stepX = this.velocity.x * delta;
      const stepZ = this.velocity.z * delta;

      const nextX = this.position.x + stepX;
      const nextZ = this.position.z + stepZ;

      if (!this.checkWallCollision(nextX, this.position.z, collisionObjects)) {
        this.position.x = nextX;
      }
      if (!this.checkWallCollision(this.position.x, nextZ, collisionObjects)) {
        this.position.z = nextZ;
      }
    }

    // Strictly lock Y position to ground level (0.0)
    this.position.y = 0.0;
    this.root.position.copy(this.position);

    // 4. Procedural Locomotion Animation
    this.animateHumanLocomotion(delta);

    // 5. Update Camera with Wall-Clipping Prevention
    this.updateCamera(delta, collisionObjects);
  }

  getFloorHeightAt(x, z) {
    // Single continuous flat ground level across the entire level
    return 0.0;
  }

  checkWallCollision(x, z, collisionObjects) {
    const playerRadius = 0.55;
    const playerFeet = this.position.y;
    const playerHead = this.position.y + 1.85;

    // Boundary checks per level
    if (window.gameManager && (window.gameManager.currentLevel === 0 || window.gameManager.currentLevel === 'palace')) {
      // Palace Hall bounds: Width 32m (X: -15.5 to 15.5), Length 64m (Z: -31.5 to 31.5)
      if (Math.abs(x) > 15.5 || Math.abs(z) > 31.5) return true;
    } else if (!window.gameManager || window.gameManager.currentLevel === 1) {
      if (z > 20) {
        if (Math.abs(x) > 27 || z > 56) return true;
      }
    } else {
      // Level 2 Lake & Level 3 Forest perimeter boundary (radius 74m)
      if (x * x + z * z > 74 * 74) return true;
    }

    for (let obj of collisionObjects) {
      if (!obj || !obj.box) continue;
      if (obj.isOpen) continue;

      const b = obj.box;

      // 3D Height-awareness
      if (b.min.y >= playerHead || b.max.y <= playerFeet + 0.1) {
        continue;
      }

      if (
        x + playerRadius > b.min.x &&
        x - playerRadius < b.max.x &&
        z + playerRadius > b.min.z &&
        z - playerRadius < b.max.z
      ) {
        return true;
      }
    }
    return false;
  }

  animateHumanLocomotion(delta) {
    const currentSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
    const normalizedSpeed = Math.min(1.5, currentSpeed / this.walkSpeed);

    if (this.isMoving && currentSpeed > 0.3) {
      const strideFreq = this.keys.sprint ? 11.5 : 8.0;
      this.animTime += delta * strideFreq;

      const cycle = Math.sin(this.animTime);

      // Leg swing with natural knee bend
      const maxLegAngle = this.keys.sprint ? 0.65 : 0.48;
      this.leftLeg.rotation.x = cycle * maxLegAngle;
      this.rightLeg.rotation.x = -cycle * maxLegAngle;

      // Knee flex
      const leftKnee = this.leftLeg.userData.knee;
      const rightKnee = this.rightLeg.userData.knee;
      leftKnee.rotation.x = Math.max(0, -cycle * 0.7);
      rightKnee.rotation.x = Math.max(0, cycle * 0.7);

      // Arm swing (counter-balancing legs)
      const maxArmAngle = this.keys.sprint ? 0.75 : 0.50;
      this.leftArm.rotation.x = -cycle * maxArmAngle;
      this.rightArm.rotation.x = cycle * maxArmAngle;

      this.leftArm.userData.elbow.rotation.x = -0.2 - Math.max(0, -cycle * 0.4);
      this.rightArm.userData.elbow.rotation.x = -0.2 - Math.max(0, cycle * 0.4);

      // Torso slight dynamic sway and lean
      this.torso.rotation.z = Math.sin(this.animTime * 0.5) * 0.03;
      this.torso.rotation.x = 0.06 * normalizedSpeed;

      // Dynamic scarf fluttering backwards
      if (this.scarfTail) {
        this.scarfTail.rotation.x = -0.35 - normalizedSpeed * 0.45 + Math.sin(this.animTime * 1.5) * 0.18;
        this.scarfTail.rotation.z = Math.sin(this.animTime) * 0.14;
      }

      // Footstep sound
      this.footstepTimer += delta * strideFreq;
      if (this.footstepTimer >= Math.PI) {
        this.footstepTimer = 0;
        if (window.soundSystem) {
          window.soundSystem.playFootstep(this.keys.sprint);
        }
      }
    } else {
      // Idle Breathing
      this.animTime += delta * 2.0;
      const breath = Math.sin(this.animTime);

      this.torso.position.y = 0.10 + breath * 0.008;
      if (this.scarfTail) {
        this.scarfTail.rotation.x = -0.1 + breath * 0.05;
        this.scarfTail.rotation.z = Math.sin(this.animTime * 0.7) * 0.06;
      }

      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, delta * 8);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, delta * 8);
      this.leftLeg.userData.knee.rotation.x = THREE.MathUtils.lerp(this.leftLeg.userData.knee.rotation.x, 0, delta * 8);
      this.rightLeg.userData.knee.rotation.x = THREE.MathUtils.lerp(this.rightLeg.userData.knee.rotation.x, 0, delta * 8);

      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0.06, delta * 6);
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0.06, delta * 6);
      this.leftArm.userData.elbow.rotation.x = THREE.MathUtils.lerp(this.leftArm.userData.elbow.rotation.x, -0.1, delta * 6);
      this.rightArm.userData.elbow.rotation.x = THREE.MathUtils.lerp(this.rightArm.userData.elbow.rotation.x, -0.1, delta * 6);

      this.torso.rotation.x = breath * 0.02;
      this.torso.rotation.z = 0;
      this.neck.rotation.x = -breath * 0.015;
    }
  }

  updateCamera(delta, collisionObjects = []) {
    if (this.cutsceneActive) {
      this.cutsceneTimer += delta;
      if (this.cutsceneTimer >= this.cutsceneDuration) {
        this.cutsceneActive = false;
      } else {
        this.camera.lookAt(this.cutsceneTarget.x, this.cutsceneTarget.y, this.cutsceneTarget.z);
        return;
      }
    }

    this.cameraDistance = THREE.MathUtils.lerp(this.cameraDistance, this.cameraTargetDistance, delta * 10);

    // Get world position of camera target
    this.cameraTarget.getWorldPosition(this.cameraPivot);

    const cosPitch = Math.cos(this.cameraPitch);
    const sinPitch = Math.sin(this.cameraPitch);
    const sinYaw = Math.sin(this.cameraYaw);
    const cosYaw = Math.cos(this.cameraYaw);

    let actualDist = this.cameraDistance;

    // Raycast from pivot to camera to prevent clipping through walls
    const rayDir = new THREE.Vector3(
      -sinYaw * cosPitch,
      sinPitch,
      -cosYaw * cosPitch
    ).normalize();

    const ray = new THREE.Ray(this.cameraPivot, rayDir);
    const hitPoint = new THREE.Vector3();

    for (let obj of collisionObjects) {
      if (!obj || !obj.box || obj.isOpen) continue;
      if (ray.intersectBox(obj.box, hitPoint)) {
        const d = this.cameraPivot.distanceTo(hitPoint);
        if (d < actualDist) {
          actualDist = Math.max(1.3, d - 0.35);
        }
      }
    }

    const desiredCamPos = new THREE.Vector3(
      this.cameraPivot.x - sinYaw * cosPitch * actualDist,
      this.cameraPivot.y + sinPitch * actualDist,
      this.cameraPivot.z - cosYaw * cosPitch * actualDist
    );

    // Apply trauma shake
    if (this.cameraTrauma > 0) {
      const shakePower = this.cameraTrauma * this.cameraTrauma;
      desiredCamPos.x += (Math.random() - 0.5) * 0.35 * shakePower;
      desiredCamPos.y += (Math.random() - 0.5) * 0.25 * shakePower;
      desiredCamPos.z += (Math.random() - 0.5) * 0.35 * shakePower;
      this.cameraTrauma = Math.max(0, this.cameraTrauma - this.traumaDecay * delta);
    }

    this.camera.position.copy(desiredCamPos);
    this.camera.lookAt(this.cameraPivot.x, this.cameraPivot.y + 0.1, this.cameraPivot.z);
  }
}

window.PlayerController = PlayerController;
