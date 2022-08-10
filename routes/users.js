/**
 * 用户管理模块
 */
const router = require('koa-router')()
const User = require('../models/userSchema')
const util = require('../utils/util')
const jwt = require('jsonwebtoken')
router.prefix('/users')

// 通过ctx拿请求参数
router.post('/login', async (ctx) => {
  // try catch防止数据库报错
  try {
    const {userName, userPwd} = ctx.request.body;
    // 根据用户名和密码查询
    // 返回数据库指定的字段，方式一字符串加空格
    const res = await User.findOne({userName, userPwd}, 'userId userName userEmail state role deptId roleList')
    // 第二种方式通过json，1返回0不反，只有userId
    // const res = await User.findOne({userName, userPwd}, {'userId': 1, '_id': 0})
    // 第三种方式select
    // const res = await User.findOne({userName, userPwd}).select('userId')

    // 生成token, 根据密钥secret加密， 时间是1h
    const data = res._doc
    console.log('data===>', data)
    const token = jwt.sign({
      data,
    }, 'secret', {expiresIn: '1h'})
    if (res) {
      data.token = token
      // ctx.body = util.success(res)
      ctx.body = util.success(data)
    } else {
      ctx.body = util.fail("账号或密码不正确")
    }
  } catch (error) {
    ctx.body = util.fail(error.message)
  }
})

module.exports = router
