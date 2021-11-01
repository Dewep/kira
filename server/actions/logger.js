const config = require('../config')

module.exports = function loggerMiddleware (webServer) {
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
        house.logs.sort((a, b) => b.to - a.to)
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
}
