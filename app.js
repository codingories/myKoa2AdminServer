const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const router = require('koa-router')()
const jwt = require('jsonwebtoken')
const log4js = require('./utils/log4j')
const util = require('./utils/util')
const koajwt = require('koa-jwt')
const users = require('./routes/users')
const menus = require('./routes/menus')
const roles = require('./routes/roles')
// error handler
onerror(app)

require('./config/db')
// middlewares
app.use(bodyparser({
  enableTypes: ['json', 'form', 'text']
}))
app.use(json())
// app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))


app.use(async (ctx, next) => {
  log4js.info(`get params: ${JSON.stringify(ctx.request.query)}`)
  log4js.info(`post params: ${JSON.stringify(ctx.request.body)} }`)
  await next().catch((err) => {
    if (err.status === 401) {
      ctx.status = 200
      ctx.body = util.fail('Token认证失败', util.CODE.AUTH_ERROR)
    } else {
      throw err;
    }
  })
})

// 一级路由
app.use(koajwt({secret: 'secret'}).unless({
  path: [/^\/api\/users\/login/]
}))
router.prefix('/api')

router.get('/leave/count', (ctx) => {
  // const token = ctx.request.headers.authorization.split(' ')[1]
  // console.log('token', token)
  // ctx.body = jwt.verify(token, 'secret')
  ctx.body = 'body'
})

// 二级路由
router.use(users.routes(), users.allowedMethods())
router.use(menus.routes(), menus.allowedMethods())
router.use(roles.routes(), roles.allowedMethods())

// 全局挂载
app.use(router.routes(), users.allowedMethods())
// error-handling
app.on('error', (err, ctx) => {
  // console.error('server error', err, ctx)
  log4js.error(`${err.stack}`)
});

module.exports = app
