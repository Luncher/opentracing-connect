const onFinished = require('on-finished')
const RouterCreator = require('./routers')
const constants = require('./constants')
const { opentracing, extractOrCreateSpan } = require('./tracer')


function RouterProxy(router, config) {
  this.router = router
  this.config = config
}

RouterProxy.create = function (config) {
  const router = RouterCreator(config)
  return new RouterProxy(router, config)
}

RouterProxy.prototype.routerProxy = function () {
  const tracer = opentracing.globalTracer()

  constants.PROXY_NAMES.forEach(method => {
    this.routerMethodProxy(router, method, tracer)
  })

  return router
}

RouterProxy.prototype.routerMethodProxy = function (router, method, tracer) {
  if (typeof router[method] !== 'function') {
    return
  }

  const doit = router[method].bind(router)
  router[method] = function (...args) {
    const length = args.length
    if (length <= 1 || typeof args[length-1] !== 'function') {
      return doit(...args)
    }
    const uri = args[0]
    const handler = this.routerMethodHandlerProxy(args[args.length - 1], uri, tracer)
    args.splice(length -1, 1, handler)
    return doit(...args)
  }

  return
}

RouterProxy.prototype.routerMethodHandlerProxy = function (handler, uri, tracer) {
  const that = this
  
  return function (...args) {
    const req = that.router.request(...args)
    const res = that.router.response(...args)
    const url = that.router.url(...args)
    const method = that.router.method(...args)

    const span = extractOrCreateSpan(req, uri, tracer)
    span.setTag(opentracing.Tags.HTTP_METHOD, method)
    span.setTag(opentracing.Tags.HTTP_URL, url)
    span.setTag(opentracing.Tags.SPAN_KIND, 'server')

    args[0].traceCtx = { span, tracer }

    function spanFinised () {
      span.finish()
    }

    onFinished(res, spanFinised)

    return handler(...args)
  }
}

module.exports = RouterProxy