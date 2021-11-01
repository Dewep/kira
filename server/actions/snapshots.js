const config = require('../config')
const http = require('http')

const availableHouseSlugs = Object.keys(config.houses)
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

async function getSnapshot (houseSlug, cameraSlug, camera, cache = true) {
  const slug = houseSlug + '.' + cameraSlug

  if (!cache || !snapshotsCache[slug]) {
    snapshotsCache[slug] = _downloadSnapshot(camera)

    snapshotsCache[slug].then(() => {
      setTimeout(() => {
        delete snapshotsCache[slug]
      }, 400)
    })
  }

  return snapshotsCache[slug]
}

module.exports = function snapshotsMiddleware (webServer) {
  webServer.post('/snapshot/', async transaction => {
    const { houseSlug, cameraSlug, cache } = transaction.body
  
    if (!availableHouseSlugs.includes(houseSlug) || !transaction.houses[houseSlug]) {
      return transaction.json({ error: 'You are not member of this house.' }, 403)
    }
    
    const house = config.houses[houseSlug]
    
    if (!Object.keys(house.cameras).includes(cameraSlug)) {
      return transaction.json({ error: 'This camera doesnt exist in this house.' }, 404)
    }
  
    const camera = house.cameras[cameraSlug]
  
    const snapshot = await getSnapshot(houseSlug, cameraSlug, camera, cache !== false)
  
    if (!snapshot) {
      return transaction.json({ error: 'Camera is not available.' }, 503)
    }
  
    transaction.response.writeHead(200, { 'Content-Type': 'image/jpeg' })
    transaction.response.end(snapshot)
  
    return true
  })
}
