const Middleware = require('../middleware')

class Pipeline {
  constructor () {
    this.pipeline = []
  }

  add (middleware) {
    if (!(middleware instanceof Middleware)) throw new Error('A middleware must be provided')
    this.pipeline.push(middleware)
  }

  insert (data, res) {
    const [firstMiddleware] = this.pipeline
    if (!firstMiddleware) return
    firstMiddleware.method.call({}, data, res, this.getNext(firstMiddleware, data, res))
  }

  getNext (middleware, data, res) {
    if (middleware === undefined) return () => {}

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

    const next = this.getNext(nextMiddleware, data, res)

    return err => {
      if (err) {
        if (!nextErrorHandler) throw new Error(`Uncaught error in middleware ${middleware.method}`)
        nextErrorHandler.method(err, data, res)
      } else if (nextMiddleware) nextMiddleware.method(data, res, next)
    }
  }
}

module.exports = Pipeline
