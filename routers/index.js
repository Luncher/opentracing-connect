const ExpressRouter = require('./express_router')
const Koa2Router = require('./koa2_router')
const constants = require('../constants')

module.exports = function (config) {
  const type = config.type

  let router = config
  if (type === constants.ROUTER_TYPE_EXPRESS) {
    router = new ExpressRouter(config)
  }

  if (type === constants.ROUTER_TYPE_KOA2) {
    router = new Koa2Router(config)
  }

  return router
}