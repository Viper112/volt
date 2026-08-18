export function formatViewers(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

export function formatFollowers(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

const CHAT_COLORS = [
  '#ff6b6b',
  '#4dabf7',
  '#69db7c',
  '#ff922b',
  '#b197fc',
  '#22d3ee',
  '#f783ac',
  '#fcc419',
  '#63e6be',
  '#74c0fc',
]

export function colorForName(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return CHAT_COLORS[Math.abs(h) % CHAT_COLORS.length]
}

export function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
