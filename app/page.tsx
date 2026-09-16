'use client';

import React, { useState } from 'react';
import { PanoramicMeadowCard } from '@/components/PanoramicMeadowCard';
import { MoonlitFernCard } from '@/components/MoonlitFernCard';
import { AquaticLilyCard } from '@/components/AquaticLilyCard';
import { Flower2, Moon, Droplets, LayoutGrid } from 'lucide-react';

type SpecimenMode = 'all' | 'meadow' | 'moonlit' | 'aquatic';

export default function Page() {
  const [activeMode, setActiveMode] = useState<SpecimenMode>('meadow');

  return (
    <main
      id="main-app"
      className="min-h-screen w-full bg-[#F6F5F1] text-stone-800 antialiased flex flex-col items-center py-6 sm:py-10 px-4 sm:px-8 selection:bg-stone-200 selection:text-stone-900"
    >
      {/* Top Minimal Concept Switcher Pill Bar (Pristine for demo recording) */}
      <nav
        id="specimen-switcher-nav"
        aria-label="Botanical Specimen Switcher"
        className="sticky top-4 z-40 mb-8 sm:mb-12 flex items-center gap-1.5 p-1.5 rounded-full bg-white/80 backdrop-blur-md border border-stone-200/80 shadow-xs"
      >
        <button
          id="btn-switch-meadow"
          type="button"
          onClick={() => setActiveMode('meadow')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
            activeMode === 'meadow'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
          }`}
        >
          <Flower2 className="w-3.5 h-3.5" />
          <span>Wildflower Meadow</span>
        </button>

        <button
          id="btn-switch-moonlit"
          type="button"
          onClick={() => setActiveMode('moonlit')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
            activeMode === 'moonlit'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Moonlit Spores</span>
        </button>

        <button
          id="btn-switch-aquatic"
          type="button"
          onClick={() => setActiveMode('aquatic')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
            activeMode === 'aquatic'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
          }`}
        >
          <Droplets className="w-3.5 h-3.5" />
          <span>Aquatic Lily Pond</span>
        </button>

        <div className="w-px h-4 bg-stone-200 mx-0.5" />

        <button
          id="btn-switch-all"
          type="button"
          title="View all concepts on same page"
          onClick={() => setActiveMode('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
            activeMode === 'all'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">All</span>
        </button>
      </nav>

      {/* Main Specimen Showcase Container */}
      <div className="w-full max-w-5xl flex flex-col items-center gap-12 sm:gap-16">
        {(activeMode === 'meadow' || activeMode === 'all') && (
          <section
            id="specimen-wildflower-meadow"
            className="w-full flex flex-col items-center"
          >
            <PanoramicMeadowCard id="panoramic-meadow-specimen" />
          </section>
        )}

        {(activeMode === 'moonlit' || activeMode === 'all') && (
          <section
            id="specimen-moonlit-fern"
            className="w-full flex flex-col items-center"
          >
            <MoonlitFernCard id="moonlit-fern-specimen" />
          </section>
        )}

        {(activeMode === 'aquatic' || activeMode === 'all') && (
          <section
            id="specimen-aquatic-lily"
            className="w-full flex flex-col items-center"
          >
            <AquaticLilyCard id="aquatic-lily-specimen" />
          </section>
        )}
      </div>
    </main>
  );
}
