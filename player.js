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
    // Materials
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xd9b392,
      roughness: 0.65,
      metalness: 0.05
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x382a1e,
      roughness: 0.9
    });

    const hatMat = new THREE.MeshStandardMaterial({
      color: 0x483a2d, // Leather fedora
      roughness: 0.75
    });

    const jacketMat = new THREE.MeshStandardMaterial({
      color: 0x5e4c3a, // Adventurer jacket
      roughness: 0.7,
      metalness: 0.08
    });

    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0xdcd6cb,
      roughness: 0.85
    });

    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x3d433e, // Cargo pants
      roughness: 0.8
    });

    const bootsMat = new THREE.MeshStandardMaterial({
      color: 0x241e18, // Laced leather boots
      roughness: 0.55,
      metalness: 0.12
    });

    const beltMat = new THREE.MeshStandardMaterial({
      color: 0x1c1714,
      roughness: 0.4
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4a853,
      metalness: 0.85,
      roughness: 0.25
    });

    const scarfMat = new THREE.MeshStandardMaterial({
      color: 0xb32832, // Red adventurer scarf
      roughness: 0.75
    });

    // =========================================================================
    // UNIFIED ANATOMICAL HIERARCHY:
    // Boot soles sit strictly at y = 0.0.
    // Every part overlaps its socket joint so it is physically impossible to detach!
    // =========================================================================

    // A. Pelvis / Hips (y = 0.92 to 1.10)
    this.pelvis = new THREE.Group();
    this.pelvis.position.set(0, 1.0, 0);
    this.characterMesh.add(this.pelvis);

    const hips = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.26), pantsMat);
    hips.castShadow = true;
    this.pelvis.add(hips);

    // Utility belt with brass buckle
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.07, 0.28), beltMat);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.03), brassMat);
    buckle.position.set(0, 0, 0.15);
    belt.add(buckle);

    // Pouches & canteen
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.10, 0.06), jacketMat);
    pouch.position.set(-0.20, -0.04, 0.02);
    belt.add(pouch);

    const canteen = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.13, 10), beltMat);
    canteen.rotation.z = 0.25;
    canteen.position.set(0.20, -0.04, 0.02);
    belt.add(canteen);
    this.pelvis.add(belt);

    // B. Torso (y = 1.08 to 1.54)
    this.torso = new THREE.Group();
    this.torso.position.set(0, 0.10, 0); // Relative to pelvis
    this.pelvis.add(this.torso);

    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.46, 0.28), jacketMat);
    torsoMesh.position.y = 0.22;
    torsoMesh.castShadow = true;
    this.torso.add(torsoMesh);

    // Inner shirt
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.02), shirtMat);
    shirt.position.set(0, 0.30, 0.145);
    this.torso.add(shirt);

    // Red Scarf around collar
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.05, 8, 16), scarfMat);
    scarf.rotation.x = Math.PI / 2;
    scarf.position.set(0, 0.46, 0);
    this.torso.add(scarf);

    // Backpack with Bedroll
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.38, 0.18), hatMat);
    pack.position.set(0, 0.22, -0.22);
    pack.castShadow = true;

    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.38, 12), pantsMat);
    roll.rotation.z = Math.PI / 2;
    roll.position.set(0, 0.43, -0.22);
    pack.add(roll);
    this.torso.add(pack);

    // C. Head, Hair & Fedora (y = 1.54 to 1.88)
    this.neck = new THREE.Group();
    this.neck.position.set(0, 0.47, 0);
    this.torso.add(this.neck);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.23, 0.22), skinMat);
    head.position.y = 0.12;
    head.castShadow = true;
    this.neck.add(head);

    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.24), hairMat);
    hair.position.set(0, 0.18, -0.01);
    this.neck.add(hair);

    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.30, 0.03, 16), hatMat);
    hatBrim.position.y = 0.24;
    hatBrim.rotation.x = -0.05;

    const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.15, 16), hatMat);
    hatCrown.position.y = 0.08;
    hatBrim.add(hatCrown);

    const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.172, 0.172, 0.03, 16), scarfMat);
    hatBand.position.y = 0.02;
    hatBrim.add(hatBand);
    this.neck.add(hatBrim);

    // D. Arms (Shoulders at y = 0.40 relative to torso)
    this.leftArm = this.createArm(skinMat, jacketMat, true);
    this.leftArm.position.set(0.28, 0.40, 0);
    this.torso.add(this.leftArm);

    this.rightArm = this.createArm(skinMat, jacketMat, false);
    this.rightArm.position.set(-0.28, 0.40, 0);
    this.torso.add(this.rightArm);

    // E. Legs (Hip joints anchored at y = -0.05 relative to pelvis)
    // In pelvis local space: pelvis at y = 1.0.
    // Hip joint at y = -0.05 -> World y = 0.95.
    // Thigh length = 0.45 -> Knee at y = 0.50.
    // Shin + Boot length = 0.50 -> Boot sole touches floor at EXACTLY y = 0.0!
    this.leftLeg = this.createLeg(pantsMat, bootsMat, true);
    this.leftLeg.position.set(0.11, -0.05, 0);
    this.pelvis.add(this.leftLeg);

    this.rightLeg = this.createLeg(pantsMat, bootsMat, false);
    this.rightLeg.position.set(-0.11, -0.05, 0);
    this.pelvis.add(this.rightLeg);
  }

  createArm(skinMat, jacketMat, isLeft) {
    const shoulder = new THREE.Group();

    // Upper arm
    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.26, 10), jacketMat);
    upperArm.position.y = -0.13;
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    // Elbow
    const elbow = new THREE.Group();
    elbow.position.y = -0.26;
    shoulder.add(elbow);

    // Forearm
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.24, 10), skinMat);
    forearm.position.y = -0.12;
    forearm.castShadow = true;
    elbow.add(forearm);

    // Glove
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.08), jacketMat);
    hand.position.y = -0.26;
    elbow.add(hand);

    shoulder.userData = { elbow };
    return shoulder;
  }

  createLeg(pantsMat, bootsMat, isLeft) {
    const hipJoint = new THREE.Group();

    // Thigh: length 0.45 -> knee at y = -0.45
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.08, 0.45, 12), pantsMat);
    thigh.position.y = -0.225;
    thigh.castShadow = true;
    hipJoint.add(thigh);

    // Knee joint at y = -0.45
    const knee = new THREE.Group();
    knee.position.y = -0.45;
    hipJoint.add(knee);

    // Shin: length 0.36 -> reaches y = -0.36
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.07, 0.36, 12), pantsMat);
    shin.position.y = -0.18;
    shin.castShadow = true;
    knee.add(shin);

    // Boot: height 0.14 -> from y = -0.36 down to -0.50.
    // Total from hip: -0.45 + -0.50 = -0.95.
    // Since hip is at y = 0.95, boot bottom touches floor at EXACTLY y = 0.0!
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.24), bootsMat);
    boot.position.set(0, -0.43, 0.04);
    boot.castShadow = true;
    knee.add(boot);

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
