window.AppDefinition = {
  data () {
    return {
      houses: [
        {
          name: 'Kira\'s house',
          isAdmin: true,
          cameras: [
            {
              slug: '4180',
              type: 'esp32-cam-tasmota',
              name: 'Salon',
              options: {}
            },
            {
              slug: '4181',
              type: 'esp32-cam-tasmota',
              name: 'Chambre',
              options: {}
            }
          ],
          logs: [
            { date: '30 oct. 8h10, 30 oct. 18h10, 30 oct. 20h10', user: 'Malie' },
            { date: '30 oct. 10h10, 30 oct. 21h10, 30 oct. 22h10', user: 'Edou' }
          ]
        }
      ]
    }
  },

  computed: {
  },

  mounted () {
  },

  methods: {
  }
}
