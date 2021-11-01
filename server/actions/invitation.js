const apiKey = require('../lib/apikey')
const config = require('../config')

const availableHouseSlugs = Object.keys(config.houses)

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

module.exports = function invitationMiddleware (webServer) {
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

  // Do not return the response, it's done by actions/authentication
  webServer.post('/auth/', async transaction => {
    const code = transaction.body.code
  
    if (!code) {
      return
    }

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
  })
}
