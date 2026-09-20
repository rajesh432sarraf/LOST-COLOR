/**
 * puzzles.js - Puzzle Manager for Level 1 (Temple) and Level 2 (Water Realm)
 * Handles:
 * - Level 1: 3 Guardian Statues alignment, Key collection, Temple gate unlock, Fire Crystal collection
 * - Level 1 Complete Screen: Title: "Level 1 Complete", Message: "Excellent Explorer! You restored the Ancient Temple and recovered the Fire Crystal.", +100 Score, Fire Crystal Collected, [NEXT LEVEL ➜]
 * - Level 2: 4 Ancient Stone Pillars clue inspection (auto-saved to localStorage)
 * - Level 2: Puzzle activation upon 4/4 discovered clues ("Connect the symbols in the correct order.")
 * - Level 2: Connection mechanic (CLOUD ➔ RAIN ➔ LAKE ➔ OCEAN)
 * - Level 2: Correct connection effects (blue energy travels, water particles, rising stone paths, circular rune lights, water SFX)
 * - Level 2: Incorrect connection handling (red flash, "Incorrect Order. Try Again.", reset attempt, clues preserved)
 * - Level 2: Crystal reveal cutscene (ground trembles, illuminating cracks, converging energy, rising Water Crystal)
 * - Level 2: Water Crystal collection (flight animation, water pulse wave, +200 score, Level 2 Complete Screen)
 */

class PuzzleManager {
  constructor(temple, player) {
    this.temple = temple;
    this.player = player;
    this.lake = null;
    this.forest = null;
    this.palace = null;
    this.currentLevel = 0; // 0 = Palace Hub, 1 = Temple, 2 = Lake, 3 = Forest

    // Soldier's Crystal Inventory & Palace Altar State
    this.inventory = { red: false, water: false, life: false };
    this.altarSockets = { fire: false, water: false, life: false };

    this.questState = {
      p1_statues: false,
      statuesSolved: false,
      hasKey: false,
      doorUnlocked: false,
      gameCompleted: false,
      lakeCompleted: false
    };

    this.currentInteraction = null;
    this.climaxActive = false;
    this.climaxTimer = 0;
    this.redRestorationProgress = 0.0;
    this.victoryShown = false;

    // Cached positions for zero-allocation interaction proximity checks
    this._palaceReturnPos = new THREE.Vector3(0, 0, 49);
    this._palaceReturnInteractable = {
      type: 'palace_return',
      position: this._palaceReturnPos,
      getPrompt: () => 'Press [E] to Return to Royal Palace Hub 🏛️'
    };

    // Level 2 Clues & Connection State
    this.discoveredClues = {
      cloud: false,
      rain: false,
      lake: false,
      river: false
    };
    this.loadSavedClues();

    this.allCluesDiscovered = Object.values(this.discoveredClues).every(Boolean);
    this.connectionSequence = [];
    this.waterPuzzleSolved = false;
    this.waterClimaxActive = false;
    this.waterClimaxTimer = 0;
    this.level2VictoryShown = false;

    // Level 3 Forest Clues & Connection State
    this.forestClues = {
      seed: false,
      sprout: false,
      tree: false,
      bloom: false
    };
    this.loadSavedForestClues();
    this.allForestCluesDiscovered = Object.values(this.forestClues).every(Boolean);
    this.forestSequence = [];
    this.forestPuzzleSolved = false;
    this.forestClimaxActive = false;
    this.forestClimaxTimer = 0;
    this.level3VictoryShown = false;
  }

