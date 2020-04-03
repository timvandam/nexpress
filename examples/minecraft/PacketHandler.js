const debug = require('debug')('nexpress:examples:minecraft')

const { Pipeline } = require('../..')
const DataTypes = require('./DataTypes')
const Packet = require('./Packet')

class PacketHandler {
  constructor (server) {
    this.server = server
    this.pipeline = new Pipeline()

    this.pipeline.use(0x00, this.handshake.bind(this))
    this.pipeline.use(0x00, this.status.bind(this))
  }

  handshake (data, res, next) {
    if (this.server.socketState.get(res.socket) !== 'Handshaking') return next()
    debug('received handshake')

    const [,,, nextState] = data.packet.read(DataTypes.VarInt, DataTypes.String, DataTypes.UShort, DataTypes.VarInt)

    if (nextState.value === 1) this.server.socketState.set(res.socket, 'Status')
    if (nextState.value === 2) this.server.socketState.set(res.socket, 'Login')
  }

  status (data, res, next) {
    if (this.server.socketState.get(res.socket) !== 'Status') return next()
    debug('received status request')

    const packetId = new DataTypes.VarInt(0x00)
    const jsonResponse = new DataTypes.String(JSON.stringify({
      version: this.server.version,
      players: {
        max: this.server.maxPlayers,
        online: 0,
        sample: []
      },
      description: this.server.description
    }))
    const packetLength = new DataTypes.VarInt(packetId.length + jsonResponse.length)

    // Write a server status packet
    const packet = new Packet()
    packet.write(
      packetLength,
      packetId,
      jsonResponse
    )

    debug('sending server status')
    res.send(packet.buffer)
  }
}

module.exports = PacketHandler
