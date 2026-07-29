export type IntentMode = 0 | 1 | 2

export interface InkTheme {
  shell: string
  panel: string
  field: string
  line: string
  hair: string
  border: string
  trackBg: string
  ink: string
  muted: string
  faint: string
  accent: string
  accentText: string
  onAccent: string
  chip: string
  stripeA: string
  stripeB: string
  sel: string
  ok: string
}

const PAPER = ['#eff1e8', '#f3f2e6', '#f7f2e2'] as const
const INK = ['#17452c', '#6d7d16', '#c98a06'] as const
const TEXT = ['#14200f', '#1f2110', '#2a2109'] as const
const ACCENT_TEXT = ['#17452c', '#5c6a14', '#8a5e04'] as const

function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

export function getInkTheme(mode: IntentMode): InkTheme {
  const paper = PAPER[mode]
  const ink = INK[mode]
  const text = TEXT[mode]
  return {
    shell: paper,
    panel: paper,
    field: 'rgba(255,255,255,.6)',
    line: hexA(text, 0.1),
    hair: hexA(text, 0.06),
    border: hexA(text, 0.2),
    trackBg: hexA(text, 0.08),
    ink: text,
    muted: hexA(text, 0.7),
    faint: hexA(text, 0.45),
    accent: ink,
    accentText: ACCENT_TEXT[mode],
    onAccent: mode === 2 ? '#241c07' : '#fbfcf5',
    chip: 'rgba(255,255,255,.9)',
    stripeA: hexA(text, 0.11),
    stripeB: hexA(text, 0.05),
    sel: hexA(ink, 0.1),
    ok: '#2f6b3a',
  }
}

export const STOP_LABELS: Record<IntentMode, string> = {
  0: 'Exactly this',
  1: 'Something like',
  2: 'Surprise me',
}

export const READBACK: Record<IntentMode, string> = {
  0: 'Read as a specific need. No guessing — every reachable match, ranked by quality then walk time.',
  1: 'Read as a vibe. A few that fit, nudged a little off the obvious answer.',
  2: 'Fully open. A few you would not have searched for, weighted to excellent-but-overlooked.',
}
