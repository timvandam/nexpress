class DataType {
  get length () {
    return this.buffer.length
  }
}

class VarInt extends DataType {
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

VarInt.fromBuffer = function (buffer) {
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

  return new VarInt(result)
}

class _String extends DataType {
  constructor (value) {
    super()
    this.value = value
    this.buffer = this.createBuffer(value)
  }

  createBuffer (value) {
    const length = new VarInt(value.length)
    const str = Buffer.from(value, 'utf8')
    return Buffer.concat([length.buffer, str])
  }
}

_String.fromBuffer = function (buffer) {
  const length = VarInt.fromBuffer(buffer)
  return new _String(buffer.slice(length.length, length.length + length.value).toString('utf8'))
}

class UShort extends DataType {
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

UShort.fromBuffer = function (buffer) {
  return new UShort(buffer.readUInt16BE())
}

class Long extends DataType {
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

Long.fromBuffer = function (buffer) {
  return new Long(buffer.readBigInt64BE())
}

module.exports = {
  VarInt,
  String: _String,
  UShort,
  Long
}
