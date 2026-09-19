/**
 * textures.js - Procedural Canvas Texture Generator
 * Creates realistic, high-fidelity PBR-ready textures for stone, runes, murals,
 * marble, metals, and character garments completely client-side.
 */

class TextureGenerator {
  constructor() {
    this.cache = {};
  }

  // Helper to create a 2D canvas
  createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return { canvas, ctx: canvas.getContext('2d') };
  }

  // Weathered ancient temple stone blocks
  getAncientStone(width = 512, height = 512) {
    const key = `ancient_stone_${width}`;
    if (this.cache[key]) return this.cache[key];

    const { canvas, ctx } = this.createCanvas(width, height);

    // Base stone color (monochrome greyscale with subtle warmth)
    ctx.fillStyle = '#6e7075';
    ctx.fillRect(0, 0, width, height);

    // Stone block brick grid
    const rows = 8;
    const cols = 4;
    const rowH = height / rows;
    const colW = width / cols;

    ctx.strokeStyle = '#323438';
    ctx.lineWidth = 4;

    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      const offset = (r % 2) * (colW / 2);
      for (let c = 0; c <= cols; c++) {
        const x = (c * colW + offset) % width;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + rowH);
        ctx.stroke();
      }
    }

    // Noise and weathering grain
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 50;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Weathering cracks
    ctx.strokeStyle = 'rgba(30, 32, 36, 0.6)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 16; i++) {
      let cx = Math.random() * width;
      let cy = Math.random() * height;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let s = 0; s < 4; s++) {
        cx += (Math.random() - 0.5) * 35;
        cy += (Math.random() - 0.5) * 35;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache[key] = texture;
    return texture;
  }

  // Smooth ancient temple floor paving slabs
  getTempleFloor(width = 512, height = 512) {
    const key = `temple_floor_${width}`;
    if (this.cache[key]) return this.cache[key];

    const { canvas, ctx } = this.createCanvas(width, height);

    ctx.fillStyle = '#82848a';
    ctx.fillRect(0, 0, width, height);

    // Large flagstone paving pattern
    const tiles = 4;
    const size = width / tiles;
    ctx.strokeStyle = '#484a50';
    ctx.lineWidth = 5;

    for (let x = 0; x < width; x += size) {
      for (let y = 0; y < height; y += size) {
        ctx.strokeRect(x, y, size, size);
        ctx.fillStyle = `rgba(255,255,255,${(Math.random() - 0.5) * 0.08})`;
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
      }
    }

    // Surface stippling
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 28;
      data[i] = Math.min(255, Math.max(0, data[i] + n));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache[key] = texture;
    return texture;
  }

  // Carved runic glyph tile for Puzzle 2
  getRunicTile(symbolName, isLit = false) {
    const key = `rune_${symbolName}_${isLit}`;
    if (this.cache[key]) return this.cache[key];

    const { canvas, ctx } = this.createCanvas(256, 256);

    // Base dark slate slab
    ctx.fillStyle = isLit ? '#282c35' : '#1c1e22';
    ctx.fillRect(0, 0, 256, 256);

    // Double carved border
    ctx.strokeStyle = isLit ? '#ff4d5a' : '#525660';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, 232, 232);

    ctx.lineWidth = 2;
    ctx.strokeRect(22, 22, 212, 212);

    // Corner rosettes
    const corners = [[22, 22], [234, 22], [22, 234], [234, 234]];
    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = isLit ? '#ff3344' : '#525660';
      ctx.fill();
    });

    // Central ancient glyph
    ctx.save();
    ctx.translate(128, 128);
    ctx.strokeStyle = isLit ? '#ffffff' : '#8a909d';
    ctx.fillStyle = isLit ? '#ff4d5a' : '#6a707c';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isLit) {
      ctx.shadowColor = '#ff3344';
      ctx.shadowBlur = 18;
    }

    switch (symbolName.toLowerCase()) {
      case 'sun':
        // Sun symbol with radiating rays
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        for (let a = 0; a < 8; a++) {
          const angle = (a * Math.PI) / 4;
          const x1 = Math.cos(angle) * 36;
          const y1 = Math.sin(angle) * 36;
          const x2 = Math.cos(angle) * 54;
          const y2 = Math.sin(angle) * 54;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        break;

      case 'eye':
        // Ancient Eye of Horus motif
        ctx.beginPath();
        ctx.moveTo(-50, 0);
        ctx.quadraticCurveTo(0, -35, 50, 0);
        ctx.quadraticCurveTo(0, 35, -50, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(10, 25);
        ctx.lineTo(25, 50);
        ctx.stroke();
        break;

      case 'star':
        // 8-point celestial compass star
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const r = i % 2 === 0 ? 55 : 22;
          const a = (i * Math.PI) / 4 - Math.PI / 2;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        break;

      case 'moon':
        // Crescent moon with star
        ctx.beginPath();
        ctx.arc(0, 0, 42, 0.4 * Math.PI, 1.6 * Math.PI, false);
        ctx.arc(16, 0, 38, 1.4 * Math.PI, 0.6 * Math.PI, true);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'scarab':
        // Sacred beetle emblem
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 38, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, -28, 14, 0, Math.PI * 2);
        ctx.fill();
        // legs
        for (let side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(side * 20, -10);
          ctx.lineTo(side * 48, -25);
          ctx.moveTo(side * 24, 5);
          ctx.lineTo(side * 50, 5);
          ctx.moveTo(side * 20, 20);
          ctx.lineTo(side * 48, 35);
          ctx.stroke();
        }
        break;

      case 'falcon':
        // Ancient falcon wings
        ctx.beginPath();
        ctx.moveTo(-55, -10);
        ctx.quadraticCurveTo(0, -45, 55, -10);
        ctx.quadraticCurveTo(0, 10, -55, -10);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, -10, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(0, 45);
        ctx.lineTo(20, 0);
        ctx.stroke();
        break;

      default:
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    this.cache[key] = texture;
    return texture;
  }

  // Mural depicting the sacred order for Puzzle 2
  getTempleMural() {
    const key = 'temple_mural';
    if (this.cache[key]) return this.cache[key];

    const { canvas, ctx } = this.createCanvas(512, 256);

    // Weathered sandstone mural background
    ctx.fillStyle = '#4a4d52';
    ctx.fillRect(0, 0, 512, 256);

    // Border engraving
    ctx.strokeStyle = '#2d2f34';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 492, 236);

    // Header inscription
    ctx.font = 'bold 16px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#b0b5be';
    ctx.textAlign = 'center';
    ctx.fillText('PATH OF THE FOUR CELESTIAL GUARDS', 256, 42);

    // Steps order illustration: 1: SUN -> 2: EYE -> 3: STAR -> 4: MOON
    const steps = [
      { name: 'SUN', icon: '☀️' },
      { name: 'EYE', icon: '👁️' },
      { name: 'STAR', icon: '⭐' },
      { name: 'MOON', icon: '🌙' }
    ];

    const startX = 75;
    const spacing = 105;

    steps.forEach((step, idx) => {
      const cx = startX + idx * spacing;
      const cy = 130;

      // Glyph box
      ctx.fillStyle = '#2d3036';
      ctx.strokeStyle = '#727680';
      ctx.lineWidth = 3;
      ctx.fillRect(cx - 36, cy - 36, 72, 72);
      ctx.strokeRect(cx - 36, cy - 36, 72, 72);

      // Roman numeral index
      ctx.font = 'bold 12px "Cinzel", serif';
      ctx.fillStyle = '#e5b95c';
      const numerals = ['I', 'II', 'III', 'IV'];
      ctx.fillText(numerals[idx], cx, cy - 44);

      // Symbol
      ctx.font = '28px sans-serif';
      ctx.fillText(step.icon, cx, cy + 10);

      // Label below
      ctx.font = 'bold 12px "Outfit", sans-serif';
      ctx.fillStyle = '#cfd3dc';
      ctx.fillText(step.name, cx, cy + 58);

      // Connector arrow to next
      if (idx < steps.length - 1) {
        ctx.strokeStyle = '#8c919d';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx + 44, cy);
        ctx.lineTo(cx + 66, cy);
        ctx.lineTo(cx + 60, cy - 6);
        ctx.moveTo(cx + 66, cy);
        ctx.lineTo(cx + 60, cy + 6);
        ctx.stroke();
      }
    });

    const texture = new THREE.CanvasTexture(canvas);
    this.cache[key] = texture;
    return texture;
  }

  // Final Red Door Carvings
  getRedDoorTexture() {
    const key = 'red_door';
    if (this.cache[key]) return this.cache[key];

    const { canvas, ctx } = this.createCanvas(512, 1024);

    // Heavy dark basalt stone
    ctx.fillStyle = '#1c1d22';
    ctx.fillRect(0, 0, 512, 1024);

    // Deep stone panels
    ctx.strokeStyle = '#0c0d10';
    ctx.lineWidth = 12;
    ctx.strokeRect(20, 20, 472, 984);

    // Center seam
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 1024);
    ctx.stroke();

    // Large glowing crimson runes
    ctx.strokeStyle = '#ff3344';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#ff2233';
    ctx.shadowBlur = 14;

    // Sacred Lock Emblem at center
    ctx.beginPath();
    ctx.arc(256, 512, 110, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(256, 512, 60, 0, Math.PI * 2);
    ctx.stroke();

    // Keyhole slot
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(256, 500, 16, 0, Math.PI * 2);
    ctx.rect(250, 500, 12, 35);
    ctx.fill();

    // Ornate sacred filigree
    for (let y = 140; y <= 880; y += 180) {
      if (Math.abs(y - 512) < 90) continue;
      ctx.beginPath();
      ctx.moveTo(60, y);
      ctx.quadraticCurveTo(256, y - 40, 452, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache[key] = texture;
    return texture;
  }

  // Sacred Temple Tapestry (Red Banner)
  getSacredBanner() {
    const key = 'sacred_banner';
    if (this.cache[key]) return this.cache[key];

    const { canvas, ctx } = this.createCanvas(256, 768);

    // Rich crimson woven fabric
    ctx.fillStyle = '#b31528';
    ctx.fillRect(0, 0, 256, 768);

    // Gold trim
    ctx.strokeStyle = '#e5b95c';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 236, 748);

    // Ancient sunburst emblem
    ctx.save();
    ctx.translate(128, 200);
    ctx.strokeStyle = '#ffd700';
    ctx.fillStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 45, Math.sin(a) * 45);
      ctx.lineTo(Math.cos(a) * 70, Math.sin(a) * 70);
      ctx.stroke();
    }
    ctx.restore();

    // Lower decorative triangle fringe
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(0, 768);
    ctx.lineTo(128, 710);
    ctx.lineTo(256, 768);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    this.cache[key] = texture;
    return texture;
  }

  // Cracked dried lake bed mud texture
  getCrackedEarth(width = 512, height = 512) {
    const key = `cracked_earth_${width}`;
    if (this.cache[key]) return this.cache[key];

    const { canvas, ctx } = this.createCanvas(width, height);

    // Desaturated dry silt base
    ctx.fillStyle = '#4c4e52';
    ctx.fillRect(0, 0, width, height);

    // Voronoi-like cracked polygon cells
    const cellPoints = [];
    const numPoints = 64;
    for (let i = 0; i < numPoints; i++) {
      cellPoints.push({
        x: (Math.random() * 0.9 + 0.05) * width,
        y: (Math.random() * 0.9 + 0.05) * height
      });
    }

    // Delaunay-like connecting lines for cracks
    ctx.strokeStyle = '#18191c';
    ctx.lineWidth = 3.5;
    for (let i = 0; i < cellPoints.length; i++) {
      for (let j = i + 1; j < cellPoints.length; j++) {
        const d = Math.hypot(cellPoints[i].x - cellPoints[j].x, cellPoints[i].y - cellPoints[j].y);
        if (d < width / 3.5) {
          ctx.beginPath();
          ctx.moveTo(cellPoints[i].x, cellPoints[i].y);
          // Add jagged fracture
          const midX = (cellPoints[i].x + cellPoints[j].x) / 2 + (Math.random() - 0.5) * 16;
          const midY = (cellPoints[i].y + cellPoints[j].y) / 2 + (Math.random() - 0.5) * 16;
          ctx.lineTo(midX, midY);
          ctx.lineTo(cellPoints[j].x, cellPoints[j].y);
          ctx.stroke();
        }
      }
    }

    // Fine capillary micro-cracks
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#25272a';
    for (let k = 0; k < 120; k++) {
      let x = Math.random() * width;
      let y = Math.random() * height;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let s = 0; s < 3; s++) {
        x += (Math.random() - 0.5) * 26;
        y += (Math.random() - 0.5) * 26;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Dirt and grit noise
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 36;
      data[i] = Math.min(255, Math.max(0, data[i] + n));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache[key] = texture;
    return texture;
  }

  // Water totem carved symbols (Cloud, Rain, Lake, Ocean)
  getTotemSymbol(symbolName, isLit = false) {
    const key = `totem_${symbolName}_${isLit}`;
    if (this.cache[key]) return this.cache[key];

    const { canvas, ctx } = this.createCanvas(256, 256);

    // Weathered ancient stone slab
    ctx.fillStyle = isLit ? '#1c2635' : '#22252a';
    ctx.fillRect(0, 0, 256, 256);

    // Ornate runic frame
    ctx.strokeStyle = isLit ? '#38b6ff' : '#454a55';
    ctx.lineWidth = isLit ? 8 : 5;
    ctx.strokeRect(16, 16, 224, 224);

    ctx.lineWidth = 2;
    ctx.strokeRect(26, 26, 204, 204);

    // Symbol drawing
    ctx.save();
    ctx.translate(128, 128);

    if (isLit) {
      ctx.shadowColor = '#00c3ff';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = '#e0f6ff';
      ctx.fillStyle = '#a0e4ff';
    } else {
      ctx.strokeStyle = '#8a909c';
      ctx.fillStyle = '#656b77';
    }
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (symbolName) {
      case 'cloud':
        // Stylized Ancient Cloud
        ctx.beginPath();
        ctx.arc(-26, 8, 22, Math.PI * 0.7, Math.PI * 1.9);
        ctx.arc(0, -18, 28, Math.PI * 1.0, Math.PI * 2.0);
        ctx.arc(30, 6, 24, Math.PI * 1.2, Math.PI * 0.35);
        ctx.closePath();
        ctx.stroke();
        if (isLit) ctx.fill();
        break;

      case 'rain':
        // Cloud with falling raindrops
        ctx.beginPath();
        ctx.arc(-20, -15, 18, Math.PI * 0.7, Math.PI * 1.9);
        ctx.arc(4, -32, 22, Math.PI * 1.0, Math.PI * 2.0);
        ctx.arc(26, -16, 18, Math.PI * 1.2, Math.PI * 0.35);
        ctx.closePath();
        ctx.stroke();
        // Raindrops
        [-30, -10, 10, 30].forEach((rx, idx) => {
          ctx.beginPath();
          const yStart = 10 + (idx % 2) * 8;
          ctx.moveTo(rx, yStart);
          ctx.lineTo(rx - 6, yStart + 22);
          ctx.stroke();
        });
        break;

      case 'lake':
        // Mountain peaks over still water basin
        ctx.beginPath();
        // Mountains
        ctx.moveTo(-50, 0);
        ctx.lineTo(-20, -40);
        ctx.lineTo(5, -10);
        ctx.lineTo(30, -48);
        ctx.lineTo(55, 0);
        ctx.stroke();
        // Still lake waves
        ctx.beginPath();
        ctx.moveTo(-45, 16);
        ctx.lineTo(45, 16);
        ctx.moveTo(-35, 30);
        ctx.lineTo(35, 30);
        ctx.stroke();
        break;

      case 'river':
      case 'ocean':
        // Flowing river streams with curling wave crests
        ctx.beginPath();
        ctx.moveTo(-55, -15);
        ctx.bezierCurveTo(-25, -35, 10, 5, 55, -15);
        ctx.moveTo(-55, 12);
        ctx.bezierCurveTo(-25, -10, 10, 32, 55, 12);
        ctx.moveTo(-45, 36);
        ctx.bezierCurveTo(-15, 18, 15, 50, 45, 36);
        ctx.stroke();
        // Water droplet
        ctx.beginPath();
        ctx.arc(0, -32, 6, 0, Math.PI * 2);
        ctx.fillStyle = isLit ? '#ffffff' : '#88d8ff';
        ctx.fill();
        break;
    }

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    this.cache[key] = texture;
    return texture;
  }

  // =========================================================================
  // REALISTIC TEXTURE GENERATORS (Canvas Techstack - High Fidelity & Colors)
  // =========================================================================

  // 1. Realistic Multi-tone Flagstone Pavers with Moss and Mortar
  getRealisticStonePavers(width = 512, height = 512) {
    const key = `realistic_pavers_${width}`;
    if (this.cache[key]) return this.cache[key];

    const { canvas, ctx } = this.createCanvas(width, height);

    // Deep dark mortar base
    ctx.fillStyle = '#22201d';
    ctx.fillRect(0, 0, width, height);

    const stonePalettes = [
      '#8f8272', '#7b7164', '#9d9181', '#6e6558', '#857868', '#a49785'
    ];

    const rows = 6;
    const cols = 4;
    const rowH = height / rows;
    const colW = width / cols;

    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      const offset = (r % 2) * (colW * 0.45);

      for (let c = -1; c <= cols + 1; c++) {
        const x = c * colW + offset;
        const color = stonePalettes[(r * 5 + c + 13) % stonePalettes.length];

        ctx.save();
        ctx.fillStyle = color;
        // Draw individual beveled flagstone
        const pad = 4;
        const sw = colW - pad * 2;
        const sh = rowH - pad * 2;
        const sx = x + pad;
        const sy = y + pad;

        // Rounded chamfered rectangle
        ctx.beginPath();
        const cr = 6;
        ctx.moveTo(sx + cr, sy);
        ctx.lineTo(sx + sw - cr, sy);
        ctx.quadraticCurveTo(sx + sw, sy, sx + sw, sy + cr);
        ctx.lineTo(sx + sw, sy + sh - cr);
        ctx.quadraticCurveTo(sx + sw, sy + sh, sx + sw - cr, sy + sh);
        ctx.lineTo(sx + cr, sy + sh);
        ctx.quadraticCurveTo(sx, sy + sh, sx, sy + sh - cr);
        ctx.lineTo(sx, sy + cr);
        ctx.quadraticCurveTo(sx, sy, sx + cr, sy);
        ctx.closePath();
        ctx.fill();

        // Edge highlight (sun angle top-left)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx + cr, sy + 1);
        ctx.lineTo(sx + sw - cr, sy + 1);
        ctx.stroke();

        // Edge shadow (bottom-right)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.moveTo(sx + 1, sy + sh - 1);
        ctx.lineTo(sx + sw - 1, sy + sh - 1);
        ctx.stroke();

        ctx.restore();
      }
    }

    // Organic Emerald Moss clusters in the joints
    ctx.fillStyle = 'rgba(65, 105, 45, 0.82)';
    for (let m = 0; m < 70; m++) {
      const mx = Math.random() * width;
      const my = Math.random() * height;
      const mrad = 3 + Math.random() * 8;
      ctx.beginPath();
      ctx.arc(mx, my, mrad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Natural stone grain noise
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 32;
      data[i] = Math.min(255, Math.max(0, data[i] + n));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n * 0.8));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache[key] = texture;
    return texture;
  }

  // 2. Ancient Carved Temple Wall Blocks with Hieroglyphs & Inlays
  getAncientCarvedWallTexture(width = 512, height = 512) {
    const key = `realistic_carved_wall_${width}`;
    if (this.cache[key]) return this.cache[key];

    const { canvas, ctx } = this.createCanvas(width, height);

    // Warm limestone sandstone base
    ctx.fillStyle = '#7a7063';
    ctx.fillRect(0, 0, width, height);

    const rows = 5;
    const cols = 3;
    const rh = height / rows;
    const cw = width / cols;

    ctx.strokeStyle = '#322d26';
    ctx.lineWidth = 5;

    for (let r = 0; r < rows; r++) {
      const y = r * rh;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      const offset = (r % 2) * (cw / 2);
      for (let c = 0; c <= cols + 1; c++) {
        const x = (c * cw + offset) % width;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + rh);
        ctx.stroke();

        // Carved glyph in center of each stone block
        ctx.save();
        ctx.strokeStyle = 'rgba(40, 35, 30, 0.65)';
        ctx.lineWidth = 2.5;
        const cx = x + cw * 0.5;
        const cy = y + rh * 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - 18, cy);
        ctx.lineTo(cx + 18, cy);
        ctx.moveTo(cx, cy - 18);
        ctx.lineTo(cx, cy + 18);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Weathering cracks & fissures
    ctx.strokeStyle = 'rgba(25, 22, 18, 0.7)';
    ctx.lineWidth = 1.6;
    for (let k = 0; k < 20; k++) {
      let cx = Math.random() * width;
      let cy = Math.random() * height;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let s = 0; s < 4; s++) {
        cx += (Math.random() - 0.5) * 40;
        cy += (Math.random() - 0.5) * 40;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    // Surface stippling
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 36;
      data[i] = Math.min(255, Math.max(0, data[i] + n + 4));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n - 4));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache[key] = texture;
    return texture;
  }

  // 3. Ornate Carved Temple Gate (Heavy dark ironwood with bronze medallions)
  getOrnateTempleDoorTexture(width = 512, height = 1024) {
    const key = 'realistic_temple_door';
    if (this.cache[key]) return this.cache[key];

    const { canvas, ctx } = this.createCanvas(width, height);

    // Deep rich dark ironwood base
    ctx.fillStyle = '#261912';
    ctx.fillRect(0, 0, width, height);

    // Vertical plank lines
    const numPlanks = 6;
    const pw = width / numPlanks;
    ctx.strokeStyle = '#120b08';
    ctx.lineWidth = 6;
    for (let p = 1; p < numPlanks; p++) {
      ctx.beginPath();
      ctx.moveTo(p * pw, 0);
      ctx.lineTo(p * pw, height);
      ctx.stroke();
    }

    // Wood grain lines
    ctx.strokeStyle = 'rgba(60, 42, 30, 0.4)';
    ctx.lineWidth = 1.2;
    for (let w = 0; w < 90; w++) {
      let wx = Math.random() * width;
      ctx.beginPath();
      ctx.moveTo(wx, 0);
      ctx.bezierCurveTo(
        wx + (Math.random() - 0.5) * 30, height * 0.33,
        wx + (Math.random() - 0.5) * 30, height * 0.66,
        wx + (Math.random() - 0.5) * 20, height
      );
      ctx.stroke();
    }

    // Heavy antique bronze framing borders
    ctx.strokeStyle = '#c49a45';
    ctx.lineWidth = 14;
    ctx.strokeRect(18, 18, width - 36, height - 36);

    // Bronze rivets along borders
    ctx.fillStyle = '#e5b95c';
    for (let y = 30; y <= height - 30; y += 45) {
      ctx.beginPath();
      ctx.arc(26, y, 5, 0, Math.PI * 2);
      ctx.arc(width - 26, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center Sacred Medallion / Lock Emblems
    const cy = height * 0.5;
    const cx = width * 0.5;

    // Glowing Sacred Crimson Arc
    ctx.strokeStyle = '#ff3344';
    ctx.lineWidth = 8;
    ctx.shadowColor = '#ff2233';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, 110, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#e5b95c';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, 70, 0, Math.PI * 2);
    ctx.stroke();

    // Central Keyhole Slot
    ctx.fillStyle = '#0a0808';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(cx, cy - 8, 18, 0, Math.PI * 2);
    ctx.rect(cx - 7, cy - 8, 14, 40);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    this.cache[key] = texture;
    return texture;
  }

  // 4. Realistic Fluted Classical Stone Pillar Texture
  getCarvedPillarTexture(width = 512, height = 1024) {
    const key = `realistic_pillar_${width}`;
    if (this.cache[key]) return this.cache[key];

    const { canvas, ctx } = this.createCanvas(width, height);

    // Warm carved limestone base
    ctx.fillStyle = '#82786b';
    ctx.fillRect(0, 0, width, height);

    // Fluted Column Vertical Ridges (Chiseled ribs)
    const flutes = 16;
    const fw = width / flutes;

    for (let f = 0; f < flutes; f++) {
      const fx = f * fw;

      // Left shadow
      const grad = ctx.createLinearGradient(fx, 0, fx + fw, 0);
      grad.addColorStop(0.0, 'rgba(30, 26, 22, 0.45)');
      grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.18)');
      grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.05)');
      grad.addColorStop(1.0, 'rgba(20, 18, 15, 0.55)');

      ctx.fillStyle = grad;
      ctx.fillRect(fx, 0, fw, height);
    }

    // Weathered base grime gradient
    const grime = ctx.createLinearGradient(0, height * 0.7, 0, height);
    grime.addColorStop(0.0, 'rgba(40, 55, 30, 0.0)');
    grime.addColorStop(1.0, 'rgba(35, 48, 25, 0.65)');
    ctx.fillStyle = grime;
    ctx.fillRect(0, height * 0.7, width, height * 0.3);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache[key] = texture;
    return texture;
  }

  // 5. Realistic Distressed Leather Jacket Texture for Character
  getLeatherJacketTexture(width = 512, height = 512) {
    const key = 'char_leather_jacket';
    if (this.cache[key]) return this.cache[key];

    const { canvas, ctx } = this.createCanvas(width, height);

    // Rich warm chestnut brown leather
    ctx.fillStyle = '#543725';
    ctx.fillRect(0, 0, width, height);

    // Leather grain noise
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 38;
      data[i] = Math.min(255, Math.max(0, data[i] + n + 8));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n * 0.8));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n * 0.5));
    }
    ctx.putImageData(imgData, 0, 0);

    // Lapels & front zipper seam
    ctx.strokeStyle = '#2d1c12';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, height);
    ctx.stroke();

    // Brass zipper teeth
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    for (let y = 100; y < height - 30; y += 8) {
      ctx.beginPath();
      ctx.moveTo(251, y);
      ctx.lineTo(261, y);
      ctx.stroke();
    }

    // Double stitching lines on lapels
    ctx.strokeStyle = '#916343';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(238, 0);
    ctx.lineTo(238, height);
    ctx.moveTo(274, 0);
    ctx.lineTo(274, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Chest pocket flaps
    [-1, 1].forEach((side) => {
      const px = 256 + side * 110;
      ctx.fillStyle = '#422a1c';
      ctx.strokeStyle = '#26160d';
      ctx.lineWidth = 3;
      ctx.fillRect(px - 45, 180, 90, 40);
      ctx.strokeRect(px - 45, 180, 90, 40);

      // Brass snap button
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(px, 200, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    this.cache[key] = texture;
    return texture;
  }

  // 6. Realistic Denim / Cargo Twill Pants Texture
  getPantsTexture(width = 512, height = 512) {
    const key = 'char_pants_twill';
    if (this.cache[key]) return this.cache[key];

    const { canvas, ctx } = this.createCanvas(width, height);

    // Dark charcoal olive denim
    ctx.fillStyle = '#34383c';
    ctx.fillRect(0, 0, width, height);

    // Twill diagonal weave lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = -height; x < width * 2; x += 4) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height, height);
      ctx.stroke();
    }

    // Side seam stitching in tan/copper
    ctx.strokeStyle = '#967954';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(50, 0);
    ctx.lineTo(50, height);
    ctx.moveTo(width - 50, 0);
    ctx.lineTo(width - 50, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Knee crease highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.fillRect(0, 240, width, 50);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache[key] = texture;
    return texture;
  }

  // 7. Realistic Oiled Leather Boots Texture
  getBootTexture(width = 256, height = 256) {
    const key = 'char_leather_boots';
    if (this.cache[key]) return this.cache[key];

    const { canvas, ctx } = this.createCanvas(width, height);

    ctx.fillStyle = '#221914';
    ctx.fillRect(0, 0, width, height);

    // Cross laces
    ctx.strokeStyle = '#634c38';
    ctx.lineWidth = 3;
    const spacing = 28;
    for (let y = 30; y < height - 60; y += spacing) {
      // Brass eyelets
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(80, y, 4, 0, Math.PI * 2);
      ctx.arc(176, y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Cross lace
      ctx.beginPath();
      ctx.moveTo(80, y);
      ctx.lineTo(176, y + spacing * 0.7);
      ctx.moveTo(176, y);
      ctx.lineTo(80, y + spacing * 0.7);
      ctx.stroke();
    }

    // Heavy rubber tread sole
    ctx.fillStyle = '#0f0a07';
    ctx.fillRect(0, height - 35, width, 35);
    ctx.strokeStyle = '#38281d';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, height - 35, width, 35);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache[key] = texture;
    return texture;
  }

  // 8. Realistic Human Adventurer Skin Texture (Face & Hands)
  getSkinTexture(width = 256, height = 256) {
    const key = 'char_skin_toned';
    if (this.cache[key]) return this.cache[key];

    const { canvas, ctx } = this.createCanvas(width, height);

    // Warm natural skin tone
    ctx.fillStyle = '#d9b392';
    ctx.fillRect(0, 0, width, height);

    // Subtle cheek & forehead warmth
    const cheekGrad = ctx.createRadialGradient(128, 140, 20, 128, 140, 110);
    cheekGrad.addColorStop(0, 'rgba(215, 135, 115, 0.45)');
    cheekGrad.addColorStop(1, 'rgba(217, 179, 146, 0)');
    ctx.fillStyle = cheekGrad;
    ctx.fillRect(0, 0, width, height);

    // Eyebrows
    ctx.fillStyle = '#3a271a';
    [-1, 1].forEach((side) => {
      const ex = 128 + side * 44;
      ctx.beginPath();
      ctx.moveTo(ex - 24 * side, 90);
      ctx.quadraticCurveTo(ex, 82, ex + 24 * side, 86);
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#3a271a';
      ctx.stroke();

      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(ex, 106, 15, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Brown/Hazel Iris & Pupil
      ctx.fillStyle = '#4a2f1c';
      ctx.beginPath();
      ctx.arc(ex, 106, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0d0805';
      ctx.beginPath();
      ctx.arc(ex, 106, 4, 0, Math.PI * 2);
      ctx.fill();

      // Eye light glint
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex + 2, 104, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Subtle lip line
    ctx.fillStyle = '#ab6c5a';
    ctx.beginPath();
    ctx.ellipse(128, 180, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    this.cache[key] = texture;
    return texture;
  }

  // 9. Realistic Felt Fedora Hat Texture
  getFedoraTexture(width = 256, height = 256) {
    const key = 'char_felt_fedora';
    if (this.cache[key]) return this.cache[key];

    const { canvas, ctx } = this.createCanvas(width, height);

    // Dark brown brushed wool felt
    ctx.fillStyle = '#3e2e22';
    ctx.fillRect(0, 0, width, height);

    // Silk ribbon hatband
    ctx.fillStyle = '#1c130d';
    ctx.fillRect(0, 140, width, 45);

    // Gold ribbon buckle
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 5;
    ctx.strokeRect(110, 138, 36, 49);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache[key] = texture;
    return texture;
  }

  // 10. Realistic Crimson Wool Woven Scarf Texture
  getScarfTexture(width = 256, height = 256) {
    const key = 'char_crimson_scarf';
    if (this.cache[key]) return this.cache[key];

    const { canvas, ctx } = this.createCanvas(width, height);

    // Deep crimson woven fabric
    ctx.fillStyle = '#b81c2e';
    ctx.fillRect(0, 0, width, height);

    // Gold trim embroidery
    ctx.strokeStyle = '#e5b95c';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    // Herringbone weave pattern
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < height; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache[key] = texture;
    return texture;
  }

  // 11. Flame Radial Glow Sprite Texture for Braziers
  getFlameSpriteTexture() {
    const key = 'brazier_flame_sprite';
    if (this.cache[key]) return this.cache[key];

    const { canvas, ctx } = this.createCanvas(128, 128);

    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
    grad.addColorStop(0.0, '#ffffff'); // Intense white-hot core
    grad.addColorStop(0.2, '#ffe066'); // Bright yellow
    grad.addColorStop(0.5, '#ff6600'); // Orange fire
    grad.addColorStop(0.8, '#dd1100'); // Deep red edge
    grad.addColorStop(1.0, 'rgba(200, 20, 0, 0)'); // Transparent fade

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache[key] = texture;
    return texture;
  }
}

window.textureGen = new TextureGenerator();
