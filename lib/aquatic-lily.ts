import { SimplexNoise, defaultNoise } from './noise';

export interface AquaticPalette {
  id: string;
  name: string;
  petalColors: string[];
  petalAccent: string[];
  stamenColor: string;
  padColor: string;
  padRim: string;
  rippleColor: string;
  waterHex: string;
  waterBg: [number, number, number];
  accentHex: string;
}

export const AQUATIC_THEMES: AquaticPalette[] = [
  {
    id: 'celestial-lotus',
    name: 'Celestial Dawn Lotus',
    petalColors: [
      'rgba(255, 175, 195, 0.55)',
      'rgba(255, 140, 170, 0.65)',
      'rgba(255, 210, 225, 0.45)',
      'rgba(245, 110, 150, 0.60)',
    ],
    petalAccent: [
      'rgba(235, 65, 120, 0.70)',
      'rgba(255, 195, 215, 0.50)',
    ],
    stamenColor: 'rgba(255, 210, 50, 0.95)',
    padColor: 'rgba(68, 142, 105, 0.60)',
    padRim: 'rgba(42, 95, 70, 0.80)',
    rippleColor: 'rgba(120, 190, 170, 0.45)',
    waterHex: '#F2F7F5',
    waterBg: [0.949, 0.969, 0.961],
    accentHex: '#F06E9A',
  },
  {
    id: 'golden-nymphaea',
    name: 'Sunlit Amber Lily',
    petalColors: [
      'rgba(255, 215, 110, 0.55)',
      'rgba(255, 185, 70, 0.65)',
      'rgba(255, 235, 160, 0.45)',
      'rgba(245, 150, 40, 0.60)',
    ],
    petalAccent: [
      'rgba(230, 110, 20, 0.70)',
      'rgba(255, 230, 140, 0.50)',
    ],
    stamenColor: 'rgba(255, 160, 20, 0.95)',
    padColor: 'rgba(80, 145, 95, 0.60)',
    padRim: 'rgba(45, 95, 60, 0.80)',
    rippleColor: 'rgba(140, 195, 160, 0.45)',
    waterHex: '#F7F7F2',
    waterBg: [0.969, 0.969, 0.949],
    accentHex: '#F5B038',
  },
  {
    id: 'twilight-azure',
    name: 'Twilight Azure Lily',
    petalColors: [
      'rgba(165, 185, 255, 0.55)',
      'rgba(130, 155, 245, 0.65)',
      'rgba(200, 215, 255, 0.45)',
      'rgba(100, 130, 235, 0.60)',
    ],
    petalAccent: [
      'rgba(70, 95, 215, 0.70)',
      'rgba(185, 205, 255, 0.50)',
    ],
    stamenColor: 'rgba(255, 225, 80, 0.95)',
    padColor: 'rgba(55, 115, 120, 0.60)',
    padRim: 'rgba(30, 75, 80, 0.80)',
    rippleColor: 'rgba(125, 175, 215, 0.45)',
    waterHex: '#F2F5F8',
    waterBg: [0.949, 0.961, 0.973],
    accentHex: '#789AF5',
  },
  {
    id: 'pure-white-jade',
    name: 'Opaline White Jade',
    petalColors: [
      'rgba(255, 255, 255, 0.75)',
      'rgba(235, 248, 245, 0.80)',
      'rgba(220, 242, 238, 0.65)',
      'rgba(255, 238, 242, 0.70)',
    ],
    petalAccent: [
      'rgba(180, 220, 210, 0.65)',
      'rgba(255, 215, 225, 0.55)',
    ],
    stamenColor: 'rgba(255, 205, 45, 0.95)',
    padColor: 'rgba(52, 128, 98, 0.65)',
    padRim: 'rgba(32, 85, 62, 0.85)',
    rippleColor: 'rgba(110, 185, 160, 0.45)',
    waterHex: '#F3F6F4',
    waterBg: [0.953, 0.965, 0.957],
    accentHex: '#4EBA97',
  },
];

export interface FloatingLilyPad {
  x: number;
  y: number;
  radius: number;
  notchAngle: number;
  bobPhase: number;
  driftX: number;
  driftY: number;
  seed: number;
}

export interface WaterLilyBlossom {
  x: number;
  y: number;
  radius: number;
  growth: number;
  targetGrowth: number;
  growthSpeed: number;
  tierCount: number;
  seed: number;
  paletteIndex: number;
  bobPhase: number;
}

export interface WaterRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
  color: string;
}

