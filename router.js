const onFinished = require('on-finished')
const RouterCreator = require('./routers')
const constants = require('./constants')
const { opentracing, extractOrCreateSpan } = require('./tracer')

// config = {
//   router: expressRouter,
//   proxy: {
//     type: 'express'
//   },
//   customizeTags: function ({ span, tracer}, ...args) {

//   }
// }

function RouterProxy(router, config) {
  this.config = config
  this.proxyInstance = router  
}

RouterProxy.create = function (config, tracer = null) {
  if (!config.router) {
    throw new Error("Not Setup Router")
  }

  if (!config.proxy) {
    throw new Error("Not Setup Proxy")    
  }

  const proxyInstance = RouterCreator(config.proxy)
  const instance = new RouterProxy(proxyInstance, config)
  instance.wrap(config.router, tracer)

  return instance
}

RouterProxy.prototype.wrap = function (router, tracer = null) {
  if (!tracer) {
    tracer = opentracing.globalTracer()  
  }

  constants.PROXY_NAMES.forEach(method => {
    this.wrapRouterMethod(router, method, tracer)
  })

  return router
}

RouterProxy.prototype.wrapRouterMethod = function (router, method, tracer) {
  if (typeof router[method] !== 'function') {
    return
  }

  const that = this
  const doit = router[method].bind(router)
  router[method] = function (...args) {
    const length = args.length
    if (length <= 1 || typeof args[length-1] !== 'function') {
      return doit(...args)
    }
    const uri = args[0]
    const handler = that.wrapRouterMethodHandler(args[args.length - 1], uri, tracer)
    args.splice(length -1, 1, handler)
    return doit(...args)
  }

  return
}

RouterProxy.prototype.wrapRouterMethodHandler = function (handler, uri, tracer) {
  const that = this

  return function (...args) {
    const req = that.proxyInstance.request(...args)
    const res = that.proxyInstance.response(...args)
    const url = that.proxyInstance.url(...args)
    const method = that.proxyInstance.method(...args)

    const span = extractOrCreateSpan(req, uri, tracer)
    span.setTag(opentracing.Tags.HTTP_METHOD, method)
    span.setTag(opentracing.Tags.HTTP_URL, url)
    span.setTag(opentracing.Tags.SPAN_KIND, 'server')

    const traceCtx = { span, tracer }
    if (that.config.customizeTags) {
      that.config.customizeTags(traceCtx, ...args)
    }

    args[0].traceCtx = traceCtx

    function spanFinised () {
      span.finish()
    }

    onFinished(res, spanFinised)

    return handler(...args)
  }
}

module.exports = RouterProxy