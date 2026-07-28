'use client'

import type { TravelMode } from '@/lib/isochrone/types'

const MODES: { value: TravelMode; label: string }[] = [
  { value: 'walk', label: 'Walk' },
  { value: 'drive', label: 'Drive' },
  { value: 'bike', label: 'Bike' },
]

interface SearchPanelProps {
  timeBudget: number
  travelMode: TravelMode
  category: string
  hasOrigin: boolean
  isLoading: boolean
  onTimeBudgetChange: (v: number) => void
  onTravelModeChange: (m: TravelMode) => void
  onCategoryChange: (v: string) => void
}

export function SearchPanel({
  timeBudget,
  travelMode,
  category,
  hasOrigin,
  isLoading,
  onTimeBudgetChange,
  onTravelModeChange,
  onCategoryChange,
}: SearchPanelProps) {
  return (
    <div className="flex flex-col gap-6 p-4 border-b border-zinc-100">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Wander</h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          {hasOrigin
            ? isLoading
              ? 'Drawing your zone…'
              : 'Click the map to move your pin.'
            : 'Click anywhere on the map to start.'}
        </p>
      </div>

      <div>
        <div className="flex justify-between items-baseline mb-1.5">
          <label className="text-xs font-medium text-zinc-600 uppercase tracking-wide">Time budget</label>
          <span className="text-sm font-semibold text-indigo-600">{timeBudget} min</span>
        </div>
        <input
          type="range"
          min={5}
          max={60}
          step={5}
          value={timeBudget}
          onChange={(e) => onTimeBudgetChange(Number(e.target.value))}
          className="w-full accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-zinc-400 mt-0.5">
          <span>5</span>
          <span>60</span>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-zinc-600 uppercase tracking-wide block mb-1.5">
          Travel mode
        </label>
        <div className="flex gap-1.5">
          {MODES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onTravelModeChange(value)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                travelMode === value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-indigo-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-zinc-600 uppercase tracking-wide block mb-1.5">
          Looking for…
        </label>
        <input
          type="text"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          placeholder="coffee, dentist, park…"
          className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:border-indigo-400 placeholder:text-zinc-300"
        />
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="inline-block w-3.5 h-3.5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
          Fetching reachable area…
        </div>
      )}
    </div>
  )
}
