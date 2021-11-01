const webServer = require('./web-server')
const path = require('path')
const fs = require('fs')
const apiKey = require('./apikey')
const config = require('./config')
const { getSnapshot } = require('./snapshots')

const availableHouseSlugs = Object.keys(config.houses)

webServer.middleware(async function (transaction) {
  transaction.houses = {}

  transaction.apiKeys = (transaction.request.headers['authorization'] || '')
    .split('.')
    .filter(secret => {
      try {
        if (!secret) {
          return false
        }
        const { data } = apiKey.decrypt(secret)
        if (!data.h) {
          return false
        }
        if (!availableHouseSlugs.includes(data.h)) {
          return false
        }
        if (!transaction.houses[data.h]) {
          transaction.houses[data.h] = {
            name: data.n,
            isAdmin: data.a === 1
          }
        }
        return true
      } catch (err) {
        return false
      }
    })
})

webServer.middleware(async function (transaction) {
  const allUsers = []
  const now = new Date().getTime()

  for (const houseSlug of Object.keys(transaction.houses)) {
    const house = config.houses[houseSlug]
    const name = transaction.houses[houseSlug].name

    if (!house.logs) {
      house.logs = []
    }

    const log = house.logs.find(l => l.name === name && l.to + 10 * 60 * 1000 >= now)
    if (log) {
      log.to = now
      house.logs.sort((a, b) => b.from - a.from)
    } else {
      if (house.logs.length >= 20) {
        house.logs.pop()
      }
      house.logs.unshift({ from: now, to: now, name })
    }

    allUsers.push(houseSlug + '/' + name)
  }

  console.info(transaction.request.method, transaction.request.url, allUsers)
})

function expirationMinuteToTimestamp (minutes) {
  return new Date().getTime() + minutes * 60 * 1000
}

const invitationCodes = {}
function generateInvitationCode (options) {
  const code = Math.random().toString('26').substr(2, 4).toUpperCase()
  invitationCodes[code] = options
  console.log('New invitation code:', code, ' ; options =', options)
  return code
}

webServer.post('/auth/', async transaction => {
  const code = transaction.body.code

  if (code) {
    if (code === 'logout') {
      transaction.houses = {}
      transaction.apiKeys = []
    }

    for (const houseSlug of availableHouseSlugs) {
      const prefixSize = houseSlug.length + 1
      if (code.startsWith(houseSlug + ':') && code.length > prefixSize + 2 && code.length < prefixSize + 30) {
        generateInvitationCode({
          houseSlug,
          name: code.substr(prefixSize),
          isAdmin: true,
          expiration: expirationMinuteToTimestamp(60 * 24 * 365)
        })
      }
    }

    if (Object.keys(invitationCodes).includes(code.toUpperCase())) {
      const options = invitationCodes[code.toUpperCase()]
      delete invitationCodes[code.toUpperCase()]

      const content = { h: options.houseSlug, n: options.name }
      if (options.isAdmin) {
        content.a = 1
      }

      const secret = apiKey.encrypt(content, options.expiration)
      transaction.apiKeys.push(secret)

      transaction.houses[options.houseSlug] = {
        name: options.name,
        isAdmin: options.isAdmin
      }
    }
  }

  const result = {
    authorization: transaction.apiKeys.join('.'),

    houses: Object.keys(transaction.houses).map(houseSlug => {
      const house = config.houses[houseSlug]
      const houseUser = transaction.houses[houseSlug]

      return {
        slug: houseSlug,
        name: house.name,
        user: houseUser.name,
        expiration: houseUser.expiration,
        isAdmin: houseUser.isAdmin,
        cameras: Object.keys(house.cameras).map(cameraSlug => {
          const camera = house.cameras[cameraSlug]
          return {
            slug: cameraSlug,
            name: camera.name,
            type: camera.type
          }
        }),
        logs: (houseUser.isAdmin ? (house.logs || []) : []).map(log => {
          const datetimeFrom = new Intl.DateTimeFormat('en-GB', { hour12: false, hour: 'numeric', minute: 'numeric', day: 'numeric', month: 'numeric' })
          const datetimeTo = new Intl.DateTimeFormat('en-GB', { hour12: false, hour: 'numeric', minute: 'numeric' })
          const from = datetimeFrom.format(new Date(log.from))
          const to = datetimeTo.format(new Date(log.to))
          const date = from.endsWith(to) ? from : (from + '-' + to)
          return { name: log.name, date }
        })
      }
    })
  }

  return transaction.json(result)
})

webServer.post('/invitation/', async transaction => {
  const { houseSlug, name, expirationMinute } = transaction.body

  if (!availableHouseSlugs.includes(houseSlug) || !transaction.houses[houseSlug] || !transaction.houses[houseSlug].isAdmin) {
    return transaction.json({ error: 'You are not admin of this house.' }, 403)
  }

  const code = generateInvitationCode({
    houseSlug,
    name,
    isAdmin: false,
    expiration: expirationMinuteToTimestamp(expirationMinute)
  })

  return transaction.json({ code })
})

webServer.post('/snapshot/', async transaction => {
  const { houseSlug, cameraSlug } = transaction.body

  if (!availableHouseSlugs.includes(houseSlug) || !transaction.houses[houseSlug]) {
    return transaction.json({ error: 'You are not member of this house.' }, 403)
  }
  
  const house = config.houses[houseSlug]
  
  if (!Object.keys(house.cameras).includes(cameraSlug)) {
    return transaction.json({ error: 'This camera doesnt exist in this house.' }, 404)
  }

  const camera = house.cameras[cameraSlug]

  const snapshot = await getSnapshot(houseSlug, cameraSlug, camera)

  if (!snapshot) {
    return transaction.json({ error: 'Camera is not available.' }, 503)
  }

  transaction.response.writeHead(200, { 'Content-Type': 'image/jpeg' })
  transaction.response.end(snapshot)

  return true
})

const staticFile = (filename, contentType) => {
  return transaction => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'public', filename))
    transaction.response.writeHead(200, { 'Content-Type': contentType })
    transaction.response.end(content, 'utf-8')
    return true
  }
}
webServer.get('/', staticFile('index.html', 'text/html'))
webServer.get('/app.js', staticFile('app.js', 'text/javascript'))
webServer.get('/IndieFlower-Regular.ttf', staticFile('IndieFlower-Regular.ttf', 'application/font-ttf'))
webServer.get('/offline.png', staticFile('offline.png', 'image/png'))
webServer.get('/favicon.ico', staticFile('favicon.ico', 'image/x-icon'))
webServer.get('/styles.css', staticFile('styles.css', 'text/css'))
webServer.get('/vue-3.2.20.global.prod.js', staticFile('vue-3.2.20.global.prod.js', 'text/javascript'))

webServer.listen(4180)
