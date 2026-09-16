import { SimplexNoise, defaultNoise } from './noise';
import { createFlowerNuancePalette } from './p5-palette';

export interface FlowerPalette {
  name: string;
  petalPrimary: string[]; // hex or rgba colors for petals
  petalAccent: string[];
  calyxColor: string;
  stemColor: string;
  leafColor: string;
}

export const PALETTES: Record<string, FlowerPalette> = {
  coralPoppy: {
    name: 'Coral Poppy',
    petalPrimary: [
      'rgba(244, 102, 85, 0.35)',
      'rgba(242, 80, 66, 0.45)',
      'rgba(255, 140, 115, 0.30)',
      'rgba(224, 60, 60, 0.40)',
    ],
    petalAccent: [
      'rgba(248, 160, 53, 0.50)',
      'rgba(215, 38, 56, 0.60)',
      'rgba(255, 185, 120, 0.40)',
    ],
    calyxColor: 'rgba(215, 50, 40, 0.85)',
    stemColor: 'rgba(46, 91, 55, 0.85)',
    leafColor: 'rgba(98, 153, 110, 0.45)',
  },
  goldenMarigold: {
    name: 'Golden Marigold',
    petalPrimary: [
      'rgba(248, 163, 53, 0.35)',
      'rgba(244, 191, 58, 0.45)',
      'rgba(255, 208, 0, 0.30)',
      'rgba(233, 108, 51, 0.40)',
    ],
    petalAccent: [
      'rgba(235, 94, 40, 0.55)',
      'rgba(255, 220, 100, 0.50)',
      'rgba(217, 72, 35, 0.60)',
    ],
    calyxColor: 'rgba(220, 90, 30, 0.85)',
    stemColor: 'rgba(50, 95, 60, 0.85)',
    leafColor: 'rgba(110, 165, 120, 0.45)',
  },
  wildDahlia: {
    name: 'Wild Dahlia',
    petalPrimary: [
      'rgba(250, 110, 90, 0.35)',
      'rgba(245, 145, 60, 0.40)',
      'rgba(255, 175, 140, 0.30)',
      'rgba(235, 75, 85, 0.45)',
    ],
    petalAccent: [
      'rgba(255, 120, 80, 0.60)',
      'rgba(240, 170, 50, 0.50)',
      'rgba(200, 40, 50, 0.65)',
    ],
    calyxColor: 'rgba(195, 45, 45, 0.85)',
    stemColor: 'rgba(42, 85, 52, 0.85)',
    leafColor: 'rgba(92, 148, 105, 0.45)',
  },
  meadowMix: {
    name: 'Botanical Meadow',
    petalPrimary: [
      'rgba(242, 80, 66, 0.38)',
      'rgba(248, 163, 53, 0.38)',
      'rgba(244, 191, 58, 0.40)',
      'rgba(255, 120, 100, 0.32)',
    ],
    petalAccent: [
      'rgba(215, 38, 56, 0.60)',
      'rgba(235, 94, 40, 0.55)',
      'rgba(255, 205, 70, 0.50)',
    ],
    calyxColor: 'rgba(210, 60, 45, 0.85)',
    stemColor: 'rgba(44, 88, 54, 0.85)',
    leafColor: 'rgba(95, 150, 108, 0.45)',
  },
};

export interface StemPlant {
  id: string;
  baseX: number; // percentage (0..1) of canvas width
  baseY: number; // usually 1.0 (bottom)
  targetHeight: number; // fraction of canvas height (0.45 .. 0.88)
  curveAmplitude: number; // stem natural waviness
  curveFreq: number;
  bloomSize: number; // final flower radius in px
  bloomType: 'chrysanthemum' | 'poppy' | 'dahlia' | 'fluffy' | 'smallStar';
  paletteKey: string;
  customPalette?: FlowerPalette;
  growth: number; // 0 (seed) to 1 (full bloom)
  targetGrowth: number; // 0 or 1 based on hover
  growthSpeed: number; // variation per flower
  petalLayers: number; // 2 to 5 concentric rings
  petalsPerLayer: number; // 6 to 22 petals
  seed: number;
  leafOffsets: { t: number; side: 1 | -1; length: number; angle: number }[];
  currentTipX: number;
  currentTipY: number;
  windPhase: number;
}

