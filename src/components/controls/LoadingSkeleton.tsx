'use client'

import type { InkTheme } from '@/lib/theme'

const BARS = [
  { a: '72%', b: '46%' },
  { a: '58%', b: '52%' },
  { a: '80%', b: '40%' },
  { a: '64%', b: '48%' },
  { a: '70%', b: '38%' },
]

export function LoadingSkeleton({ theme: t }: { theme: InkTheme }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-2.5 border-b" style={{ borderColor: t.line }}>
        <span
          className="w-2.5 h-2.5 rounded-full border-2 animate-spin"
          style={{ borderColor: t.border, borderTopColor: t.accentText }}
        />
        <span className="font-mono text-[9.5px] tracking-widest uppercase" style={{ color: t.faint }}>
          Drawing your edge
        </span>
      </div>
      {BARS.map((s, i) => (
        <div key={i} className="px-6 py-[15px] border-b flex flex-col gap-2" style={{ borderColor: t.hair }}>
          <div className="h-[9px] rounded-full" style={{ background: t.trackBg, width: s.a }} />
          <div className="h-[7px] rounded-full" style={{ background: t.hair, width: s.b }} />
        </div>
      ))}
    </div>
  )
}
