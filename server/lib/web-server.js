const http = require('http')

class WebServer {
  constructor () {
    this._handlers = []

    this.middleware(transaction => {
      transaction.json = function (data, code = 200) {
        transaction.response.writeHead(code, { 'Content-Type': 'application/json' })
        transaction.response.end(JSON.stringify(data), 'utf-8')
        return true
      }

      if (transaction.request.headers['content-type'] === 'application/json') {
        transaction.body = JSON.parse(transaction.body)
      }
    })
  }

  middleware (handler) {
    this._handlers.push(handler)
  }

  method (method, path, handler) {
    this.middleware(async transaction => {
      transaction.path = transaction.request.url
      if (!transaction.path) {
        transaction.path = '/'
      }

      if (transaction.request.method === method && transaction.path === path) {
        return await handler(transaction)
      }
    })
  }

  get (path, handler) {
    this.method('GET', path, handler)
  }
  post (path, handler) {
    this.method('POST', path, handler)
  }
  put (path, handler) {
    this.method('PUT', path, handler)
  }

  async _handleTransaction (transaction) {
    for (const handler of this._handlers) {
      const result = await handler(transaction)

      if (result === true) {
        return
      }
    }

    throw new Error('No handler found for this request')
  }

  listen (port) {
    const server = http.createServer()

    server.on('request', (request, response) => {
      const chunks = []
      request.on('data', chunk => {
        chunks.push(chunk)
      })
      request.on('end', async () => {
        try {
          await this._handleTransaction({
            request,
            response,
            body: Buffer.concat(chunks).toString()
          })
        } catch (err) {
          console.error(err)
          response.writeHead(500)
          response.end(err.message)
        }
      })
    })

    server.listen(port)
  }
}

module.exports = new WebServer()