export function createStemPlant(
  baseX: number,
  targetHeight: number,
  paletteKey = 'coralPoppy',
  type?: 'chrysanthemum' | 'poppy' | 'dahlia' | 'fluffy' | 'smallStar',
  customSeed?: number,
  customPalette?: FlowerPalette
): StemPlant {
  const seed = customSeed ?? Math.random() * 10000;
  const types: ('chrysanthemum' | 'poppy' | 'dahlia' | 'fluffy' | 'smallStar')[] = [
    'chrysanthemum',
    'poppy',
    'dahlia',
    'fluffy',
    'smallStar',
  ];
  const chosenType = type ?? types[Math.floor(Math.random() * types.length)];

  // Leaf positions along stem
  const numLeaves = 2 + Math.floor(Math.random() * 4);
  const leafOffsets: StemPlant['leafOffsets'] = [];
  for (let i = 0; i < numLeaves; i++) {
    const t = 0.2 + (i / numLeaves) * 0.5 + (Math.random() * 0.1 - 0.05);
    leafOffsets.push({
      t,
      side: i % 2 === 0 ? 1 : -1,
      length: 12 + Math.random() * 16,
      angle: (Math.random() * 0.3 + 0.35) * Math.PI,
    });
  }

  let petalLayers = 3;
  let petalsPerLayer = 10;
  let bloomRadius = 38;

  if (chosenType === 'chrysanthemum' || chosenType === 'fluffy') {
    petalLayers = 4 + Math.floor(Math.random() * 2);
    petalsPerLayer = 14 + Math.floor(Math.random() * 8);
    bloomRadius = 42 + Math.random() * 14;
  } else if (chosenType === 'dahlia') {
    petalLayers = 4;
    petalsPerLayer = 12 + Math.floor(Math.random() * 6);
    bloomRadius = 38 + Math.random() * 12;
  } else if (chosenType === 'smallStar') {
    petalLayers = 2;
    petalsPerLayer = 6 + Math.floor(Math.random() * 2);
    bloomRadius = 22 + Math.random() * 8;
  } else {
    // poppy
    petalLayers = 2 + Math.floor(Math.random() * 2);
    petalsPerLayer = 7 + Math.floor(Math.random() * 4);
    bloomRadius = 34 + Math.random() * 10;
  }

  return {
    id: `plant-${Math.random().toString(36).substr(2, 9)}`,
    baseX,
    baseY: 1.0,
    targetHeight,
    curveAmplitude: (Math.random() - 0.5) * 45,
    curveFreq: 1.5 + Math.random() * 1.5,
    bloomSize: bloomRadius,
    bloomType: chosenType,
    paletteKey,
    customPalette,
    growth: 0,
    targetGrowth: 0,
    growthSpeed: 0.024 + Math.random() * 0.015,
    petalLayers,
    petalsPerLayer,
    seed,
    leafOffsets,
    currentTipX: 0,
    currentTipY: 0,
    windPhase: Math.random() * Math.PI * 2,
  };
}

