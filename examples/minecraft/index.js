
const Nexpress = require('../../index')
const Packet = require('./packet')

const packetHandler = require('./packetHandler')

const app = new Nexpress()

// Serialize incoming data into individual packets and enter them into the packet handler pipeline
app.use((data, res, next) => {
  for (let i = 0; i < data.buffer.length;) {
    const packet = new Packet(data.buffer.slice(i))
    const [packetLength, packetId] = packet.read(Packet.VarInt, Packet.VarInt)
    const offset = i + [packetLength, packetId].reduce((len, val) => len + val.length, 0)
    packet.buffer = data.buffer.slice(
      offset,
      offset + packetLength.value - packetId.length
    )

    packet.id = packetId.value

    const dataObj = new Nexpress.Data(packet.buffer)
    dataObj.packet = packet
    dataObj.id = packet.id

    packetHandler.exec(dataObj, res, next)

    i = offset + packet.length
  }
})

app.listen(25565)
