const net = require('net')
const debug = require('debug')('nexpress')

const Pipeline = require('./pipeline')
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
    debug(`option ${option} set`)
  }

  /**
   * Adds a middleware to the pipeline. If provided an id will be added to the middleware
   * @param {String} [id] - id to which this middleware should respond
   * @param {Function|Middleware} middleware - middleware function/instance to add to the pipeline
   */
  use (id, middleware) {
    this.pipeline.use(id, middleware)
  }

  /**
   * Sets up net server listeners
   */
  setUpListeners () {
    this.server.on('connection', socket => {
      debug('handling incoming connection')
      socket.setTimeout(this.options.timeOut)
      socket.on('data', data => {
        this.pipeline.exec(
          new Data(data),
          new Response(socket)
        )
      })

      socket.on('timeout', () => this.options.timeOutHandler(socket))
    })

    this.server.on('close', () => {
    })

    this.server.on('error', () => {
    })

    this.server.on('listening', () => {
      const { port } = this.server.address()
      debug('listening on %o', port)
    })
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
