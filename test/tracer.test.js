const sinon = require('sinon')
const Jaeger = require('jaeger-client') 
const Tracer = require('../tracer')
const should = require('chai').should()

describe("Tracer test", () => {
  it('should allow createTracer', () => {
    const sandbox = sinon.sandbox.create()
    const serviceName = "test-service"
    const options = { 
      logger: console,
      agentHost: "127.0.0.1",
      agentPort: 6832
    }

    sandbox.mock(Jaeger).expects('initTracer')
      .once().withExactArgs({
        serviceName, 
        reporter: {
          logSpans: true,
          agentHost: options.agentHost,
          agentPort: options.agentPort
        },
        sampler: {
          type: "const",
          param: 1
        }
      }, {
        logger: options.logger
      })
    Tracer.createTracer(serviceName, options)
    sandbox.verifyAndRestore()
  })

  it('should allow createGlobalTracer', () => {
    const sandbox = sinon.sandbox.create()

    const fakeTracer = { a: 1 }
    sandbox.stub(Tracer, "createTracer").returns(fakeTracer)
    sandbox.mock(Jaeger.opentracing).expects("initGlobalTracer").once().withExactArgs(fakeTracer)
    Tracer.createGlobalTracer()
    sandbox.verifyAndRestore()
  })

  describe("Tracer extractOrCreateSpan", () => {
    const uri = "/foo/bar"
    const request = {
      headers: { a: 1 }
    }
    const tracer = {
      startSpan: function () {},
      extract: function() {}
    }

    let sandbox    
    beforeEach(() => {
      sandbox = sinon.sandbox.create()
    })

    afterEach(() => {
      sandbox.verifyAndRestore()
    })

    it('should allow extract Span', () => {
      const spanContext = { foo: "bar" }
      sandbox.mock(tracer).expects("extract")
        .once()
        .withExactArgs(Tracer.opentracing.FORMAT_HTTP_HEADERS, request.headers)
        .returns(spanContext)
      sandbox.mock(tracer).expects("startSpan")
        .once()
        .withExactArgs(uri, { childOf: spanContext })

      Tracer.extractOrCreateSpan(request, uri, tracer)
    })

    it('should allow create Span', () => {
      sandbox.stub(tracer, "extract").throws()
      sandbox.mock(tracer).expects("startSpan")
        .once()
        .withExactArgs(uri)
      
      Tracer.extractOrCreateSpan(request, uri, tracer)
    })
  })
})