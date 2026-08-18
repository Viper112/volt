import type { Category, Clip, Stream, Streamer } from '../types'

const V = {
  bunny:
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  elephants:
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  sintel:
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  steel:
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  blazes:
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  escapes:
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  joyrides:
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  meltdowns:
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  fun: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  subaru:
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
}

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

export const streamers: Streamer[] = [
  { username: 'nova', displayName: 'Nova', verified: true, followers: 2_410_000, bio: 'Late nights. Loud takes. Zero chill.', seed: 'NovaLive', socials: { x: 'nova', youtube: 'novalive', discord: 'nova' } },
  { username: 'drift', displayName: 'Drift', verified: true, followers: 890_000, bio: 'City nights and unscripted chaos.', seed: 'DriftIRL', socials: { instagram: 'drift', x: 'drift' } },
  { username: 'kira', displayName: 'Kira', verified: true, followers: 1_120_000, bio: 'Ranked grind. Clutch or kick.', seed: 'KiraFPS', socials: { x: 'kira', youtube: 'kira' } },
  { username: 'blaze', displayName: 'Blaze', verified: true, followers: 640_000, bio: 'GTA RP until the server begs.', seed: 'BlazeRP', socials: { x: 'blaze' } },
  { username: 'echo', displayName: 'Echo', verified: false, followers: 188_000, bio: 'Just chatting, actually chatting.', seed: 'EchoChat', socials: { discord: 'echo' } },
  { username: 'raven', displayName: 'Raven', verified: true, followers: 410_000, bio: 'Music, beats, and bad decisions.', seed: 'RavenBeats', socials: { instagram: 'raven', youtube: 'raven' } },
  { username: 'jett', displayName: 'Jett', verified: true, followers: 980_000, bio: 'Radiant lobby tourist.', seed: 'JettVal', socials: { x: 'jett' } },
  { username: 'orion', displayName: 'Orion', verified: false, followers: 76_000, bio: 'Blocks, builds, and bittersweet lore.', seed: 'OrionCraft', socials: { youtube: 'orion' } },
  { username: 'luna', displayName: 'Luna', verified: true, followers: 1_540_000, bio: 'IRL, unfiltered, always moving.', seed: 'LunaGoes', socials: { instagram: 'luna', x: 'luna' } },
  { username: 'vex', displayName: 'Vex', verified: false, followers: 54_000, bio: 'Slots. Superstition. Science.', seed: 'VexSpin', socials: { x: 'vex' } },
  { username: 'ash', displayName: 'Ash', verified: true, followers: 320_000, bio: 'Call of Duty until the sun comes up.', seed: 'AshCod', socials: { x: 'ash', youtube: 'ash' } },
  { username: 'pixel', displayName: 'Pixel', verified: false, followers: 91_000, bio: 'Drawing live. Commissioning chaos.', seed: 'PixelArt', socials: { instagram: 'pixel' } },
  { username: 'rook', displayName: 'Rook', verified: true, followers: 210_000, bio: 'Chess speedrun. No takebacks.', seed: 'RookChess', socials: { x: 'rook' } },
  { username: 'hex', displayName: 'Hex', verified: true, followers: 470_000, bio: 'League until diamond or delusion.', seed: 'HexMid', socials: { x: 'hex', youtube: 'hex' } },
  { username: 'surge', displayName: 'Surge', verified: false, followers: 133_000, bio: 'CS2 aim training and unrated hopium.', seed: 'SurgeCS', socials: { x: 'surge' } },
  { username: 'milo', displayName: 'Milo', verified: false, followers: 44_000, bio: 'Sports talk that actually watches the game.', seed: 'MiloSports', socials: { x: 'milo' } },
  { username: 'nyx', displayName: 'Nyx', verified: true, followers: 705_000, bio: 'Fortnite arena. Zero builds optional.', seed: 'NyxFN', socials: { youtube: 'nyx' } },
  { username: 'coil', displayName: 'Coil', verified: false, followers: 28_000, bio: 'Variety, vibes, voice cracks.', seed: 'CoilVibes', socials: { discord: 'coil' } },
  { username: 'sage', displayName: 'Sage', verified: false, followers: 62_000, bio: 'VOD reviews and ranked nights.', seed: 'SageVod', socials: { x: 'sage' } },
]

