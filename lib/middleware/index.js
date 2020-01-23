const MiddlewareType = require('../enums/MiddlewareType')

class Middleware {
  constructor (method) {
    if (typeof method !== 'function') throw new Error('Middleware must be a method')
    this.method = method
    this.type = MiddlewareType[method.length === 4 ? 'ERROR_HANDLER' : 'NORMAL_HANDLER']
  }

  exec (data, res, next) {
    if (arguments.length === 4) next(data)
  }
}

Middleware.MiddlewareType = MiddlewareType

module.exports = Middleware
