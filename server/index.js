const webServer = require('./web-server')
const path = require('path')
const fs = require('fs')
const apiKey = require('./apikey')

webServer.middleware(async function (transaction) {
  transaction.houses = []
  transaction.admins = []

  transaction.apiKeys = (transaction.request.headers['authorization'] || '')
    .split('.')
    .filter(secret => {
      try {
        const { data } = apiKey.decrypt(secret)
        if (!data.h) {
          return false
        }
        if (!transaction.houses.includes(data.h)) {
          transaction.houses.push(data.h)
        }
        if (data.a && !transaction.houses.includes(data.h)) {
          transaction.admins.push(data.h)
        }
        return true
      } catch (err) {
        return false
      }
    })
})

webServer.post('/auth/', async transaction => {
  if (transaction.body.code === 'kira') {
    const secret = apiKey.encrypt({ h: 'kira', a: 1 }, new Date().getTime() + 30 * 1000)
    transaction.apiKeys.push(secret)
    transaction.houses.push('kira')
    transaction.admins.push('kira')
  }

  const result = {
    authorization: transaction.apiKeys.join('.'),
    houses: transaction.houses
  }

  return transaction.json(result)
})

const staticFile = (filename, contentType) => {
  const content = fs.readFileSync(path.join(__dirname, '..', 'public', filename))
  return transaction => {
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