export const streams: Stream[] = [
  { id: 's1', username: 'nova', title: 'UNFILTERED TAKES — phones away, chat on blast', category: 'just-chatting', language: 'English', mature: false, viewers: 41200, thumbnail: img('photo-1516321318423-f06f85e504b3', 800), videoUrl: V.bunny, tags: ['English'], featured: true, source: 'vod' },
  { id: 's2', username: 'luna', title: 'N3on energy with none of the agenda — city walk', category: 'irl', language: 'English', mature: false, viewers: 28600, thumbnail: img('photo-1514565131-fce0801e5785', 800), videoUrl: V.subaru, tags: ['English', 'Travel'], featured: true, source: 'vod' },
  { id: 's3', username: 'blaze', title: 'MR K CRIMINAL MASTERMIND — Prodigy RP day 40', category: 'gta-v', language: 'English', mature: true, viewers: 19400, thumbnail: img('photo-1480714378408-67cf0d13bc1b', 800), videoUrl: V.escapes, tags: ['English', 'RP'], featured: true, source: 'vod' },
  { id: 's4', username: 'kira', title: 'Radiant only. If I throw, clip it.', category: 'valorant', language: 'English', mature: false, viewers: 15800, thumbnail: img('photo-1606144042614-b2417e99c4e3', 800), videoUrl: V.blazes, tags: ['English', 'Ranked'], featured: true, source: 'vod' },
  { id: 's5', username: 'jett', title: 'duo queue with the homies, then ranked depression', category: 'valorant', language: 'English', mature: false, viewers: 12100, thumbnail: img('photo-1542751371-adc38448a05e', 800), videoUrl: V.fun, tags: ['English'], featured: true, source: 'vod' },
  { id: 's6', username: 'hex', title: 'MID OR FEED — one-trick until Masters', category: 'league-of-legends', language: 'English', mature: false, viewers: 9800, thumbnail: img('photo-1538481199705-c7403e645b90', 800), videoUrl: V.sintel, tags: ['English'], source: 'vod' },
  { id: 's7', username: 'ash', title: 'Warzone rebirth until the lobbies get scary', category: 'call-of-duty', language: 'English', mature: false, viewers: 8600, thumbnail: img('photo-1552820728-8b83bb6b773f', 800), videoUrl: V.meltdowns, tags: ['English'], source: 'vod' },
  { id: 's8', username: 'drift', title: 'night drive + street food. no itinerary.', category: 'irl', language: 'English', mature: false, viewers: 7400, thumbnail: img('photo-1477959858617-67f85cf4f1df', 800), videoUrl: V.joyrides, tags: ['English'], source: 'vod' },
  { id: 's9', username: 'nyx', title: 'Arena grind. Crown or crash out.', category: 'fortnite', language: 'English', mature: false, viewers: 6900, thumbnail: img('photo-1511512578047-dfb367046420', 800), videoUrl: V.blazes, tags: ['English'], source: 'vod' },
  { id: 's10', username: 'surge', title: 'FACEIT level 10 attempt #400', category: 'counter-strike-2', language: 'English', mature: false, viewers: 5400, thumbnail: img('photo-1542751110-97427bbada6c', 800), videoUrl: V.steel, tags: ['English'], source: 'vod' },
  { id: 's11', username: 'raven', title: 'lo-fi set then requests. stay a while.', category: 'music', language: 'English', mature: false, viewers: 4100, thumbnail: img('photo-1470225620780-dba8ba36b745', 800), videoUrl: V.elephants, tags: ['English'], source: 'vod' },
  { id: 's12', username: 'vex', title: 'need break-even minimum today', category: 'slots-casino', language: 'English', mature: true, viewers: 13200, thumbnail: img('photo-1511193311914-0346f16efe90', 800), videoUrl: V.fun, tags: ['English', '18+'], source: 'vod' },
  { id: 's13', username: 'echo', title: 'Sunday reset. movies, chat, snacks.', category: 'just-chatting', language: 'English', mature: false, viewers: 2100, thumbnail: img('photo-1478737270239-2f02b77fc618', 800), videoUrl: V.bunny, tags: ['English'], source: 'vod' },
  { id: 's14', username: 'orion', title: 'hardcore world day 86 — the nether is personal', category: 'minecraft', language: 'English', mature: false, viewers: 1800, thumbnail: img('photo-1586182987320-4f376d39d787', 800), videoUrl: V.sintel, tags: ['English'], source: 'vod' },
  { id: 's15', username: 'rook', title: 'bullet chess until I forget how knights move', category: 'chess', language: 'English', mature: false, viewers: 3200, thumbnail: img('photo-1529699211556-47d4d4d3d3a3', 800), videoUrl: V.elephants, tags: ['English'], source: 'vod' },
  { id: 's16', username: 'pixel', title: 'painting a city that does not exist', category: 'art', language: 'English', mature: false, viewers: 960, thumbnail: img('photo-1460661411761-4e0a0f3e4b8e', 800), videoUrl: V.steel, tags: ['English'], source: 'vod' },
  { id: 's17', username: 'milo', title: 'matchday desk — talking every game that matters', category: 'sports', language: 'English', mature: false, viewers: 2700, thumbnail: img('photo-1461896836934-ffe607ba6851', 800), videoUrl: V.subaru, tags: ['English'], source: 'vod' },
  { id: 's18', username: 'coil', title: 'variety dump: whatever chat votes in 10 minutes', category: 'just-chatting', language: 'English', mature: false, viewers: 640, thumbnail: img('photo-1516321497487-e288fb19713f', 800), videoUrl: V.escapes, tags: ['English'], source: 'vod' },
  { id: 's19', username: 'sage', title: 'VOD review then ranked. no hopping.', category: 'valorant', language: 'English', mature: false, viewers: 4300, thumbnail: img('photo-1542751371-adc38448a05e', 800), videoUrl: V.meltdowns, tags: ['English'], source: 'vod' },
]

