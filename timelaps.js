const https = require('https')
const fs = require('fs')
const path = require('path')

const [hostname, houseSlug, cameraSlug, apiKey, secondsBetweenImage = 300, directory = __dirname] = process.argv.slice(2)

if (!hostname || !houseSlug || !cameraSlug || !apiKey) {
  console.error('Usage: node timelaps.js hostname houseSlug cameraSlug apiKey [secondsBetweenImage=300] [directory=.]')
  console.error('       node timelaps.js kira.dewep.ovh kira salon XXXXXXXXXXX 300 timelaps')
  return process.exit(1)
}

const bodyJson = JSON.stringify({
  houseSlug,
  cameraSlug,
  cache: false
})

async function _get () {
  return new Promise(resolve => {
    const options = {
      hostname,
      port: 443,
      path: '/snapshot/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': bodyJson.length,
        'Authorization': apiKey
      }
    }
    const request = https.request(options, response => {
      const chunks = []
      response.on('data', chunk => {
        chunks.push(chunk)
      })
      response.on('end', () => {
        resolve(Buffer.concat(chunks))
      })
    })
    request.on('error', err => {
      resolve(null)
    })
    request.write(bodyJson)
    request.end()
  })
}

async function tick () {
  const filename = (new Date().toISOString()).substr(0, 19).replace(/T/g, '_').replace(/:/g, '-') + '.jpg'
  try {
    await _get() // Reset camera internal cache
    await _get() // Reset camera internal cache
    const buffer = await _get()
    if (!buffer) {
      throw new Error('Cannot get image')
    }
    if (buffer.length < 1000) {
      throw new Error('Bad image (not allowed?)')
    }
    await fs.promises.writeFile(path.join(directory, filename), buffer)
    console.info(filename, 'OK')
  } catch (err) {
    console.warn(filename, err.message)
  }
}

tick()
setInterval(tick, +secondsBetweenImage * 1000)
