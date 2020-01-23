const net = require('net')
const debug = require('debug')('nexpress')

const Pipeline = require('./pipeline')
const Middleware = require('./middleware')

/**
 * Express like framework for TCP servers
 */
class Nexpress {
  constructor () {
    this.server = net.createServer()
    this.pipeline = new Pipeline()

    this.setUpListeners()
  }

  use (method) {
    const middleware = new Middleware(method)
    this.pipeline.add(middleware)
  }

  setUpListeners () {
    this.server.on('close', this.handleClose.bind(this))
    this.server.on('connection', this.handleConnection.bind(this))
    this.server.on('error', this.handleError.bind(this))
    this.server.on('listening', this.handleListening.bind(this))
    this.server.on('error', this.handleError.bind(this))
  }

  handleClose () {
  }

  handleConnection (socket) {
    debug('handling incoming connection')
    socket.on('data', () => {
      //
    })
  }

  handleError (error) {
  }

  handleListening () {
    const { port } = this.server.address()
    debug('listening on %o', port)
  }

  /**
   * Starts listening at the specified port
   * @param {Number} port - port to listen at
   * @param {Function} [callback] - optional callback function
   */
  listen (port, callback = () => {}) {
    if (this.server.listening) throw new Error('Already listening')

    this.server.listen(port, callback)
  }
}

module.exports = (...args) => {
  return new Nexpress(...args)
}
