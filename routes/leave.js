/**
 * 角色管理模块
 */
const router = require('koa-router')()
const md5 = require('md5')

const Leave = require('../models/leaveSchema')
const Counter = require('../models/roleSchema')

const util = require('../utils/util')
const jwt = require('jsonwebtoken')
router.prefix('/leave')

router.get('/list', async (ctx) => {
  const {applyState} = ctx.request.query;
  const {page, skipIndex} = util.pager(ctx.request.query)
  let authorization = ctx.request.headers.authorization
  let {data} = util.decoded(authorization)
  try {
    let params = {
      "applyUser.userId": data.userId
    }
    if (applyState) params.applyState = applyState;
    const query = Leave.find(params)
    const list = await query.skip(skipIndex).limit(page.pageSize)
    const total = await Leave.countDocuments(params)
    ctx.body = util.success({
      page: {
        ...page,
        total
      },
      list
    })
  } catch (error) {
    ctx.body = util.fail(`查询失败:${error.stack}`)
  }
})


module.exports = router
