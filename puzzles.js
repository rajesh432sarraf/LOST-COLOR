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
    this.currentLevel = 1;

    this.questState = {
      p1_statues: false,
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

    // Level 2 Clues & Connection State
    this.discoveredClues = {
      cloud: false,
      rain: false,
      lake: false,
      ocean: false
    };
    this.loadSavedClues();

    this.allCluesDiscovered = Object.values(this.discoveredClues).every(Boolean);
    this.connectionSequence = [];
    this.waterPuzzleSolved = false;
    this.waterClimaxActive = false;
    this.waterClimaxTimer = 0;
    this.level2VictoryShown = false;
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

  setLevel2(lake) {
    this.lake = lake;
    this.currentLevel = 2;
    this.currentInteraction = null;
    this.connectionSequence = [];
    this.allCluesDiscovered = Object.values(this.discoveredClues).every(Boolean);
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
  }

  checkInteractions() {
    const playerPos = this.player.position;
    let closestInteractable = null;
    let minDistance = Infinity;

    const items = this.currentLevel === 1 
      ? (this.temple ? this.temple.interactables : []) 
      : (this.lake ? this.lake.interactables : []);

    for (let item of items) {
      if (item.isCollected || item.isClaimed || (item.type === 'door' && this.questState.doorUnlocked)) {
        continue;
      }

      const dist = playerPos.distanceTo(item.position);
      if (dist <= item.radius && dist < minDistance) {
        minDistance = dist;
        closestInteractable = item;
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

      // Level 2: Water Realm
      case 'water_pillar':
        this.handleWaterPillarInteract(item);
        break;

      case 'water_crystal':
        this.claimWaterCrystal(item);
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

    if (window.soundSystem) {
      window.soundSystem.playColorTransformation();
    }

    if (window.uiManager) {
      window.uiManager.addScore(100);
      window.uiManager.completeQuestStep(3);
      window.uiManager.showNotification('Fire Crystal Recovered! Temple Restored.');
      window.uiManager.setObjective('Fire Crystal Recovered! Level 1 Complete.');
    }
  }

  // ==========================================
  // Level 2: Water Realm Pillar Clues & Puzzle
  // ==========================================

  handleWaterPillarInteract(item) {
    if (!this.lake) return;

    const pillarKey = item.id; // 'cloud', 'rain', 'lake', 'ocean'
    const pillarData = this.lake.pillarConfigs[pillarKey];
    if (!pillarData) return;

    // Phase 1: Clue Inspection (if not all clues discovered yet)
    if (!this.allCluesDiscovered) {
      // Mark discovered
      this.discoveredClues[pillarKey] = true;
      this.saveClues();

      // Play discovery sound
      if (window.soundSystem) {
        window.soundSystem.playClueDiscovered();
      }

      // Open Pillar Clue Slate Modal
      if (window.uiManager) {
        window.uiManager.openClueModal(pillarData.name, pillarData.icon, pillarData.clue);
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
          window.uiManager.setObjective('Connect the symbols in the correct order: CLOUD ➔ RAIN ➔ LAKE ➔ OCEAN');
          window.uiManager.showBanner('Connect the symbols in the correct order.');
        }
      } else {
        if (window.uiManager) {
          window.uiManager.setObjective(`Discovered ${count}/4 clues. Inspect the remaining ancient stone pillars.`);
        }
      }
      return;
    }

    // Phase 2: Connection Mechanic (all 4 clues discovered)
    if (this.waterPuzzleSolved) return;

    const expectedOrder = ['cloud', 'rain', 'lake', 'ocean'];
    const currentStepIndex = this.connectionSequence.length; // 0, 1, 2, 3

    // Check if this pillar is already connected in this attempt
    if (this.connectionSequence.includes(pillarKey)) {
      if (window.uiManager) {
        window.uiManager.showNotification(`⚠️ ${pillarData.icon} ${pillarKey.toUpperCase()} is already connected.`);
      }
      return;
    }

    // Check if player clicked the correct next symbol
    if (pillarKey === expectedOrder[currentStepIndex]) {
      // Correct connection!
      this.connectionSequence.push(pillarKey);
      const newStep = this.connectionSequence.length;

      // Visual and audio effects
      this.lake.activateConnectionStep(newStep);

      if (window.soundSystem) {
        window.soundSystem.playWaterStep(newStep - 1);
      }

      if (window.uiManager) {
        window.uiManager.showNotification(`✨ Connected: ${pillarData.icon} ${pillarKey.toUpperCase()} (${newStep}/4)`);
      }

      // Check if complete sequence reached
      if (newStep === 4) {
        this.waterPuzzleSolved = true;

        if (window.uiManager) {
          window.uiManager.completeQuestStep(1);
          window.uiManager.showNotification('🌊 The Water Cycle is Complete! The Lake awakens.');
          window.uiManager.setObjective('The Water Cycle is restored! Witness the Water Crystal emerge.');
        }

        // Trigger cinematic reveal
        setTimeout(() => {
          this.lake.triggerCrystalRevealCinematic();
          if (window.uiManager) {
            window.uiManager.completeQuestStep(2);
            window.uiManager.setObjective('The Blue Water Crystal is revealed! Approach the altar and collect it.');
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
      window.uiManager.addScore(200);
      window.uiManager.completeQuestStep(3);
      window.uiManager.showNotification('💎 Water Crystal Collected! (+200 Score)');
      window.uiManager.setObjective('Water Crystal Collected! The sacred lake is restored.');
    }
  }
}

window.PuzzleManager = PuzzleManager;
