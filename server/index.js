const webServer = require('./web-server')
const path = require('path')
const fs = require('fs')

webServer.middleware(async function (transaction) {
  transaction.houses = ['kira']
  transaction.admins = ['kira']
})

webServer.get('/api/', async transaction => {
  return transaction.json({})
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
