const path = require('path')
const fs = require('fs')

const staticFile = (filename, contentType) => {
  return transaction => {
    const content = fs.readFileSync(path.join(__dirname, '..', '..', 'public', filename))
    transaction.response.writeHead(200, { 'Content-Type': contentType })
    transaction.response.end(content, 'utf-8')
    return true
  }
}

module.exports = function staticMiddleware (webServer) {
  webServer.get('/', staticFile('index.html', 'text/html'))
  webServer.get('/app.js', staticFile('app.js', 'text/javascript'))
  webServer.get('/IndieFlower-Regular.ttf', staticFile('IndieFlower-Regular.ttf', 'application/font-ttf'))
  webServer.get('/offline.png', staticFile('offline.png', 'image/png'))
  webServer.get('/favicon.ico', staticFile('favicon.ico', 'image/x-icon'))
  webServer.get('/styles.css', staticFile('styles.css', 'text/css'))
  webServer.get('/vue-3.2.20.global.prod.js', staticFile('vue-3.2.20.global.prod.js', 'text/javascript'))
}
