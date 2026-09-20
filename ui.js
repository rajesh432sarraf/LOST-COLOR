/**
 * ui.js - Modern HUD, Interactive Mini-Map, Objective Tracker & Modals
 * Renders real-time architectural mini-map with player heading, objectives,
 * contextual interaction reticle, clue reader, Level 1 complete modal,
 * Level 2 intro dashboard, red flash error feedback, and Level 2 complete celebration card.
 */

class UIManager {
  constructor(player, temple) {
    this.player = player;
    this.temple = temple;

    // Mini-map setup
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;
    if (this.minimapCanvas) {
      this.minimapCanvas.width = 380;
      this.minimapCanvas.height = 380;
    }

    // UI elements
    this.reticleDot = document.querySelector('.reticle-dot');
    this.promptEl = document.querySelector('.interaction-prompt');
    this.promptText = document.getElementById('prompt-text');
    if (this.promptEl) {
      this.promptEl.style.cursor = 'pointer';
      this.promptEl.addEventListener('click', () => {
        if (window.puzzleManager) window.puzzleManager.handleInteract();
      });
    }
    this.questSteps = document.querySelectorAll('.quest-step');
    this.keySlot = document.getElementById('key-slot');

    // Level 1 Inspection Modal
    this.inspectionModal = document.getElementById('inspection-modal');
    this.modalTitle = document.getElementById('modal-title');
    this.modalBody = document.getElementById('modal-body');

    // Level 2 Ancient Pillar Clue Slate Modal
    this.clueSlateModal = document.getElementById('clue-slate-modal');
    this.clueSlateTitle = document.getElementById('clue-slate-title');
    this.clueSlateIcon = document.getElementById('clue-slate-icon');
    this.clueSlateQuote = document.getElementById('clue-slate-quote');

    // Level 2 Intro Dashboard
    this.level2IntroDashboard = document.getElementById('level2-intro-dashboard');
    this.palaceIntroDashboard = document.getElementById('palace-intro-dashboard');

    // Red Flash Overlay
    this.redFlashOverlay = document.getElementById('red-flash-overlay');

    // Victory screens
    this.victoryScreen = document.getElementById('victory-screen');
    this.level2VictoryScreen = document.getElementById('level2-victory-screen');
    this.level3IntroDashboard = document.getElementById('level3-intro-dashboard');
    this.level3VictoryScreen = document.getElementById('level3-victory-screen');
    this.currentObjectiveText = document.getElementById('current-objective-text');

    this.score = 0;
    this.startTime = Date.now();
    this.isMuted = false;
    this.currentLevel = 0; // 0 = Palace Hub
    this.palace = null;
    this.lake = null;
    this.forest = null;

    this.initButtons();
    this.initMobileControls();
  }

