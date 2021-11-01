const config = require('./config')
const http = require('http')

const snapshotsCache = {}

async function _get (url) {
  return new Promise(resolve => {
    http.get(url, { timeout: 1000 }, response => {
      const chunks = []
      response.on('data', chunk => {
        chunks.push(chunk)
      })
      response.on('end', () => {
        resolve(Buffer.concat(chunks))
      })
    }).on('error', err => {
      resolve(null)
    })
  })
}

async function _downloadSnapshotEsp32CamTasmota (camera) {
  const buffer = await _get(camera.host + '/snapshot.jpg')

  if (!buffer || buffer.length < 1000) {
    if (camera.type === 'esp32-cam-tasmota') {
      // After reboot or an action, GET / is required to used the snapshot file
      await _get(camera.host + '/')
    }

    return null
  }

  return buffer
}

async function _downloadSnapshot (camera) {
  if (camera.type === 'esp32-cam-tasmota') {
    return _downloadSnapshotEsp32CamTasmota(camera)
  }

  console.warn('Camera type not found.')
  return null
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