// Generate a natural composition of stems like the reference photo
export function generateBotanicalBouquet(
  count = 14,
  paletteKey = 'meadowMix',
  preset?: 'dense' | 'minimal' | 'trio' | 'meadow' | 'panoramic',
  paletteOverride?: FlowerPalette,
  paletteMix?: FlowerPalette[]
): StemPlant[] {
  const plants: StemPlant[] = [];

  const resolvePalette = (seed: number, x: number, defaultKey: string, stalkIndex = 0) => {
    if (paletteMix && paletteMix.length > 0) {
      // Pick a distinct color family from the mix so adjacent stems display vibrant contrasting hues
      const mixIdx = Math.abs((stalkIndex * 3 + Math.floor(seed % 5))) % paletteMix.length;
      return createFlowerNuancePalette(paletteMix[mixIdx], seed, x);
    }
    if (paletteOverride) {
      return createFlowerNuancePalette(paletteOverride, seed, x);
    }
    return undefined;
  };

  if (preset === 'minimal') {
    // Single or double elegant focal flowers
    plants.push(createStemPlant(0.5, 0.72, paletteKey, 'dahlia', 101, resolvePalette(101, 0.5, paletteKey, 0)));
    plants.push(createStemPlant(0.42, 0.58, paletteKey, 'poppy', 102, resolvePalette(102, 0.42, paletteKey, 1)));
    plants.push(createStemPlant(0.62, 0.52, paletteKey, 'smallStar', 103, resolvePalette(103, 0.62, paletteKey, 2)));
    return plants;
  }

  if (preset === 'trio') {
    plants.push(createStemPlant(0.35, 0.76, paletteKey, 'fluffy', 201, resolvePalette(201, 0.35, paletteKey, 0)));
    plants.push(createStemPlant(0.52, 0.84, paletteKey, 'chrysanthemum', 202, resolvePalette(202, 0.52, paletteKey, 1)));
    plants.push(createStemPlant(0.68, 0.65, paletteKey, 'poppy', 203, resolvePalette(203, 0.68, paletteKey, 2)));
    return plants;
  }

  if (preset === 'panoramic') {
    let globalStalkIdx = 0;
    // Specific botanical composition matching the reference image layout:
    // 1. Left dense floral sheaf / bouquet (fanning outwards)
    const sheafLeft = [
      { x: 0.12, h: 0.82, type: 'fluffy' as const, pal: 'coralPoppy', seed: 301 },
      { x: 0.14, h: 0.74, type: 'chrysanthemum' as const, pal: 'goldenMarigold', seed: 302 },
      { x: 0.15, h: 0.88, type: 'dahlia' as const, pal: 'coralPoppy', seed: 303 },
      { x: 0.16, h: 0.68, type: 'poppy' as const, pal: 'wildDahlia', seed: 304 },
      { x: 0.18, h: 0.85, type: 'fluffy' as const, pal: 'goldenMarigold', seed: 305 },
      { x: 0.20, h: 0.62, type: 'smallStar' as const, pal: 'coralPoppy', seed: 306 },
      { x: 0.08, h: 0.72, type: 'poppy' as const, pal: 'coralPoppy', seed: 307 },
    ];
    sheafLeft.forEach((s) => {
      const pal = resolvePalette(s.seed, s.x, s.pal, globalStalkIdx++);
      const p = createStemPlant(s.x, s.h, s.pal, s.type, s.seed, pal);
      p.curveAmplitude = (s.x - 0.15) * 60;
      plants.push(p);
    });

    // 2. Second cluster (tied lower stem bouquet at ~0.28)
    const sheafMidLeft = [
      { x: 0.27, h: 0.70, type: 'chrysanthemum' as const, pal: 'goldenMarigold', seed: 310 },
      { x: 0.29, h: 0.86, type: 'fluffy' as const, pal: 'coralPoppy', seed: 311 },
      { x: 0.31, h: 0.58, type: 'smallStar' as const, pal: 'goldenMarigold', seed: 312 },
      { x: 0.33, h: 0.78, type: 'dahlia' as const, pal: 'coralPoppy', seed: 313 },
      { x: 0.35, h: 0.48, type: 'smallStar' as const, pal: 'wildDahlia', seed: 314 },
    ];
    sheafMidLeft.forEach((s) => {
      const pal = resolvePalette(s.seed, s.x, s.pal, globalStalkIdx++);
      const p = createStemPlant(s.x, s.h, s.pal, s.type, s.seed, pal);
      p.curveAmplitude = (s.x - 0.30) * 45;
      plants.push(p);
    });

    // 3. Central slender stalks
    const centerStalks = [
      { x: 0.41, h: 0.68, type: 'poppy' as const, pal: 'coralPoppy', seed: 320 },
      { x: 0.44, h: 0.62, type: 'chrysanthemum' as const, pal: 'goldenMarigold', seed: 321 },
      { x: 0.49, h: 0.88, type: 'fluffy' as const, pal: 'wildDahlia', seed: 322 },
      { x: 0.52, h: 0.72, type: 'smallStar' as const, pal: 'coralPoppy', seed: 323 },
    ];
    centerStalks.forEach((s) => {
      const pal = resolvePalette(s.seed, s.x, s.pal, globalStalkIdx++);
      plants.push(createStemPlant(s.x, s.h, s.pal, s.type, s.seed, pal));
    });

    // 4. Center-right stalks
    const midRightStalks = [
      { x: 0.60, h: 0.65, type: 'dahlia' as const, pal: 'coralPoppy', seed: 330 },
      { x: 0.62, h: 0.52, type: 'fluffy' as const, pal: 'goldenMarigold', seed: 331 },
      { x: 0.68, h: 0.78, type: 'fluffy' as const, pal: 'goldenMarigold', seed: 332 },
      { x: 0.71, h: 0.88, type: 'chrysanthemum' as const, pal: 'coralPoppy', seed: 333 },
      { x: 0.73, h: 0.60, type: 'poppy' as const, pal: 'wildDahlia', seed: 334 },
    ];
    midRightStalks.forEach((s) => {
      const pal = resolvePalette(s.seed, s.x, s.pal, globalStalkIdx++);
      plants.push(createStemPlant(s.x, s.h, s.pal, s.type, s.seed, pal));
    });

    // 5. Far right cluster
    const farRight = [
      { x: 0.81, h: 0.76, type: 'fluffy' as const, pal: 'coralPoppy', seed: 340 },
      { x: 0.83, h: 0.84, type: 'poppy' as const, pal: 'coralPoppy', seed: 341 },
      { x: 0.86, h: 0.62, type: 'smallStar' as const, pal: 'wildDahlia', seed: 342 },
      { x: 0.91, h: 0.78, type: 'chrysanthemum' as const, pal: 'coralPoppy', seed: 343 },
      { x: 0.94, h: 0.66, type: 'smallStar' as const, pal: 'goldenMarigold', seed: 344 },
    ];
    farRight.forEach((s) => {
      const pal = resolvePalette(s.seed, s.x, s.pal, globalStalkIdx++);
      plants.push(createStemPlant(s.x, s.h, s.pal, s.type, s.seed, pal));
    });

    // Sort back to front by height
    plants.sort((a, b) => b.targetHeight - a.targetHeight);
    return plants;
  }

  // Meadow / Dense cluster fallback
  const num = preset === 'dense' ? Math.max(count, 12) : count;
  for (let i = 0; i < num; i++) {
    const norm = (i + 0.5) / num;
    const jitter = (Math.random() - 0.5) * (0.8 / num);
    const x = Math.max(0.1, Math.min(0.9, norm + jitter));
    const height = 0.48 + Math.random() * 0.42;
    const seed = i * 47;
    const pal = resolvePalette(seed, x, paletteKey, i);
    const plant = createStemPlant(x, height, paletteKey, undefined, seed, pal);
    plants.push(plant);
  }

  plants.sort((a, b) => b.targetHeight - a.targetHeight);
  return plants;
}

