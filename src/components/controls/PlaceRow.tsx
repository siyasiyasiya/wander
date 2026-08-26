'use client'

import type { InkTheme } from '@/lib/theme'
import type { EnrichedPlace } from '@/lib/places/mockEnrich'

export type RowVariant = 'tight' | 'mid' | 'wild'

interface PlaceRowProps {
  place: EnrichedPlace
  idx: number
  dist: string
  variant: RowVariant
  isSelected: boolean
  theme: InkTheme
  onClick: () => void
}

export function PlaceRow({ place, idx, dist, variant, isSelected, theme: t, onClick }: PlaceRowProps) {
  const rank = String(idx + 1).padStart(2, '0')
  const bg = isSelected ? t.sel : 'transparent'

  if (variant === 'tight') {
    return (
      <div
        onClick={onClick}
        className="flex gap-2.5 px-6 py-3 border-b cursor-pointer"
        style={{ borderColor: t.hair, background: bg }}
      >
        <span className="font-mono text-[10px] w-4 flex-none pt-0.5" style={{ color: isSelected ? t.accent : t.faint }}>
          {rank}
        </span>
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[13.5px] font-semibold tracking-tight" style={{ color: t.ink }}>
              {place.name}
            </span>
            <span className="font-mono text-[10px] whitespace-nowrap" style={{ color: t.faint }}>
              {dist}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold" style={{ color: t.ink }}>
              {place.rating}
            </span>
            <span className="text-[11px]" style={{ color: t.faint }}>
              {place.reviewsLabel}
            </span>
            <Dot color={t.border} />
            <span className="text-[11px] font-medium" style={{ color: t.ok }}>
              {place.openLabel}
            </span>
            <Dot color={t.border} />
            <span className="text-[11px]" style={{ color: t.faint }}>
              {place.categories[0] ?? place.tag}
            </span>
          </div>
          <p className="text-xs leading-snug [text-wrap:pretty]" style={{ color: t.muted }}>
            {place.why}
          </p>
        </div>
      </div>
    )
  }

  if (variant === 'mid') {
    return (
      <div
        onClick={onClick}
        className="flex gap-3.5 px-6 py-4 border-b cursor-pointer"
        style={{ borderColor: t.hair, background: bg }}
      >
        {place.photoName ? (
          <img
            src={`/api/photo?name=${encodeURIComponent(place.photoName)}&w=112`}
            alt=""
            className="w-14 h-14 flex-none rounded-md object-cover"
          />
        ) : (
          <div
            className="w-14 h-14 flex-none rounded-md flex items-end p-1"
            style={{ backgroundImage: `repeating-linear-gradient(135deg, ${t.stripeA} 0 6px, ${t.stripeB} 6px 12px)` }}
          >
            <span className="font-mono text-[7px]" style={{ color: t.faint }}>
              photo
            </span>
          </div>
        )}
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[15px] font-semibold tracking-tight" style={{ color: t.ink }}>
              {place.name}
            </span>
            <span className="font-mono text-[10px] whitespace-nowrap" style={{ color: t.faint }}>
              {dist}
            </span>
          </div>
          <p className="text-[13px] leading-snug [text-wrap:pretty] m-0" style={{ color: t.ink }}>
            <span className="font-serif italic text-[15px]">“{place.quote}”</span>{' '}
            <span className="text-[12.5px]" style={{ color: t.muted }}>
              {place.why}
            </span>
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold" style={{ color: t.ink }}>
              {place.rating}
            </span>
            <span className="text-[11px]" style={{ color: t.faint }}>
              {place.reviewsLabel}
            </span>
            <Dot color={t.border} />
            <span className="text-[11px] font-medium" style={{ color: t.ok }}>
              {place.openLabel}
            </span>
            <Dot color={t.border} />
            <span className="text-[10.5px]" style={{ color: t.faint }}>
              {place.src}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className="px-6 pt-2.5 pb-3 border-b cursor-pointer flex flex-col gap-1.5"
      style={{ borderColor: t.hair, background: bg }}
    >
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[10px]" style={{ color: t.faint }}>
          {rank}
        </span>
        <span className="font-serif text-[22px] font-medium leading-tight" style={{ color: t.ink }}>
          {place.name}
        </span>
        <span className="ml-auto font-mono text-[9px] tracking-wide uppercase" style={{ color: t.accentText }}>
          {place.tag}
        </span>
      </div>
      <p className="font-serif italic text-base leading-snug [text-wrap:pretty] m-0" style={{ color: t.ink }}>
        “{place.quote}”
      </p>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9.5px] tracking-wide uppercase" style={{ color: t.muted }}>
          {dist} · {place.rating} ({place.reviews})
        </span>
        <Dot color={t.border} />
        <span className="font-mono text-[9.5px] tracking-wide uppercase" style={{ color: t.ok }}>
          {place.openLabel}
        </span>
        <span className="ml-auto text-[10px]" style={{ color: t.faint }}>
          {place.src}
        </span>
      </div>
    </div>
  )
}

function Dot({ color }: { color: string }) {
  return <span className="w-[3px] h-[3px] rounded-full flex-none" style={{ background: color }} />
}
