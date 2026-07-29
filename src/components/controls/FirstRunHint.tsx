'use client'

import type { InkTheme } from '@/lib/theme'

export function FirstRunHint({ theme: t }: { theme: InkTheme }) {
  return (
    <div
      className="mx-6 my-[18px] p-[17px] rounded-xl border border-dashed flex flex-col gap-2.5"
      style={{ borderColor: t.border, background: t.field }}
    >
      <span className="font-mono text-[9.5px] tracking-widest uppercase" style={{ color: t.accentText }}>
        Start here
      </span>
      <p className="m-0 text-[13px] leading-relaxed [text-wrap:pretty]" style={{ color: t.muted }}>
        Drop a point on the map. Every minute is measured from there — real streets, not straight lines.
      </p>
    </div>
  )
}
