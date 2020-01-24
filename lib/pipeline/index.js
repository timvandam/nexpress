const Middleware = require('../middleware')

// TODO: See if it's possible to generate the pipeline after each .use instead of every .exec
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
   * @param {String} [id] - optional id to which this middleware will only respond
   */
  use (id, middleware) {
    const hasId = [id, middleware].filter(e => e).length === 2
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
   * @param {String} [id] - middleware id to look for
   */
  getNextMiddleware (middleware, type, id) {
    const currentIndex = this.pipeline.indexOf(middleware)

    let nextMiddlewareIndex
    for (let i = currentIndex + 1; i < this.pipeline.length; i++) {
      const mw = this.pipeline[i]
      if (mw.type === type && (!mw.id || mw.id === id)) {
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

    const nextMiddleware = this.getNextMiddleware(middleware, Middleware.MiddlewareType.NORMAL_HANDLER, data.id)
    const nextErrorHandler = this.getNextMiddleware(middleware, Middleware.MiddlewareType.ERROR_HANDLER, data.id)

    const next = this.getNext(nextMiddleware, data, res, lastNext)

    return err => {
      if (err) {
        if (!nextErrorHandler) throw new Error(`Uncaught error in middleware ${middleware.exec}`)
        nextErrorHandler.exec(err, data, res, next)
      } else if (nextMiddleware) nextMiddleware.exec(data, res, next)
    }
  }
}

module.exports = Pipeline
