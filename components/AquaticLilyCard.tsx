'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import {
  AQUATIC_THEMES,
  AquaticPalette,
  FloatingLilyPad,
  WaterLilyBlossom,
  WaterRipple,
  generateFloatingLilyPads,
  generateWaterLilies,
  drawFloatingLilyPad,
  drawWaterLilyBlossom,
  updateAndDrawRipples,
} from '@/lib/aquatic-lily';
import { defaultNoise } from '@/lib/noise';

export interface AquaticLilyCardProps {
  id?: string;
  className?: string;
}

const VERT_SHADER = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAG_SHADER = `
precision mediump float;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_water_color;

varying vec2 v_uv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 uv = v_uv;
  vec4 tex = texture2D(u_texture, uv);

  // Soft liquid paper texture
  float grain = hash(floor(uv * u_resolution * 0.35));
  vec3 paper = u_water_color - (grain - 0.5) * 0.015;

  // Composite watercolor pigment over celadon water paper with watercolor multiply
  vec3 finalColor = mix(paper, tex.rgb, tex.a);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

export function AquaticLilyCard({
  id = 'aquatic-lily-card',
  className = '',
}: AquaticLilyCardProps) {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [ripplesPaused, setRipplesPaused] = useState<boolean>(false);
  const [themeIndex, setThemeIndex] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreen2dRef = useRef<HTMLCanvasElement | null>(null);

  // WebGL references
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);

  // Botanical states
  const isHoveredRef = useRef<boolean>(false);
  const padsRef = useRef<FloatingLilyPad[]>([]);
  const liliesRef = useRef<WaterLilyBlossom[]>([]);
  const ripplesRef = useRef<WaterRipple[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const rippleTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number | null>(null);
  const lastMousePosRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });

  const currentTheme: AquaticPalette = AQUATIC_THEMES[themeIndex % AQUATIC_THEMES.length];
  const themeRef = useRef<AquaticPalette>(currentTheme);
  useEffect(() => {
    themeRef.current = currentTheme;
  }, [currentTheme]);

  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  // Initialize botanical pads and water lilies
  useEffect(() => {
    padsRef.current = generateFloatingLilyPads(7);
    liliesRef.current = generateWaterLilies(4);
  }, []);

  // Shift aquatic theme
  const handleShiftPalette = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setThemeIndex((prev) => (prev + 1) % AQUATIC_THEMES.length);
  }, []);

  // Click drops a water pebble ripple and sprouts a floating lotus
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const normX = clickX / rect.width;
    const normY = clickY / rect.height;

    // Trigger expanding splash ripples
    ripplesRef.current.push({
      x: clickX,
      y: clickY,
      radius: 4,
      maxRadius: 140,
      alpha: 1.0,
      speed: 2.6,
      color: themeRef.current.rippleColor,
    });
    ripplesRef.current.push({
      x: clickX,
      y: clickY,
      radius: 1,
      maxRadius: 90,
      alpha: 0.8,
      speed: 1.8,
      color: themeRef.current.rippleColor,
    });

    // Sprout a new small floating lotus
    const newLily: WaterLilyBlossom = {
      x: normX,
      y: normY,
      radius: 32 + Math.random() * 8,
      growth: 0.1,
      targetGrowth: 1.0,
      growthSpeed: 0.03,
      tierCount: 3,
      seed: Math.random() * 10000,
      paletteIndex: liliesRef.current.length,
      bobPhase: Math.random() * Math.PI * 2,
    };
    liliesRef.current.push(newLily);
  };

  // Moving cursor creates subtle fluid watercolor ripples
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (ripplesPaused || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;
    const now = performance.now();

    const dx = curX - lastMousePosRef.current.x;
    const dy = curY - lastMousePosRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 28 && now - lastMousePosRef.current.time > 80) {
      ripplesRef.current.push({
        x: curX,
        y: curY,
        radius: 2,
        maxRadius: 55 + Math.min(dist * 0.8, 40),
        alpha: 0.65,
        speed: 1.6,
        color: themeRef.current.rippleColor,
      });
      lastMousePosRef.current = { x: curX, y: curY, time: now };
    }
  };

  // WebGL Context Setup
  useEffect(() => {
    const glCanvas = glCanvasRef.current;
    if (!glCanvas) return;

    const offscreen = document.createElement('canvas');
    offscreen2dRef.current = offscreen;

    try {
      const gl = glCanvas.getContext('webgl', { alpha: false, antialias: true });
      if (!gl) return;
      glRef.current = gl;

      const compileShader = (type: number, src: string) => {
        const s = gl.createShader(type);
        if (!s) return null;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      };

      const vs = compileShader(gl.VERTEX_SHADER, VERT_SHADER);
      const fs = compileShader(gl.FRAGMENT_SHADER, FRAG_SHADER);
      if (!vs || !fs) return;

      const program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      programRef.current = program;

      const posBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW
      );

      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      textureRef.current = texture;
    } catch {
      // Fallback
    }
  }, []);

  // Continuous 60fps Render Loop
  useEffect(() => {
    const render = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min(32, timestamp - lastTimeRef.current);
      lastTimeRef.current = timestamp;

      if (!ripplesPaused) {
        rippleTimeRef.current += dt;
      }
      const activeTime = rippleTimeRef.current;

      const glCanvas = glCanvasRef.current;
      const offscreen = offscreen2dRef.current;
      if (!glCanvas || !offscreen) {
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      const rect = glCanvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayWidth = Math.floor(rect.width * dpr);
      const displayHeight = Math.floor(rect.height * dpr);

      if (glCanvas.width !== displayWidth || glCanvas.height !== displayHeight) {
        glCanvas.width = displayWidth;
        glCanvas.height = displayHeight;
      }
      if (offscreen.width !== displayWidth || offscreen.height !== displayHeight) {
        offscreen.width = displayWidth;
        offscreen.height = displayHeight;
      }

      const ctx = offscreen.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.scale(dpr, dpr);
        const w = rect.width;
        const h = rect.height;

        ctx.clearRect(0, 0, w, h);

        const palette = themeRef.current;

        // 1. Draw expanding watercolor ripples beneath lily pads
        updateAndDrawRipples(ctx, ripplesRef.current, w, h, activeTime, palette);

        // 2. Draw floating translucent lily pads
        for (const pad of padsRef.current) {
          drawFloatingLilyPad(ctx, pad, w, h, activeTime, palette, defaultNoise);
        }

        // 3. Draw water lily blossoms (smoothly bloom and unbloom)
        const targetGrowth = isHoveredRef.current ? 1.0 : 0.0;
        for (const lily of liliesRef.current) {
          lily.targetGrowth = targetGrowth;
          const diff = lily.targetGrowth - lily.growth;
          const speed = diff < 0 ? lily.growthSpeed * 0.85 : lily.growthSpeed;
          lily.growth += diff * speed;

          drawWaterLilyBlossom(ctx, lily, w, h, activeTime, palette, defaultNoise);
        }

        ctx.restore();
      }

      // WebGL Render
      const gl = glRef.current;
      const program = programRef.current;
      const texture = textureRef.current;

      if (gl && program && texture) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.useProgram(program);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, offscreen);

        const uTex = gl.getUniformLocation(program, 'u_texture');
        const uRes = gl.getUniformLocation(program, 'u_resolution');
        const uTime = gl.getUniformLocation(program, 'u_time');
        const uWater = gl.getUniformLocation(program, 'u_water_color');

        gl.uniform1i(uTex, 0);
        gl.uniform2f(uRes, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.uniform1f(uTime, activeTime * 0.001);
        const [wr, wg, wb] = themeRef.current.waterBg;
        gl.uniform3f(uWater, wr, wg, wb);

        const aPos = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else {
        const directCtx = glCanvas.getContext('2d');
        if (directCtx) {
          directCtx.clearRect(0, 0, glCanvas.width, glCanvas.height);
          directCtx.fillStyle = themeRef.current.waterHex;
          directCtx.fillRect(0, 0, glCanvas.width, glCanvas.height);
          directCtx.drawImage(offscreen, 0, 0);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [ripplesPaused]);

  return (
    <div
      id={id}
      className={`group relative flex flex-col w-full max-w-5xl h-[560px] sm:h-[620px] rounded-3xl bg-[#F2F7F5] border border-stone-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_54px_rgba(0,0,0,0.07)] transition-all duration-500 overflow-hidden cursor-default ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsHovered((prev) => !prev)}
    >
      {/* Sleek Floating Controls: Minimal icon-only buttons with zero text overlay for clean demo recording */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Shift Lotus Color Palette (icon only) */}
          <button
            id="aquatic-palette-shift-button"
            type="button"
            aria-label="Shift aquatic lotus color palette"
            title="Shift lotus color palette"
            onClick={handleShiftPalette}
            className="w-9 h-9 rounded-full flex items-center justify-center border border-stone-200/80 bg-white/80 hover:bg-white text-stone-600 hover:text-stone-900 shadow-xs hover:shadow-sm transition-all backdrop-blur-sm cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-4 h-4 transition-transform group-active:-rotate-45" />
          </button>

          {/* Water Surface Ripple Pause/Resume Toggle (icon only) */}
          <button
            id="aquatic-ripple-toggle-button"
            type="button"
            aria-label={ripplesPaused ? 'Resume water ripples' : 'Pause water ripples'}
            title={ripplesPaused ? 'Resume water ripples' : 'Pause water ripples'}
            onClick={(e) => {
              e.stopPropagation();
              setRipplesPaused((prev) => !prev);
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center border shadow-xs hover:shadow-sm transition-all backdrop-blur-sm cursor-pointer active:scale-95 ${
              ripplesPaused
                ? 'bg-amber-50/90 border-amber-200 text-amber-900 hover:bg-amber-100/90'
                : 'bg-white/80 border-stone-200/80 text-stone-600 hover:bg-white hover:text-stone-900'
            }`}
          >
            {ripplesPaused ? (
              <Play className="w-4 h-4 fill-amber-800 text-amber-800 ml-0.5" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Aquatic Pond Canvas */}
      <div ref={containerRef} className="relative flex-1 w-full h-full">
        <canvas
          ref={glCanvasRef}
          id="aquatic-lily-webgl-canvas"
          className="w-full h-full block cursor-pointer transition-opacity duration-300"
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
        />
      </div>
    </div>
  );
}
