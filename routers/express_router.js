class ExpressRouter {
  constructor (...args) {

  }

  request (req, res, next) {
    return req
  }

  response (req, res, next) {
    return res
  }

  method (req, res, next) {
    return req.method
  }

  url (req, res, next) {
    return req.originalUrl
  }
}

module.exports = ExpressRouter