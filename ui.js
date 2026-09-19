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

    // Red Flash Overlay
    this.redFlashOverlay = document.getElementById('red-flash-overlay');

    // Victory screens
    this.victoryScreen = document.getElementById('victory-screen');
    this.level2VictoryScreen = document.getElementById('level2-victory-screen');
    this.currentObjectiveText = document.getElementById('current-objective-text');

    this.score = 0;
    this.startTime = Date.now();
    this.isMuted = false;
    this.currentLevel = 1;
    this.lake = null;

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
        this.showNotification('✨ Level 3 is under development! Thank you for playing.');
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
    this.promptText.textContent = text;
    this.promptEl.classList.add('visible');
    if (this.reticleDot) this.reticleDot.classList.add('interactable');
  }

  hidePrompt() {
    if (!this.promptEl) return;
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
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.fillStyle = '#0b0e14';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    const centerX = w / 2;
    const centerY = h / 2;

    if (this.currentLevel === 1) {
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
    } else {
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