export function generateFloatingLilyPads(count = 7): FloatingLilyPad[] {
  const pads: FloatingLilyPad[] = [];
  const coords = [
    { x: 0.18, y: 0.62, r: 72, a: 0.4 },
    { x: 0.35, y: 0.40, r: 94, a: -0.8 },
    { x: 0.52, y: 0.74, r: 85, a: 1.2 },
    { x: 0.70, y: 0.35, r: 68, a: -1.5 },
    { x: 0.84, y: 0.65, r: 88, a: 0.9 },
    { x: 0.28, y: 0.78, r: 54, a: -0.2 },
    { x: 0.62, y: 0.28, r: 60, a: 2.1 },
  ];

  for (let i = 0; i < Math.min(count, coords.length); i++) {
    const c = coords[i];
    pads.push({
      x: c.x,
      y: c.y,
      radius: c.r,
      notchAngle: c.a,
      bobPhase: i * 1.4,
      driftX: 0,
      driftY: 0,
      seed: 200 + i * 43,
    });
  }
  return pads;
}

export function generateWaterLilies(count = 4): WaterLilyBlossom[] {
  const lilies: WaterLilyBlossom[] = [];
  const coords = [
    { x: 0.36, y: 0.42, r: 42, speed: 0.026 },
    { x: 0.72, y: 0.37, r: 36, speed: 0.022 },
    { x: 0.53, y: 0.72, r: 44, speed: 0.028 },
    { x: 0.20, y: 0.64, r: 34, speed: 0.024 },
  ];

  for (let i = 0; i < Math.min(count, coords.length); i++) {
    const c = coords[i];
    lilies.push({
      x: c.x,
      y: c.y,
      radius: c.r,
      growth: 0,
      targetGrowth: 0,
      growthSpeed: c.speed,
      tierCount: 3,
      seed: 500 + i * 77,
      paletteIndex: i,
      bobPhase: i * 2.1,
    });
  }
  return lilies;
}

/**
 * Draw translucent floating lotus / lily pads
 */
