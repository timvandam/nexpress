const Middleware = require('../middleware')

// TODO: See if it's possible to generate the pipeline after each .use instead of every .exec
class Pipeline extends Middleware {
  constructor () {
    super((data, res, next) => {
      const [firstMiddleware] = this.pipeline
      if (!firstMiddleware) return
      firstMiddleware.exec(data, res, this.getNext(firstMiddleware, data, res, next))
    })
    this.pipeline = []
  }

  use (method) {
    const middleware = method instanceof Middleware ? method : new Middleware(method)
    this.pipeline.push(middleware)
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
        if (!nextErrorHandler) throw new Error(`Uncaught error in middleware ${middleware.exec}`)
        nextErrorHandler.exec(err, data, res)
      } else if (nextMiddleware) nextMiddleware.exec(data, res, next)
    }
  }
}

module.exports = Pipeline