  loadSavedForestClues() {
    try {
      const saved = localStorage.getItem('forest_realm_clues');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          this.forestClues = Object.assign(this.forestClues, parsed);
        }
      }
    } catch (e) {
      console.log('Error loading saved forest clues:', e);
    }
  }

  saveForestClues() {
    try {
      localStorage.setItem('forest_realm_clues', JSON.stringify(this.forestClues));
    } catch (e) {
      console.log('Error saving forest clues:', e);
    }
  }

  loadSavedClues() {
    try {
      const saved = localStorage.getItem('water_realm_clues');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          this.discoveredClues = Object.assign(this.discoveredClues, parsed);
        }
      }
    } catch (e) {
      console.log('Error loading saved clues:', e);
    }
  }

  saveClues() {
    try {
      localStorage.setItem('water_realm_clues', JSON.stringify(this.discoveredClues));
    } catch (e) {
      console.log('Error saving clues:', e);
    }
  }

  setPalace(palace) {
    this.palace = palace;
    this.currentLevel = 0;
    this.currentInteraction = null;
  }

  setLevel1(temple) {
    this.temple = temple;
    this.currentLevel = 1;
    this.currentInteraction = null;
  }

  setLevel2(lake) {
    this.lake = lake;
    this.currentLevel = 2;
    this.currentInteraction = null;
    this.connectionSequence = [];
    this.allCluesDiscovered = Object.values(this.discoveredClues).every(Boolean);
  }

  setLevel3(forest) {
    this.forest = forest;
    this.currentLevel = 3;
    this.currentInteraction = null;
    this.forestSequence = [];
    this.allForestCluesDiscovered = Object.values(this.forestClues).every(Boolean);
  }

  update(delta, time) {
    // 1. Proximity check for interactable objects
    this.checkInteractions();

    // 2. Smoothly rotate statues and check completion (Level 1)
    if (this.currentLevel === 1 && this.temple && this.temple.statues) {
      this.temple.statues.forEach((s) => {
        if (s.isRotating) {
          let diff = s.targetAngle - s.group.rotation.y;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;

          if (Math.abs(diff) > 0.04) {
            s.group.rotation.y += Math.sign(diff) * delta * 3.6;
          } else {
            s.group.rotation.y = s.targetAngle;
            s.isRotating = false;

            // Direction text and visual glow feedback
            this.handleStatueRotated(s);
            this.checkStatuesSolved();
          }
        }
      });
    }

    // 3. Level 1 Climax Sequence
    if (this.climaxActive) {
      this.climaxTimer += delta;
      this.redRestorationProgress = Math.min(1.0, this.climaxTimer / 2.5);

      if (window.postProcessing) {
        window.postProcessing.setRedRestoration(this.redRestorationProgress);
      }

      if (this.climaxTimer >= 3.0 && !this.victoryShown) {
        this.victoryShown = true;
        if (window.uiManager) {
          window.uiManager.showVictoryScreen();
        }
      }
    }

    // 4. Level 2 Water Climax Sequence
    if (this.waterClimaxActive) {
      this.waterClimaxTimer += delta;
      const blueProgress = Math.min(1.0, this.waterClimaxTimer / 2.5);

      if (window.postProcessing) {
        window.postProcessing.setBlueRestoration(blueProgress);
      }

      if (this.waterClimaxTimer >= 2.8 && !this.level2VictoryShown) {
        this.level2VictoryShown = true;
        if (window.uiManager) {
          window.uiManager.showLevel2VictoryScreen();
        }
      }
    }

    // 5. Level 3 Green Life Climax Sequence
    if (this.forestClimaxActive) {
      this.forestClimaxTimer += delta;
      const greenProgress = Math.min(1.0, this.forestClimaxTimer / 2.5);

      if (window.postProcessing) {
        window.postProcessing.setGreenRestoration(greenProgress);
      }

      if (this.forestClimaxTimer >= 2.8 && !this.level3VictoryShown) {
        this.level3VictoryShown = true;
        if (window.uiManager) {
          window.uiManager.showLevel3VictoryScreen();
        }
      }
    }
  }

  checkInteractions() {
    const playerPos = this.player.position;
    let closestInteractable = null;
    let minDistance = Infinity;

    const items = (this.currentLevel === 0 || this.currentLevel === 'palace')
      ? (this.palace ? this.palace.interactables : [])
      : this.currentLevel === 1 
        ? (this.temple ? this.temple.interactables : []) 
        : this.currentLevel === 2
          ? (this.lake ? this.lake.interactables : [])
          : (this.forest ? this.forest.interactables : []);

    for (let item of items) {
      if (item.isCollected || item.isClaimed || item.isPlaced || 
          (item.type === 'door' && this.questState.doorUnlocked) ||
          (item.type === 'statue' && (this.questState.p1_statues || this.questState.statuesSolved))) {
        continue;
      }

      const dist = playerPos.distanceTo(item.position);
      const radius = item.interactionDistance || item.radius || 3.2;
      if (dist <= radius && dist < minDistance) {
        minDistance = dist;
        closestInteractable = item;
      }
    }

    // Level 1 Courtyard South Portal back to Royal Palace Hub
    if (this.currentLevel === 1 && !closestInteractable) {
      const dx = playerPos.x - this._palaceReturnPos.x;
      const dz = playerPos.z - this._palaceReturnPos.z;
      if (dx * dx + dz * dz <= 42.25) { // 6.5 * 6.5
        closestInteractable = this._palaceReturnInteractable;
      }
    }

    this.currentInteraction = closestInteractable;
    if (window.uiManager) {
      if (closestInteractable) {
        window.uiManager.showPrompt(closestInteractable.getPrompt());
      } else {
        window.uiManager.hidePrompt();
      }
    }
  }

  handleInteract() {
    if (!this.currentInteraction) return;
    const item = this.currentInteraction;

    switch (item.type) {
      // Level 1: Temple
      case 'statue':
        this.rotateStatue(item.data);
        break;

      case 'clue':
        if (window.uiManager) {
          window.uiManager.openInspectionModal(item.data.title, item.data.desc);
        }
        break;

      case 'key':
        this.collectAncientKey(item);
        break;

      case 'door':
        this.unlockTempleDoor();
        break;

      case 'crystal':
        this.claimRedCrystal(item);
        break;

      case 'palace_return':
        if (window.gameManager) {
          if (window.uiManager) {
            window.uiManager.showNotification('🌀 Returning to Royal Palace Hub...');
            window.uiManager.hidePrompt();
          }
          setTimeout(() => {
            window.gameManager.transitionToPalace();
          }, 250);
        }
        break;

      // Level 2: Lake
      case 'water_pillar':
        this.handleWaterPillarInteract(item);
        break;

      case 'water_crystal':
        this.claimWaterCrystal(item);
        break;

      // Level 3: Forest
      case 'forest_shrine':
        this.handleForestShrineInteract(item);
        break;

      case 'life_crystal':
        this.claimLifeCrystal(item);
        break;

      // Palace Hub
      case 'altar_socket':
        this.handleAltarSocketInteract(item);
        break;

      case 'palace_portal':
        this.handlePalacePortalInteract(item);
        break;
    }
  }

  // ==========================================
  // Level 1: Guardian Statues Rotation & Flow
  // ==========================================
  rotateStatue(statueData) {
    if (statueData.isRotating || this.questState.p1_statues) return;

    statueData.isRotating = true;
    statueData.targetAngle = statueData.group.rotation.y + Math.PI / 2;
    while (statueData.targetAngle > Math.PI) statueData.targetAngle -= Math.PI * 2;
    while (statueData.targetAngle < -Math.PI) statueData.targetAngle += Math.PI * 2;

    if (window.soundSystem) {
      window.soundSystem.playStatueRotate();
    }
  }

  handleStatueRotated(s) {
    let angle = s.group.rotation.y;
    while (angle < -Math.PI) angle += Math.PI * 2;
    while (angle > Math.PI) angle -= Math.PI * 2;

    let dirName = 'Facing South';
    if (Math.abs(angle - Math.PI / 2) < 0.2) {
      dirName = 'Facing East';
    } else if (Math.abs(angle - (-Math.PI / 2)) < 0.2 || Math.abs(angle - (3 * Math.PI / 2)) < 0.2) {
      dirName = 'Facing West';
    } else if (Math.abs(angle - Math.PI) < 0.2 || Math.abs(angle - (-Math.PI)) < 0.2) {
      dirName = 'Facing North';
    } else if (Math.abs(angle) < 0.2) {
      dirName = 'Facing South';
    }

    let diff = Math.abs(s.group.rotation.y - s.config.targetAngle);
    while (diff > Math.PI * 2) diff -= Math.PI * 2;
    const isCorrect = diff < 0.15 || Math.abs(diff - Math.PI * 2) < 0.15;

    if (s.auraMat) {
      s.auraMat.emissiveIntensity = isCorrect ? 1.8 : 0.2;
      s.auraMesh.scale.set(isCorrect ? 1.18 : 1.0, isCorrect ? 1.18 : 1.0, isCorrect ? 1.18 : 1.0);
    }

    if (window.uiManager) {
      const statusNote = isCorrect ? ' ✨ (Aligned!)' : '';
      window.uiManager.showNotification(`${s.config.name}: ${dirName}${statusNote}`);
    }
  }

  checkStatuesSolved() {
    if (this.questState.p1_statues) return;

    let allCorrect = true;
    this.temple.statues.forEach((s) => {
      let diff = Math.abs(s.group.rotation.y - s.config.targetAngle);
      while (diff > Math.PI * 2) diff -= Math.PI * 2;
      if (diff > 0.15 && Math.abs(diff - Math.PI * 2) > 0.15) {
        allCorrect = false;
      }
    });

    if (allCorrect) {
      this.questState.p1_statues = true;
      this.questState.statuesSolved = true;

      if (window.soundSystem) {
        window.soundSystem.playGlyphStep(3, true);
      }

      if (this.player) {
        this.player.addCameraShake(0.38, 1.4);
      }

      this.temple.spawnAncientRedKey();

      if (window.uiManager) {
        window.uiManager.showNotification('✨ Ancient Red Key Discovered');
        window.uiManager.completeQuestStep(0);
        window.uiManager.setObjective('Collect the Ancient Red Key from the center pedestal.');
      }
    }
  }

  collectAncientKey(item) {
    item.isCollected = true;
    this.questState.hasKey = true;
    if (window.gameManager) window.gameManager.hasKey = true;

    if (this.temple.keyGroup) {
      this.temple.keyGroup.visible = false;
    }

    if (window.soundSystem) {
      window.soundSystem.playKeyPickup();
    }

    if (window.uiManager) {
      window.uiManager.setHasKey(true);
      window.uiManager.completeQuestStep(1);
      window.uiManager.showNotification('Ancient Red Key Collected!');
      window.uiManager.setObjective('Use the Ancient Red Key to enter the Temple.');
    }
  }

  unlockTempleDoor() {
    if (!this.questState.hasKey) {
      if (window.uiManager) {
        window.uiManager.showNotification('Locked! You need the Ancient Red Key.');
      }
      return;
    }

    if (this.questState.doorUnlocked) return;
    this.questState.doorUnlocked = true;

    if (this.player) {
      this.player.addCameraShake(0.28, 1.2);
    }

    this.temple.openTempleGate();

    if (window.uiManager) {
      window.uiManager.completeQuestStep(2);
      window.uiManager.showNotification('Temple Door Unlocked!');
      window.uiManager.setObjective('Enter the Temple & Claim the Sacred Red Crystal.');
    }
  }

  claimRedCrystal(item) {
    if (this.climaxActive) return;

    item.isClaimed = true;
    this.questState.gameCompleted = true;
    this.climaxActive = true;
    this.climaxTimer = 0;
    this.inventory.red = true; // Royal Soldier secures Fire Crystal

    if (window.soundSystem) {
      window.soundSystem.playColorTransformation();
    }

    if (window.uiManager) {
      window.uiManager.addScore(100);
      window.uiManager.completeQuestStep(3);
      window.uiManager.updateCrystalInventory(this.inventory, this.altarSockets);
      window.uiManager.showNotification('🔴 Fire Crystal Acquired! Return to the Palace to socket it.');
      window.uiManager.setObjective('Return to the Royal Palace (click 🏛️ or Courtyard Gate) to socket the Fire Crystal into the Altar.');
    }
  }

  // ==========================================
  // Level 2: Water Realm Ground Tablet Clues & Puzzle
  // ==========================================

  handleWaterPillarInteract(item) {
    if (!this.lake) return;

    const tabletKey = item.id; // 'cloud', 'rain', 'lake', 'river'
    const tabletData = (this.lake.tabletConfigs || this.lake.pillarConfigs)[tabletKey];
    if (!tabletData) return;

    // Phase 1: Clue Inspection (if not all clues discovered yet)
    if (!this.allCluesDiscovered) {
      // Mark discovered
      this.discoveredClues[tabletKey] = true;
      this.saveClues();

      // Play discovery sound
      if (window.soundSystem) {
        window.soundSystem.playClueDiscovered();
      }

      // Open Clue Slate Modal
      if (window.uiManager) {
        window.uiManager.openClueModal(tabletData.name, tabletData.icon, tabletData.clue);
      }

      // Check discovered count
      const count = Object.values(this.discoveredClues).filter(Boolean).length;
      if (count === 4) {
        this.allCluesDiscovered = true;
        if (window.soundSystem) {
          window.soundSystem.playTotemActivate(2);
        }
        if (window.uiManager) {
          window.uiManager.completeQuestStep(0);
          window.uiManager.showNotification('✨ All 4 clues discovered! Puzzle is activated.');
          window.uiManager.setObjective('Connect the ground tablets in the correct order: CLOUD ➔ RAIN ➔ LAKE ➔ RIVER');
          window.uiManager.showBanner('Connect the ground tablets in the correct order.');
        }
      } else {
        if (window.uiManager) {
          window.uiManager.setObjective(`Discovered ${count}/4 clues. Inspect the remaining ground stone tablets.`);
        }
      }
      return;
    }

    // Phase 2: Connection Mechanic (all 4 clues discovered)
    if (this.waterPuzzleSolved) return;

    const expectedOrder = ['cloud', 'rain', 'lake', 'river'];
    const currentStepIndex = this.connectionSequence.length; // 0, 1, 2, 3

    // Check if this tablet is already connected in this attempt
    if (this.connectionSequence.includes(tabletKey)) {
      if (window.uiManager) {
        window.uiManager.showNotification(`⚠️ ${tabletData.icon} ${tabletKey.toUpperCase()} is already connected.`);
      }
      return;
    }

    // Check if player clicked the correct next symbol
    if (tabletKey === expectedOrder[currentStepIndex]) {
      // Correct connection!
      this.connectionSequence.push(tabletKey);
      const newStep = this.connectionSequence.length;

      // Visual and audio effects
      this.lake.activateConnectionStep(newStep);

      if (window.soundSystem) {
        window.soundSystem.playWaterStep(newStep - 1);
      }

      if (window.uiManager) {
        window.uiManager.showNotification(`✨ Connected: ${tabletData.icon} ${tabletKey.toUpperCase()} (${newStep}/4)`);
      }

      // Check if complete sequence reached
      if (newStep === 4) {
        this.waterPuzzleSolved = true;

        if (window.uiManager) {
          window.uiManager.completeQuestStep(1);
          window.uiManager.showNotification('🌊 The Water Cycle is Complete! The Lake awakens.');
          window.uiManager.setObjective('The Water Cycle is restored! The ground cracks open at the center.');
        }

        // Trigger cinematic reveal
        setTimeout(() => {
          this.lake.triggerCrystalRevealCinematic();
          if (window.uiManager) {
            window.uiManager.completeQuestStep(2);
            window.uiManager.setObjective('The Blue Water Crystal has emerged! Approach the center and collect it.');
          }
        }, 1200);
      }
    } else {
      // Incorrect connection!
      if (window.soundSystem) {
        window.soundSystem.playWrongSequence();
      }

      if (window.uiManager) {
        window.uiManager.triggerRedFlash();
        window.uiManager.showNotification('Incorrect Order. Try Again.');
        window.uiManager.setObjective('Incorrect Order. Try Again. Start with: ☁️ CLOUD');
      }

      // Reset only connection attempt; clues remain 4/4 saved!
      this.connectionSequence = [];
      this.lake.resetConnectionAttempt();
    }
  }

  // ==========================================
  // Level 2: Water Crystal Claim Climax
  // ==========================================
  claimWaterCrystal(item) {
    if (this.waterClimaxActive) return;

    item.isClaimed = true;
    item.isCollected = true;
    this.questState.lakeCompleted = true;
    this.waterClimaxActive = true;
    this.waterClimaxTimer = 0;

    // Smooth crystal fly toward player
    if (this.lake && this.lake.crystalGroup && this.player) {
      const startPos = this.lake.crystalGroup.position.clone();
      const targetPos = this.player.position.clone().add(new THREE.Vector3(0, 1.2, 0));
      let flyT = 0;
      const flyInterval = setInterval(() => {
        flyT += 0.05;
        if (flyT >= 1.0) {
          clearInterval(flyInterval);
          this.lake.crystalGroup.visible = false;
        } else {
          this.lake.crystalGroup.position.lerpVectors(startPos, targetPos, flyT);
          this.lake.crystalGroup.scale.multiplyScalar(0.96);
        }
      }, 30);
    }

    // Trigger radial water pulse wave across the lake bed
    if (this.lake) {
      this.lake.triggerWaterPulseWave();
    }

    // Audio fanfare
    if (window.soundSystem) {
      window.soundSystem.playWaterPulse();
      window.soundSystem.playBlueColorTransformation();
    }

    // Camera shake
    if (this.player) {
      this.player.addCameraShake(0.35, 2.0);
    }

    if (window.uiManager) {
      this.inventory.water = true; // Royal Soldier secures Water Crystal
      window.uiManager.addScore(200);
      window.uiManager.completeQuestStep(3);
      window.uiManager.updateCrystalInventory(this.inventory, this.altarSockets);
      window.uiManager.showNotification('🔵 Water Crystal Acquired! Return to the Palace to socket it.');
      window.uiManager.setObjective('Return to the Palace and place the Water Crystal into the Altar.');
    }
  }

  // ==========================================
  // Level 3: Forest of Life Shrine Clues & Puzzle
  // ==========================================

  handleForestShrineInteract(item) {
    if (!this.forest) return;

    const shrineKey = item.id; // 'seed', 'sprout', 'tree', 'bloom'
    const shrineData = this.forest.shrineConfigs[shrineKey];
    if (!shrineData) return;

    // Phase 1: Clue Discovery
    if (!this.allForestCluesDiscovered) {
      this.forestClues[shrineKey] = true;
      this.saveForestClues();

      if (window.soundSystem) {
        window.soundSystem.playClueDiscovered();
      }

      if (window.uiManager) {
        window.uiManager.openClueModal(shrineData.name, shrineData.icon, shrineData.clue);
      }

      const count = Object.values(this.forestClues).filter(Boolean).length;
      if (count === 4) {
        this.allForestCluesDiscovered = true;
        if (window.soundSystem) {
          window.soundSystem.playTotemActivate(2);
        }
        if (window.uiManager) {
          window.uiManager.completeQuestStep(0);
          window.uiManager.showNotification('✨ All 4 Forest Clues Discovered! Puzzle Activated.');
          window.uiManager.setObjective('Awaken the Cycle of Life: SEED ➔ SPROUT ➔ TREE ➔ BLOOM');
          window.uiManager.showBanner('Awaken the Cycle of Life: SEED ➔ SPROUT ➔ TREE ➔ BLOOM');
        }
      } else {
        if (window.uiManager) {
          window.uiManager.setObjective(`Discovered ${count}/4 clues. Inspect the remaining forest shrines.`);
        }
      }
      return;
    }

    // Phase 2: Connection Sequence
    if (this.forestPuzzleSolved) return;

    const expectedOrder = ['seed', 'sprout', 'tree', 'bloom'];
    const currentStepIndex = this.forestSequence.length;

    if (this.forestSequence.includes(shrineKey)) {
      if (window.uiManager) {
        window.uiManager.showNotification(`⚠️ ${shrineData.icon} ${shrineKey.toUpperCase()} is already active.`);
      }
      return;
    }

    if (shrineKey === expectedOrder[currentStepIndex]) {
      // Correct!
      this.forestSequence.push(shrineKey);
      const newStep = this.forestSequence.length;

      this.forest.activateConnectionStep(newStep);

      if (window.soundSystem) {
        window.soundSystem.playForestStep(newStep - 1);
      }

      if (window.uiManager) {
        window.uiManager.showNotification(`✨ Awakened: ${shrineData.icon} ${shrineKey.toUpperCase()} (${newStep}/4)`);
      }

      if (newStep === 4) {
        this.forestPuzzleSolved = true;

        if (window.uiManager) {
          window.uiManager.completeQuestStep(1);
          window.uiManager.showNotification('🌿 The Cycle of Life is Restored! The Elder Oak awakens.');
          window.uiManager.setObjective('The Elder Tree opens its roots! Witness the Green Life Crystal emerge.');
        }

        setTimeout(() => {
          this.forest.triggerCrystalRevealCinematic();
          if (window.uiManager) {
            window.uiManager.completeQuestStep(2);
            window.uiManager.setObjective('The Sacred Life Crystal is revealed! Approach the Elder Oak and collect it.');
          }
        }, 1200);
      }
    } else {
      // Incorrect order
      if (window.soundSystem) {
        window.soundSystem.playWrongSequence();
      }

      if (window.uiManager) {
        window.uiManager.triggerRedFlash();
        window.uiManager.showNotification('Incorrect Cycle. Try Again.');
        window.uiManager.setObjective('Incorrect Cycle. Start with: 🌱 SEED');
      }

      this.forestSequence = [];
      this.forest.resetConnectionAttempt();
    }
  }

  // Claim Green Life Crystal Climax
  claimLifeCrystal(item) {
    if (this.forestClimaxActive) return;

    item.isClaimed = true;
    item.isCollected = true;
    this.questState.forestCompleted = true;
    this.forestClimaxActive = true;
    this.forestClimaxTimer = 0;

    // Crystal flies to player
    if (this.forest && this.forest.crystalGroup && this.player) {
      const startPos = this.forest.crystalGroup.position.clone();
      const targetPos = this.player.position.clone().add(new THREE.Vector3(0, 1.2, 0));
      let flyT = 0;
      const flyInterval = setInterval(() => {
        flyT += 0.05;
        if (flyT >= 1.0) {
          clearInterval(flyInterval);
          this.forest.crystalGroup.visible = false;
        } else {
          this.forest.crystalGroup.position.lerpVectors(startPos, targetPos, flyT);
          this.forest.crystalGroup.scale.multiplyScalar(0.96);
        }
      }, 30);
    }

    if (this.forest) {
      this.forest.triggerNaturePulseWave();
    }

    if (window.soundSystem) {
      window.soundSystem.playGreenColorTransformation();
    }

    if (this.player) {
      this.player.addCameraShake(0.38, 2.2);
    }

    if (window.uiManager) {
      this.inventory.life = true; // Royal Soldier secures Life Crystal
      window.uiManager.addScore(300);
      window.uiManager.completeQuestStep(3);
      window.uiManager.updateCrystalInventory(this.inventory, this.altarSockets);
      window.uiManager.showNotification('🟢 Life Crystal Acquired! Return to the Palace for the Final Ceremony.');
      window.uiManager.setObjective('Return to the Palace and place the final Life Crystal into the Altar of Elements!');
    }
  }

  // ==========================================
  // Palace Hub: Altar Sockets & Portals Interaction
  // ==========================================

  handleAltarSocketInteract(item) {
    if (!this.palace) return;

    let targetElement = item.element; // 'fire', 'water', 'life', or 'all'

    // If 'all' (Master Altar) or already placed or uncarried element, adaptively choose next carried crystal:
    if (targetElement === 'all' || !targetElement || this.altarSockets[targetElement]) {
      if (!this.altarSockets.fire && this.inventory.red) {
        targetElement = 'fire';
      } else if (!this.altarSockets.water && this.inventory.water) {
        targetElement = 'water';
      } else if (!this.altarSockets.life && this.inventory.life) {
        targetElement = 'life';
      } else if (!this.altarSockets.fire) {
        targetElement = 'fire';
      } else if (!this.altarSockets.water) {
        targetElement = 'water';
      } else if (!this.altarSockets.life) {
        targetElement = 'life';
      }
    } else {
      // If player targeted a specific socket but lacks that crystal, but holds another unplaced crystal:
      const hasSpecific = (targetElement === 'fire' && this.inventory.red) ||
                          (targetElement === 'water' && this.inventory.water) ||
                          (targetElement === 'life' && this.inventory.life);
      if (!hasSpecific) {
        if (!this.altarSockets.fire && this.inventory.red) targetElement = 'fire';
        else if (!this.altarSockets.water && this.inventory.water) targetElement = 'water';
        else if (!this.altarSockets.life && this.inventory.life) targetElement = 'life';
      }
    }

    if (this.altarSockets[targetElement]) {
      if (this.altarSockets.fire && this.altarSockets.water && this.altarSockets.life) {
        if (window.uiManager) {
          window.uiManager.showNotification('✨ The Altar of Elements shines in eternal color!');
        }
      } else {
        if (window.uiManager) {
          window.uiManager.showNotification(`✨ The ${targetElement.toUpperCase()} crystal is already mounted.`);
        }
      }
      return;
    }

    const hasCrystal = (targetElement === 'fire' && this.inventory.red) ||
                       (targetElement === 'water' && this.inventory.water) ||
                       (targetElement === 'life' && this.inventory.life);

    if (hasCrystal) {
      // Place into altar
      if (targetElement === 'fire') this.inventory.red = false;
      if (targetElement === 'water') this.inventory.water = false;
      if (targetElement === 'life') this.inventory.life = false;
      this.altarSockets[targetElement] = true;

      // Mark individual socket as placed
      const specificSocket = this.palace.interactables.find(i => i.id === `altar_${targetElement}`);
      if (specificSocket) specificSocket.isPlaced = true;

      // Only mark main altar as placed when ALL 3 crystals are mounted
      if (this.altarSockets.fire && this.altarSockets.water && this.altarSockets.life) {
        const mainAltar = this.palace.interactables.find(i => i.id === 'altar_main');
        if (mainAltar) mainAltar.isPlaced = true;
      }

      this.palace.socketCrystal(targetElement);

      if (window.soundSystem) {
        window.soundSystem.playCrystalSocket();
        window.soundSystem.playPalaceColorAwaken(targetElement);
      }

      if (this.player) {
        this.player.addCameraShake(0.32, 1.8);
      }

      if (window.uiManager) {
        window.uiManager.updatePalaceQuestProgress();
        if (targetElement === 'fire') {
          window.uiManager.showNotification('🔥 Fire Crystal Embedded! Crimson Life Restored to Palace!');
          window.uiManager.showBanner('Palace Awakening: Crimson Color Restored!');
        } else if (targetElement === 'water') {
          window.uiManager.showNotification('💧 Water Crystal Embedded! Sapphire Waters Restored to Palace!');
          window.uiManager.showBanner('Palace Awakening: Azure Color Restored!');
        } else if (targetElement === 'life') {
          window.uiManager.showNotification('🌿 Life Crystal Embedded! Nature & All Colors Awaken!');
          window.uiManager.showBanner('Grand Restoration: The Kingdom of Color is Saved!');
          setTimeout(() => {
            if (window.soundSystem) window.soundSystem.playGrandFinaleFanfare();
            window.uiManager.showLevel3VictoryScreen();
          }, 3200);
        }
      }
    } else {
      const realmName = targetElement === 'fire' ? 'Chapter I: Temple of Red' : targetElement === 'water' ? 'Chapter II: The Dried Lake' : 'Chapter III: Forest of Life';
      if (window.uiManager) {
        window.uiManager.showNotification(`⚠️ You must first journey to ${realmName} to recover this crystal.`);
      }
    }
  }

  handlePalacePortalInteract(item) {
    if (!item.portalData) return;
    if (!item.portalData.isOpen) {
      if (window.uiManager) {
        window.uiManager.showNotification(`🔒 This portal is dormant. Restore the previous crystal to the Altar.`);
      }
      return;
    }

    if (window.gameManager) {
      if (window.uiManager) {
        window.uiManager.showNotification(`🌀 Entering ${item.portalData.realmName}...`);
        window.uiManager.hidePrompt();
      }
      setTimeout(() => {
        if (item.portalData.targetLevel === 1) {
          window.gameManager.transitionToLevel1();
        } else if (item.portalData.targetLevel === 2) {
          window.gameManager.transitionToLevel2();
        } else if (item.portalData.targetLevel === 3) {
          window.gameManager.transitionToLevel3();
        }
      }, 500);
    }
  }
}

window.PuzzleManager = PuzzleManager;
