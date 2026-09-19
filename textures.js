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

      case 'ocean':
        // Great curling ocean wave
        ctx.beginPath();
        ctx.moveTo(-50, 30);
        ctx.bezierCurveTo(-30, 30, -15, -10, 10, -40);
        ctx.bezierCurveTo(30, -60, 45, -20, 20, -10);
        ctx.bezierCurveTo(5, -5, 0, -25, 15, -30);
        ctx.stroke();
        // Sub-waves
        ctx.beginPath();
        ctx.arc(-15, 15, 18, Math.PI, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(20, 20, 20, Math.PI, 0);
        ctx.stroke();
        break;
    }

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    this.cache[key] = texture;
    return texture;
  }
}

window.textureGen = new TextureGenerator();
