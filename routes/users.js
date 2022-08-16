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

router.get('/list', async (ctx) => {
  const {userId, userName, state} = ctx.request.query
  // 处理分页，模块化处理，是第几个开始
  const {page, skipIndex} = util.pager(ctx.request.query)
  let params = {}
  // 如果有的话就不需要查询了，直接复制上去，作为查询条件
  if (userId) params.userId = userId
  if (userName) params.userName = userName
  if (state && state !== '0') params.state = state
  try {
    // 通过User 的model模型进行查找
    // 根据条件查询所有用户列表,第二个参数代表过滤掉_id ,userPwd字段，返回query对象
    const query = User.find(params, {_id: 0, userPwd: 0})
    // 分页
    const list = await query.skip(skipIndex).limit(page.pageSize)
    const total = await User.countDocuments(params)
    ctx.body = util.success({
      page: {
        ...page,
        total
      },
      list
    })
  } catch (e) {
    ctx.body = util.fail(`查询异常:${e}`)
  }
})

// 用户删除/批量删除
router.post('/delete', async (ctx) => {
  console.log('fuck delete')
  const {userIds} = ctx.request.body
  // User.updateMany({ $or: [{ userId: 10001 }, { userId: 10002 }] })
  //$in userIds可能是一个数组  userid是否包含在这个数组里
  const res = await User.updateMany({userId: {$in: userIds}}, {state: 2})
  console.log('res fuck', res)
  if (res.matchedCount) {
    ctx.body = util.success(res, `共删除成功${res.matchedCount}条`)
    return
  }
  ctx.body = util.fail('删除失败')
})

module.exports = router
