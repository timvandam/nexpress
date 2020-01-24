const Middleware = require('../middleware')

// TODO: See if it's possible to generate the pipeline after each .use instead of every .exec
class Pipeline extends Middleware {
  constructor () {
    super((data, res, next) => {
      const firstMiddleware = this.getNextMiddleware(null, data.id, Middleware.MiddlewareType.NORMAL_HANDLER)
      if (!firstMiddleware) return
      firstMiddleware.exec(data, res, this.getNext(firstMiddleware, data, res, next))
    })
    this.pipeline = []
  }

  use (method, id) {
    if (id && typeof id !== 'string') throw new Error('Middleware id must be of type string')
    const middleware = method instanceof Middleware ? method : new Middleware(method)
    if (id) middleware.id = id
    this.pipeline.push(middleware)
  }

  getNextMiddleware (middleware, id, type) {
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

  getNext (middleware, data, res, lastNext = () => {}) {
    if (middleware === undefined) return lastNext

    const nextMiddleware = this.getNextMiddleware(middleware, data.id, Middleware.MiddlewareType.NORMAL_HANDLER)
    const nextErrorHandler = this.getNextMiddleware(middleware, data.id, Middleware.MiddlewareType.ERROR_HANDLER)

    const next = this.getNext(nextMiddleware, data, res, lastNext)

    return err => {
      if (err) {
        if (!nextErrorHandler) throw new Error(`Uncaught error in middleware ${middleware.exec}`)
        nextErrorHandler.exec(err, data, res)
      } else if (nextMiddleware) nextMiddleware.exec(data, res, next)
    }
  }
}

module.exports = Pipeline
