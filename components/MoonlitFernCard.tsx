'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import {
  MOONLIT_THEMES,
  MoonlitPalette,
  FiddleheadFern,
  MoonlitSpore,
  generateMoonlitFerns,
  generateMoonlitSpores,
  drawMoonlitFernFrond,
  updateAndDrawSpores,
} from '@/lib/moonlit-fern';
import { defaultNoise } from '@/lib/noise';

export interface MoonlitFernCardProps {
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
uniform vec3 u_paper_color;

varying vec2 v_uv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float paperGrain(vec2 uv) {
  vec2 p = uv * vec2(u_resolution.x / 120.0, u_resolution.y / 120.0);
  float n = 0.0;
  n += 0.50 * hash(floor(p * 2.0));
  n += 0.25 * hash(floor(p * 4.0));
  return n;
}

void main() {
  vec2 uv = v_uv;
  vec4 tex = texture2D(u_texture, uv);

  // Deep nocturnal washi paper texture
  float grain = paperGrain(uv);
  vec3 bg = u_paper_color + (grain - 0.5) * 0.015;

  // Luminous glow additive blend over dark paper
  vec3 finalColor = bg + tex.rgb * tex.a;

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

export function MoonlitFernCard({
  id = 'moonlit-fern-card',
  className = '',
}: MoonlitFernCardProps) {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [windPaused, setWindPaused] = useState<boolean>(false);
  const [themeIndex, setThemeIndex] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreen2dRef = useRef<HTMLCanvasElement | null>(null);

  // WebGL references
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);

  // State refs for continuous 60fps render loop
  const isHoveredRef = useRef<boolean>(false);
  const fernsRef = useRef<FiddleheadFern[]>([]);
  const sporesRef = useRef<MoonlitSpore[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const mousePosRef = useRef<{ x: number; y: number; active: boolean; targetWind: number; wind: number }>({
    x: 0,
    y: 0,
    active: false,
    targetWind: 0,
    wind: 0,
  });
  const windTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number | null>(null);

  const currentTheme: MoonlitPalette = MOONLIT_THEMES[themeIndex % MOONLIT_THEMES.length];
  const themeRef = useRef<MoonlitPalette>(currentTheme);
  useEffect(() => {
    themeRef.current = currentTheme;
  }, [currentTheme]);

  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  // Initialize botanical ferns and luminous spores
  useEffect(() => {
    fernsRef.current = generateMoonlitFerns(9);
    sporesRef.current = generateMoonlitSpores(52, themeRef.current);
  }, []);

  // Shift color spectrum
  const handleShiftPalette = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setThemeIndex((prev) => (prev + 1) % MOONLIT_THEMES.length);
    // Refresh spore colors with new theme
    const nextTheme = MOONLIT_THEMES[(themeIndex + 1) % MOONLIT_THEMES.length];
    sporesRef.current.forEach((s, idx) => {
      s.color = nextTheme.sporePrimary[idx % nextTheme.sporePrimary.length];
      s.glow = nextTheme.sporeGlow;
    });
  }, [themeIndex]);

  // Click to drop a fresh fiddlehead bud at cursor
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickNormX = (e.clientX - rect.left) / rect.width;
    const clickYFraction = (e.clientY - rect.top) / rect.height;

    const newFern: FiddleheadFern = {
      x: clickNormX,
      maxHeight: Math.max(0.45, Math.min(0.85, 1.0 - clickYFraction + 0.15)),
      growth: 0.1,
      targetGrowth: 1.0,
      growthSpeed: 0.025,
      curveDir: clickNormX > 0.5 ? -1 : 1,
      seed: Math.random() * 10000,
      pinnaePairs: 10,
      paletteIndex: fernsRef.current.length % 3,
    };
    fernsRef.current.push(newFern);

    // Sprout local burst of spores
    for (let i = 0; i < 6; i++) {
      sporesRef.current.push({
        x: clickNormX + (Math.random() - 0.5) * 0.05,
        y: clickYFraction + (Math.random() - 0.5) * 0.05,
        baseX: clickNormX + (Math.random() - 0.5) * 0.05,
        baseY: clickYFraction + (Math.random() - 0.5) * 0.05,
        vx: 0,
        vy: 0,
        size: 2.0 + Math.random() * 2.5,
        alpha: 0.8,
        pulsePhase: Math.random() * Math.PI * 2,
        color: currentTheme.sporePrimary[i % currentTheme.sporePrimary.length],
        glow: currentTheme.sporeGlow,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mousePosRef.current.x = e.clientX - rect.left;
    mousePosRef.current.y = e.clientY - rect.top;
    mousePosRef.current.active = true;
    mousePosRef.current.targetWind = ((e.clientX - rect.left) / rect.width - 0.5) * 1.5;
  };

  const handleMouseLeave = () => {
    mousePosRef.current.active = false;
    mousePosRef.current.targetWind = 0;
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
      // Fallback to 2D
    }
  }, []);

