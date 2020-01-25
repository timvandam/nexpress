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
    max: 100,
    online: 12,
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
    const packetLength = Packet.VarInt.fromBuffer(data.buffer.slice(i))
    const packetId = Packet.VarInt.fromBuffer(data.buffer.slice(i + packetLength.length))
    const packet = new Packet(data.buffer.slice(
      i + packetLength.length + packetId.length,
      i + packetLength.length + packetId.length + packetLength.value - packetId.length
    ))

    packet.id = packetId.value

    const dataObj = new Nexpress.Data(packet.buffer)
    dataObj.packet = packet
    dataObj.id = packet.id

    packetHandler.exec(dataObj, res, next)

    i += packet.length + packetLength.length + packetId.length
  }
})

// Handshake packet (0x00, state = handshaking)
packetHandler.use(0x00, (data, res, next) => {
  if (socketState.get(res.socket) !== 'Handshaking') return next()
  debug('received handshake')

  let i = 0
  const protocolVersion = Packet.VarInt.fromBuffer(data.packet.buffer)
  i += protocolVersion.length
  const serverAddress = Packet.String.fromBuffer(data.packet.buffer.slice(i))
  i += serverAddress.length
  const serverPort = Packet.UShort.fromBuffer(data.packet.buffer.slice(i))
  i += serverPort.length
  const nextState = Packet.VarInt.fromBuffer(data.packet.buffer.slice(i))

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
    packetLength.buffer,
    packetId.buffer,
    jsonResponse.buffer
  )

  debug('sending server status')
  res.send(packet.buffer)
})

// Ping packet (0x01, state = Status)
packetHandler.use(0x01, (data, res, next) => {
  if (socketState.get(res.socket) !== 'Status') return next()
  debug('received ping')

  const payload = Packet.Long.fromBuffer(data.packet.buffer)

  const packetId = new Packet.VarInt(0x01)
  const packetLength = new Packet.VarInt(packetId.length + payload.length)

  // Write a pong packet
  const packet = new Packet()
  packet.write(
    packetLength.buffer,
    packetId.buffer,
    payload.buffer
  )

  debug('sending pong')
  res.send(packet.buffer)
})

app.listen(25565)
