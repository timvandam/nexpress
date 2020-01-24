const net = require('net')
const debug = require('debug')('nexpress')

const Pipeline = require('./pipeline')
const Middleware = require('./middleware')
const Response = require('./response')
const Data = require('./data')

const ONE_MINUTE = 1000 * 60

/**
 * Express like framework for TCP servers
 */
// TODO: Make private methods private
class Nexpress {
  /**
   * Constructs an instance of nexpress
   * @param {{
   *  timeOut: Number,
   *  timeOutHandler: Function
   * }} [options={}] - nexpress options
   */
  constructor (options = {}) {
    this.server = net.createServer()
    this.pipeline = new Pipeline()

    // Set default options
    this.options = {}
    this.options.timeOut = ONE_MINUTE
    this.options.timeOutHandler = socket => {
      socket.end()
      socket.destroy()
      debug('closed timed-out socket')
    }

    // Set user-defined options
    Object.entries(options).forEach(([key, value]) => {
      this.options[key] = value
    })

    this.setUpListeners()
  }

  /**
   * Sets an option to a specified value
   * @param {String} option - option name to set
   * @param {Any} value - value to set specified option to
   */
  set (option, value) {
    this.options[option] = value
  }

  /**
   * Adds a middleware to the pipeline
   * @param {Function} method - middleware function to add to the pipeline
   */
  use (method) {
    const middleware = method instanceof Middleware ? method : new Middleware(method)
    if (middleware.method === undefined) throw new Error('Middlewares must have methods')
    this.pipeline.use(middleware)
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
    socket.setTimeout(this.options.timeOut)
    socket.on('data', data => {
      this.pipeline.insert(
        new Data(data),
        new Response(socket)
      )
    })

    socket.on('timeout', () => this.options.timeOutHandler(socket))
  }

  handleError (error) {
    throw error
  }

  handleListening () {
    const { port } = this.server.address()
    debug('listening on %o', port)
  }

  /**
   * Starts listening at the specified port
   * @param {Number} port - port to listen at
   * @param {Function} [callback=Function] - optional callback function
   */
  listen (port, callback = () => {}) {
    if (this.server.listening) throw new Error('Already listening')

    this.server.listen(port, callback)
  }
}

/**
 * Constructs a Nexpress instance
 */
module.exports = (...args) => {
  return new Nexpress(...args)
}
