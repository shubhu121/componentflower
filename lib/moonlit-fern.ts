import { SimplexNoise, defaultNoise } from './noise';

export interface MoonlitPalette {
  id: string;
  name: string;
  fernStem: string;
  pinnaeColor: string[];
  sporePrimary: string[];
  sporeGlow: string;
  shroomCap: string[];
  paperHex: string;
  paperColor: [number, number, number];
  accentHex: string;
}

export const MOONLIT_THEMES: MoonlitPalette[] = [
  {
    id: 'aurora-cyan',
    name: 'Aurora Bioluminescence',
    fernStem: 'rgba(20, 60, 52, 0.92)',
    pinnaeColor: [
      'rgba(45, 195, 160, 0.55)',
      'rgba(30, 160, 140, 0.65)',
      'rgba(80, 230, 190, 0.40)',
    ],
    sporePrimary: [
      'rgba(100, 255, 218, 0.95)',
      'rgba(80, 230, 255, 0.90)',
      'rgba(160, 255, 230, 0.85)',
    ],
    sporeGlow: 'rgba(40, 220, 180, 0.35)',
    shroomCap: ['rgba(30, 180, 160, 0.7)', 'rgba(80, 240, 210, 0.85)'],
    paperHex: '#080D12',
    paperColor: [0.031, 0.051, 0.071],
    accentHex: '#4EECD0',
  },
  {
    id: 'amethyst-night',
    name: 'Nocturnal Amethyst',
    fernStem: 'rgba(45, 25, 65, 0.92)',
    pinnaeColor: [
      'rgba(175, 105, 235, 0.55)',
      'rgba(140, 75, 205, 0.65)',
      'rgba(210, 150, 255, 0.45)',
    ],
    sporePrimary: [
      'rgba(220, 160, 255, 0.95)',
      'rgba(255, 180, 240, 0.90)',
      'rgba(180, 130, 255, 0.85)',
    ],
    sporeGlow: 'rgba(165, 90, 240, 0.35)',
    shroomCap: ['rgba(150, 75, 220, 0.7)', 'rgba(230, 160, 255, 0.85)'],
    paperHex: '#0D0914',
    paperColor: [0.051, 0.035, 0.078],
    accentHex: '#C58BF2',
  },
  {
    id: 'golden-firefly',
    name: 'Moonlit Golden Ember',
    fernStem: 'rgba(50, 42, 22, 0.92)',
    pinnaeColor: [
      'rgba(235, 175, 60, 0.55)',
      'rgba(205, 140, 35, 0.65)',
      'rgba(255, 215, 110, 0.45)',
    ],
    sporePrimary: [
      'rgba(255, 215, 90, 0.95)',
      'rgba(255, 185, 60, 0.90)',
      'rgba(255, 240, 150, 0.85)',
    ],
    sporeGlow: 'rgba(240, 170, 40, 0.35)',
    shroomCap: ['rgba(215, 145, 45, 0.7)', 'rgba(255, 215, 100, 0.85)'],
    paperHex: '#100D08',
    paperColor: [0.063, 0.051, 0.031],
    accentHex: '#F5BE4E',
  },
  {
    id: 'lunar-sapphire',
    name: 'Celestial Sapphire',
    fernStem: 'rgba(22, 38, 68, 0.92)',
    pinnaeColor: [
      'rgba(80, 145, 235, 0.55)',
      'rgba(55, 115, 205, 0.65)',
      'rgba(140, 195, 255, 0.45)',
    ],
    sporePrimary: [
      'rgba(140, 200, 255, 0.95)',
      'rgba(100, 175, 255, 0.90)',
      'rgba(200, 230, 255, 0.85)',
    ],
    sporeGlow: 'rgba(65, 140, 240, 0.35)',
    shroomCap: ['rgba(70, 130, 220, 0.7)', 'rgba(160, 210, 255, 0.85)'],
    paperHex: '#090D15',
    paperColor: [0.035, 0.051, 0.082],
    accentHex: '#6EB2F7',
  },
];

export interface FiddleheadFern {
  x: number;
  maxHeight: number;
  growth: number;
  targetGrowth: number;
  growthSpeed: number;
  curveDir: number;
  seed: number;
  pinnaePairs: number;
  paletteIndex: number;
}

export interface MoonlitSpore {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  pulsePhase: number;
  color: string;
  glow: string;
}

