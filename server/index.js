const webServer = require('./lib/web-server')

// Global middlewares
require('./actions/authorization')(webServer)
require('./actions/logger')(webServer)

// Real routes, and common middlewares
require('./actions/invitation')(webServer)
require('./actions/authentication')(webServer) // Must be after invitation
require('./actions/snapshots')(webServer)

// Static files
require('./actions/static')(webServer)

// 404
webServer.middleware(async function (transaction) {
  transaction.response.writeHead(404, { 'Content-Type': 'text/html' })
  transaction.response.end('<meta http-equiv="refresh" content="0; URL=/" /><h1>Page not found</h1>', 'utf-8')
  return true
})

webServer.listen(4180)
