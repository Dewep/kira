const config = require('./config')
const http = require('http')

const snapshotsCache = {}

async function _downloadSnapshot (camera) {
  // TODO: add timeout
  return new Promise(resolve => {
    http.get(camera.snapshot, { timeout: 1000 }, response => {
      const chunks = []
      response.on('data', chunk => {
        chunks.push(chunk)
      })
      response.on('end', () => {
        const buffer = Buffer.concat(chunks)
        resolve(buffer.length < 1000 ? null : buffer)
      })
    }).on('error', err => {
      console.error('Snapshot.download.error', err)
      resolve(null)
    })
  })
}

async function getSnapshot (houseSlug, cameraSlug, camera) {
  const slug = houseSlug + '.' + cameraSlug

  if (!snapshotsCache[slug]) {
    snapshotsCache[slug] = _downloadSnapshot(camera)

    snapshotsCache[slug].then(() => {
      setTimeout(() => {
        delete snapshotsCache[slug]
      }, 400)
    })
  }

  return snapshotsCache[slug]
}

module.exports = { getSnapshot }
