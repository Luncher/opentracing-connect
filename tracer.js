const Jaeger = require('jaeger-client')
const opentracing = Jaeger.opentracing

function Tracer() {

}

Tracer.opentracing = Jaeger.opentracing

Tracer.createTracer = function(serviceName, options = {}) {
  const config = {}
  const reporter = { logSpans: false }

  if (options.logger) {
    config.logger = options.logger
    reporter.logSpans = true
  }

  if (options.agentHost) {
    reporter.agentHost = options.agentHost
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

Tracer.createGlobalTracer = function (serviceName, options) {
  const tracer = Tracer.createTracer(serviceName, options)
  Jaeger.opentracing.initGlobalTracer(tracer)

  return tracer
}

Tracer.extractOrCreateSpan = function (request, uri, tracer) {
  let span
  
  try {
    const spanContext = tracer.extract(opentracing.FORMAT_HTTP_HEADERS, request.headers)    
    span = tracer.startSpan(uri, { childOf:  spanContext })
  } catch(err) {
    span = tracer.startSpan(uri)
  }

  return span
}

module.exports = Tracer