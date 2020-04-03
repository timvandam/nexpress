const DataTypes = require('./DataTypes')
const Packet = require('./Packet')

// TODO: Optional compression key
class PacketDeserializer {
  constructor (buffer) {
    if (!(buffer instanceof Buffer)) throw new Error('Argument must be a buffer')
    this.packets = []
    for (let i = 0; i < buffer.length;) {
      const packet = new Packet(buffer.slice(i))
      const [packetLength, packetId] = packet.read(DataTypes.VarInt, DataTypes.VarInt)
      const offset = i + [packetLength, packetId].reduce((len, val) => len + val.length, 0)

      packet.buffer = buffer.slice(
        offset,
        offset + packetLength.value - packetId.length
      )

      packet.id = packetId.value

      this.packets.push(packet)

      i = offset + packet.length
    }
  }
}

module.exports = PacketDeserializer
