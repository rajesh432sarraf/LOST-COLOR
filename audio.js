/**
 * audio.js - Web Audio API Procedural Synthesizer for "Temple of Red"
 * Provides atmospheric soundscapes, footsteps, mechanical rumblings,
 * harmonic glyph chimes, key pickup shimmer, and triumphant color restoration fanfare.
 */

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.isMuted = false;
    this.initialized = false;
    this.ambientOscillators = [];
    this.footstepTimer = 0;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.initialized = true;
      this.startAmbientSoundscape();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  toggleMute() {
    if (!this.initialized) this.init();
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  startAmbientSoundscape() {
    if (!this.ctx || this.ambientOscillators.length > 0) return;

    // Mystic Drone 1 - Deep resonant temple root
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    const filter1 = this.ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note
    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(140, this.ctx.currentTime);
    gain1.gain.setValueAtTime(0.18, this.ctx.currentTime);

    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(this.musicGain);
    osc1.start();
    this.ambientOscillators.push(osc1);

    // Mystic Drone 2 - Ethereal fifth harmonic
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    const filter2 = this.ctx.createBiquadFilter();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(82.4, this.ctx.currentTime); // E2 note
    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(220, this.ctx.currentTime);
    gain2.gain.setValueAtTime(0.12, this.ctx.currentTime);

    osc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(this.musicGain);
    osc2.start();
    this.ambientOscillators.push(osc2);

    // Wind / Air filter noise
    this.createWindAtmosphere();
  }

  createWindAtmosphere() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    whiteNoise.start();

    // Gentle LFO to modulate wind gust
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(120, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
  }

  playFootstep(isSprinting = false) {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    const pitch = 80 + Math.random() * 25;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(isSprinting ? 0.18 : 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  playStatueRotate() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Low stone friction grind
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(45, now);
    osc.frequency.linearRampToValueAtTime(55, now + 0.4);
    osc.frequency.linearRampToValueAtTime(35, now + 0.8);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.9);

    // Stone lock clunk at the end
    setTimeout(() => {
      this.playStoneThud();
    }, 700);
  }

  playStoneThud() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  playDoorOpen() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Sub rumble
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(40, now);
    subOsc.frequency.linearRampToValueAtTime(30, now + 2.0);

    subGain.gain.setValueAtTime(0.45, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 2.5);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + 2.6);

    // Stone sliding friction
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2.5, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(180, now);
    noiseFilter.Q.setValueAtTime(2.5, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.01, now);
    noiseGain.gain.linearRampToValueAtTime(0.4, now + 0.5);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(now);
  }

  playGlyphStep(stepIndex = 0, isCorrect = true) {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    if (!isCorrect) {
      // Dull wrong buzzer
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.32);
      return;
    }

    // Melodic pentatonic chime for correct steps: C4, D4, E4, G4, A4, C5
    const pentatonicFrequencies = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
    const freq = pentatonicFrequencies[stepIndex % pentatonicFrequencies.length];

    const osc = this.ctx.createOscillator();
    const oscHarmonic = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    oscHarmonic.type = 'triangle';
    oscHarmonic.frequency.setValueAtTime(freq * 2, now);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    oscHarmonic.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    oscHarmonic.start(now);
    osc.stop(now + 1.3);
    oscHarmonic.stop(now + 1.3);
  }

  playKeyPickup() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Rising celestial arpeggio: C5 -> E5 -> G5 -> C6 -> E6
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      osc.stop(startTime + 0.9);
    });
  }

  playColorTransformation() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    // 1. Initial crystal release blast
    const blastOsc = this.ctx.createOscillator();
    const blastGain = this.ctx.createGain();
    blastOsc.type = 'sine';
    blastOsc.frequency.setValueAtTime(180, now);
    blastOsc.frequency.exponentialRampToValueAtTime(45, now + 1.8);
    blastGain.gain.setValueAtTime(0.6, now);
    blastGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
    blastOsc.connect(blastGain);
    blastGain.connect(this.sfxGain);
    blastOsc.start(now);
    blastOsc.stop(now + 2.0);

    // 2. Rising orchestral major chord sequence (Victory Fanfare: C -> G -> C -> E -> G)
    const chordNotes = [
      [261.63, 329.63, 392.00],        // C Major
      [349.23, 440.00, 523.25],        // F Major
      [392.00, 493.88, 587.33],        // G Major
      [523.25, 659.25, 783.99, 1046.5] // Grand C Major high octave
    ];

    chordNotes.forEach((chord, step) => {
      const stepTime = now + 0.5 + step * 0.9;
      chord.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, stepTime);
        gain.gain.setValueAtTime(0.2, stepTime);
        gain.gain.exponentialRampToValueAtTime(0.001, stepTime + 1.5);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(stepTime);
        osc.stop(stepTime + 1.6);
      });
    });
  }

  // Error sound when player activates wrong water totem sequence
  playWrongSequence() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Dissonant low buzz and stone rumble
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(120, now);
    osc1.frequency.exponentialRampToValueAtTime(55, now + 0.5);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(114, now); // Minor second dissonance
    osc2.frequency.exponentialRampToValueAtTime(52, now + 0.5);

    gain.gain.setValueAtTime(0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  }

  // Water totem chime when a correct step is activated
  playTotemActivate(stepIndex = 0) {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Harmonious water-toned crystal chimes (Pentatonic E minor / D Dorian)
    const tones = [329.63, 392.00, 493.88, 587.33, 659.25];
    const freq = tones[stepIndex % tones.length];

    const osc = this.ctx.createOscillator();
    const harmonic = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    harmonic.type = 'triangle';
    harmonic.frequency.setValueAtTime(freq * 2, now);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

    osc.connect(gain);
    harmonic.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    harmonic.start(now);
    osc.stop(now + 1.7);
    harmonic.stop(now + 1.7);
  }

  // Procedural rain soundscape
  startRainAmbient() {
    if (!this.ctx || this.rainSource) return;
    try {
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.4;
      }

      this.rainSource = this.ctx.createBufferSource();
      this.rainSource.buffer = noiseBuffer;
      this.rainSource.loop = true;

      this.rainFilter = this.ctx.createBiquadFilter();
      this.rainFilter.type = 'lowpass';
      this.rainFilter.frequency.setValueAtTime(900, this.ctx.currentTime);

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.rainGain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 3.0);

      this.rainSource.connect(this.rainFilter);
      this.rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.musicGain);

      this.rainSource.start();
    } catch (e) {
      console.warn('Rain audio error:', e);
    }
  }

  stopRainAmbient() {
    if (this.rainGain && this.ctx) {
      this.rainGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);
      setTimeout(() => {
        if (this.rainSource) {
          try { this.rainSource.stop(); } catch (e) {}
          this.rainSource = null;
        }
      }, 1600);
    }
  }

  // Rushing water sound when lake fills
  playWaterRising() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(160, now + 4.0);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(280, now);
    filter.Q.setValueAtTime(2.0, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 1.5);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 6.0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 6.2);
  }

  // Massive blue beam sound
  playBlueShrineBeam() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Sub rumble + celestial overtone
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(50, now);
    subOsc.frequency.linearRampToValueAtTime(110, now + 2.0);

    const subFilter = this.ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(220, now);

    subGain.gain.setValueAtTime(0.01, now);
    subGain.gain.linearRampToValueAtTime(0.4, now + 0.8);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 4.5);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(this.sfxGain);

    subOsc.start(now);
    subOsc.stop(now + 4.6);

    // High shimmer
    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(880, now + 0.2);
    chime.frequency.exponentialRampToValueAtTime(1760, now + 3.0);
    chimeGain.gain.setValueAtTime(0.01, now + 0.2);
    chimeGain.gain.linearRampToValueAtTime(0.25, now + 0.8);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
    chime.connect(chimeGain);
    chimeGain.connect(this.sfxGain);
    chime.start(now + 0.2);
    chime.stop(now + 3.6);
  }

  // Grand Blue Color Restoration Fanfare
  playBlueColorTransformation() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Deep crystal surge
    const surge = this.ctx.createOscillator();
    const surgeGain = this.ctx.createGain();
    surge.type = 'sine';
    surge.frequency.setValueAtTime(220, now);
    surge.frequency.exponentialRampToValueAtTime(65, now + 2.2);
    surgeGain.gain.setValueAtTime(0.55, now);
    surgeGain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);
    surge.connect(surgeGain);
    surgeGain.connect(this.sfxGain);
    surge.start(now);
    surge.stop(now + 2.5);

    // Ethereal oceanic major chords (Eb Major -> Ab Major -> Bb Major -> Grand Eb Major)
    const chords = [
      [311.13, 392.00, 466.16],        // Eb
      [415.30, 523.25, 622.25],        // Ab
      [466.16, 587.33, 698.46],        // Bb
      [622.25, 783.99, 932.33, 1244.5] // Grand high Eb octave
    ];

    chords.forEach((chord, step) => {
      const stepTime = now + 0.4 + step * 0.85;
      chord.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, stepTime);
        gain.gain.setValueAtTime(0.22, stepTime);
        gain.gain.exponentialRampToValueAtTime(0.001, stepTime + 1.8);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(stepTime);
        osc.stop(stepTime + 1.9);
      });
    });
  }

  // Soft water sound effect when a connection is made
  playWaterStep(stepIndex = 0) {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Bubbling harmonic sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    const baseFreq = [320, 380, 440, 520][stepIndex % 4];
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + 0.35);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(baseFreq * 1.5, now);
    filter.Q.setValueAtTime(4.0, now);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.95);

    // High shimmer drop
    const drop = this.ctx.createOscillator();
    const dropGain = this.ctx.createGain();
    drop.type = 'triangle';
    drop.frequency.setValueAtTime(1200 + stepIndex * 200, now + 0.05);
    drop.frequency.exponentialRampToValueAtTime(600, now + 0.35);
    dropGain.gain.setValueAtTime(0.2, now + 0.05);
    dropGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    drop.connect(dropGain);
    dropGain.connect(this.sfxGain);
    drop.start(now + 0.05);
    drop.stop(now + 0.45);
  }

  // Ethereal clue discovery chime
  playClueDiscovered() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    const chords = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
    chords.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.18, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 1.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.3);
    });
  }

  // Radial water shockwave pulse sound upon collecting Water Crystal
  playWaterPulse() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Sub splash rumble
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(90, now);
    sub.frequency.exponentialRampToValueAtTime(30, now + 1.5);
    subGain.gain.setValueAtTime(0.45, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 1.7);

    // Oceanic surge sweep
    const sweep = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    sweep.type = 'sine';
    sweep.frequency.setValueAtTime(220, now);
    sweep.frequency.linearRampToValueAtTime(660, now + 0.6);
    sweep.frequency.exponentialRampToValueAtTime(110, now + 2.4);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(1800, now + 0.6);
    filter.frequency.exponentialRampToValueAtTime(200, now + 2.4);

    sweepGain.gain.setValueAtTime(0.01, now);
    sweepGain.gain.linearRampToValueAtTime(0.4, now + 0.4);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    sweep.connect(filter);
    filter.connect(sweepGain);
    sweepGain.connect(this.sfxGain);
    sweep.start(now);
    sweep.stop(now + 2.6);
  }
}

window.soundSystem = new SoundSystem();