export function generateMoonlitFerns(count = 9): FiddleheadFern[] {
  const ferns: FiddleheadFern[] = [];
  const spacing = 1.0 / (count + 1);

  for (let i = 0; i < count; i++) {
    const normX = spacing * (i + 1) + (Math.sin(i * 3.7) * 0.03);
    const height = 0.55 + ((i % 3) * 0.12) + (Math.cos(i * 2.1) * 0.05);
    const curveDir = i % 2 === 0 ? 1 : -1;
    const seed = 1000 + i * 83;

    ferns.push({
      x: normX,
      maxHeight: Math.min(0.88, Math.max(0.45, height)),
      growth: 0,
      targetGrowth: 0,
      growthSpeed: 0.024 + (i % 4) * 0.004,
      curveDir,
      seed,
      pinnaePairs: 8 + (i % 5) * 2,
      paletteIndex: i % 3,
    });
  }

  // Sort back to front
  ferns.sort((a, b) => b.maxHeight - a.maxHeight);
  return ferns;
}

export function generateMoonlitSpores(count = 48, palette: MoonlitPalette): MoonlitSpore[] {
  const spores: MoonlitSpore[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.random();
    const y = 0.2 + Math.random() * 0.75;
    const colorIdx = i % palette.sporePrimary.length;
    spores.push({
      x,
      y,
      baseX: x,
      baseY: y,
      vx: 0,
      vy: 0,
      size: 1.5 + Math.random() * 2.8,
      alpha: 0.4 + Math.random() * 0.5,
      pulsePhase: Math.random() * Math.PI * 2,
      color: palette.sporePrimary[colorIdx],
      glow: palette.sporeGlow,
    });
  }
  return spores;
}

/**
 * Draw circinate vernation (fiddlehead uncoiling)
 * At growth=0: coiled spiral at lower stem
 * At growth=1: full upright arched frond with feather-like pinnae
 */
