'use client';

import type p5 from 'p5';
import type { FlowerPalette } from './watercolor-brush';

// Client-side singleton p5 instance for native p5.js color operations
let p5Instance: p5 | null = null;
let p5Initializing = false;

/**
 * Lazily initialize headless p5 instance for p5.js color calculations
 */
export function getP5Instance(): p5 | null {
  if (typeof window === 'undefined') return null;
  if (p5Instance) return p5Instance;
  if (p5Initializing) return null;

  try {
    p5Initializing = true;
    const P5 = require('p5');
    const dummy = document.createElement('div');
    dummy.style.display = 'none';
    p5Instance = new P5((p: p5) => {
      p.setup = () => {
        p.noCanvas();
      };
    }, dummy);
    return p5Instance;
  } catch (err) {
    // If native p5 constructor cannot be instantiated synchronously, mathematical lerp handles it
    return null;
  } finally {
    p5Initializing = false;
  }
}

/**
 * Parse an RGBA/RGB string or hex string into numeric components [r, g, b, a]
 */
export function parseRgba(colorStr: string): [number, number, number, number] {
  const s = colorStr.trim();
  if (s.startsWith('#')) {
    let hex = s.substring(1);
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    const num = parseInt(hex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 1.0];
  }
  const match = s.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\)/i);
  if (match) {
    return [
      parseInt(match[1], 10),
      parseInt(match[2], 10),
      parseInt(match[3], 10),
      match[4] !== undefined ? parseFloat(match[4]) : 1.0,
    ];
  }
  return [200, 100, 100, 1.0];
}

/**
 * RGB to HSB conversion (matching p5.js HSB coordinate range: 0-360, 0-100, 0-100)
 */
function rgbToHsb(r: number, g: number, b: number): [number, number, number] {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : (d / max) * 100;
  const v = max * 100;

  if (d !== 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) * 60;
    } else if (max === gNorm) {
      h = ((bNorm - rNorm) / d + 2) * 60;
    } else {
      h = ((rNorm - gNorm) / d + 4) * 60;
    }
  }
  return [h, s, v];
}

/**
 * HSB to RGB conversion (matching p5.js colorMode(HSB, 360, 100, 100))
 */
function hsbToRgb(h: number, s: number, b: number): [number, number, number] {
  const hNorm = ((h % 360) + 360) % 360;
  const sNorm = Math.max(0, Math.min(100, s)) / 100;
  const vNorm = Math.max(0, Math.min(100, b)) / 100;

  const c = vNorm * sNorm;
  const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1));
  const m = vNorm - c;

  let r1 = 0, g1 = 0, b1 = 0;
  if (hNorm >= 0 && hNorm < 60) {
    r1 = c; g1 = x; b1 = 0;
  } else if (hNorm >= 60 && hNorm < 120) {
    r1 = x; g1 = c; b1 = 0;
  } else if (hNorm >= 120 && hNorm < 180) {
    r1 = 0; g1 = c; b1 = x;
  } else if (hNorm >= 180 && hNorm < 240) {
    r1 = 0; g1 = x; b1 = c;
  } else if (hNorm >= 240 && hNorm < 300) {
    r1 = x; g1 = 0; b1 = c;
  } else {
    r1 = c; g1 = 0; b1 = x;
  }

  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255),
  ];
}

/**
 * Mathematical p5.js lerpColor implementation
 * Supports both RGB and HSB color spaces
 */
