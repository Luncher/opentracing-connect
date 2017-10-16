# opentracing-connect

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Coverage][codecov-image]][codecov-url]
[![David Status][david-image]][david-url]


[npm-url]: https://www.npmjs.com/package/opentracing-connect
[npm-image]: https://img.shields.io/npm/v/opentracing-connect.svg?style=flat
[david-url]: https://david-dm.org/Luncher/opentracing-connect
[david-image]: https://david-dm.org/Luncher/opentracing-connect.svg?style=flat
[travis-url]: https://travis-ci.org/Luncher/opentracing-connect
[travis-image]: https://img.shields.io/travis/Luncher/opentracing-connect.svg?style=flat
[codecov-url]: https://codecov.io/gh/Luncher/opentracing-connect
[codecov-image]: https://img.shields.io/codecov/c/github/Luncher/opentracing-connect.svg?style=flat


## Quick Start

### Integrated With Express 

```javascript
const express = require('express')
const { Tracer, RouterProxy } = require('opentracing-connect')

const app = new express()

const serviceName = 'One'
//create and register global tracer
Tracer.createGlobalTracer(serviceName, { logger: console })
//proxy express router
const Router = RouterProxy.create({ router: express.Router(), proxy: { type: "express" } })

Router.get('/one',  async (request, response, next) => {
  //request has trace prop: traceCtx
  const result = await doSomething(request.traceCtx.span)
  console.log('service one result:')
  console.dir(result)
  response.json(result)
})

```

---

### Integrated With Koa2

```javascript
const Koa = require('koa')
const KoaRouter = require('koa-router')

const app = new Koa()
const serviceName = 'Two'
const tracer = Tracer.createGlobalTracer(serviceName, { logger: console })
const Router = RouterProxy.create({ router: KoaRouter(), proxy: { type: "koa2" } })

Router.get('/two', async (ctx, next) => {
  try {
    const userIds = [1, 2]
    //ctx has trace prop: traceCtx    
    const result = await getUserInfo(userIds, { span: ctx.traceCtx.span })
    ctx.traceCtx.span.log({'event': 'request_end'})
    ctx.body = result
  } catch(err) {
    console.log(err)
  }

  return 
})

```

---

### RouterProxy Configure

```javascript
{
  //router instance
  router: expressRouter,
  //proxy type
  proxy: {
    type: 'express'
  },
  //add cusmomize tags
  customizeTags: function ({ span, tracer}, ...args) {

  }
}
```

## [MIT License](https://opensource.org/licenses/MIT)