const webServer = require('../server/lib/web-server')
const path = require('path')
const fs = require('fs')

webServer.get('/snapshot.jpg', transaction => {
  const content = fs.readFileSync(path.join(__dirname, Math.floor(1 + Math.random() * 9) + '.jpg'))
  transaction.response.writeHead(200, { 'Content-Type': 'image/jpg' })
  transaction.response.end(content, 'utf-8')
  return true
})

webServer.listen(4181)
