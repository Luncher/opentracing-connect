const { opentracing, extractOrCreateSpan } = require('./tracer')

const PROXY_NAMES = ["use", "get", "post", "patch", "put", "delete"]

function routerMethodHandlerProxy(handler, uri, tracer) {
  return function (...args) {
    let req = null

    if (args.length === 3) {
      //express      
      req = args[0]
    } else {
      //koa
      req = ctx.request
    }

    const span = extractOrCreateSpan(req, uri, tracer)
    span.setTag(opentracing.Tags.HTTP_METHOD, req.method)
    span.setTag(opentracing.Tags.HTTP_URL, req.originalUrl || req.url)
    span.setTag(opentracing.Tags.SPAN_KIND, 'server')
    
    args.push({ span })

    handler(...args)
  }
}

function routerMethodProxy(router, method, tracer) {
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
    const handler = routerMethodHandlerProxy(args[args.length - 1], uri, tracer)
    args.splice(length -1, 1, handler)
    return doit(...args)
  }

  return
}

function routerProxy(router) {
  const tracer = opentracing.globalTracer()

  PROXY_NAMES.forEach(method => {
    routerMethodProxy(router, method, tracer)
  })

  return router
}

module.exports = routerProxy