  initButtons() {
    // Level 1 Tablet modal close
    const closeBtn = document.getElementById('modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeInspectionModal());
    }

    // Level 2 Clue slate close
    const clueClose = document.getElementById('clue-slate-close');
    if (clueClose) {
      clueClose.addEventListener('click', () => this.closeClueModal());
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        this.closeInspectionModal();
        this.closeClueModal();
      }
    });

    // Sound toggle
    const soundBtn = document.getElementById('btn-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        if (window.soundSystem) {
          const muted = window.soundSystem.toggleMute();
          soundBtn.innerHTML = muted ? '🔇' : '🔊';
        }
      });
    }

    // Cinematic toggle
    const cineBtn = document.getElementById('btn-cine');
    if (cineBtn) {
      cineBtn.addEventListener('click', () => {
        if (this.player) this.player.toggleCinematicMode();
      });
    }

    // Level 1 "NEXT LEVEL ➜" button -> transitions to LEVEL 2 – WATER REALM
    const btnLevel2 = document.getElementById('btn-continue-level2');
    if (btnLevel2) {
      btnLevel2.addEventListener('click', () => {
        if (this.victoryScreen) {
          this.victoryScreen.classList.remove('visible');
        }
        if (window.gameManager) {
          window.gameManager.transitionToLevel2();
        }
      });
    }

    // Level 2 Intro Dashboard "START LEVEL" button
    const btnStartLevel2 = document.getElementById('btn-start-level2');
    if (btnStartLevel2) {
      btnStartLevel2.addEventListener('click', () => {
        this.hideLevel2IntroDashboard();
        try {
          if (window.gameManager && window.gameManager.renderer) {
            window.gameManager.renderer.domElement.requestPointerLock();
          }
        } catch (e) {}

        this.showNotification('🌊 Water Realm: Restore the Water Cycle');
        this.setObjective('Explore the dried lake bed and inspect the 4 ground stone tablets.');
      });
    }

    // Level 2 Complete "CONTINUE TO LEVEL 3" button
    const btnLevel3 = document.getElementById('btn-continue-level3');
    if (btnLevel3) {
      btnLevel3.addEventListener('click', () => {
        if (this.level2VictoryScreen) {
          this.level2VictoryScreen.classList.remove('visible');
        }
        if (window.gameManager) {
          window.gameManager.transitionToLevel3();
        }
      });
    }

    // Level 3 Intro Dashboard "START CHAPTER 3" button
    const btnStartLevel3 = document.getElementById('btn-start-level3');
    if (btnStartLevel3) {
      btnStartLevel3.addEventListener('click', () => {
        this.hideLevel3IntroDashboard();
        try {
          if (window.gameManager && window.gameManager.renderer) {
            window.gameManager.renderer.domElement.requestPointerLock();
          }
        } catch (e) {}

        this.showNotification('🌿 Forest of Life: Awaken the Cycle of Life');
        this.setObjective('Explore the sacred grove and inspect the 4 overgrown shrines.');
      });
    }

    // Palace Prologue Dashboard "ACCEPT ROYAL MISSION" button
    const btnStartPalace = document.getElementById('btn-start-palace');
    if (btnStartPalace) {
      btnStartPalace.addEventListener('click', () => {
        this.hidePalaceIntroDashboard();
        try {
          if (window.gameManager && window.gameManager.renderer) {
            window.gameManager.renderer.domElement.requestPointerLock();
          }
        } catch (e) {}

        this.showNotification('🏛️ Royal Mission: Restore the Faded Citadel');
        this.setObjective('Inspect the central Altar of Elements and enter Chapter I Portal (🔴 Temple of Red).');
      });
    }

    // Return to Palace from Level 1
    const btnPalaceL1 = document.getElementById('btn-palace-from-l1');
    if (btnPalaceL1) {
      btnPalaceL1.addEventListener('click', () => {
        if (this.victoryScreen) this.victoryScreen.classList.remove('visible');
        if (window.gameManager) window.gameManager.transitionToPalace();
      });
    }

    // Return to Palace from Level 2
    const btnPalaceL2 = document.getElementById('btn-palace-from-l2');
    if (btnPalaceL2) {
      btnPalaceL2.addEventListener('click', () => {
        if (this.level2VictoryScreen) this.level2VictoryScreen.classList.remove('visible');
        if (window.gameManager) window.gameManager.transitionToPalace();
      });
    }

    // Return to Palace from Level 3
    const btnPalaceL3 = document.getElementById('btn-palace-from-l3');
    if (btnPalaceL3) {
      btnPalaceL3.addEventListener('click', () => {
        if (this.level3VictoryScreen) this.level3VictoryScreen.classList.remove('visible');
        if (window.gameManager) window.gameManager.transitionToPalace();
      });
    }

    // Game Complete / Play Again button
    const btnPlayAgain = document.getElementById('btn-play-again');
    if (btnPlayAgain) {
      btnPlayAgain.addEventListener('click', () => {
        window.location.href = window.location.pathname;
      });
    }

    // Quick Palace return button from action bar
    const btnPalaceNav = document.getElementById('btn-palace-nav');
    if (btnPalaceNav) {
      btnPalaceNav.addEventListener('click', () => {
        if (window.gameManager) window.gameManager.transitionToPalace();
      });
    }
  }

  // ==========================================
  // Mobile Touch Controls (Joystick & Buttons)
  // ==========================================
  initMobileControls() {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const mobileOverlay = document.getElementById('mobile-controls');
    if (!mobileOverlay) return;

    if (isTouch || window.innerWidth < 900) {
      mobileOverlay.style.display = 'block';
    }

    const interactBtn = document.getElementById('btn-touch-interact');
    if (interactBtn) {
      interactBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (window.puzzleManager) window.puzzleManager.handleInteract();
      });
      interactBtn.addEventListener('click', () => {
        if (window.puzzleManager) window.puzzleManager.handleInteract();
      });
    }

    const jumpBtn = document.getElementById('btn-touch-jump');
    if (jumpBtn) {
      jumpBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (this.player) {
          this.player.keys.jump = true;
          setTimeout(() => { this.player.keys.jump = false; }, 150);
        }
      });
    }

    // Virtual Joystick logic
    const joystickZone = document.getElementById('virtual-joystick-zone');
    const joystickBase = document.getElementById('joystick-base');
    const joystickKnob = document.getElementById('joystick-knob');
    if (!joystickZone || !joystickBase || !joystickKnob) return;

    let touchId = null;
    let baseRect = null;

    const handleJoystickMove = (touch) => {
      if (!baseRect) baseRect = joystickBase.getBoundingClientRect();
      const centerX = baseRect.left + baseRect.width / 2;
      const centerY = baseRect.top + baseRect.height / 2;

      const dx = touch.clientX - centerX;
      const dy = touch.clientY - centerY;
      const maxDist = baseRect.width / 2;
      const dist = Math.min(maxDist, Math.sqrt(dx * dx + dy * dy));
      const angle = Math.atan2(dy, dx);

      const knobX = Math.cos(angle) * dist;
      const knobY = Math.sin(angle) * dist;
      joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

      // Map to player keys
      const nx = knobX / maxDist;
      const ny = knobY / maxDist;
      if (this.player) {
        this.player.keys.forward = ny < -0.3;
        this.player.keys.backward = ny > 0.3;
        this.player.keys.left = nx < -0.3;
        this.player.keys.right = nx > 0.3;
      }
    };

    const resetJoystick = () => {
      touchId = null;
      joystickKnob.style.transform = 'translate(0px, 0px)';
      if (this.player) {
        this.player.keys.forward = false;
        this.player.keys.backward = false;
        this.player.keys.left = false;
        this.player.keys.right = false;
      }
    };

    joystickZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (touchId === null && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        touchId = touch.identifier;
        baseRect = joystickBase.getBoundingClientRect();
        handleJoystickMove(touch);
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (touchId !== null) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchId) {
            handleJoystickMove(e.changedTouches[i]);
            break;
          }
        }
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (touchId !== null) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchId) {
            resetJoystick();
            break;
          }
        }
      }
    });

    window.addEventListener('touchcancel', () => resetJoystick());
  }

  showPrompt(text) {
    if (!this.promptEl || !this.promptText) return;
    if (this._lastPromptText === text && this.promptEl.classList.contains('visible')) return;
    this._lastPromptText = text;
    this.promptText.textContent = text;
    this.promptEl.classList.add('visible');
    if (this.reticleDot) this.reticleDot.classList.add('interactable');
  }

  hidePrompt() {
    if (!this.promptEl) return;
    if (!this.promptEl.classList.contains('visible') && !this._lastPromptText) return;
    this._lastPromptText = null;
    this.promptEl.classList.remove('visible');
    if (this.reticleDot) this.reticleDot.classList.remove('interactable');
  }

  setObjective(text) {
    if (this.currentObjectiveText) {
      this.currentObjectiveText.textContent = text;
    }
  }

  addScore(points) {
    this.score += points;
    const scoreBadge = document.getElementById('hud-score-display');
    if (scoreBadge) {
      scoreBadge.textContent = `Score: ${this.score}`;
    }
  }

  showNotification(message) {
    const notif = document.createElement('div');
    notif.className = 'hud-notification';
    notif.style.cssText = `
      position: absolute;
      top: 90px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(12, 16, 24, 0.95);
      border: 1px solid ${this.currentLevel === 2 ? '#00e1ff' : '#ff3344'};
      box-shadow: 0 0 25px ${this.currentLevel === 2 ? 'rgba(0, 225, 255, 0.5)' : 'rgba(255, 51, 68, 0.5)'};
      color: #ffffff;
      padding: 12px 28px;
      border-radius: 20px;
      font-family: 'Cinzel', serif;
      font-size: 1.05rem;
      letter-spacing: 2px;
      z-index: 40;
      pointer-events: none;
      transition: all 0.5s ease-out;
    `;
    notif.textContent = message;
    document.body.appendChild(notif);

    setTimeout(() => {
      notif.style.opacity = '0';
      notif.style.transform = 'translate(-50%, -15px)';
      setTimeout(() => notif.remove(), 500);
    }, 3400);
  }

  showBanner(text) {
    const banner = document.createElement('div');
    banner.className = 'center-screen-banner';
    banner.style.cssText = `
      position: absolute;
      top: 38%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      background: radial-gradient(circle at center, rgba(0, 110, 220, 0.92) 0%, rgba(6, 12, 20, 0.96) 100%);
      border: 2px solid #00e1ff;
      box-shadow: 0 0 50px rgba(0, 225, 255, 0.6);
      color: #ffffff;
      padding: 24px 45px;
      border-radius: 16px;
      font-family: 'Cinzel', serif;
      font-size: 1.45rem;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
      z-index: 60;
      pointer-events: none;
      opacity: 0;
      transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      text-align: center;
    `;
    banner.textContent = text;
    document.body.appendChild(banner);

    requestAnimationFrame(() => {
      banner.style.opacity = '1';
      banner.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    setTimeout(() => {
      banner.style.opacity = '0';
      banner.style.transform = 'translate(-50%, -50%) scale(0.95)';
      setTimeout(() => banner.remove(), 600);
    }, 3200);
  }

  triggerRedFlash() {
    if (!this.redFlashOverlay) return;
    this.redFlashOverlay.classList.add('active');
    setTimeout(() => {
      this.redFlashOverlay.classList.remove('active');
    }, 450);
  }

  completeQuestStep(index) {
    if (!this.questSteps || index >= this.questSteps.length) return;
    const step = this.questSteps[index];
    step.classList.remove('active');
    step.classList.add('completed');

    if (index + 1 < this.questSteps.length) {
      this.questSteps[index + 1].classList.add('active');
    }
  }

  setHasKey(hasKey) {
    if (!this.keySlot) return;
    if (hasKey) {
      this.keySlot.classList.add('has-item');
      const icon = this.keySlot.querySelector('.inv-icon');
      if (icon) {
        icon.style.filter = 'none';
        icon.style.textShadow = '0 0 12px #ff3344';
      }
    }
  }

  openInspectionModal(title, desc) {
    if (!this.inspectionModal) return;
    if (this.modalTitle) this.modalTitle.textContent = title;
    if (this.modalBody) {
      this.modalBody.innerHTML = desc.replace(/\n/g, '<br/>');
    }
    this.inspectionModal.classList.add('open');
    try { document.exitPointerLock(); } catch (e) {}
  }

  closeInspectionModal() {
    if (!this.inspectionModal) return;
    this.inspectionModal.classList.remove('open');
  }

  // ==========================================
  // Level 2 Ancient Pillar Clue Slate Modal
  // ==========================================
  openClueModal(title, icon, clueQuote) {
    if (!this.clueSlateModal) return;
    if (this.clueSlateTitle) this.clueSlateTitle.textContent = title;
    if (this.clueSlateIcon) this.clueSlateIcon.textContent = icon;
    if (this.clueSlateQuote) this.clueSlateQuote.textContent = `"${clueQuote}"`;
    this.clueSlateModal.classList.add('open');
    try { document.exitPointerLock(); } catch (e) {}
  }

  closeClueModal() {
    if (this.clueSlateModal) {
      this.clueSlateModal.classList.remove('open');
    }
  }

  showLevel2IntroDashboard() {
    if (this.level2IntroDashboard) {
      this.level2IntroDashboard.classList.add('open');
      try { document.exitPointerLock(); } catch (e) {}
    }
  }

  hideLevel2IntroDashboard() {
    if (this.level2IntroDashboard) {
      this.level2IntroDashboard.classList.remove('open');
    }
  }

  showVictoryScreen() {
    if (!this.victoryScreen) return;
    this.victoryScreen.classList.add('visible');
    try { document.exitPointerLock(); } catch (e) {}
  }

  showLevel2VictoryScreen() {
    if (this.level2VictoryScreen) {
      this.level2VictoryScreen.classList.add('visible');
      try { document.exitPointerLock(); } catch (e) {}
    }
  }

  showPalaceIntroDashboard() {
    if (this.palaceIntroDashboard) {
      this.palaceIntroDashboard.classList.add('open');
      try { document.exitPointerLock(); } catch (e) {}
    }
  }

  hidePalaceIntroDashboard() {
    if (this.palaceIntroDashboard) {
      this.palaceIntroDashboard.classList.remove('open');
    }
  }

  setupPalaceUI(palace) {
    this.palace = palace;
    this.currentLevel = 0;

    const titleBadge = document.querySelector('.title-badge');
    if (titleBadge) {
      titleBadge.innerHTML = `
        <h1>COLOR THIEF <span style="color: #ffd700; text-shadow: 0 0 14px rgba(255, 215, 0, 0.85);">ROYAL PALACE</span></h1>
        <div class="subtitle">The Faded Sanctum · Kingdom of Luminaria</div>
        <div class="hud-score" id="hud-score-display">Score: ${this.score}</div>
      `;
    }

    this.setObjective('Inspect the central Altar of Elements and embark through Chapter I Portal (🔴).');

    const questUl = document.querySelector('.quest-steps');
    if (questUl) {
      questUl.innerHTML = `
        <li class="quest-step active" id="pal-step-0">
          <span class="step-dot"></span>
          <span>Inspect the Altar of Elements (Throne Room)</span>
        </li>
        <li class="quest-step" id="pal-step-1">
          <span class="step-dot"></span>
          <span>Chapter I: Enter Temple Portal & Recover Fire Crystal</span>
        </li>
        <li class="quest-step" id="pal-step-2">
          <span class="step-dot"></span>
          <span>Mount Fire Crystal into Altar (Restores Red)</span>
        </li>
        <li class="quest-step" id="pal-step-3">
          <span class="step-dot"></span>
          <span>Chapter II: Enter Lake Portal & Recover Water Crystal</span>
        </li>
        <li class="quest-step" id="pal-step-4">
          <span class="step-dot"></span>
          <span>Mount Water Crystal into Altar (Restores Blue)</span>
        </li>
        <li class="quest-step" id="pal-step-5">
          <span class="step-dot"></span>
          <span>Chapter III: Enter Forest Portal & Recover Life Crystal</span>
        </li>
        <li class="quest-step" id="pal-step-6">
          <span class="step-dot"></span>
          <span>Mount Life Crystal: Grand Kingdom Restoration!</span>
        </li>
      `;
      this.questSteps = document.querySelectorAll('.quest-step');
    }

    if (this.keySlot) {
      this.keySlot.style.display = 'none';
    }

    this.updatePalaceQuestProgress();
  }

  updatePalaceQuestProgress() {
    const pm = window.puzzleManager;
    const inv = pm ? pm.inventory : {};
    const sockets = pm ? pm.altarSockets : (this.palace ? {
      fire: this.palace.sockets.fire.placed,
      water: this.palace.sockets.water.placed,
      life: this.palace.sockets.life.placed
    } : {});

    this.updateCrystalInventory(inv, sockets);

    this.questSteps = document.querySelectorAll('.quest-step');
    if (!this.questSteps || this.questSteps.length === 0) return;

    this.questSteps.forEach(s => {
      s.classList.remove('active');
      s.classList.remove('completed');
    });

    if (sockets.fire && sockets.water && sockets.life) {
      this.setObjective('✨ All 3 Crystals Restored! The Kingdom of Luminaria shines in eternal color!');
      this.questSteps.forEach(s => s.classList.add('completed'));
    } else if (sockets.fire && sockets.water) {
      for (let i = 0; i <= 4; i++) {
        if (this.questSteps[i]) this.questSteps[i].classList.add('completed');
      }
      if (inv.life) {
        this.setObjective('🟢 Life Crystal Carried! Mount it into the Altar to awaken the Kingdom!');
        if (this.questSteps[5]) this.questSteps[5].classList.add('completed');
        if (this.questSteps[6]) this.questSteps[6].classList.add('active');
      } else {
        this.setObjective('The Forest of Life Portal (🟢 North) is open! Journey to Chapter III to recover the Life Crystal.');
        if (this.questSteps[5]) this.questSteps[5].classList.add('active');
      }
    } else if (sockets.fire) {
      for (let i = 0; i <= 2; i++) {
        if (this.questSteps[i]) this.questSteps[i].classList.add('completed');
      }
      if (inv.water) {
        this.setObjective('🔵 Water Crystal Carried! Mount it into the Altar to restore Sapphire Waters!');
        if (this.questSteps[3]) this.questSteps[3].classList.add('completed');
        if (this.questSteps[4]) this.questSteps[4].classList.add('active');
      } else {
        this.setObjective('The Dried Lake Portal (🔵 East) is open! Journey to Chapter II to recover the Water Crystal.');
        if (this.questSteps[3]) this.questSteps[3].classList.add('active');
      }
    } else {
      if (inv.red) {
        this.setObjective('🔴 Fire Crystal Carried! Mount it into the Altar to awaken Crimson colors!');
        if (this.questSteps[0]) this.questSteps[0].classList.add('completed');
        if (this.questSteps[1]) this.questSteps[1].classList.add('completed');
        if (this.questSteps[2]) this.questSteps[2].classList.add('active');
      } else {
        this.setObjective('Inspect the central Altar, then enter Chapter I Portal (🔴 West) to recover the Fire Crystal.');
        if (this.questSteps[0]) this.questSteps[0].classList.add('active');
      }
    }
  }

  setupLevel1UI(temple) {
    this.temple = temple;
    this.currentLevel = 1;

    const titleBadge = document.querySelector('.title-badge');
    if (titleBadge) {
      titleBadge.innerHTML = `
        <h1>COLOR THIEF <span style="color: #ff3344; text-shadow: 0 0 14px rgba(255, 51, 68, 0.85);">TEMPLE OF RED</span></h1>
        <div class="subtitle">The Ancient Courtyard · Chapter I</div>
        <div class="hud-score" id="hud-score-display">Score: ${this.score}</div>
      `;
    }

    const questUl = document.querySelector('.quest-steps');
    if (questUl) {
      questUl.innerHTML = `
        <li class="quest-step" id="step-0">
          <span class="step-dot"></span>
          <span>Align the 3 Guardian Statues</span>
        </li>
        <li class="quest-step" id="step-1">
          <span class="step-dot"></span>
          <span>Collect the Ancient Red Key</span>
        </li>
        <li class="quest-step" id="step-2">
          <span class="step-dot"></span>
          <span>Use Key to Enter the Temple</span>
        </li>
        <li class="quest-step" id="step-3">
          <span class="step-dot"></span>
          <span>Claim the Sacred Red Crystal</span>
        </li>
      `;
      this.questSteps = document.querySelectorAll('.quest-step');
    }

    if (this.keySlot) {
      this.keySlot.style.display = 'flex';
    }

    // Refresh state dynamically from questState and inventory
    const qs = this.questState || (window.puzzleManager ? window.puzzleManager.questState : null);
    const inv = window.puzzleManager ? window.puzzleManager.inventory : {};
    
    if (qs) {
      const p1Done = !!(qs.p1_statues || qs.statuesSolved);
      const keyDone = !!qs.hasKey;
      const doorDone = !!qs.doorUnlocked;
      const crystalDone = !!(qs.gameCompleted || inv.red);

      if (p1Done) this.completeQuestStep(0);
      else if (this.questSteps && this.questSteps[0]) this.questSteps[0].classList.add('active');

      if (keyDone) this.completeQuestStep(1);
      if (doorDone) this.completeQuestStep(2);
      if (crystalDone) this.completeQuestStep(3);

      if (crystalDone) {
        this.setObjective('🔴 Fire Crystal Secured! Return to the Royal Palace (click 🏛️ or head to South Gate) to mount it onto the Altar.');
      } else if (doorDone) {
        this.setObjective('Enter the Temple & Claim the Sacred Red Crystal.');
      } else if (keyDone) {
        this.setObjective('Use the Ancient Red Key to unlock the Temple Gates.');
      } else if (p1Done) {
        this.setObjective('Collect the Ancient Red Key from the center pedestal.');
      } else {
        this.setObjective('Align the 3 Guardian Statues using the stone tablet clues.');
      }
    } else {
      if (this.questSteps && this.questSteps[0]) this.questSteps[0].classList.add('active');
      this.setObjective('Align the 3 Guardian Statues using the stone tablet clues.');
    }
  }

  updateCrystalInventory(inventory = {}, altarSockets = {}) {
    const fireStatus = altarSockets.fire ? '✨ Mounted' : (inventory.red ? '🎒 Carried' : '🔒 Lost');
    const waterStatus = altarSockets.water ? '✨ Mounted' : (inventory.water ? '🎒 Carried' : '🔒 Lost');
    const lifeStatus = altarSockets.life ? '✨ Mounted' : (inventory.life ? '🎒 Carried' : '🔒 Lost');

    const fireSlot = document.getElementById('slot-fire-crystal');
    const waterSlot = document.getElementById('slot-water-crystal');
    const lifeSlot = document.getElementById('slot-life-crystal');

    if (fireSlot) {
      fireSlot.className = `crystal-slot ${altarSockets.fire ? 'mounted' : (inventory.red ? 'carried' : 'lost')}`;
      const statusEl = fireSlot.querySelector('.slot-status');
      if (statusEl) statusEl.textContent = fireStatus;
    }
    if (waterSlot) {
      waterSlot.className = `crystal-slot ${altarSockets.water ? 'mounted' : (inventory.water ? 'carried' : 'lost')}`;
      const statusEl = waterSlot.querySelector('.slot-status');
      if (statusEl) statusEl.textContent = waterStatus;
    }
    if (lifeSlot) {
      lifeSlot.className = `crystal-slot ${altarSockets.life ? 'mounted' : (inventory.life ? 'carried' : 'lost')}`;
      const statusEl = lifeSlot.querySelector('.slot-status');
      if (statusEl) statusEl.textContent = lifeStatus;
    }
  }

  showLevel3IntroDashboard() {
    if (this.level3IntroDashboard) {
      this.level3IntroDashboard.classList.add('open');
      try { document.exitPointerLock(); } catch (e) {}
    }
  }

  hideLevel3IntroDashboard() {
    if (this.level3IntroDashboard) {
      this.level3IntroDashboard.classList.remove('open');
    }
  }

  showLevel3VictoryScreen() {
    if (this.level3VictoryScreen) {
      this.level3VictoryScreen.classList.add('visible');
      try { document.exitPointerLock(); } catch (e) {}
    }
  }

  setupLevel3UI(forest) {
    this.forest = forest;
    this.currentLevel = 3;

    const titleBadge = document.querySelector('.title-badge');
    if (titleBadge) {
      titleBadge.innerHTML = `
        <h1>COLOR THIEF <span style="color: #2ecc71; text-shadow: 0 0 14px rgba(46, 204, 113, 0.85);">FOREST OF LIFE</span></h1>
        <div class="subtitle">The Emerald Grove · Chapter III</div>
        <div class="hud-score" id="hud-score-display">Score: ${this.score}</div>
      `;
    }

    this.setObjective('Explore the sacred grove and inspect the 4 overgrown shrines.');

    const questUl = document.querySelector('.quest-steps');
    if (questUl) {
      questUl.innerHTML = `
        <li class="quest-step active" id="l3-step-0">
          <span class="step-dot"></span>
          <span>Inspect 4 Forest Shrines (🌱 🌿 🌳 🌸)</span>
        </li>
        <li class="quest-step" id="l3-step-1">
          <span class="step-dot"></span>
          <span>Awaken Cycle (SEED ➔ SPROUT ➔ TREE ➔ BLOOM)</span>
        </li>
        <li class="quest-step" id="l3-step-2">
          <span class="step-dot"></span>
          <span>Witness the Elder Oak Open</span>
        </li>
        <li class="quest-step" id="l3-step-3">
          <span class="step-dot"></span>
          <span>Claim the Sacred Life Crystal</span>
        </li>
      `;
      this.questSteps = document.querySelectorAll('.quest-step');
    }

    if (this.keySlot) {
      this.keySlot.style.display = 'none';
    }
  }

  setupLevel2UI(lake) {
    this.lake = lake;
    this.currentLevel = 2;

    // Title badge
    const titleBadge = document.querySelector('.title-badge');
    if (titleBadge) {
      titleBadge.innerHTML = `
        <h1>COLOR THIEF <span style="color: #00d4ff; text-shadow: 0 0 14px rgba(0, 212, 255, 0.85);">WATER REALM</span></h1>
        <div class="subtitle">The Dried Lake · Chapter II</div>
        <div class="hud-score" id="hud-score-display">Score: ${this.score}</div>
      `;
    }

    // Quest tracker steps & objective
    this.setObjective('Explore the dried lake bed and inspect the 4 ground stone tablets.');

    const questUl = document.querySelector('.quest-steps');
    if (questUl) {
      questUl.innerHTML = `
        <li class="quest-step active" id="l2-step-0">
          <span class="step-dot"></span>
          <span>Inspect 4 Stone Tablets (☁️ 🌧️ 🏞️ 🌊)</span>
        </li>
        <li class="quest-step" id="l2-step-1">
          <span class="step-dot"></span>
          <span>Connect Symbols (CLOUD ➔ RAIN ➔ LAKE ➔ RIVER)</span>
        </li>
        <li class="quest-step" id="l2-step-2">
          <span class="step-dot"></span>
          <span>Witness the Water Crystal Emerge</span>
        </li>
        <li class="quest-step" id="l2-step-3">
          <span class="step-dot"></span>
          <span>Claim the Sacred Water Crystal</span>
        </li>
      `;
      this.questSteps = document.querySelectorAll('.quest-step');
    }

    // Hide Level 1 key slot
    if (this.keySlot) {
      this.keySlot.style.display = 'none';
    }
  }

  // ==========================================
  // Real-Time Mini-Map Renderer (Level 1 & Level 2)
  // ==========================================
  updateMiniMap() {
    if (!this.minimapCtx || !this.player) return;
    // Skip completely during cinematic cutscenes
    if (document.body.classList.contains('cinematic-active')) return;

    // Throttle minimap redraws to ~22 FPS (every 45ms) to save CPU/GPU canvas texture upload bandwidth
    const now = performance.now();
    if (this._lastMinimapUpdate && now - this._lastMinimapUpdate < 45) return;
    this._lastMinimapUpdate = now;

    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.fillStyle = '#0b0e14';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    const centerX = w / 2;
    const centerY = h / 2;

    if (this.currentLevel === 0 || this.currentLevel === 'palace') {
      // Level 0: Royal Palace Hub Mini-Map
      const scale = 2.4;
      const mapX = (worldX) => centerX + (worldX - this.player.position.x) * scale;
      const mapY = (worldZ) => centerY + (worldZ - this.player.position.z) * scale;

      ctx.lineWidth = 2;

      // Throne Room Outer Walls (34m x 68m)
      ctx.fillStyle = '#171a22';
      ctx.strokeStyle = '#d4af37';
      this.drawMapRect(ctx, mapX(-16), mapY(-32), 32 * scale, 64 * scale);

      // Central Aisle Runner Carpet
      ctx.fillStyle = this.palace && this.palace.redRestored ? 'rgba(178, 34, 34, 0.45)' : 'rgba(87, 96, 111, 0.25)';
      this.drawMapRect(ctx, mapX(-2.6), mapY(-28), 5.2 * scale, 56 * scale);

      // Royal Dais at North
      ctx.fillStyle = '#222733';
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
      this.drawMapRect(ctx, mapX(-7), mapY(-30), 14 * scale, 10 * scale);
      this.drawPOIMarker(ctx, mapX(0), mapY(-26.5), '#ffd700', '👑');

      // Central Altar of Elements
      ctx.beginPath();
      ctx.arc(mapX(0), mapY(0), 5.2 * scale, 0, Math.PI * 2);
      ctx.fillStyle = '#272d38';
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.stroke();

      // 3 Sockets on Altar
      this.drawPOIMarker(ctx, mapX(-2.0), mapY(0.8), '#ff4757', '🔴');
      this.drawPOIMarker(ctx, mapX(2.0), mapY(0.8), '#00d2d3', '🔵');
      this.drawPOIMarker(ctx, mapX(0), mapY(-1.8), '#2ed573', '🟢');

      // Portals
      this.drawPOIMarker(ctx, mapX(-15), mapY(8), '#ff4757', '🚪');
      this.drawPOIMarker(ctx, mapX(15), mapY(8), '#00d2d3', '🌊');
      this.drawPOIMarker(ctx, mapX(0), mapY(30), '#2ed573', '🌿');

    } else if (this.currentLevel === 1) {
      // Level 1: Temple Mini-Map
      const scale = 2.4;
      const mapX = (worldX) => centerX + (worldX - this.player.position.x) * scale;
      const mapY = (worldZ) => centerY + (worldZ - this.player.position.z) * scale;

      ctx.lineWidth = 2;

      // Courtyard
      ctx.fillStyle = '#1c1e24';
      ctx.strokeStyle = '#3a3e4a';
      this.drawMapRect(ctx, mapX(-25), mapY(20), 50 * scale, 30 * scale);

      // Temple Interior
      ctx.fillStyle = '#22252e';
      ctx.strokeStyle = '#4a5060';
      this.drawMapRect(ctx, mapX(-14), mapY(-55), 28 * scale, 75 * scale);

      // Chamber
      ctx.fillStyle = '#2a1a20';
      ctx.strokeStyle = '#8a2b36';
      this.drawMapRect(ctx, mapX(-16), mapY(-79), 32 * scale, 24 * scale);

      // POI Markers
      this.drawPOIMarker(ctx, mapX(-7.0), mapY(26), '#ffaa22', '☀️');
      this.drawPOIMarker(ctx, mapX(0.0), mapY(29.5), '#99bbff', '🌙');
      this.drawPOIMarker(ctx, mapX(7.0), mapY(26), '#ffd700', '⭐');

      if (!this.questState || !this.questState.hasKey) {
        this.drawPOIMarker(ctx, mapX(0), mapY(23.5), '#ff3344', '🗝️');
      }

      this.drawPOIMarker(ctx, mapX(0), mapY(20), '#ff4455', '🚪');
      this.drawPOIMarker(ctx, mapX(0), mapY(-65), '#ff1128', '🔥');
    } else if (this.currentLevel === 2) {
      // Level 2: Water Realm - The Dried Lake Mini-Map
      const scale = 2.4;
      const mapX = (worldX) => centerX + (worldX - this.player.position.x) * scale;
      const mapY = (worldZ) => centerY + (worldZ - this.player.position.z) * scale;

      // Outer Dried Lake Basin Boundary (radius 75m)
      ctx.beginPath();
      ctx.arc(mapX(0), mapY(0), 75 * scale, 0, Math.PI * 2);
      ctx.fillStyle = '#12161f';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#2d3b4e';
      ctx.stroke();

      // Open Circular Lake Bed Ring (radius 18m)
      ctx.beginPath();
      ctx.arc(mapX(0), mapY(0), 18 * scale, 0, Math.PI * 2);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(75, 110, 145, 0.4)';
      ctx.stroke();

      // Connecting energy circuit lines between tablets
      ctx.strokeStyle = 'rgba(0, 180, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mapX(0), mapY(-14));
      ctx.lineTo(mapX(14), mapY(0));
      ctx.lineTo(mapX(0), mapY(14));
      ctx.lineTo(mapX(-14), mapY(0));
      ctx.closePath();
      ctx.stroke();

      // Center Fissure & Water Crystal
      ctx.beginPath();
      ctx.arc(mapX(0), mapY(0), 2.5 * scale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 170, 255, 0.4)';
      ctx.fill();
      this.drawPOIMarker(ctx, mapX(0), mapY(0), '#00d4ff', '💎');

      // 4 Ground Stone Tablets (radius 14m)
      // Stone 1: ☁️ CLOUD (North: 0, -14)
      this.drawPOIMarker(ctx, mapX(0), mapY(-14), '#38b6ff', '☁️');
      // Stone 2: 🌧️ RAIN (East: 14, 0)
      this.drawPOIMarker(ctx, mapX(14), mapY(0), '#38b6ff', '🌧️');
      // Stone 3: 🏞️ LAKE (South: 0, 14)
      this.drawPOIMarker(ctx, mapX(0), mapY(14), '#38b6ff', '🏞️');
      // Stone 4: 🌊 RIVER (West: -14, 0)
      this.drawPOIMarker(ctx, mapX(-14), mapY(0), '#38b6ff', '🌊');
    } else {
      // Level 3: Forest of Life Mini-Map
      const scale = 2.4;
      const mapX = (worldX) => centerX + (worldX - this.player.position.x) * scale;
      const mapY = (worldZ) => centerY + (worldZ - this.player.position.z) * scale;

      // Outer Forest Perimeter (radius 75m)
      ctx.beginPath();
      ctx.arc(mapX(0), mapY(0), 75 * scale, 0, Math.PI * 2);
      ctx.fillStyle = '#0f2016';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#1e824c';
      ctx.stroke();

      // Circular Trail Ring (radius 16m)
      ctx.beginPath();
      ctx.arc(mapX(0), mapY(0), 16 * scale, 0, Math.PI * 2);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(46, 204, 113, 0.4)';
      ctx.stroke();

      // Connecting vine circuit lines
      ctx.strokeStyle = 'rgba(46, 204, 113, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mapX(0), mapY(-16));
      ctx.lineTo(mapX(16), mapY(0));
      ctx.lineTo(mapX(0), mapY(16));
      ctx.lineTo(mapX(-16), mapY(0));
      ctx.closePath();
      ctx.stroke();

      // Center: The Elder Oak Tree & Life Crystal
      ctx.beginPath();
      ctx.arc(mapX(0), mapY(0), 3.6 * scale, 0, Math.PI * 2);
      ctx.fillStyle = '#1b5e20';
      ctx.fill();
      this.drawPOIMarker(ctx, mapX(0), mapY(0), '#2ecc71', '💎');

      // 4 Shrines (radius 16m)
      // Shrine 1: 🌱 SEED (North: 0, -16)
      this.drawPOIMarker(ctx, mapX(0), mapY(-16), '#55efc4', '🌱');
      // Shrine 2: 🌿 SPROUT (East: 16, 0)
      this.drawPOIMarker(ctx, mapX(16), mapY(0), '#55efc4', '🌿');
      // Shrine 3: 🌳 TREE (South: 0, 16)
      this.drawPOIMarker(ctx, mapX(0), mapY(16), '#55efc4', '🌳');
      // Shrine 4: 🌸 BLOOM (West: -16, 0)
      this.drawPOIMarker(ctx, mapX(-16), mapY(0), '#55efc4', '🌸');
    }

    // Player Direction Cone & Position Marker
    ctx.save();
    ctx.translate(centerX, centerY);

    const viewAngle = -this.player.cameraYaw + Math.PI / 2;
    ctx.fillStyle = 'rgba(0, 212, 255, 0.25)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 34, viewAngle - 0.45, viewAngle + 0.45);
    ctx.closePath();
    ctx.fill();

    ctx.rotate(viewAngle);
    ctx.fillStyle = '#00e1ff';
    ctx.shadowColor = '#00e1ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-6, -6);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }

  drawMapRect(ctx, x, y, w, h) {
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  }

  drawPOIMarker(ctx, x, y, color, label) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(x, y, 7.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    ctx.fillText(label, x, y);
    ctx.restore();
  }
}

window.UIManager = UIManager;
