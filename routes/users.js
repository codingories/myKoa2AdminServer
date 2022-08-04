/**
 * 用户管理模块
 */
const router = require('koa-router')()
const User = require('../models/userSchema')
const util = require('../utils/util')
router.prefix('/users')

// 通过ctx拿请求参数
router.post('/login', async (ctx) => {
  // try catch防止数据库报错
  try {
    const {userName, userPwd} = ctx.request.body;
    // 根据用户名和密码查询
    const res = await User.findOne({userName, userPwd})
    console.log('res', res)
    if (res) {
      ctx.body = util.success(res)
    } else {
      ctx.body = util.fail("账号或密码不正确")
    }
  } catch (error) {
    ctx.body = util.fail(error.message)
  }
})

module.exports = router
