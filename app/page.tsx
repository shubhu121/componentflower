'use client';

import React from 'react';
import { PanoramicMeadowCard } from '@/components/PanoramicMeadowCard';

export default function Page() {
  return (
    <main
      id="main-app"
      className="min-h-screen w-full bg-[#F6F5F1] text-stone-800 antialiased flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 selection:bg-rose-100 selection:text-rose-900"
    >
      <div className="w-full flex items-center justify-center">
        <PanoramicMeadowCard id="panoramic-meadow-specimen" />
      </div>
    </main>
  );
}
