/**
 * postprocessing.js - Fullscreen Custom Post-Processing & Color Thief Shader
 * Renders the world in atmospheric monochrome noir, and drives the expanding
 * cinematic shockwave that restores vibrant red to the universe.
 */

class PostProcessingManager {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    // Render Target for scene capture
    const width = window.innerWidth || 800;
    const height = window.innerHeight || 600;
    this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    });

    // Custom Color Thief Shader Quad
    this.postScene = new THREE.Scene();
    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.uniforms = {
      tDiffuse: { value: this.renderTarget.texture },
      uRedRestored: { value: 0.0 },       // 0.0 = Pure B&W, 1.0 = Red restored
      uShockwaveRadius: { value: 0.0 },   // Climax shockwave expansion
      uShockwaveCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uBlueRestored: { value: 0.0 },      // 0.0 = Blue locked, 1.0 = Blue restored
      uBlueShockwaveRadius: { value: 0.0 },
      uBlueShockwaveCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uGreenRestored: { value: 0.0 },     // 0.0 = Green locked, 1.0 = Green restored
      uGreenShockwaveRadius: { value: 0.0 },
      uGreenShockwaveCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uWorldSaturation: { value: 1.0 },   // 1.0 = Full rich color, 0.0 = Noir monochrome
      uVignette: { value: 0.38 },
      uContrast: { value: 1.10 },
      uTime: { value: 0.0 }
    };

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D tDiffuse;
      uniform float uRedRestored;
      uniform float uShockwaveRadius;
      uniform vec2 uShockwaveCenter;
      uniform float uBlueRestored;
      uniform float uBlueShockwaveRadius;
      uniform vec2 uBlueShockwaveCenter;
      uniform float uGreenRestored;
      uniform float uGreenShockwaveRadius;
      uniform vec2 uGreenShockwaveCenter;
      uniform float uWorldSaturation;
      uniform float uVignette;
      uniform float uContrast;
      uniform float uTime;
      varying vec2 vUv;

      void main() {
        vec2 uv = vUv;

        // Shockwave distortion during red color restoration
        if (uShockwaveRadius > 0.01 && uShockwaveRadius < 2.0) {
          vec2 toCenter = uv - uShockwaveCenter;
          float dist = length(toCenter);
          float waveDiff = abs(dist - uShockwaveRadius);
          if (waveDiff < 0.12) {
            float strength = (1.0 - waveDiff / 0.12) * 0.035;
            uv -= normalize(toCenter) * strength;
          }
        }

        // Shockwave distortion during blue color restoration
        if (uBlueShockwaveRadius > 0.01 && uBlueShockwaveRadius < 2.0) {
          vec2 toCenterB = uv - uBlueShockwaveCenter;
          float distB = length(toCenterB);
          float waveDiffB = abs(distB - uBlueShockwaveRadius);
          if (waveDiffB < 0.14) {
            float strengthB = (1.0 - waveDiffB / 0.14) * 0.04;
            uv -= normalize(toCenterB) * strengthB;
          }
        }

        vec4 texColor = texture2D(tDiffuse, uv);

        // Standard Luminance for Black & White Noir
        float gray = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));

        // Boost monochrome contrast
        gray = pow(gray, uContrast);

        // 1. Red chrominance isolation
        float maxGreenBlue = max(texColor.g, texColor.b);
        float redDiff = texColor.r - maxGreenBlue;
        float isRed = smoothstep(0.08, 0.28, redDiff);

        vec3 vibrantRed = vec3(
          min(1.0, texColor.r * 1.45 + 0.1),
          texColor.g * 0.15,
          texColor.b * 0.2
        );

        // 2. Blue & Cyan chrominance isolation
        float maxRedGreen = max(texColor.r, texColor.g * 0.95);
        float blueDiff = texColor.b - maxRedGreen;
        float isBlue = smoothstep(0.05, 0.22, blueDiff);

        // Vibrant azure / cerulean sapphire
        vec3 vibrantBlue = vec3(
          texColor.r * 0.2,
          min(1.0, texColor.g * 0.85 + 0.1),
          min(1.0, texColor.b * 1.45 + 0.15)
        );

        // Emissive magical particles allowance (subtle luminescence near shrine even in monochrome)
        float isMagicalSparkle = smoothstep(0.7, 1.0, texColor.b) * step(0.25, blueDiff);

        // Standard monochrome color
        vec3 monoColor = vec3(gray);

        // Effective red restoration wave
        vec2 centerDiffR = uv - uShockwaveCenter;
        float distFromCenterR = length(centerDiffR);
        float waveMaskR = smoothstep(uShockwaveRadius + 0.05, uShockwaveRadius - 0.05, distFromCenterR);
        float effectiveRedRestoration = max(uRedRestored, waveMaskR);

        // Effective blue restoration wave
        vec2 centerDiffB = uv - uBlueShockwaveCenter;
        float distFromCenterB = length(centerDiffB);
        float waveMaskB = smoothstep(uBlueShockwaveRadius + 0.05, uBlueShockwaveRadius - 0.05, distFromCenterB);
        float effectiveBlueRestoration = max(uBlueRestored, waveMaskB);

        // Base color mixes between full color scene and monochrome based on uWorldSaturation
        vec3 baseColor = mix(monoColor, texColor.rgb, clamp(uWorldSaturation, 0.0, 1.0));
        vec3 finalColor = baseColor;

        // Apply subtle magical particle luminescence in B&W
        finalColor = mix(finalColor, vibrantBlue, isMagicalSparkle * 0.75);

        // Apply Red Restoration
        if (effectiveRedRestoration > 0.0) {
          vec3 redAccent = mix(finalColor, vibrantRed, isRed);
          finalColor = mix(finalColor, redAccent, effectiveRedRestoration);
        }

        // Apply Blue Restoration
        if (effectiveBlueRestoration > 0.0) {
          vec3 blueAccent = mix(finalColor, vibrantBlue, isBlue);
          finalColor = mix(finalColor, blueAccent, effectiveBlueRestoration);
        }

        // Effective green restoration wave
        vec2 centerDiffG = uv - uGreenShockwaveCenter;
        float distFromCenterG = length(centerDiffG);
        float waveMaskG = smoothstep(uGreenShockwaveRadius + 0.05, uGreenShockwaveRadius - 0.05, distFromCenterG);
        float effectiveGreenRestoration = max(uGreenRestored, waveMaskG);

        // Apply Green Restoration
        if (effectiveGreenRestoration > 0.0) {
          vec3 vibrantGreen = vec3(texColor.r * 0.15, min(1.0, texColor.g * 1.5 + 0.1), texColor.b * 0.2);
          float isGreen = smoothstep(0.05, 0.22, texColor.g - max(texColor.r, texColor.b));
          vec3 greenAccent = mix(finalColor, vibrantGreen, isGreen);
          finalColor = mix(finalColor, greenAccent, effectiveGreenRestoration);
        }

        // Soft cinematic vignette
        float vignette = 1.0 - dot(vUv - 0.5, vUv - 0.5) * uVignette * 1.8;
        finalColor *= clamp(vignette, 0.0, 1.0);

        // Subtle film grain
        float noise = (fract(sin(dot(vUv, vec2(12.9898, 78.233) * uTime)) * 43758.5453) - 0.5) * 0.025;
        finalColor += vec3(noise);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    this.postScene.add(quad);
  }

  resize(width, height) {
    this.renderTarget.setSize(width, height);
  }

  setRedRestoration(progress) {
    this.uniforms.uRedRestored.value = progress;
    this.uniforms.uShockwaveRadius.value = progress * 1.8;
  }

  setBlueRestoration(progress) {
    this.uniforms.uBlueRestored.value = progress;
    this.uniforms.uBlueShockwaveRadius.value = progress * 2.0;
  }

  setGreenRestoration(progress) {
    this.uniforms.uGreenRestored.value = progress;
    this.uniforms.uGreenShockwaveRadius.value = progress * 2.0;
  }

  setWorldSaturation(saturation) {
    this.uniforms.uWorldSaturation.value = Math.max(0.0, Math.min(1.0, saturation));
  }

  render(time) {
    this.uniforms.uTime.value = time;

    // 1. Render primary 3D scene to target
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);

    // 2. Render post-processing quad to screen
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.postScene, this.postCamera);
  }
}

window.PostProcessingManager = PostProcessingManager;
