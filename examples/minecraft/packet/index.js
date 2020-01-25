/**
 * Class that represents a packet. Can be used both for packet construction and packet reading
 */
class Packet {
  /**
   * Constructs a Packet instance
   * @param {Buffer} [buffer] - buffer with packet data
   */
  constructor (buffer = Buffer.alloc(0)) {
    this.buffer = buffer
  }

  /**
   * Writes some data to this buffer
   * @param  {...DataType} data - data to write to this buffer
   */
  write (...data) {
    this.buffer = Buffer.concat([this.buffer, ...data.map(d => d.buffer)])
  }

  /**
   * Reads data from this packet using provided data types
   * @param  {...DataType} dataTypes - data types to read
   * @returns {DataType[]} list of read data
   */
  read (...dataTypes) {
    const data = []
    let i = 0
    dataTypes.forEach(dt => {
      const res = dt.fromBuffer(this.buffer.slice(i))
      data.push(res)
      i += res.length
    })
    return data
  }

  get length () {
    return this.buffer.length
  }
}

class DataType {
  get length () {
    return this.buffer.length
  }
}

Packet.VarInt = class extends DataType {
  constructor (value) {
    super()
    this.value = value
    this.buffer = this.createBuffer(value)
  }

  createBuffer (value) {
    let buf = Buffer.alloc(0)
    do {
      let temp = (value & 0b01111111)
      // Note: >>> means that the sign bit is shifted with the rest of the number rather than being left alone
      value >>>= 7
      if (value !== 0) {
        temp |= 0b10000000
      }
      buf = Buffer.concat([buf, Buffer.from([temp])])
    } while (value !== 0)
    return buf
  }
}

Packet.VarInt.fromBuffer = function (buffer) {
  let numRead = 0
  let result = 0
  let read
  do {
    read = buffer
      .slice(numRead, numRead + 1)
      .readInt8()
    const value = (read & 0b01111111)
    result |= (value << (7 * numRead))

    numRead++
    if (numRead > 5) throw new Error('VarInt is too big')
  } while ((read & 0b10000000) !== 0)

  return new Packet.VarInt(result)
}

Packet.String = class extends DataType {
  constructor (value) {
    super()
    this.value = value
    this.buffer = this.createBuffer(value)
  }

  createBuffer (value) {
    const length = new Packet.VarInt(value.length)
    const str = Buffer.from(value, 'utf8')
    return Buffer.concat([length.buffer, str])
  }
}

Packet.String.fromBuffer = function (buffer) {
  const length = Packet.VarInt.fromBuffer(buffer)
  return new Packet.String(buffer.slice(length.length, length.length + length.value).toString('utf8'))
}

Packet.UShort = class extends DataType {
  constructor (value) {
    super()
    this.value = value
    this.buffer = this.createBuffer(value)
  }

  createBuffer (value) {
    const buf = Buffer.alloc(2)
    buf.writeUInt16BE(value)
    return buf
  }
}

Packet.UShort.fromBuffer = function (buffer) {
  return new Packet.UShort(buffer.readUInt16BE())
}

Packet.Long = class extends DataType {
  constructor (value) {
    super()
    if (typeof value !== 'bigint') throw new Error('Value must be of type bigint')
    this.value = value
    this.buffer = this.createBuffer(value)
  }

  createBuffer (value) {
    const buf = Buffer.alloc(8)
    buf.writeBigInt64BE(value)
    return buf
  }
}

Packet.Long.fromBuffer = function (buffer) {
  return new Packet.Long(buffer.readBigInt64BE())
}

module.exports = Packet