export const clips: Clip[] = [
  { id: 'c1', username: 'nova', title: 'chat predicted the crashout frame-perfect', views: 1_240_000, duration: '0:18', thumbnail: img('photo-1516321318423-f06f85e504b3', 640), videoUrl: V.bunny, createdAt: '2 days ago' },
  { id: 'c2', username: 'kira', title: '1v5 that should not have worked', views: 880_000, duration: '0:24', thumbnail: img('photo-1606144042614-b2417e99c4e3', 640), videoUrl: V.blazes, createdAt: '5 days ago' },
  { id: 'c3', username: 'luna', title: 'stranger recognizes her from last week', views: 610_000, duration: '0:41', thumbnail: img('photo-1514565131-fce0801e5785', 640), videoUrl: V.subaru, createdAt: '1 day ago' },
  { id: 'c4', username: 'blaze', title: 'the heist plan lasting 11 seconds', views: 430_000, duration: '0:31', thumbnail: img('photo-1480714378408-67cf0d13bc1b', 640), videoUrl: V.escapes, createdAt: '3 days ago' },
  { id: 's5c', username: 'hex', title: 'outplayed, then outplayed the outplay', views: 290_000, duration: '0:22', thumbnail: img('photo-1538481199705-c7403e645b90', 640), videoUrl: V.sintel, createdAt: '6 days ago' },
  { id: 'c6', username: 'rook', title: 'GM blunder in 3 moves. chat unhinged.', views: 155_000, duration: '0:12', thumbnail: img('photo-1529699211556-47d4d4d3d3a3', 640), videoUrl: V.elephants, createdAt: '4 days ago' },
  { id: 'c7', username: 'nyx', title: 'box fight clip of the week', views: 204_000, duration: '0:16', thumbnail: img('photo-1511512578047-dfb367046420', 640), videoUrl: V.fun, createdAt: '2 days ago' },
  { id: 'c8', username: 'raven', title: 'crowd actually sang the drop', views: 98_000, duration: '0:37', thumbnail: img('photo-1470225620780-dba8ba36b745', 640), videoUrl: V.steel, createdAt: '1 week ago' },
]

export const chatPool = {
  users: [
    'snackz', 'milo', 'souliya', 'lambo', 'hedempti', 'hector', 'sniper', 'pafoly', 'flabbz', 'iloveyall',
    'bowmaster', 'nugknight', 'machineelf', 'boomboy', 'arthium', 'raikxn', 'takeurlumps', 'usernameempty',
    'speedislife', 'rottenbanana', 'clipit', 'nightowl', 'gilded', 'lowlatency', 'warmup', 'firstchat',
  ],
  lines: [
    'W stream', 'clip that', 'LMAO', 'chat is unhinged', 'LET\'S GO', 'sheeeesh', 'this title is crazy',
    'how is this real', 'W', 'L', 'mods asleep', 'gifted a sub in spirit', 'backseat less, enjoy more',
    'audio going crazy', 'that was nasty', 'I just got here what happened', 'ratio', 'so true',
    'this is cinema', 'pause', 'we are so back', 'it\'s over', 'huge', 'no way', 'I can\'t', 'COOK',
    'send it', 'respect', 'chat slow down', 'first time catching live', 'that play was illegal',
  ],
}

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

export function streamsForCategory(slug: string) {
  return streams.filter((s) => s.category === slug).sort((a, b) => b.viewers - a.viewers)
}

export function liveStreamForUser(username: string) {
  return streams
    .filter((s) => s.username.toLowerCase() === username.toLowerCase())
    .sort((a, b) => b.viewers - a.viewers)[0]
}

export function categoryViewers(slug: string) {
  return streams.filter((s) => s.category === slug).reduce((n, s) => n + s.viewers, 0)
}
