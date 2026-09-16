'use client';

import React, { useState } from 'react';
import { FloralShaderCanvas } from './FloralShaderCanvas';
import { Sparkles, RefreshCw, Plus, Wind } from 'lucide-react';

export interface FloralCardProps {
  id: string;
  specimenNumber: string;
  title: string;
  botanicalName: string;
  paletteKey: string;
  preset?: 'dense' | 'minimal' | 'trio' | 'meadow';
  stemCount?: number;
  description?: string;
  initialHovered?: boolean;
}

export function FloralCard({
  id,
  specimenNumber,
  title,
  botanicalName,
  paletteKey,
  preset = 'dense',
  stemCount = 8,
  description,
  initialHovered = false,
}: FloralCardProps) {
  const [isHovered, setIsHovered] = useState<boolean>(initialHovered);
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [bloomState, setBloomState] = useState<'dormant' | 'budding' | 'bloomed'>('dormant');
  const [remountKey, setRemountKey] = useState<number>(0);
  const [activeStemCount, setActiveStemCount] = useState<number>(stemCount);

  const effectiveHovered = isHovered || isPinned;

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRemountKey((prev) => prev + 1);
    setActiveStemCount(stemCount);
  };

  const handleAddStem = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveStemCount((prev) => Math.min(prev + 3, 20));
  };

  const togglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPinned((prev) => !prev);
  };

  return (
    <div
      id={`card-${id}`}
      className="group relative flex flex-col h-[540px] w-full rounded-2xl bg-[#FCFCFB] border border-stone-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.07)] transition-all duration-500 overflow-hidden cursor-default"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsHovered((prev) => !prev)}
    >
      {/* Top Header Information inside card */}
      <div className="relative z-10 flex items-start justify-between px-6 pt-5 pb-2 pointer-events-none">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-stone-400">
              {specimenNumber}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide transition-colors duration-300 ${
                effectiveHovered
                  ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                  : 'bg-stone-100 text-stone-500 border border-stone-200/50'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  effectiveHovered ? 'bg-amber-500 animate-pulse' : 'bg-stone-300'
                }`}
              />
              {effectiveHovered
                ? bloomState === 'bloomed'
                  ? 'In Full Bloom'
                  : 'Blooming...'
                : 'Hover to Bloom'}
            </span>
          </div>
          <h3 className="mt-1 text-lg font-serif font-medium text-stone-900 tracking-tight">
            {title}
          </h3>
          <p className="text-xs italic text-stone-500 font-serif">
            {botanicalName}
          </p>
        </div>

        {/* Action Controls (Pointer Events Enabled) */}
        <div className="pointer-events-auto flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
          <button
            id={`btn-add-${id}`}
            title="Sprout more stems"
            onClick={handleAddStem}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/80 hover:bg-white text-stone-600 hover:text-stone-900 border border-stone-200/70 shadow-xs text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            id={`btn-reset-${id}`}
            title="Regenerate garden"
            onClick={handleReset}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/80 hover:bg-white text-stone-600 hover:text-stone-900 border border-stone-200/70 shadow-xs text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            id={`btn-pin-${id}`}
            title={isPinned ? 'Unfreeze bloom' : 'Keep bloomed'}
            onClick={togglePin}
            className={`w-7 h-7 flex items-center justify-center rounded-lg border shadow-xs text-xs transition-colors cursor-pointer ${
              isPinned
                ? 'bg-amber-100 border-amber-300 text-amber-800'
                : 'bg-white/80 hover:bg-white text-stone-600 hover:text-stone-900 border-stone-200/70'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Floral Canvas Area (Shader + Generative Brush) */}
      <div className="relative flex-1 w-full min-h-[360px]">
        <FloralShaderCanvas
          key={`${id}-${remountKey}`}
          paletteKey={paletteKey}
          preset={preset}
          stemCount={activeStemCount}
          isHovered={effectiveHovered}
          enableShader={true}
          windIntensity={0.6}
          interactive={true}
          onBloomStateChange={setBloomState}
          className="absolute inset-0"
        />

        {/* Subtle interactive hint overlay when dormant */}
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-700 ${
            effectiveHovered ? 'opacity-0' : 'opacity-40 group-hover:opacity-0'
          }`}
        >
          <div className="px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur-xs border border-stone-200/60 shadow-xs text-[11px] font-sans text-stone-600 tracking-wide">
            Hover cursor to grow & bloom
          </div>
        </div>
      </div>

      {/* Bottom Card Footer */}
      <div className="relative z-10 px-6 py-4 bg-white/70 backdrop-blur-xs border-t border-stone-100 flex items-center justify-between pointer-events-none">
        <p className="text-xs text-stone-500 font-sans line-clamp-1">
          {description || 'Interactive watercolor shader with p5.js brush physics.'}
        </p>
        <div className="flex items-center gap-2 shrink-0 text-[11px] text-stone-400 font-mono">
          <Wind className="w-3 h-3 text-stone-400" />
          <span>Breeze active</span>
        </div>
      </div>
    </div>
  );
}
