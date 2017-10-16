const sinon = require('sinon')
const Jaeger = require('jaeger-client') 
const Router = require('../router')
const should = require('chai').should()
const ExpressRouter = require('../routers/express_router')
const Koa2Ruoter = require('../routers/koa2_router')

describe("Router Test", () => {
  describe("Create Router", () => {
    it("should allow create express routerProxy", () => {
      const config = {
        router: {},
        proxy: {
          type: "express"
        }
      }
      const routerProxy = Router.create(config)
      routerProxy.proxyInstance.should.be.instanceof(ExpressRouter)
    })

    it("should allow create koa2 routerProxy", () => {
      const config = {
        router: {},
        proxy: {
          type: "koa2"
        }
      }
      const routerProxy = Router.create(config)
      routerProxy.proxyInstance.should.be.instanceof(Koa2Ruoter)
    })
  })

  it('should allow routerProxy', () => {
    const config = {
      router: {},      
      proxy: {
        type: "express"
      }
    }
    const router = Router.create(config)
  })
})