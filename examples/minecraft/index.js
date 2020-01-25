const debug = require('debug')('nexpress:examples:minecraft')

const Nexpress = require('../../index')
const Packet = require('./packet')

const app = new Nexpress()

// Track the state of each socket (https://wiki.vg/Protocol)
const socketState = new Map()

// Server status
const SERVER_STATUS = {
  version: {
    name: '1.15.2!',
    protocol: 578
  },
  players: {
    max: 876543210,
    online: 123456789,
    sample: []
  },
  description: {
    text: 'Hello World!',
    bold: true,
    color: 'green'
  }
}

// Default socket state to Handshaking
app.use((data, res, next) => {
  if (!socketState.has(res.socket)) socketState.set(res.socket, 'Handshaking')
  next()
})

// Create a pipeline that will handle individual packets
const packetHandler = new Nexpress.Pipeline()

// Read incoming data. Put each packet it contains in the packetHandler
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

// Handshake packet (0x00, state = handshaking)
packetHandler.use(0x00, (data, res, next) => {
  if (socketState.get(res.socket) !== 'Handshaking') return next()
  debug('received handshake')

  const [,,, nextState] = data.packet.read(Packet.VarInt, Packet.String, Packet.UShort, Packet.VarInt)

  if (nextState.value === 1) socketState.set(res.socket, 'Status')
  if (nextState.value === 2) socketState.set(res.socket, 'Login')
})

// Status packet (0x00, state = Status)
packetHandler.use(0x00, (data, res, next) => {
  if (socketState.get(res.socket) !== 'Status') return next()
  debug('received status request')

  const packetId = new Packet.VarInt(0x00)
  const jsonResponse = new Packet.String(JSON.stringify(SERVER_STATUS))
  const packetLength = new Packet.VarInt(packetId.length + jsonResponse.length)

  // Write a server status packet
  const packet = new Packet()
  packet.write(
    packetLength,
    packetId,
    jsonResponse
  )

  debug('sending server status')
  res.send(packet.buffer)
})

// Ping packet (0x01, state = Status)
packetHandler.use(0x01, (data, res, next) => {
  if (socketState.get(res.socket) !== 'Status') return next()
  debug('received ping')

  const [payload] = data.packet.read(Packet.Long)

  const packetId = new Packet.VarInt(0x01)
  const packetLength = new Packet.VarInt(packetId.length + payload.length)

  // Write a pong packet
  const packet = new Packet()
  packet.write(
    packetLength,
    packetId,
    payload
  )

  debug('sending pong')
  res.send(packet.buffer)
})

app.listen(25565)
