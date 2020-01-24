const Middleware = require('../middleware')

class Pipeline extends Middleware {
  constructor () {
    super(() => {})
    this.pipeline = []
  }

  get method () {
    return this.insert
  }

  add (middleware) {
    if (!(middleware instanceof Middleware)) throw new Error('A middleware must be provided')
    this.pipeline.push(middleware)
  }

  insert (data, res, next) {
    const [firstMiddleware] = this.pipeline
    if (!firstMiddleware) return
    firstMiddleware.method.call({}, data, res, this.getNext(firstMiddleware, data, res, next))
  }

  getNext (middleware, data, res, lastNext = () => {}) {
    if (middleware === undefined) return lastNext

    const currentIndex = this.pipeline.indexOf(middleware)

    let nextMiddlewareIndex
    for (let i = currentIndex + 1; i < this.pipeline.length; i++) {
      if (this.pipeline[i].type === Middleware.MiddlewareType.NORMAL_HANDLER) {
        nextMiddlewareIndex = i
        break
      }
    }

    let nextErrorHandlerIndex
    for (let i = currentIndex + 1; i < this.pipeline.length; i++) {
      if (this.pipeline[i].type === Middleware.MiddlewareType.ERROR_HANDLER) {
        nextErrorHandlerIndex = i
        break
      }
    }

    const nextMiddleware = this.pipeline[nextMiddlewareIndex]
    const nextErrorHandler = this.pipeline[nextErrorHandlerIndex]

    const next = this.getNext(nextMiddleware, data, res, lastNext)

    return err => {
      if (err) {
        if (!nextErrorHandler) throw new Error(`Uncaught error in middleware ${middleware.method}`)
        nextErrorHandler.method(err, data, res)
      } else if (nextMiddleware) nextMiddleware.method(data, res, next)
      d
    }
  }
}

module.exports = Pipeline
