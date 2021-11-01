const config = require('../config')

module.exports = function authenticationMiddleware (webServer) {
  webServer.post('/auth/', async transaction => {
    // A code on body can be submit, to join a new house
    // This is handled by a middleware in actions/invitation

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
}
