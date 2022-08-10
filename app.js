const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const router = require('koa-router')()
const jwt = require('jsonwebtoken')
const users = require('./routes/users')
const log4js = require('./utils/log4j')

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
  await next()
})

// 一级路由
router.prefix('/api')

router.get('/leave/count', (ctx) => {
  const token = ctx.request.headers.authorization.split(' ')[1]
  console.log('token', token)
  ctx.body = jwt.verify(token, 'secret')
})

// 二级路由
router.use(users.routes(), users.allowedMethods())
// 全局挂载
app.use(router.routes(), users.allowedMethods())
// error-handling
app.on('error', (err, ctx) => {
  // console.error('server error', err, ctx)
  log4js.error(`${err.stack}`)
});

module.exports = app
