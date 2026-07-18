"use client";

import { useState } from "react";

// Before-after comparison slider
// Step 1: styled placeholder blocks
// Future: read from `gallery_results` table
export default function BeforeAfterSlider() {
  const [sliderPosition, setSliderPosition] = useState(50);

  return (
    <section id="hasil" className="w-full py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-2 text-center text-3xl font-bold text-white">
          Before & After
        </h2>
        <p className="mb-12 text-center text-sm text-zinc-400">
          Lihat perubahan sepatu setelah dirawat.
        </p>

        <div className="mx-auto max-w-2xl">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
            <div className="relative h-[300px] w-full sm:h-[400px]">
              {/* Before layer */}
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-700">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-32 w-48 rounded-xl bg-zinc-600/80 sm:h-40 sm:w-64" />
                  <p className="text-sm font-bold tracking-widest text-zinc-400">
                    SEBELUM
                  </p>
                </div>
              </div>

              {/* After layer — clipped by slider */}
              <div
                className="absolute inset-0 flex items-center justify-center bg-yellow-900/40"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <div className="text-center">
                  <div className="mx-auto mb-3 h-32 w-48 rounded-xl bg-yellow-400/30 sm:h-40 sm:w-64" />
                  <p className="text-sm font-bold tracking-widest text-yellow-300">
                    SESUDAH
                  </p>
                </div>
              </div>

              {/* Slider line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-yellow-400"
                style={{ left: `${sliderPosition}%` }}
              />
            </div>

            {/* Range input */}
            <div className="p-4">
              <label htmlFor="before-after-slider" className="sr-only">
                Geser untuk melihat perbandingan
              </label>
              <input
                id="before-after-slider"
                type="range"
                min={0}
                max={100}
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="w-full cursor-pointer accent-yellow-400"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}