export function drawFloatingLilyPad(
  ctx: CanvasRenderingContext2D,
  pad: FloatingLilyPad,
  width: number,
  height: number,
  time: number,
  palette: AquaticPalette,
  noise: SimplexNoise = defaultNoise
) {
  // Gentle water surface buoyancy bobbing
  const bobY = Math.sin(time * 0.0018 + pad.bobPhase) * 3.5;
  const bobX = Math.cos(time * 0.0012 + pad.bobPhase) * 2.5;

  const cx = pad.x * width + bobX;
  const cy = pad.y * height + bobY;
  const r = pad.radius;

  ctx.save();
  ctx.translate(cx, cy);

  // Pad shadow in translucent water depth
  ctx.fillStyle = 'rgba(20, 60, 45, 0.07)';
  ctx.beginPath();
  ctx.ellipse(3, 8, r * 1.02, r * 0.92, 0, 0, Math.PI * 2);
  ctx.fill();

  // Lotus pad leaf with notch (slit cut toward center)
  const notchWidth = 0.38; // radians
  const startAngle = pad.notchAngle + notchWidth;
  const endAngle = pad.notchAngle + Math.PI * 2 - notchWidth;

  ctx.beginPath();
  ctx.moveTo(0, 0);

  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const a = startAngle + (i / steps) * (endAngle - startAngle);
    // Subtle organic edge undulation
    const edgeNoise = noise.noise2D(Math.cos(a) * 2, Math.sin(a) * 2 + pad.seed);
    const radiusAtA = r * (0.94 + edgeNoise * 0.08);
    const px = Math.cos(a) * radiusAtA;
    const py = Math.sin(a) * radiusAtA;
    ctx.lineTo(px, py);
  }
  ctx.closePath();

  // Water lily pad radial watercolor pigment
  const padGrad = ctx.createRadialGradient(0, 0, r * 0.15, 0, 0, r);
  padGrad.addColorStop(0, palette.padColor);
  padGrad.addColorStop(0.85, palette.padColor);
  padGrad.addColorStop(1, palette.padRim);

  ctx.fillStyle = padGrad;
  ctx.fill();

  ctx.strokeStyle = palette.padRim;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Fine radial veining (stippled watercolor leaf veins)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 0.8;
  const veinCount = 14;
  for (let v = 0; v < veinCount; v++) {
    const va = startAngle + (v / veinCount) * (endAngle - startAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const vLen = r * 0.85;
    const midX = Math.cos(va) * (vLen * 0.5) + noise.noise2D(v, pad.seed) * 2;
    const midY = Math.sin(va) * (vLen * 0.5) + noise.noise2D(v + 10, pad.seed) * 2;
    const endX = Math.cos(va) * vLen;
    const endY = Math.sin(va) * vLen;
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.stroke();
  }

  // Morning dewdrop on lotus pad
  const dewX = r * 0.32;
  const dewY = -r * 0.25;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.beginPath();
  ctx.arc(dewX, dewY, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  ctx.arc(dewX - 0.7, dewY - 0.7, 0.9, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw blooming / unblooming floating water lily (Nymphaea)
 */
export function drawWaterLilyBlossom(
  ctx: CanvasRenderingContext2D,
  lily: WaterLilyBlossom,
  width: number,
  height: number,
  time: number,
  palette: AquaticPalette,
  noise: SimplexNoise = defaultNoise
) {
  const bobY = Math.sin(time * 0.0018 + lily.bobPhase) * 3.5;
  const bobX = Math.cos(time * 0.0012 + lily.bobPhase) * 2.5;

  const cx = lily.x * width + bobX;
  const cy = lily.y * height + bobY;

  ctx.save();
  ctx.translate(cx, cy);

  const g = lily.growth; // 0 = closed floating bud, 1 = full open star lotus
  const easedG = Math.min(1.0, Math.pow(g, 1.25));

  // 1. Water shadow beneath flower
  const shadowRadius = lily.radius * (0.4 + easedG * 0.6);
  ctx.fillStyle = 'rgba(25, 55, 45, 0.12)';
  ctx.beginPath();
  ctx.ellipse(0, 4, shadowRadius, shadowRadius * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Petals (arranged in 3 concentric tiers)
  // When dormant (g = 0), petals stand upright in a tapered closed water bud
  // When blooming (g = 1), petals unfold outwards like a star
  const tiers = [
    { count: 12, maxRadius: lily.radius * 1.15, widthFactor: 0.32, colorIdx: 0 },
    { count: 10, maxRadius: lily.radius * 0.88, widthFactor: 0.28, colorIdx: 1 },
    { count: 8,  maxRadius: lily.radius * 0.62, widthFactor: 0.24, colorIdx: 2 },
  ];

  tiers.forEach((tier, tIdx) => {
    const tierOpenFactor = Math.max(0.12, Math.min(1.0, easedG * (1.2 - tIdx * 0.15)));
    const tierRadius = tier.maxRadius * (0.35 + tierOpenFactor * 0.65);
    const petalColor = palette.petalColors[(tIdx + lily.paletteIndex) % palette.petalColors.length];

    for (let p = 0; p < tier.count; p++) {
      const angle = (p / tier.count) * Math.PI * 2 + (tIdx * 0.3);
      const pLen = tierRadius * (0.92 + noise.noise2D(p + tIdx * 10, lily.seed) * 0.16);
      const pWidth = pLen * tier.widthFactor * (0.6 + tierOpenFactor * 0.4);

      ctx.save();
      ctx.rotate(angle);

      // Draw pointed water-lily petal (almond star shape)
      ctx.fillStyle = petalColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(pWidth, pLen * 0.45, 0, pLen);
      ctx.quadraticCurveTo(-pWidth, pLen * 0.45, 0, 0);
      ctx.closePath();
      ctx.fill();

      // Delicate darker petal rim/accent
      ctx.strokeStyle = palette.petalAccent[tIdx % palette.petalAccent.length];
      ctx.lineWidth = 0.6;
      ctx.stroke();

      ctx.restore();
    }
  });

  // 3. Golden Core / Stamens (Visible when lotus opens)
  if (easedG > 0.1) {
    const coreR = lily.radius * 0.24 * easedG;

    // Glowing core gradient
    const coreGrad = ctx.createRadialGradient(0, 0, coreR * 0.1, 0, 0, coreR);
    coreGrad.addColorStop(0, palette.stamenColor);
    coreGrad.addColorStop(0.8, 'rgba(255, 175, 20, 0.85)');
    coreGrad.addColorStop(1, 'rgba(255, 220, 50, 0)');

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, coreR, 0, Math.PI * 2);
    ctx.fill();

    // Stamen pollen filament ring
    const stamenCount = Math.floor(16 * easedG);
    ctx.fillStyle = 'rgba(255, 245, 180, 0.95)';
    for (let s = 0; s < stamenCount; s++) {
      const sa = (s / stamenCount) * Math.PI * 2;
      const sDist = coreR * (0.4 + (s % 3) * 0.25);
      const sx = Math.cos(sa) * sDist;
      const sy = Math.sin(sa) * sDist;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Update expanding concentric watercolor ripples
 */
export function updateAndDrawRipples(
  ctx: CanvasRenderingContext2D,
  ripples: WaterRipple[],
  width: number,
  height: number,
  time: number,
  palette: AquaticPalette
) {
  ctx.save();

  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.radius += r.speed;
    r.alpha = Math.max(0, 1.0 - (r.radius / r.maxRadius));

    if (r.alpha <= 0.01 || r.radius >= r.maxRadius) {
      ripples.splice(i, 1);
      continue;
    }

    // Outer ripple ring
    ctx.strokeStyle = palette.rippleColor.replace(/[\d.]+\)$/, `${(r.alpha * 0.55).toFixed(3)})`);
    ctx.lineWidth = Math.max(0.6, 2.2 * r.alpha);
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Secondary concentric inner refraction wave
    if (r.radius > 12) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${(r.alpha * 0.4).toFixed(3)})`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius * 0.75, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();
}
