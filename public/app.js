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
      houses: []
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
      this.houses = []
      try {
        const response = await this.auth()
        window.localStorage.authorization = response.authorization
        this.houses = response.houses
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
