window.AppDefinition = {
  data () {
    return {
      code: '',
      invitation: {
        opened: false,
        name: '',
        expiration: 10,
        code: ''
      },
      houses: [],
      snapshotInterval: null,
      activeCamera: null,
      snapshots: {},
      snapshotsRunning: {}
    }
  },

  computed: {
  },

  mounted () {
    setTimeout(() => {
      document.body.classList.remove('initializing')
    }, 250)

    this.load()
  },

  methods: {
    async load () {
      if (this.snapshotInterval) {
        clearInterval(this.snapshotInterval)
        this.snapshotInterval = null
      }

      this.houses = []

      try {
        const response = await this.auth()
        window.localStorage.authorization = response.authorization
        this.houses = response.houses

        this.refreshSnapshots()
        this.snapshotInterval = setInterval(() => {
          this.refreshSnapshots()
        }, 500)
        } catch (err) {
        console.error(err)
      }
    },

    async auth () {
      const response = await this.request('/auth/', {
        code: this.code || null
      })
      this.code = ''
      return response
    },

    async invite (houseSlug) {
      const response = await this.request('/invitation/', {
        houseSlug,
        name: this.invitation.name,
        expirationMinute: this.invitation.expiration
      })
      this.invitation.name = ''
      this.invitation.code = response.code
      this.invitation.opened = false
    },

    async setActiveCamera (slug) {
      this.activeCamera = slug

      try {
        if (!slug) {
          document.exitFullscreen()
        } else {
          await document.body.requestFullscreen()
        }
      } catch (err) {
        console.warn('Fullscreen', err.message)
      }
    },

    async refreshSnapshots () {
      for (const house of this.houses) {
        for (const camera of house.cameras) {
          this.refreshSnapshot(house, camera)
        }
      }
    },

    async refreshSnapshot (house, camera) {
      const slug = house.slug + '.' + camera.slug

      if (this.snapshots[slug] && this.activeCamera !== slug) {
        return
      }

      if (this.snapshotsRunning[slug]) {
        return
      }
      this.snapshotsRunning[slug] = true

      try {
        const response = await this.request('/snapshot/', {
          houseSlug: house.slug,
          cameraSlug: camera.slug
        }, false)
        const blob = await response.blob()

        if (blob.size < 1000) {
          throw new Error('Bad blob size')
        }
  
        const objectUrl = window.URL.createObjectURL(blob)
        if (this.snapshots[slug]) {
          window.URL.revokeObjectURL(this.snapshots[slug])
        }
        this.snapshots[slug] = objectUrl
      } catch (err) {
        console.warn('Download snapshot error', err)
        if (this.snapshots[slug]) {
          window.URL.revokeObjectURL(this.snapshots[slug])
        }
        delete this.snapshots[slug]
      }

      this.snapshotsRunning[slug] = false
    },

    async request (path, body, json = true) {
      const options = {
        method: body ? 'POST' : 'GET',
        cache: 'no-cache',
        headers: {
          'Authorization': window.localStorage.authorization || ''
        }
      }

      if (body) {
        options.headers['Content-Type'] = 'application/json'
        options.method = 'POST'
        options.body = JSON.stringify(body)
      }

      const response = await fetch(path, options)

      if (json) {
        return response.json()
      }
      return response
    }
  }
}
