export type Streamer = {
  username: string
  displayName: string
  verified: boolean
  followers: number
  bio: string
  seed: string
  socials: {
    x?: string
    youtube?: string
    instagram?: string
    discord?: string
  }
}

export type Category = {
  slug: string
  name: string
  image: string
  tags: string[]
}

export type Stream = {
  id: string
  username: string
  title: string
  category: string
  language: string
  mature: boolean
  viewers: number
  thumbnail: string
  videoUrl: string
  tags: string[]
  featured?: boolean
  source: 'vod' | 'webrtc'
}

export type Clip = {
  id: string
  username: string
  title: string
  views: number
  duration: string
  thumbnail: string
  videoUrl: string
  createdAt: string
}

export type User = {
  id: string
  username: string
  displayName: string
  following: string[]
}

export type ChatMessage = {
  id: string
  username: string
  text: string
  ts: number
  color: string
  system?: boolean
}
