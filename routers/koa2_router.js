class Koa2Router {
  constructor (...args) {

  }

  request (ctx, next) {
    return ctx.req
  }

  response (ctx, next) {
    return ctx.res
  }

  method (ctx, next) {
    return ctx.method
  }

  url (ctx, next) {
    return ctx.url
  }
}

module.exports = Koa2Router