/**
 * Draw a p5-style artistic multi-bristle stippled stem
 * Replicates the textured dry-brush / stipple-dot look from the reference photo.
 */
export function drawArtisticStem(
  ctx: CanvasRenderingContext2D,
  plant: StemPlant,
  width: number,
  height: number,
  windX: number,
  time: number,
  noise: SimplexNoise = defaultNoise
) {
  if (plant.growth <= 0.001) return;

  const startX = plant.baseX * width;
  const startY = plant.baseY * height;
  const maxHeight = plant.targetHeight * height;
  const currentStemHeight = maxHeight * Math.min(1.0, plant.growth * 1.3);

  // Compute stem trajectory points
  const steps = Math.floor(currentStemHeight / 3.5);
  if (steps < 2) return;

  const points: { x: number; y: number }[] = [];
  const palette = plant.customPalette || PALETTES[plant.paletteKey] || PALETTES.coralPoppy;

  for (let i = 0; i <= steps; i++) {
    const progress = i / steps; // 0 (bottom) to 1 (current tip)
    const y = startY - progress * currentStemHeight;

    // Organic curving using simplex noise + natural sway
    const curveNoise = noise.noise2D(plant.seed + progress * plant.curveFreq, time * 0.0003);
    const windEffect = windX * progress * progress * 40;
    const organicSway = Math.sin(time * 0.002 + plant.windPhase + progress * 2) * progress * 8;

    const x =
      startX +
      plant.curveAmplitude * Math.sin(progress * Math.PI) * 0.5 +
      curveNoise * 18 * progress +
      windEffect +
      organicSway;

    points.push({ x, y });
  }

  // Update current tip location for flower blooming
  const tip = points[points.length - 1];
  plant.currentTipX = tip.x;
  plant.currentTipY = tip.y;

  // Render multi-bristle dry-brush stipple lines (authentic p5.js brush feeling)
  // Look at the image: stems are 4-6 parallel textured micro-dot trails
  const bristleCount = 5;
  const stemBaseWidth = 3.2;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let b = 0; b < bristleCount; b++) {
    const bristleOffset = ((b - (bristleCount - 1) / 2) / (bristleCount - 1)) * stemBaseWidth;
    
    // Slight color/opacity jitter for natural organic watercolor bristle
    const bristleAlpha = 0.55 + ((b % 2) * 0.25) + (Math.sin(b * 3.3) * 0.1);
    ctx.strokeStyle = palette.stemColor.replace(/[\d.]+\)$/, `${bristleAlpha})`);
    ctx.fillStyle = palette.stemColor.replace(/[\d.]+\)$/, `${bristleAlpha * 0.85})`);
    ctx.lineWidth = 1.0;

    // Stipple dots along the stem path
    for (let i = 0; i < points.length; i += 2) {
      const pt = points[i];
      const progress = i / points.length;
      const jitter = noise.noise2D(pt.y * 0.08 + b * 20, plant.seed) * 1.2;
      const px = pt.x + bristleOffset * (1.1 - progress * 0.4) + jitter;
      const py = pt.y;

      // Small stipple dab
      ctx.beginPath();
      const dotRadius = 0.8 + (Math.sin(i * 1.7 + b) * 0.3);
      ctx.arc(px, py, Math.max(0.4, dotRadius), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw delicate watercolor leaves along stem
  const leafProgressThreshold = plant.growth * 1.3;
  for (const leaf of plant.leafOffsets) {
    if (leaf.t > leafProgressThreshold) continue;

    const pointIndex = Math.floor(leaf.t * (points.length - 1));
    const pt = points[Math.min(pointIndex, points.length - 1)];
    if (!pt) continue;

    // Unfurling leaf progress
    const leafGrowth = Math.min(1.0, (leafProgressThreshold - leaf.t) * 3.5);
    if (leafGrowth <= 0) continue;

    drawWatercolorLeaf(ctx, pt.x, pt.y, leaf, leafGrowth, palette.leafColor);
  }

  ctx.restore();
}

/**
 * Draw a translucent, soft watercolor leaf with brush stroke texture
 */
function drawWatercolorLeaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  leaf: StemPlant['leafOffsets'][0],
  growth: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);

  const angle = leaf.side * leaf.angle - Math.PI / 2;
  ctx.rotate(angle);

  const len = leaf.length * growth;
  const width = len * 0.38;

  // Soft watercolor wash shape
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(width * 0.6, -len * 0.3, width * 0.7, -len * 0.7, 0, -len);
  ctx.bezierCurveTo(-width * 0.7, -len * 0.7, -width * 0.6, -len * 0.3, 0, 0);
  ctx.fill();

  // Subtle interior vein
  ctx.strokeStyle = color.replace(/[\d.]+\)$/, '0.65)');
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -len * 0.75);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw a breathtaking procedural watercolor flower bloom
 * Features layered petal washes, stippled brush dabs, calyx, and center stamen.
 */
