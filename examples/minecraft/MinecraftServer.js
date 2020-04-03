const debug = require('debug')('nexpress:examples:minecraft')

const Nexpress = require('../../')
const PacketDeserializer = require('./PacketDeserializer')
const PacketHandler = require('./PacketHandler')

class MinecraftServer {
  constructor (description = 'My Minecraft Server', maxPlayers = 100, port = 25565) {
    this.port = port
    this.socketState = new Map()
    this.app = new Nexpress()
    this.packetHandler = new PacketHandler(this)

    this.version = {
      name: '1.15.2',
      protocol: 578
    }

    this.description = description

    this.maxPlayers = maxPlayers

    this.app.use(this.initializeSocketState.bind(this))
    this.app.use(this.handlePackets.bind(this))
  }

  initializeSocketState (data, res, next) {
    if (!this.socketState.has(res.socket)) this.socketState.set(res.socket, 'Handshaking')
    next()
  }

  handlePackets (data, res, next) {
    const deserializer = new PacketDeserializer(data.buffer)
    for (const packet of deserializer.packets) {
      const dataObj = new Nexpress.Data(packet.buffer)
      dataObj.packet = packet
      dataObj.id = packet.id

      this.packetHandler.pipeline.exec(dataObj, res, next)
    }
  }

  start () {
    this.app.listen(this.port)
  }
}

module.exports = MinecraftServer
