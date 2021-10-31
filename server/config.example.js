module.exports = {
  apiKey: {
    iv: '6ee3e9d87c82417ee172e66d26ef69626ad55d6c1c', // node -p "require('crypto').randomBytes(21).toString('hex')"
    key: '3fe085559891796d8742d60443f7ceb5aed9061a89' // node -p "require('crypto').randomBytes(21).toString('hex')"
  },
  houses: {
    kira: {
      name: 'Kira',
      cameras: {
        salon: {
          name: 'Salon',
          type: 'esp32-cam-tasmota',
          snapshot: 'http://127.0.0.1:4181/snapshot.jpg'
        }
      }
    }
  }
}
