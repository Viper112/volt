export function iceServers() {
  const stun = [{ urls: 'stun:stun.l.google.com:19302' }]
  const turnUrls = process.env.TURN_URLS
  const turnUser = process.env.TURN_USERNAME || 'openrelayproject'
  const turnPass = process.env.TURN_CREDENTIAL || 'openrelayproject'
  const urls = turnUrls
    ? turnUrls.split(',').map((u) => u.trim()).filter(Boolean)
    : [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:80?transport=tcp',
        'turn:openrelay.metered.ca:443?transport=tcp',
      ]
  return [
    ...stun,
    { urls, username: turnUser, credential: turnPass },
  ]
}

export const rtcConfig = { iceServers: iceServers() }
