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

module.exports = Packet
