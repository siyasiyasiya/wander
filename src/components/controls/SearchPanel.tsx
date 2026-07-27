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
  hasOrigin: boolean
  isLoading: boolean
  onTimeBudgetChange: (v: number) => void
  onTravelModeChange: (m: TravelMode) => void
}

export function SearchPanel({
  timeBudget,
  travelMode,
  hasOrigin,
  isLoading,
  onTimeBudgetChange,
  onTravelModeChange,
}: SearchPanelProps) {
  return (
    <div className="flex flex-col gap-8 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Wander</h1>
        <p className="text-sm text-zinc-400 mt-1">
          {hasOrigin
            ? isLoading
              ? 'Drawing your zone…'
              : 'Click the map to move your pin.'
            : 'Click anywhere on the map to start.'}
        </p>
      </div>

      <div>
        <div className="flex justify-between items-baseline mb-2">
          <label className="text-sm font-medium text-zinc-700">Time budget</label>
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
        <div className="flex justify-between text-xs text-zinc-400 mt-1">
          <span>5 min</span>
          <span>60 min</span>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-700 block mb-2">Travel mode</label>
        <div className="flex gap-2">
          {MODES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onTravelModeChange(value)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
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

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
          Fetching reachable area…
        </div>
      )}
    </div>
  )
}