  // Continuous 60fps Render Loop
  useEffect(() => {
    const render = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min(32, timestamp - lastTimeRef.current);
      lastTimeRef.current = timestamp;

      if (!windPaused) {
        windTimeRef.current += dt;
      }
      const activeWindTime = windTimeRef.current;

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

        // Smooth wind easing
        mousePosRef.current.wind +=
          (mousePosRef.current.targetWind - mousePosRef.current.wind) * 0.08;
        const windX = mousePosRef.current.wind + (windPaused ? 0 : Math.sin(activeWindTime * 0.001) * 0.2);

        // Update Ferns growth smoothly (graceful uncurling and coiling back)
        const targetGrowth = isHoveredRef.current ? 1.0 : 0.0;
        const palette = themeRef.current;

        for (const fern of fernsRef.current) {
          fern.targetGrowth = targetGrowth;
          const diff = fern.targetGrowth - fern.growth;
          const speed = diff < 0 ? fern.growthSpeed * 0.85 : fern.growthSpeed;
          fern.growth += diff * speed;

          drawMoonlitFernFrond(ctx, fern, w, h, windX, activeWindTime, palette, defaultNoise);
        }

        // Update and draw bioluminescent drifting spores
        updateAndDrawSpores(
          ctx,
          sporesRef.current,
          w,
          h,
          activeWindTime,
          windX,
          mousePosRef.current,
          defaultNoise
        );

        ctx.restore();
      }

      // WebGL Shader render
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
        const uPaper = gl.getUniformLocation(program, 'u_paper_color');

        gl.uniform1i(uTex, 0);
        gl.uniform2f(uRes, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.uniform1f(uTime, activeWindTime * 0.001);
        const [pr, pg, pb] = themeRef.current.paperColor;
        gl.uniform3f(uPaper, pr, pg, pb);

        const aPos = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else {
        const directCtx = glCanvas.getContext('2d');
        if (directCtx) {
          directCtx.clearRect(0, 0, glCanvas.width, glCanvas.height);
          directCtx.fillStyle = themeRef.current.paperHex;
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
  }, [windPaused]);

  return (
    <div
      id={id}
      className={`group relative flex flex-col w-full max-w-5xl h-[560px] sm:h-[620px] rounded-3xl bg-[#080D12] border border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.5)] transition-all duration-500 overflow-hidden cursor-default ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsHovered((prev) => !prev)}
    >
      {/* Sleek Floating Controls: Minimal icon-only buttons with zero text overlay for clean demo recording */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Shift Color Spectrum (icon only) */}
          <button
            id="moonlit-palette-shift-button"
            type="button"
            aria-label="Shift bioluminescent color spectrum"
            title="Shift bioluminescent spectrum"
            onClick={handleShiftPalette}
            className="w-9 h-9 rounded-full flex items-center justify-center border border-white/15 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white shadow-xs hover:shadow-sm transition-all backdrop-blur-md cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-4 h-4 transition-transform group-active:-rotate-45" />
          </button>

          {/* Wind Animation Pause/Resume Toggle (icon only) */}
          <button
            id="moonlit-wind-toggle-button"
            type="button"
            aria-label={windPaused ? 'Resume wind drift' : 'Pause wind drift'}
            title={windPaused ? 'Resume wind drift' : 'Pause wind drift'}
            onClick={(e) => {
              e.stopPropagation();
              setWindPaused((prev) => !prev);
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center border shadow-xs hover:shadow-sm transition-all backdrop-blur-md cursor-pointer active:scale-95 ${
              windPaused
                ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                : 'bg-white/10 border-white/15 text-white/80 hover:bg-white/20 hover:text-white'
            }`}
          >
            {windPaused ? (
              <Play className="w-4 h-4 fill-amber-300 text-amber-300 ml-0.5" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Nocturnal Botanical Canvas */}
      <div ref={containerRef} className="relative flex-1 w-full h-full">
        <canvas
          ref={glCanvasRef}
          id="moonlit-fern-webgl-canvas"
          className="w-full h-full block cursor-pointer transition-opacity duration-300"
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      </div>
    </div>
  );
}
