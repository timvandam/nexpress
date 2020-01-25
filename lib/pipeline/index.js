const Middleware = require('../middleware')

/**
 * Class that represents a pipeline. A pipeline can also have another pipeline as middleware
 */
class Pipeline extends Middleware {
  /**
   * Constructs a Pipeline
   */
  constructor () {
    super((data, res, next) => {
      const firstMiddleware = this.getNextMiddleware(null, Middleware.MiddlewareType.NORMAL_HANDLER, data.id)
      if (!firstMiddleware) return
      firstMiddleware.exec(data, res, this.getNext(firstMiddleware, data, res, next))
    })
    this.pipeline = []
  }

  /**
   * Adds a middleware to the pipeline
   * @param {Function|Middleware} middleware - middleware function/instance to add to the pipeline
   * @param {String|Number} [id] - optional id to which this middleware will only respond
   */
  use (id, middleware) {
    const hasId = [id, middleware].filter(e => e !== undefined).length === 2
    if (!hasId) middleware = id
    middleware = middleware instanceof Middleware
      ? middleware
      : new Middleware(middleware)
    if (hasId) middleware.id = id
    this.pipeline.push(middleware)
  }

  /**
   * Gets the next middleware
   * @param {Middleware} middleware - the current middleware
   * @param {Middleware.MiddlewareType} type - middleware type to look for
   * @param {String} [id] - middleware id
   */
  getNextMiddleware (middleware, type, id) {
    const currentIndex = this.pipeline.indexOf(middleware)

    let nextMiddlewareIndex
    for (let i = currentIndex + 1; i < this.pipeline.length; i++) {
      const mw = this.pipeline[i]
      if (mw.type === type && (mw.id === undefined || mw.id === id)) {
        nextMiddlewareIndex = i
        break
      }
    }
    return this.pipeline[nextMiddlewareIndex]
  }

  /**
   * Generates a next() function for a middleware
   * @param {Middleware} middleware - middleware to generate function for
   * @param {Data} data - data object
   * @param {Response} res - response object
   * @param {Function} lastNext - the next() function to execute after the pipeline has completed
   */
  getNext (middleware, data, res, lastNext = () => {}) {
    if (middleware === undefined) return lastNext
    return err => {
      if (err) {
        const nextErrorHandler = this.getNextMiddleware(middleware, Middleware.MiddlewareType.ERROR_HANDLER, data.id)
        if (!nextErrorHandler) throw new Error('Uncaught error in middleware')
        nextErrorHandler.exec(err, data, res, this.getNext(nextErrorHandler, data, res, lastNext))
      } else {
        const nextMiddleware = this.getNextMiddleware(middleware, Middleware.MiddlewareType.NORMAL_HANDLER, data.id)
        if (!nextMiddleware) return
        nextMiddleware.exec(data, res, this.getNext(nextMiddleware, data, res, lastNext))
      }
    }
  }
}

module.exports = Pipeline
