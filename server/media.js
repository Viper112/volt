import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const NodeMediaServer = require('node-media-server')

export function startRtmpServer({ rtmpPort, httpPort, onPublish, onUnpublish, getUserByKey }) {
  const nms = new NodeMediaServer({
    bind: '0.0.0.0',
    notify: { url: '' },
    auth: {
      play: false,
      publish: false,
      secret: 'volt-rtmp',
    },
    rtmp: { port: Number(rtmpPort) },
    http: { port: Number(httpPort) },
  })

  nms.on('prePublish', (session) => {
    const key = session?.streamName
    if (!getUserByKey(key)) session?.close?.()
  })

  nms.on('postPublish', (session) => {
    const key = session?.streamName
    const user = getUserByKey(key)
    if (user) onPublish(user)
    else session?.close?.()
  })

  nms.on('donePublish', (session) => {
    const key = session?.streamName
    const user = getUserByKey(key)
    if (user) onUnpublish(user)
  })

  nms.run()
  return nms
}