export function p5LerpColor(
  c1: string,
  c2: string,
  amt: number,
  mode: 'RGB' | 'HSB' = 'HSB'
): string {
  const t = Math.max(0, Math.min(1, amt));

  // If p5 instance is active in client environment, try native p5.lerpColor
  const p = getP5Instance();
  if (p) {
    try {
      p.colorMode(mode === 'HSB' ? p.HSB : p.RGB);
      const col1 = p.color(c1);
      const col2 = p.color(c2);
      const res = p.lerpColor(col1, col2, t);
      const r = Math.round(p.red(res));
      const g = Math.round(p.green(res));
      const b = Math.round(p.blue(res));
      const a = parseFloat(p.alpha(res).toFixed(2));
      const normalizedAlpha = a > 1 ? a / 255 : a;
      return `rgba(${r}, ${g}, ${b}, ${normalizedAlpha.toFixed(2)})`;
    } catch {
      // Fallback below
    }
  }

  const [r1, g1, b1, a1] = parseRgba(c1);
  const [r2, g2, b2, a2] = parseRgba(c2);
  const lerpedAlpha = a1 + (a2 - a1) * t;

  if (mode === 'RGB') {
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgba(${r}, ${g}, ${b}, ${lerpedAlpha.toFixed(2)})`;
  }

  // HSB color interpolation (matching p5.js circular hue lerping)
  const [h1, s1, bVal1] = rgbToHsb(r1, g1, b1);
  const [h2, s2, bVal2] = rgbToHsb(r2, g2, b2);

  let deltaHue = h2 - h1;
  if (deltaHue > 180) deltaHue -= 360;
  if (deltaHue < -180) deltaHue += 360;

  const h = (h1 + deltaHue * t + 360) % 360;
  const s = s1 + (s2 - s1) * t;
  const bVal = bVal1 + (bVal2 - bVal1) * t;

  const [r, g, b] = hsbToRgb(h, s, bVal);
  return `rgba(${r}, ${g}, ${b}, ${lerpedAlpha.toFixed(2)})`;
}

/**
 * Botanical Hue Themes specification
 */
export interface HueTheme {
  id: string;
  name: string;
  category: 'violet' | 'crimson' | 'goldenrod' | 'cerulean' | 'coral' | 'peony';
  anchorA: string; // Base blooming hue
  anchorB: string; // Secondary petal gradient hue
  accent: string;  // Deep pigment core/accent
  calyxBase: string;
  stemBase: string;
  leafBase: string;
}

export const FLORAL_HUE_THEMES: HueTheme[] = [
  // 1. Violet Family (Iris, Lavender, Wisteria, Plum)
  {
    id: 'violet-iris',
    name: 'Wild Violet & Iris',
    category: 'violet',
    anchorA: 'rgba(128, 62, 192, 0.44)',
    anchorB: 'rgba(188, 132, 238, 0.36)',
    accent: 'rgba(92, 32, 155, 0.65)',
    calyxBase: 'rgba(78, 28, 126, 0.85)',
    stemBase: 'rgba(46, 84, 62, 0.85)',
    leafBase: 'rgba(102, 152, 120, 0.45)',
  },
  {
    id: 'lavender-mist',
    name: 'Lavender Wisteria',
    category: 'violet',
    anchorA: 'rgba(145, 95, 210, 0.42)',
    anchorB: 'rgba(215, 175, 250, 0.35)',
    accent: 'rgba(108, 48, 172, 0.62)',
    calyxBase: 'rgba(88, 38, 140, 0.85)',
    stemBase: 'rgba(44, 82, 58, 0.85)',
    leafBase: 'rgba(108, 158, 124, 0.45)',
  },

  // 2. Crimson Family (Carmine, Scarlet Poppy, Ruby Dahlia, Rose)
  {
    id: 'crimson-poppy',
    name: 'Venetian Crimson',
    category: 'crimson',
    anchorA: 'rgba(224, 38, 58, 0.44)',
    anchorB: 'rgba(255, 110, 95, 0.36)',
    accent: 'rgba(172, 18, 40, 0.65)',
    calyxBase: 'rgba(165, 22, 38, 0.85)',
    stemBase: 'rgba(42, 85, 52, 0.85)',
    leafBase: 'rgba(95, 150, 108, 0.45)',
  },
  {
    id: 'scarlet-dahlia',
    name: 'Scarlet & Ruby Dahlia',
    category: 'crimson',
    anchorA: 'rgba(218, 45, 75, 0.42)',
    anchorB: 'rgba(250, 128, 110, 0.35)',
    accent: 'rgba(162, 15, 48, 0.65)',
    calyxBase: 'rgba(152, 18, 44, 0.85)',
    stemBase: 'rgba(40, 80, 50, 0.85)',
    leafBase: 'rgba(92, 148, 105, 0.45)',
  },

  // 3. Goldenrod Family (Marigold, Saffron, Amber Ochre, Sunflower)
  {
    id: 'goldenrod-marigold',
    name: 'Goldenrod & Marigold',
    category: 'goldenrod',
    anchorA: 'rgba(242, 168, 30, 0.45)',
    anchorB: 'rgba(255, 214, 65, 0.36)',
    accent: 'rgba(215, 105, 22, 0.62)',
    calyxBase: 'rgba(195, 85, 18, 0.85)',
    stemBase: 'rgba(50, 92, 58, 0.85)',
    leafBase: 'rgba(110, 165, 120, 0.45)',
  },
  {
    id: 'amber-saffron',
    name: 'Amber Saffron',
    category: 'goldenrod',
    anchorA: 'rgba(235, 145, 25, 0.44)',
    anchorB: 'rgba(255, 195, 75, 0.35)',
    accent: 'rgba(198, 88, 15, 0.65)',
    calyxBase: 'rgba(185, 75, 14, 0.85)',
    stemBase: 'rgba(52, 94, 60, 0.85)',
    leafBase: 'rgba(114, 168, 122, 0.45)',
  },

  // 4. Cerulean / Cornflower Family (Wild Iris, Delphinium)
  {
    id: 'cerulean-cornflower',
    name: 'Cerulean Cornflower',
    category: 'cerulean',
    anchorA: 'rgba(72, 118, 220, 0.42)',
    anchorB: 'rgba(142, 184, 252, 0.35)',
    accent: 'rgba(45, 78, 175, 0.65)',
    calyxBase: 'rgba(38, 62, 145, 0.85)',
    stemBase: 'rgba(38, 80, 58, 0.85)',
    leafBase: 'rgba(88, 142, 115, 0.45)',
  },

  // 5. Coral Poppy / Peach Sunset
  {
    id: 'coral-sunset',
    name: 'Coral Poppy & Peach',
    category: 'coral',
    anchorA: 'rgba(244, 98, 78, 0.42)',
    anchorB: 'rgba(255, 160, 118, 0.36)',
    accent: 'rgba(225, 68, 44, 0.62)',
    calyxBase: 'rgba(205, 52, 38, 0.85)',
    stemBase: 'rgba(46, 91, 55, 0.85)',
    leafBase: 'rgba(98, 153, 110, 0.45)',
  },

  // 6. Peony / Rose Magenta
  {
    id: 'peony-rose',
    name: 'Peony & Wild Rose',
    category: 'peony',
    anchorA: 'rgba(232, 72, 128, 0.42)',
    anchorB: 'rgba(255, 165, 200, 0.35)',
    accent: 'rgba(188, 32, 92, 0.65)',
    calyxBase: 'rgba(168, 28, 84, 0.85)',
    stemBase: 'rgba(48, 86, 56, 0.85)',
    leafBase: 'rgba(100, 154, 112, 0.45)',
  },
];

export interface GeneratedFloralPaletteResult {
  palette: FlowerPalette;
  theme: HueTheme;
  previewColor: string;
}

/**
 * Generates a palette from a HueTheme with optional randomized or deterministic shifts using p5.js color lerping
 */
export function buildPaletteFromTheme(
  theme: HueTheme,
  hueShiftAmt = 0.2,
  accentLerpAmt = 0.25
): FlowerPalette {
  const petalPrimary: string[] = [
    theme.anchorA,
    p5LerpColor(theme.anchorA, theme.anchorB, 0.35, 'HSB'),
    p5LerpColor(theme.anchorA, theme.anchorB, 0.70, 'HSB'),
    theme.anchorB,
  ];

  const petalAccent: string[] = [
    theme.accent,
    p5LerpColor(theme.accent, theme.anchorA, 0.45, 'HSB'),
    p5LerpColor(theme.accent, theme.anchorB, accentLerpAmt, 'HSB'),
  ];

  const calyxColor = p5LerpColor(theme.calyxBase, theme.accent, 0.25, 'RGB');
  const stemColor = p5LerpColor(theme.stemBase, theme.calyxBase, 0.08, 'RGB');
  const leafColor = p5LerpColor(theme.leafBase, theme.anchorB, hueShiftAmt * 0.12, 'HSB');

  return {
    name: theme.name,
    petalPrimary,
    petalAccent,
    calyxColor,
    stemColor,
    leafColor,
  };
}

/**
 * Generates a deterministic mixture of floral color palettes across all botanical hue families
 * (Violet, Crimson, Goldenrod, Cerulean, Coral, Peony) for hydration-safe SSR and initial client mount.
 */
export function getDeterministicMeadowColorMixture(): FlowerPalette[] {
  const categories: ('crimson' | 'goldenrod' | 'violet' | 'cerulean' | 'coral' | 'peony')[] = [
    'crimson',
    'goldenrod',
    'violet',
    'cerulean',
    'coral',
    'peony',
  ];

  return categories.map((cat, idx) => {
    const theme = FLORAL_HUE_THEMES.find((t) => t.category === cat) || FLORAL_HUE_THEMES[idx % FLORAL_HUE_THEMES.length];
    const shift = 0.18 + (idx * 0.04);
    return buildPaletteFromTheme(theme, shift, 0.22 + (idx * 0.03));
  });
}

/**
 * Generates a randomized mixture of colors using p5.js color lerping across botanical families
 * (Violet, Crimson, Goldenrod, Cerulean, Coral, Peony, Saffron, Lavender).
 */
export function generateRandomMeadowColorMixture(): FlowerPalette[] {
  // Shuffle/select themes across all vibrant botanical categories
  const categories: ('crimson' | 'goldenrod' | 'violet' | 'cerulean' | 'coral' | 'peony')[] = [
    'crimson',
    'goldenrod',
    'violet',
    'cerulean',
    'coral',
    'peony',
  ];

  return categories.map((cat) => {
    const matching = FLORAL_HUE_THEMES.filter((t) => t.category === cat);
    const theme = matching[Math.floor(Math.random() * matching.length)] || FLORAL_HUE_THEMES[0];
    const hueShiftAmt = 0.12 + Math.random() * 0.32;
    const accentLerpAmt = 0.18 + Math.random() * 0.35;
    return buildPaletteFromTheme(theme, hueShiftAmt, accentLerpAmt);
  });
}

/**
 * Generates a deterministic botanical palette for hydration-safe initial SSR & mount.
 */
export function getDeterministicFloralPalette(themeId = 'crimson-poppy'): GeneratedFloralPaletteResult {
  const theme = FLORAL_HUE_THEMES.find((t) => t.id === themeId) || FLORAL_HUE_THEMES[0];
  const palette = buildPaletteFromTheme(theme, 0.2, 0.25);

  return {
    palette,
    theme,
    previewColor: theme.anchorA.replace(/[\d.]+\)$/, '1.0)'),
  };
}

/**
 * Generates a randomized botanical palette using p5.js color lerping.
 * Shifts floral hues through violet, crimson, goldenrod, etc.
 */
export function generateRandomFloralPalette(
  forcedCategory?: 'violet' | 'crimson' | 'goldenrod' | 'cerulean' | 'coral' | 'peony',
  previousThemeId?: string
): GeneratedFloralPaletteResult {
  // Pick next or random theme, avoiding immediate repetition
  const candidates = forcedCategory
    ? FLORAL_HUE_THEMES.filter((t) => t.category === forcedCategory)
    : FLORAL_HUE_THEMES.filter((t) => t.id !== previousThemeId);

  const pool = candidates.length > 0 ? candidates : FLORAL_HUE_THEMES;
  const theme = pool[Math.floor(Math.random() * pool.length)];

  // Randomized shift factors using p5 color lerping
  const hueShiftAmt = 0.15 + Math.random() * 0.25; // 15% to 40% lerp
  const accentLerpAmt = 0.2 + Math.random() * 0.3;

  // 1. Generate 4 primary petal wash steps using p5.js HSB color lerping
  // Progressive gradient from Anchor A to Anchor B with natural translucent alphas
  const petalPrimary: string[] = [
    theme.anchorA,
    p5LerpColor(theme.anchorA, theme.anchorB, 0.35, 'HSB'),
    p5LerpColor(theme.anchorA, theme.anchorB, 0.70, 'HSB'),
    theme.anchorB,
  ];

  // 2. Generate 3 deeper petal accent pools using p5.js color lerping
  const petalAccent: string[] = [
    theme.accent,
    p5LerpColor(theme.accent, theme.anchorA, 0.45, 'HSB'),
    p5LerpColor(theme.accent, theme.anchorB, accentLerpAmt, 'HSB'),
  ];

  // 3. Calyx color lerped between flower accent and deep botanical base
  const calyxColor = p5LerpColor(theme.calyxBase, theme.accent, 0.25, 'RGB');

  // 4. Botanical stem color (subtly tinted toward the floral hue warmth/coolness)
  const stemColor = p5LerpColor(theme.stemBase, theme.calyxBase, 0.08, 'RGB');

  // 5. Soft watercolor leaf wash
  const leafColor = p5LerpColor(theme.leafBase, theme.anchorB, hueShiftAmt * 0.12, 'HSB');

  const palette: FlowerPalette = {
    name: theme.name,
    petalPrimary,
    petalAccent,
    calyxColor,
    stemColor,
    leafColor,
  };

  return {
    palette,
    theme,
    previewColor: theme.anchorA.replace(/[\d.]+\)$/, '1.0)'),
  };
}

/**
 * Creates individual per-flower color nuances across the meadow using p5.js color lerping.
 * Subtle natural variation so blooms in a cluster have realistic watercolor differences.
 */
export function createFlowerNuancePalette(
  basePalette: FlowerPalette,
  seed: number,
  normX: number
): FlowerPalette {
  // Horizontal gradient factor + individual seed jitter
  const variance = Math.sin(normX * Math.PI + seed * 0.1) * 0.25;
  const t = Math.max(0, Math.min(1, 0.2 + variance));

  const primary0 = p5LerpColor(basePalette.petalPrimary[0], basePalette.petalPrimary[1], t, 'HSB');
  const primary1 = p5LerpColor(basePalette.petalPrimary[1], basePalette.petalPrimary[2], t, 'HSB');
  const primary2 = p5LerpColor(basePalette.petalPrimary[2], basePalette.petalPrimary[3], t, 'HSB');
  const primary3 = basePalette.petalPrimary[3];

  const accent0 = p5LerpColor(basePalette.petalAccent[0], basePalette.petalAccent[1], t, 'HSB');
  const accent1 = basePalette.petalAccent[1];
  const accent2 = p5LerpColor(basePalette.petalAccent[2], basePalette.petalPrimary[0], t * 0.5, 'HSB');

  return {
    name: basePalette.name,
    petalPrimary: [primary0, primary1, primary2, primary3],
    petalAccent: [accent0, accent1, accent2],
    calyxColor: basePalette.calyxColor,
    stemColor: basePalette.stemColor,
    leafColor: basePalette.leafColor,
  };
}
