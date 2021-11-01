const apiKey = require('../lib/apikey')
const config = require('../config')

const availableHouseSlugs = Object.keys(config.houses)

module.exports = function authorizationMiddleware (webServer) {
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
}
