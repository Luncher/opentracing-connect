const Jaeger = require('jaeger-client')

exports.opentracing = Jaeger.opentracing

const createTracer = module.exports.createTracer = 
function createTracer (serviceName, options) {
  const config = {}
  const reporter = { logSpans: false }

  if (options.logger) {
    config.logger = logger
    reporter.logSpans = true
  }

  if (options.agentHost) {
    reporter.agentHost = agentHost
  }

  if (options.agentPort) {
    reporter.agentPort = options.agentPort
  }

  return Jaeger.initTracer({
    serviceName,
    reporter,
    sampler: {
      type: "const",
      param: 1
    }
  }, config)
}

exports.createGlobalTracer = function (serviceName, options) {
  const tracer = createTracer(serviceName, options)
  Jaeger.opentracing.initGlobalTracer(tracer)

  return tracer
}

exports.extractOrCreateSpan = function (request, uri, tracer) {
  let span = null
  
  try {
    const spanContext = tracer.extract(opentracing.FORMAT_HTTP_HEADERS, request.headers)    
    span = tracer.startSpan(uri, { childOf:  spanContext })
  } catch(err) {
    span = tracer.startSpan(uri)
  }

  return span
}