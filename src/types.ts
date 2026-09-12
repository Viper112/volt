export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'offline'

export type Channel = {
  id: string
  name: string
  topic: string
  category: string
}

export type Member = {
  id: string
  username: string
  displayName: string
  status: PresenceStatus
}

export type ChatMessage = {
  id: string
  channelId: string
  userId: string
  username: string
  displayName: string
  text: string
  createdAt: number
}

export type AuthUser = Member
