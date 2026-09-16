'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FloralShaderCanvas } from './FloralShaderCanvas';
import { Pause, Play, RotateCcw } from 'lucide-react';
import {
  getDeterministicMeadowColorMixture,
  generateRandomMeadowColorMixture,
} from '@/lib/p5-palette';
import { FlowerPalette } from '@/lib/watercolor-brush';

export interface PanoramicMeadowCardProps {
  id?: string;
  initialHovered?: boolean;
  initialWindPaused?: boolean;
  className?: string;
}

export function PanoramicMeadowCard({
  id = 'panoramic-meadow-card',
  initialHovered = false,
  initialWindPaused = false,
  className = '',
}: PanoramicMeadowCardProps) {
  const [isHovered, setIsHovered] = useState<boolean>(initialHovered);
  const [windPaused, setWindPaused] = useState<boolean>(initialWindPaused);

  // Multi-color mixture palettes for hydration-safe initial SSR & client render
  const [mixedPalettes, setMixedPalettes] = useState<FlowerPalette[]>(() =>
    getDeterministicMeadowColorMixture()
  );
  const [paletteSeed, setPaletteSeed] = useState<number>(100);

  // On client mount / re-mount, dynamically shift the mixture of colors using p5.js color lerping
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setMixedPalettes(generateRandomMeadowColorMixture());
      setPaletteSeed(Date.now());
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  // Shift the mixture of floral hues across the meadow
  const handleResetPalette = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMixedPalettes(generateRandomMeadowColorMixture());
    setPaletteSeed(Date.now());
  }, []);

  return (
    <div
      id={id}
      className={`group relative flex flex-col w-full max-w-5xl h-[560px] sm:h-[620px] rounded-3xl bg-[#FCFCFB] border border-stone-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_54px_rgba(0,0,0,0.07)] transition-all duration-500 overflow-hidden cursor-default ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsHovered((prev) => !prev)}
    >
      {/* Sleek Floating Controls: Minimal icon-only buttons with zero text overlay for clean demo recording */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Shift Mixture of Floral Hues button (icon only) */}
          <button
            id="palette-reset-button"
            type="button"
            aria-label="Shift floral color mixture"
            title="Shift floral color mixture"
            onClick={handleResetPalette}
            className="w-9 h-9 rounded-full flex items-center justify-center border border-stone-200/80 bg-white/80 hover:bg-white text-stone-600 hover:text-stone-900 shadow-xs hover:shadow-sm transition-all backdrop-blur-sm cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-4 h-4 transition-transform group-active:-rotate-45" />
          </button>

          {/* Wind Animation Pause/Resume Toggle (icon only) */}
          <button
            id="wind-toggle-button"
            type="button"
            aria-label={windPaused ? 'Resume wind animation' : 'Pause wind animation'}
            title={windPaused ? 'Resume wind animation' : 'Pause wind animation'}
            onClick={(e) => {
              e.stopPropagation();
              setWindPaused((prev) => !prev);
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center border shadow-xs hover:shadow-sm transition-all backdrop-blur-sm cursor-pointer active:scale-95 ${
              windPaused
                ? 'bg-amber-50/90 border-amber-200 text-amber-900 hover:bg-amber-100/90'
                : 'bg-white/80 border-stone-200/80 text-stone-600 hover:bg-white hover:text-stone-900'
            }`}
          >
            {windPaused ? (
              <Play className="w-4 h-4 fill-amber-800 text-amber-800 ml-0.5" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Botanical Canvas with rich mixture of colors */}
      <div className="relative flex-1 w-full h-full">
        <FloralShaderCanvas
          paletteMix={mixedPalettes}
          paletteSeed={paletteSeed}
          preset="panoramic"
          stemCount={22}
          isHovered={isHovered}
          enableShader={true}
          windIntensity={0.7}
          windPaused={windPaused}
          interactive={true}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
