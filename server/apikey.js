const config = require('./config')
const crypto = require('crypto')

const resizedIV = Buffer.allocUnsafe(16)
const iv = crypto.createHash('sha256').update(config.apiKey.iv).digest()
iv.copy(resizedIV)

const key = crypto.createHash('sha256').update(config.apiKey.key).digest()

function rawEncrypt (data) {
  const cipher = crypto.createCipheriv('aes256', key, resizedIV)

  return [
    cipher.update(data, 'binary', 'hex'),
    cipher.final('hex')
  ].join('')
}

function rawDecrypt (data) {
  const decipher = crypto.createDecipheriv('aes256', key, resizedIV)

  return [
    decipher.update(data, 'hex', 'binary'),
    decipher.final('binary')
  ].join('')
}

function encrypt (data, expiration) {
  const content = {
    c: new Date().getTime(),
    e: expiration,
    d: data
  }
  const json = JSON.stringify(content)
  return rawEncrypt(json)
}

function decrypt (apiKey) {
  try {
    const json = rawDecrypt(apiKey)
    const content = JSON.parse(json)

    if (!content.c || !content.e || !content.d) {
      throw new Error('Bad ApiKey format')
    }
    const now = new Date().getTime()
    if (content.c > now || content.e < now) {
      throw new Error('Expired ApiKey')
    }

    return {
      created: content.c,
      expiration: content.e,
      data: content.d
    }
  } catch (err) {
    console.error('ApiKey.error', err.message)
    throw new Error('Invalid or expired ApiKey')
  }
}

module.exports= {
  encrypt,
  decrypt
}
