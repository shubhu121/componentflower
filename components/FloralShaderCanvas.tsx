'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  StemPlant,
  FlowerPalette,
  drawArtisticStem,
  drawArtisticFlowerBloom,
  createStemPlant,
  generateBotanicalBouquet,
} from '@/lib/watercolor-brush';
import { createFlowerNuancePalette } from '@/lib/p5-palette';
import { defaultNoise } from '@/lib/noise';

interface FloralShaderCanvasProps {
  paletteKey?: string;
  palette?: FlowerPalette;
  paletteMix?: FlowerPalette[];
  paletteSeed?: number;
  preset?: 'dense' | 'minimal' | 'trio' | 'meadow' | 'panoramic';
  stemCount?: number;
  isHovered?: boolean;
  enableShader?: boolean;
  windIntensity?: number;
  windPaused?: boolean;
  interactive?: boolean;
  className?: string;
  onBloomStateChange?: (state: 'dormant' | 'budding' | 'bloomed') => void;
}

// GLSL Vertex Shader
const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  // Flip Y because canvas 2D coordinates are inverted relative to WebGL
  v_uv.y = 1.0 - v_uv.y;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// GLSL Fragment Shader for Watercolor Paper Grain, Edge Bleed, and Warm Bloom
const FRAGMENT_SHADER_SOURCE = `
precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_bloom_factor;
uniform float u_grain_strength;
uniform float u_bleed_strength;

varying vec2 v_uv;

// Pseudo-random hash
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// 2D Value Noise
float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fine watercolor paper fiber texture (FBM)
float paperGrain(vec2 uv) {
  vec2 p = uv * vec2(u_resolution.x / 140.0, u_resolution.y / 140.0);
  float n = 0.0;
  n += 0.500 * valueNoise(p * 2.0);
  n += 0.250 * valueNoise(p * 4.0);
  n += 0.125 * valueNoise(p * 8.0);
  return n;
}

void main() {
  vec2 uv = v_uv;
  vec2 pixel = 1.0 / u_resolution;

  // Multi-tap sample for watercolor pigment bleed / capillary edge pooling
  vec4 centerCol = texture2D(u_texture, uv);

  // If pixel is background or nearly transparent, apply fine paper grain
  float paper = paperGrain(uv);
  vec3 paperColor = vec3(0.988, 0.985, 0.980); // Fine cream watercolor paper
  // Subtle paper grain modulation
  paperColor -= (paper - 0.5) * 0.035 * u_grain_strength;

  if (centerCol.a < 0.005) {
    gl_FragColor = vec4(paperColor, 1.0);
    return;
  }

  // Edge detection for watercolor pigment pooling (darker pigment ring at water edge)
  vec4 leftCol  = texture2D(u_texture, uv - vec2(pixel.x * 1.5, 0.0));
  vec4 rightCol = texture2D(u_texture, uv + vec2(pixel.x * 1.5, 0.0));
  vec4 upCol    = texture2D(u_texture, uv - vec2(0.0, pixel.y * 1.5));
  vec4 downCol  = texture2D(u_texture, uv + vec2(0.0, pixel.y * 1.5));

  float edgeDelta = abs(centerCol.a - leftCol.a) +
                    abs(centerCol.a - rightCol.a) +
                    abs(centerCol.a - upCol.a) +
                    abs(centerCol.a - downCol.a);

  // Dark fringe / pigment gathering at drying boundary
  float pigmentFringe = clamp(edgeDelta * 1.2 * u_bleed_strength, 0.0, 0.35);

  // Watercolor wash color with paper texture absorption
  vec3 pigment = centerCol.rgb;
  pigment *= (1.0 - pigmentFringe * 0.4); // Darker rim
  pigment += (paper - 0.5) * 0.04; // Fiber absorption

  // Chromatic warm bloom enhancement for corals and yellows
  float warmth = max(0.0, pigment.r - pigment.b);
  pigment.r += warmth * 0.04 * u_bloom_factor;
  pigment.g += warmth * 0.02 * u_bloom_factor;

  // Composite pigment over paper background with watercolor multiply/translucency
  vec3 finalColor = mix(paperColor, pigment, centerCol.a);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

export function FloralShaderCanvas({
  paletteKey = 'coralPoppy',
  palette,
  paletteMix,
  paletteSeed,
  preset = 'dense',
  stemCount = 8,
  isHovered = false,
  enableShader = true,
  windIntensity = 0.5,
  windPaused = false,
  interactive = true,
  className = '',
  onBloomStateChange,
}: FloralShaderCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreen2dRef = useRef<HTMLCanvasElement | null>(null);

  // WebGL resources
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);

  // Plants state
  const plantsRef = useRef<StemPlant[]>([]);
  const mouseWindRef = useRef<{ x: number; targetX: number }>({ x: 0, targetX: 0 });
  const animFrameIdRef = useRef<number | null>(null);
  const bloomStateRef = useRef<'dormant' | 'budding' | 'bloomed'>('dormant');
  const hasWebGLRef = useRef<boolean>(true);
  const windTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number | null>(null);

  // Keep track of hover state in a ref to avoid tearing down the animation loop or resetting plants
  const isHoveredRef = useRef<boolean>(isHovered);
  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  // Initialize botanical plants (only on mount or seed/mix change, NEVER on hover)
  const initPlants = useCallback(() => {
    plantsRef.current = generateBotanicalBouquet(stemCount, paletteKey, preset, palette, paletteMix);
    const target = isHoveredRef.current ? 1.0 : 0.0;
    plantsRef.current.forEach((p) => {
      p.targetGrowth = target;
      p.growth = target;
    });
  }, [stemCount, paletteKey, preset, palette, paletteMix]);

  useEffect(() => {
    initPlants();
  }, [initPlants, paletteSeed]);

  // Click on canvas to sprout a fresh plant at cursor
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickNormX = (e.clientX - rect.left) / rect.width;
    const clickHeightFraction = 1.0 - (e.clientY - rect.top) / rect.height;

    const seed = Math.random() * 10000;
    let customPal: FlowerPalette | undefined = undefined;
    if (paletteMix && paletteMix.length > 0) {
      const idx = Math.floor(Math.random() * paletteMix.length);
      customPal = createFlowerNuancePalette(paletteMix[idx], seed, clickNormX);
    } else if (palette) {
      customPal = createFlowerNuancePalette(palette, seed, clickNormX);
    }

    const newPlant = createStemPlant(
      clickNormX,
      Math.max(0.4, Math.min(0.85, clickHeightFraction + 0.1)),
      paletteKey,
      undefined,
      seed,
      customPal
    );
    newPlant.growth = 0.1;
    newPlant.targetGrowth = 1.0;
    plantsRef.current.push(newPlant);
  };

  // Mouse move for gentle interactive wind sway
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width;
    // Map to [-1, 1] relative to center
    mouseWindRef.current.targetX = (normX - 0.5) * 2.0 * windIntensity;
  };

  const handleMouseLeave = () => {
    mouseWindRef.current.targetX = 0;
  };

  // WebGL context setup
  useEffect(() => {
    const glCanvas = glCanvasRef.current;
    if (!glCanvas) return;

    // Create 2D offscreen canvas for rendering p5-style brush strokes
    const offscreen = document.createElement('canvas');
    offscreen2dRef.current = offscreen;

    if (!enableShader) {
      hasWebGLRef.current = false;
      return;
    }

    try {
      const gl = glCanvas.getContext('webgl', {
        alpha: false,
        antialias: true,
        preserveDrawingBuffer: false,
      });

      if (!gl) {
        hasWebGLRef.current = false;
        return;
      }

      glRef.current = gl;

      // Compile Shaders
      const compileShader = (type: number, src: string) => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.warn('Shader compile failed:', gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
      const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);

      if (!vs || !fs) {
        hasWebGLRef.current = false;
        return;
      }

      const program = gl.createProgram();
      if (!program) {
        hasWebGLRef.current = false;
        return;
      }

      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn('Program link failed:', gl.getProgramInfoLog(program));
        hasWebGLRef.current = false;
        return;
      }

      programRef.current = program;

      // Setup full-screen quad (-1 to 1)
      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      const positions = new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

      // Create WebGL texture to upload offscreen 2D canvas
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      textureRef.current = texture;

      hasWebGLRef.current = true;
    } catch (err) {
      console.warn('WebGL init error:', err);
      hasWebGLRef.current = false;
    }
  }, [enableShader]);

  // Main Render Loop
  useEffect(() => {
    lastTimeRef.current = performance.now();

    const render = (now: number) => {
      const delta = Math.min(now - (lastTimeRef.current || now), 100);
      lastTimeRef.current = now;

      if (!windPaused) {
        windTimeRef.current += delta;
      }
      const activeWindTime = windTimeRef.current;

      const container = containerRef.current;
      const glCanvas = glCanvasRef.current;
      const offscreen = offscreen2dRef.current;

      if (!container || !glCanvas || !offscreen) {
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (width === 0 || height === 0) {
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      // Sync canvas dimensions
      if (glCanvas.width !== Math.floor(width * dpr) || glCanvas.height !== Math.floor(height * dpr)) {
        glCanvas.width = Math.floor(width * dpr);
        glCanvas.height = Math.floor(height * dpr);
        offscreen.width = Math.floor(width * dpr);
        offscreen.height = Math.floor(height * dpr);
      }

      const offCtx = offscreen.getContext('2d');
      if (!offCtx) {
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      // 1. Clear offscreen 2D canvas with transparency
      offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
      offCtx.save();
      offCtx.scale(dpr, dpr);

      // Smooth mouse wind easing or freeze if wind paused
      if (windPaused) {
        mouseWindRef.current.targetX = 0;
        mouseWindRef.current.x = 0;
      } else {
        mouseWindRef.current.x += (mouseWindRef.current.targetX - mouseWindRef.current.x) * 0.08;
      }

      // Update plants growth based on hover state (graceful blooming & unblooming motion)
      let totalGrowth = 0;
      const plants = plantsRef.current;
      const targetGrowth = isHoveredRef.current ? 1.0 : 0.0;

      for (const plant of plants) {
        plant.targetGrowth = targetGrowth;
        const diff = plant.targetGrowth - plant.growth;
        // Natural organic easing:
        // Blooming (diff > 0): spring-like upward growth
        // Unblooming (diff < 0): graceful, organic folding of petals and receding stems
        const speed = diff < 0 ? plant.growthSpeed * 0.88 : plant.growthSpeed;
        plant.growth += diff * speed;
        totalGrowth += plant.growth;

        // Draw stippled dry-brush stems
        drawArtisticStem(offCtx, plant, width, height, mouseWindRef.current.x, activeWindTime, defaultNoise);

        // Draw watercolor blooming petals
        drawArtisticFlowerBloom(offCtx, plant, activeWindTime, defaultNoise);
      }

      offCtx.restore();

      // Determine state for UI feedback
      const avgGrowth = plants.length > 0 ? totalGrowth / plants.length : 0;
      let currentState: 'dormant' | 'budding' | 'bloomed' = 'dormant';
      if (avgGrowth > 0.8) {
        currentState = 'bloomed';
      } else if (avgGrowth > 0.15) {
        currentState = 'budding';
      }

      if (bloomStateRef.current !== currentState) {
        bloomStateRef.current = currentState;
        onBloomStateChange?.(currentState);
      }

      // 2. Render through WebGL Shader (or fallback to 2D)
      const gl = glRef.current;
      const program = programRef.current;
      const texture = textureRef.current;

      if (enableShader && hasWebGLRef.current && gl && program && texture) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

        // Upload 2D canvas as texture to WebGL
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, offscreen);

        gl.useProgram(program);

        // Bind uniforms
        const uTextureLoc = gl.getUniformLocation(program, 'u_texture');
        const uResLoc = gl.getUniformLocation(program, 'u_resolution');
        const uTimeLoc = gl.getUniformLocation(program, 'u_time');
        const uBloomLoc = gl.getUniformLocation(program, 'u_bloom_factor');
        const uGrainLoc = gl.getUniformLocation(program, 'u_grain_strength');
        const uBleedLoc = gl.getUniformLocation(program, 'u_bleed_strength');

        gl.uniform1i(uTextureLoc, 0);
        gl.uniform2f(uResLoc, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.uniform1f(uTimeLoc, activeWindTime * 0.001);
        gl.uniform1f(uBloomLoc, avgGrowth);
        gl.uniform1f(uGrainLoc, 1.0);
        gl.uniform1f(uBleedLoc, 1.2);

        // Draw quad
        const aPositionLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(aPositionLoc);
        gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else {
        // Direct 2D Fallback
        const directCtx = glCanvas.getContext('2d');
        if (directCtx) {
          directCtx.clearRect(0, 0, glCanvas.width, glCanvas.height);
          directCtx.fillStyle = '#FCFCFB';
          directCtx.fillRect(0, 0, glCanvas.width, glCanvas.height);
          directCtx.drawImage(offscreen, 0, 0);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [enableShader, windPaused, onBloomStateChange]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
      id={`floral-canvas-container-${paletteKey}`}
    >
      <canvas
        ref={glCanvasRef}
        id={`floral-webgl-canvas-${paletteKey}`}
        className="w-full h-full block cursor-pointer transition-opacity duration-300"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