export function drawArtisticFlowerBloom(
  ctx: CanvasRenderingContext2D,
  plant: StemPlant,
  time: number,
  noise: SimplexNoise = defaultNoise
) {
  // Flower starts blooming once stem has reached ~40% upward growth
  const bloomFactor = Math.max(0, (plant.growth - 0.38) / 0.62);
  if (bloomFactor <= 0.001) return;

  const cx = plant.currentTipX;
  const cy = plant.currentTipY;
  const palette = plant.customPalette || PALETTES[plant.paletteKey] || PALETTES.coralPoppy;

  // Spring-like organic blooming & unblooming ease (smooth cubic)
  const easedBloom = Math.min(1.0, Math.pow(bloomFactor, 1.3));
  const currentRadius = plant.bloomSize * easedBloom;

  ctx.save();
  ctx.translate(cx, cy);

  // Gentle petal breathing motion
  const breath = Math.sin(time * 0.0025 + plant.seed) * 0.03 * easedBloom;
  ctx.scale(1 + breath, 1 + breath);

  // 1. Draw Calyx (base sepal beneath the flower)
  const calyxSize = currentRadius * 0.3;
  if (calyxSize > 0.5) {
    ctx.fillStyle = palette.calyxColor;
    ctx.beginPath();
    ctx.ellipse(0, calyxSize * 0.4, calyxSize * 0.8, calyxSize * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Draw Multi-Layered Watercolor Petals
  // Outer layer first, progressing toward center
  const layers = plant.petalLayers;
  for (let l = layers - 1; l >= 0; l--) {
    const layerProgress = l / (layers - 1 || 1); // 0 (inner) to 1 (outer)
    const layerRadius = currentRadius * (0.35 + layerProgress * 0.65);
    const count = plant.petalsPerLayer + (layers - l) * 2;
    const baseColor =
      palette.petalPrimary[l % palette.petalPrimary.length] || palette.petalPrimary[0];
    const accentColor =
      palette.petalAccent[l % palette.petalAccent.length] || palette.petalAccent[0];

    const angleOffset = (l * Math.PI) / count + plant.seed * 0.1;

    for (let p = 0; p < count; p++) {
      const petalAngle = (p / count) * Math.PI * 2 + angleOffset;
      // Per-petal noise variation
      const noiseVal = noise.noise2D(Math.cos(petalAngle) * 2.0 + l, Math.sin(petalAngle) * 2.0 + plant.seed);
      // Petals gracefully taper inward when unblooming into a closed bud
      const taper = 0.8 + easedBloom * 0.2;
      const petalLen = layerRadius * (0.85 + noiseVal * 0.25);
      const petalWidth = (petalLen * (0.4 + (1 - layerProgress) * 0.3)) * (0.9 + noiseVal * 0.2) * taper;

      drawWatercolorPetalDab(
        ctx,
        petalAngle,
        petalLen,
        petalWidth,
        p % 2 === 0 ? baseColor : accentColor,
        noiseVal,
        plant.bloomType
      );
    }
  }

  // 3. Flower Core & Stamen (dense watercolor pigment pool)
  const coreRadius = currentRadius * 0.22;
  if (coreRadius > 0.5) {
    const coreGradient = ctx.createRadialGradient(0, 0, Math.max(0.1, coreRadius * 0.1), 0, 0, coreRadius);
    coreGradient.addColorStop(0, palette.calyxColor);
    coreGradient.addColorStop(0.6, palette.petalAccent[0]);
    coreGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
    ctx.fill();

    // Fine stamen dots (p5 stipple brush feeling)
    const stamenCount = Math.floor(4 + coreRadius * 0.8);
    ctx.fillStyle = 'rgba(255, 240, 180, 0.85)';
    for (let s = 0; s < stamenCount; s++) {
      const sAngle = (s / stamenCount) * Math.PI * 2 + noise.noise2D(s, plant.seed);
      const sDist = coreRadius * (0.2 + (s % 3) * 0.25);
      const sx = Math.cos(sAngle) * sDist;
      const sy = Math.sin(sAngle) * sDist;
      ctx.beginPath();
      ctx.arc(sx, sy, Math.min(1.0, coreRadius * 0.15), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Draw a single organic watercolor petal with feathered wash edges
 */
function drawWatercolorPetalDab(
  ctx: CanvasRenderingContext2D,
  angle: number,
  length: number,
  width: number,
  color: string,
  noiseVal: number,
  bloomType: StemPlant['bloomType']
) {
  ctx.save();
  ctx.rotate(angle);

  // Soft watercolor layering: multiple offset semi-transparent passes
  // This simulates the wet-on-dry watercolor brush overlapping
  const passes = 2;
  for (let pass = 0; pass < passes; pass++) {
    const passScale = 1.0 - pass * 0.15;
    const passLen = length * passScale;
    const passWidth = width * passScale;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);

    if (bloomType === 'chrysanthemum' || bloomType === 'fluffy') {
      // Slender ruffled or lobed petal
      ctx.bezierCurveTo(
        passWidth * 0.6,
        passLen * 0.35,
        passWidth * 0.8,
        passLen * 0.75,
        0,
        passLen
      );
      ctx.bezierCurveTo(
        -passWidth * 0.8,
        passLen * 0.75,
        -passWidth * 0.6,
        passLen * 0.35,
        0,
        0
      );
    } else {
      // Broad round scallop petal (poppy/dahlia)
      const bulge = 0.85 + noiseVal * 0.2;
      ctx.bezierCurveTo(
        passWidth * bulge,
        passLen * 0.25,
        passWidth * 1.1,
        passLen * 0.7,
        0,
        passLen
      );
      ctx.bezierCurveTo(
        -passWidth * 1.1,
        passLen * 0.7,
        -passWidth * bulge,
        passLen * 0.25,
        0,
        0
      );
    }

    ctx.fill();
  }

  ctx.restore();
}
