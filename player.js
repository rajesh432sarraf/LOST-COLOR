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

    // PBR-Ready Materials
    const skinMat = new THREE.MeshStandardMaterial({
      map: skinTex,
      roughness: 0.58,
      metalness: 0.04
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x2e1e12,
      roughness: 0.85
    });

    const hatMat = new THREE.MeshStandardMaterial({
      map: hatTex,
      roughness: 0.72,
      metalness: 0.1
    });

    const jacketMat = new THREE.MeshStandardMaterial({
      map: jacketTex,
      roughness: 0.62,
      metalness: 0.14
    });

    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0xeee7db,
      roughness: 0.85
    });

    const pantsMat = new THREE.MeshStandardMaterial({
      map: pantsTex,
      roughness: 0.76,
      metalness: 0.06
    });

    const bootsMat = new THREE.MeshStandardMaterial({
      map: bootsTex,
      roughness: 0.52,
      metalness: 0.18
    });

    const beltMat = new THREE.MeshStandardMaterial({
      color: 0x1c120c,
      roughness: 0.45,
      metalness: 0.2
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xe5b95c,
      metalness: 0.88,
      roughness: 0.22
    });

    const scarfMat = new THREE.MeshStandardMaterial({
      map: scarfTex,
      roughness: 0.68
    });

    // =========================================================================
    // UNIFIED REALISTIC ADVENTURER ANATOMY
    // =========================================================================

    // A. Pelvis / Hips (y = 0.95 to 1.05)
    this.pelvis = new THREE.Group();
    this.pelvis.position.set(0, 1.0, 0);
    this.characterMesh.add(this.pelvis);

    const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.18, 0.22, 14), pantsMat);
    hips.scale.set(1.15, 1.0, 0.85);
    hips.castShadow = true;
    this.pelvis.add(hips);

    // Heavy utility explorer belt
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 16), beltMat);
    belt.scale.set(1.18, 1.0, 0.9);
    belt.position.y = 0.08;

    // Golden brass buckle
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.04), brassMat);
    buckle.position.set(0, 0, 0.20);
    belt.add(buckle);

    // Explorer pouches & field canteen
    const pouchL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.10, 0.07), jacketMat);
    pouchL.position.set(-0.21, -0.02, 0.04);
    pouchL.rotation.y = 0.25;
    belt.add(pouchL);

    const pouchR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.10, 0.07), jacketMat);
    pouchR.position.set(0.21, -0.02, 0.04);
    pouchR.rotation.y = -0.25;
    belt.add(pouchR);

    const canteen = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.14, 12), brassMat);
    canteen.rotation.z = 0.35;
    canteen.position.set(0.18, -0.04, -0.08);
    belt.add(canteen);

    // Ancient Map Scroll Canister
    const mapScroll = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.26, 10), jacketMat);
    mapScroll.rotation.x = Math.PI / 2;
    mapScroll.rotation.z = 0.4;
    mapScroll.position.set(-0.16, -0.02, -0.10);
    belt.add(mapScroll);

    this.pelvis.add(belt);

    // B. Torso (y = 1.08 to 1.54)
    this.torso = new THREE.Group();
    this.torso.position.set(0, 0.10, 0);
    this.pelvis.add(this.torso);

    // Contoured leather jacket torso
    const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.20, 0.46, 14), jacketMat);
    torsoMesh.scale.set(1.15, 1.0, 0.85);
    torsoMesh.position.y = 0.23;
    torsoMesh.castShadow = true;
    this.torso.add(torsoMesh);

    // 3D Jacket Lapels
    const lapelGeo = new THREE.BoxGeometry(0.12, 0.32, 0.05);
    const lapelL = new THREE.Mesh(lapelGeo, jacketMat);
    lapelL.position.set(-0.08, 0.28, 0.16);
    lapelL.rotation.z = -0.15;
    const lapelR = new THREE.Mesh(lapelGeo, jacketMat);
    lapelR.position.set(0.08, 0.28, 0.16);
    lapelR.rotation.z = 0.15;
    this.torso.add(lapelL, lapelR);

    // Inner linen shirt with V-neck
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.26, 0.02), shirtMat);
    shirt.position.set(0, 0.28, 0.15);
    this.torso.add(shirt);

    // Shoulder Epaulets with brass buttons
    [-1, 1].forEach((side) => {
      const epaulet = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.07), jacketMat);
      epaulet.position.set(side * 0.24, 0.44, 0);
      const snap = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), brassMat);
      snap.position.set(side * 0.04, 0.02, 0);
      epaulet.add(snap);
      this.torso.add(epaulet);
    });

    // Flowing Crimson Scarf with dynamic animated tails
    const scarfCollar = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.06, 10, 20), scarfMat);
    scarfCollar.rotation.x = Math.PI / 2;
    scarfCollar.position.set(0, 0.47, 0);
    this.torso.add(scarfCollar);

    // Hanging Scarf Tail (animated during movement)
    this.scarfTail = new THREE.Group();
    this.scarfTail.position.set(0.06, 0.45, 0.14);
    const tailMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.02), scarfMat);
    tailMesh.position.y = -0.14;
    this.scarfTail.add(tailMesh);
    this.torso.add(this.scarfTail);

    // Explorer Backpack with Bedroll
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.16), hatMat);
    pack.position.set(0, 0.23, -0.22);
    pack.castShadow = true;

    const bedroll = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.36, 12), pantsMat);
    bedroll.rotation.z = Math.PI / 2;
    bedroll.position.set(0, 0.42, -0.22);
    pack.add(bedroll);
    this.torso.add(pack);

    // C. Head, Hair & Fedora (y = 1.54 to 1.88)
    this.neck = new THREE.Group();
    this.neck.position.set(0, 0.48, 0);
    this.torso.add(this.neck);

    // Contoured head with face texture
    const headGeo = new THREE.BoxGeometry(0.20, 0.22, 0.20);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.12;
    head.castShadow = true;
    this.neck.add(head);

    // Styled hair peeking out around sides and back
    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.12), hairMat);
    hairBack.position.set(0, 0.14, -0.09);
    this.neck.add(hairBack);

    // Fedora Hat with curved brim & pinched crown
    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, 0.24, 0);
    hatGroup.rotation.x = -0.06;

    // Curved oval brim
    const brimGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.025, 20);
    const hatBrim = new THREE.Mesh(brimGeo, hatMat);
    hatBrim.scale.set(1.05, 1.0, 1.25);
    hatGroup.add(hatBrim);

    // Pinched Fedora Crown
    const crownGeo = new THREE.CylinderGeometry(0.14, 0.17, 0.15, 16);
    const hatCrown = new THREE.Mesh(crownGeo, hatMat);
    hatCrown.scale.set(0.95, 1.0, 1.15);
    hatCrown.position.y = 0.08;
    hatGroup.add(hatCrown);

    // Hat Band with gold buckle
    const bandGeo = new THREE.CylinderGeometry(0.172, 0.172, 0.035, 16);
    const hatBand = new THREE.Mesh(bandGeo, beltMat);
    hatBand.scale.set(0.96, 1.0, 1.16);
    hatBand.position.y = 0.025;
    const hatBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.045, 0.02), brassMat);
    hatBuckle.position.set(0.165, 0.025, 0);
    hatGroup.add(hatBand, hatBuckle);

    this.neck.add(hatGroup);

    // D. Articulated Arms with Jacket Sleeves & Leather Gloves
    this.leftArm = this.createArm(skinMat, jacketMat, bootsMat, true);
    this.leftArm.position.set(0.29, 0.40, 0);
    this.torso.add(this.leftArm);

    this.rightArm = this.createArm(skinMat, jacketMat, bootsMat, false);
    this.rightArm.position.set(-0.29, 0.40, 0);
    this.torso.add(this.rightArm);

    // E. Articulated Legs with Cargo Twill & Laced Boots
    this.leftLeg = this.createLeg(pantsMat, bootsMat, true);
    this.leftLeg.position.set(0.11, -0.05, 0);
    this.pelvis.add(this.leftLeg);

    this.rightLeg = this.createLeg(pantsMat, bootsMat, false);
    this.rightLeg.position.set(-0.11, -0.05, 0);
    this.pelvis.add(this.rightLeg);
  }

  createArm(skinMat, jacketMat, gloveMat, isLeft) {
    const shoulder = new THREE.Group();

    // Upper arm with leather sleeve
    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.26, 12), jacketMat);
    upperArm.position.y = -0.13;
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    // Elbow Joint
    const elbow = new THREE.Group();
    elbow.position.y = -0.26;
    shoulder.add(elbow);

    // Forearm with rolled cuff
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 12), jacketMat);
    cuff.position.y = -0.02;
    elbow.add(cuff);

    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.22, 12), skinMat);
    forearm.position.y = -0.12;
    forearm.castShadow = true;
    elbow.add(forearm);

    // Sculpted Leather Glove Hand
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.09, 0.09), gloveMat);
    hand.position.set(0, -0.26, 0.01);
    hand.castShadow = true;
    elbow.add(hand);

    shoulder.userData = { elbow };
    return shoulder;
  }

  createLeg(pantsMat, bootsMat, isLeft) {
    const hipJoint = new THREE.Group();

    // Thigh with cargo twill
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.085, 0.45, 14), pantsMat);
    thigh.position.y = -0.225;
    thigh.castShadow = true;
    hipJoint.add(thigh);

    // Side cargo pocket flap
    const cargoPocket = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.09), pantsMat);
    cargoPocket.position.set(isLeft ? 0.09 : -0.09, -0.20, 0);
    hipJoint.add(cargoPocket);

    // Knee joint at y = -0.45
    const knee = new THREE.Group();
    knee.position.y = -0.45;
    hipJoint.add(knee);

    // Shin: length 0.36
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.072, 0.36, 14), pantsMat);
    shin.position.y = -0.18;
    shin.castShadow = true;
    knee.add(shin);

    // Realistic Laced Explorer Boot:
    // Boot cuff + foot box with raised heel and toe
    const bootGroup = new THREE.Group();
    bootGroup.position.set(0, -0.42, 0.03);

    const bootShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.082, 0.12, 12), bootsMat);
    bootShaft.position.y = 0.06;
    bootShaft.castShadow = true;
    bootGroup.add(bootShaft);

    const bootFoot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.11, 0.25), bootsMat);
    bootFoot.position.set(0, 0.0, 0.03);
    bootFoot.castShadow = true;
    bootGroup.add(bootFoot);

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

    // Courtyard boundaries (Level 1 only)
    if (!window.gameManager || window.gameManager.currentLevel === 1) {
      if (z > 20) {
        if (Math.abs(x) > 27 || z > 56) return true;
      }
    } else {
      // Level 2 Lake perimeter boundary (radius 115)
      if (x * x + z * z > 115 * 115) return true;
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
