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
    firstMiddleware.method.call({}, data, res, this.getNext(firstMiddleware).bind({ data, res }))
  }

  getNext (middleware) {
    if (middleware === undefined) return () => {}

    const currentIndex = this.pipeline.indexOf(middleware)

    let nextMiddlewareIndex
    for (let i = currentIndex + 1; i < this.pipeline.length; i++) {
      if (this.pipeline[i].type === Middleware.MiddlewareType.NORMAL_HANDLER) {
        nextMiddlewareIndex = i
        break
      }
    }

    let nextErrorIndex
    for (let i = currentIndex + 1; i < this.pipeline.length; i++) {
      if (this.pipeline[i].type === Middleware.MiddlewareType.ERROR_HANDLER) {
        nextErrorIndex = i
        break
      }
    }

    const nextMiddleware = this.pipeline[nextMiddlewareIndex]
    const nextErrorHandler = this.pipeline[nextErrorIndex]

    const next = this.getNext(nextMiddleware)

    return function (err) {
      const { data, res } = this
      if (err) {
        if (!nextErrorHandler) throw new Error(`Uncaught error in middleware ${middleware}`)
        nextErrorHandler.method(err, data, res, next.bind({ data, res }))
      } else if (nextMiddleware) nextMiddleware.method(data, res, next.bind({ data, res }))
    }
  }
}

module.exports = Pipeline
