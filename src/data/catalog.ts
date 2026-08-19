import type { Category, Clip, Stream, Streamer } from '../types'

function img(seed: string, w = 640, h = 360) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`
}

export const categories: Category[] = [
  { slug: 'just-chatting', name: 'Just Chatting', image: img('just-chatting', 400, 533), tags: ['IRL'] },
  { slug: 'irl', name: 'IRL', image: img('irl-city', 400, 533), tags: ['IRL'] },
  { slug: 'gta-v', name: 'Grand Theft Auto V', image: img('gta-city', 400, 533), tags: ['Adventure'] },
  { slug: 'fortnite', name: 'Fortnite', image: img('fortnite-game', 400, 533), tags: ['Shooter'] },
  { slug: 'league-of-legends', name: 'League of Legends', image: img('league-esports', 400, 533), tags: ['MOBA'] },
  { slug: 'call-of-duty', name: 'Call of Duty', image: img('cod-war', 400, 533), tags: ['FPS'] },
  { slug: 'counter-strike-2', name: 'Counter-Strike 2', image: img('cs2-fps', 400, 533), tags: ['FPS'] },
  { slug: 'valorant', name: 'Valorant', image: img('valorant-game', 400, 533), tags: ['FPS'] },
  { slug: 'minecraft', name: 'Minecraft', image: img('minecraft-blocks', 400, 533), tags: ['Adventure'] },
  { slug: 'slots-casino', name: 'Slots & Casino', image: img('casino-neon', 400, 533), tags: ['Gambling'] },
  { slug: 'music', name: 'Music', image: img('dj-music', 400, 533), tags: ['Creative'] },
  { slug: 'chess', name: 'Chess', image: img('chess-board', 400, 533), tags: ['Strategy'] },
  { slug: 'sports', name: 'Sports', image: img('sports-arena', 400, 533), tags: ['IRL'] },
  { slug: 'art', name: 'Art', image: img('art-studio', 400, 533), tags: ['Creative'] },
]

export const streamers: Streamer[] = []
export const streams: Stream[] = []
export const clips: Clip[] = []

export function avatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1a1d21`
}

export function streamerByUsername(username: string) {
  return streamers.find((s) => s.username.toLowerCase() === username.toLowerCase())
}

export function categoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug)
}

export function categoryName(slug: string) {
  return categoryBySlug(slug)?.name ?? slug
}