export function drawMoonlitFernFrond(
  ctx: CanvasRenderingContext2D,
  fern: FiddleheadFern,
  width: number,
  height: number,
  windX: number,
  time: number,
  palette: MoonlitPalette,
  noise: SimplexNoise = defaultNoise
) {
  const startX = fern.x * width;
  const startY = height * 0.98;

  // Graceful uncurling growth factor
  const g = fern.growth;
  if (g <= 0.005) {
    // Dormant tight curled spiral near ground
    drawTightFiddleheadBud(ctx, startX, startY - height * 0.08, fern.curveDir, palette);
    return;
  }

  // Eased growth for height
  const easedG = Math.min(1.0, Math.pow(g, 1.2));
  const currentTotalHeight = height * fern.maxHeight * (0.2 + easedG * 0.8);

  ctx.save();

  // Stem points along rachis
  const steps = 36;
  const points: { x: number; y: number; angle: number }[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const py = startY - t * currentTotalHeight;

    // Organic arch curve
    const archAmount = fern.curveDir * Math.sin(t * Math.PI * 0.8) * (35 + easedG * 45);
    const windEffect = windX * (t * t * 40) + Math.sin(time * 0.002 + fern.seed + t * 3) * 6;
    const px = startX + archAmount + windEffect;

    const angle = i > 0
      ? Math.atan2(py - points[i - 1].y, px - points[i - 1].x)
      : -Math.PI / 2;

    points.push({ x: px, y: py, angle });
  }

  // 1. Draw central rachis (stem) with stippled watercolor bristle
  ctx.strokeStyle = palette.fernStem;
  ctx.lineWidth = Math.max(1.8, 3.5 * (1 - easedG * 0.4));
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();

  // 2. Unfurling Spiral Tip (Crook / Fiddlehead)
  // When not fully grown, the tip remains curled in a logarithmic spiral
  const tip = points[points.length - 1];
  const curlTension = Math.max(0, 1.0 - easedG);
  if (curlTension > 0.05) {
    drawLogarithmicSpiralTip(ctx, tip.x, tip.y, tip.angle, fern.curveDir, curlTension, palette);
  }

  // 3. Draw Lateral Pinnae (Feather-like leaflets)
  // Pinnae unfold progressively from base to tip as frond unfurls
  const pinnaeColor = palette.pinnaeColor[fern.paletteIndex % palette.pinnaeColor.length];
  const numPairs = fern.pinnaePairs;

  for (let p = 1; p <= numPairs; p++) {
    const frac = p / (numPairs + 2);
    // Pinna only emerges once stem growth has reached past this point
    const pinnaBloomFactor = Math.max(0, Math.min(1.0, (easedG - frac * 0.7) / 0.3));
    if (pinnaBloomFactor <= 0.02) continue;

    const idx = Math.min(points.length - 1, Math.floor(frac * points.length));
    const pt = points[idx];

    // Lateral angles relative to rachis
    const rachisAngle = pt.angle;
    const baseLen = (Math.sin(frac * Math.PI) * 32 + 10) * pinnaBloomFactor;

    // Left and Right pinna
    [-1, 1].forEach((side) => {
      const pinnaAngle = rachisAngle + side * (Math.PI * 0.42) + (noise.noise2D(p * 2, fern.seed) * 0.15);
      const endX = pt.x + Math.cos(pinnaAngle) * baseLen;
      const endY = pt.y + Math.sin(pinnaAngle) * baseLen;

      // Pinna stalk
      ctx.strokeStyle = palette.fernStem;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Watercolor leaflet wash
      ctx.fillStyle = pinnaeColor;
      ctx.beginPath();
      const midX = (pt.x + endX) * 0.5 + Math.cos(pinnaAngle + Math.PI / 2) * (3.5 * pinnaBloomFactor);
      const midY = (pt.y + endY) * 0.5 + Math.sin(pinnaAngle + Math.PI / 2) * (3.5 * pinnaBloomFactor);
      ctx.moveTo(pt.x, pt.y);
      ctx.quadraticCurveTo(midX, midY, endX, endY);
      ctx.quadraticCurveTo((pt.x + endX) * 0.5, (pt.y + endY) * 0.5, pt.x, pt.y);
      ctx.fill();

      // Bioluminescent tip glow dot on each pinna tip
      if (pinnaBloomFactor > 0.6) {
        ctx.fillStyle = palette.sporePrimary[0];
        ctx.beginPath();
        ctx.arc(endX, endY, 1.2 * pinnaBloomFactor, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  ctx.restore();
}

function drawTightFiddleheadBud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  curveDir: number,
  palette: MoonlitPalette
) {
  ctx.save();
  ctx.translate(x, y);

  // Small stipe
  ctx.strokeStyle = palette.fernStem;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, 16);
  ctx.quadraticCurveTo(curveDir * 4, 8, 0, 0);
  ctx.stroke();

  // Spiral coil
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 3.5; a += 0.2) {
    const r = 9 * Math.exp(-0.16 * a);
    const px = curveDir * Math.cos(a) * r;
    const py = -Math.sin(a) * r;
    if (a === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Gentle sleeping glow core
  ctx.fillStyle = palette.sporeGlow;
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawLogarithmicSpiralTip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  curveDir: number,
  tension: number,
  palette: MoonlitPalette
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2);

  ctx.strokeStyle = palette.fernStem;
  ctx.lineWidth = 1.8 * tension;
  ctx.beginPath();

  const maxAngle = Math.PI * (2.0 + tension * 2.5);
  for (let a = 0; a < maxAngle; a += 0.2) {
    const r = (12 * tension) * Math.exp(-0.18 * a);
    const px = curveDir * Math.cos(a) * r;
    const py = -Math.sin(a) * r;
    if (a === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Luminous spore droplet in coiled spiral
  ctx.fillStyle = palette.sporePrimary[0];
  ctx.beginPath();
  ctx.arc(0, 0, 2.0 * tension, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw luminous bioluminescent spores drifting with gentle physics
 */
export function updateAndDrawSpores(
  ctx: CanvasRenderingContext2D,
  spores: MoonlitSpore[],
  width: number,
  height: number,
  time: number,
  windX: number,
  mousePos: { x: number; y: number; active: boolean },
  noise: SimplexNoise = defaultNoise
) {
  ctx.save();

  for (let i = 0; i < spores.length; i++) {
    const s = spores[i];

    // Curl noise wind vector field
    const nx = noise.noise2D(s.baseX * 2.5, time * 0.0006 + i * 0.1);
    const ny = noise.noise2D(s.baseY * 2.5, time * 0.0006 + i * 0.1 + 100);

    // Drifting coordinates
    s.x = s.baseX * width + nx * 38 + windX * 50;
    s.y = s.baseY * height + ny * 24 - Math.sin(time * 0.001 + i) * 12;

    // Repulsion from cursor when active
    if (mousePos.active) {
      const dx = s.x - mousePos.x;
      const dy = s.y - mousePos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 90 && dist > 1) {
        const force = (1 - dist / 90) * 28;
        s.x += (dx / dist) * force;
        s.y += (dy / dist) * force;
      }
    }

    // Breathing pulsation
    const pulse = Math.sin(time * 0.003 + s.pulsePhase) * 0.3 + 0.7;
    const currentRadius = s.size * pulse;

    // Radial glow halo
    const glowGrad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, currentRadius * 3.5);
    glowGrad.addColorStop(0, s.color);
    glowGrad.addColorStop(0.35, s.glow);
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(s.x, s.y, currentRadius * 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Intense central starlight core
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(s.x, s.y, currentRadius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
