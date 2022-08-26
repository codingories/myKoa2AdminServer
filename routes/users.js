/**
 * 用户管理模块
 */
const router = require('koa-router')()
const md5 = require('md5')

const User = require('../models/userSchema')
const Menu = require('../models/menuSchema')
const Role = require('../models/roleSchema')
const Counter = require('../models/counterSchema')

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

    if (res) {
      const data = res._doc
      data.token = jwt.sign({
        data,
      }, 'secret', {expiresIn: '24h'})
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

// 用户新增/编辑
router.post('/operate', async (ctx) => {
  console.log('fuk operate')
  const {
    userId,
    userName,
    userEmail,
    mobile,
    job,
    state,
    roleList,
    deptId,
    action
  } = ctx.request.body

  if (action === 'add') {
    if (!userName || !userEmail || !deptId) {
      ctx.body = util.fail('参数错误', util.CODE.PARAM_ERROR)
      return
    }
    // 先查找下看看有没有重复的用户名和邮箱，有就返回报错
    const res = await User.findOne(
      {$or: [{userName}, {userEmail}]},
      '_id userName userEmail'
    )
    if (res) {
      ctx.body = util.fail(
        `系统监测到有重复的用户，信息如下：${res.userName} - ${res.userEmail}`
      )
    } else {
      try {
        // 这里开始新建
        // 每次去数据库查找一个id，并加1，{new: true}返回最新的值
        const doc = await Counter.findOneAndUpdate({_id: 'userId'}, {$inc: {sequence_value: 1}}, {new: true})
        const user = new User({
          userId: doc.sequence_value, //需要手动增加一个自增的ID
          userName,
          userPwd: md5('123456'),
          userEmail,
          role: 1, //默认普通用户
          roleList,
          job,
          state,
          deptId,
          mobile
        })
        user.save();
        ctx.body = util.success('', '用户创建成功');
      } catch (error) {
        ctx.body = util.fail(error.stack, '用户创建失败');
      }

    }
  } else {
    if (!deptId) {
      ctx.body = util.fail('部门不能为空', util.CODE.PARAM_ERROR)
      return
    }
    try {
      const res = await User.findOneAndUpdate(
        {userId},
        {mobile, job, state, roleList, deptId}
      )
      ctx.body = util.success({}, '更新成功')
    } catch (error) {
      ctx.body = util.fail(error.state, '更新失败')
    }
  }
})

router.get('/all/list', async (ctx) => {
  // 获取全量用户列表
  try {
    const list = await User.find({}, "userId userName userEmail")
    ctx.body = util.success(list)
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }
})

// 获取用户对应的权限菜单
router.get("/permissionList", async (ctx) => {
  let authorization = ctx.request.headers.authorization
  let {data} = util.decoded(authorization)
  let menuList = await getMenuList(data.role, data.roleList)
  let actionList = getActionList(JSON.parse(JSON.stringify(menuList)))
  ctx.body = util.success({menuList, actionList})
})

async function getMenuList(userRole, roleKeys) {
  let rootList = []
  if (userRole === 0) {
    rootList = await Menu.find({}) || []
  } else {
    // 获取用户的权限列表
    // 查找用户有哪些角色
    let roleList = await Role.find({_id: {$in: roleKeys}})
    let permissionList = []
    // 根据角色去查询角色有哪些权限列表
    roleList.map(role => {
      let {checkedKeys, halfCheckedKeys} = role.permissionList
      permissionList = permissionList.concat([...checkedKeys, ...halfCheckedKeys])
    })
    // 把这些key进行聚合
    permissionList = [...new Set(permissionList)]
    // 去查找哪些菜单里面是包含这些key的
    rootList = await Menu.find({_id: {$in: permissionList}})
  }
  return util.getTreeMenu(rootList, null, [])
}

function getActionList(list) {
  let actionList = []
  const deep = (arr) => {
    while (arr.length) {
      let item = arr.pop()
      if (item.action && item.action) {
        item.action.map(action=>{
          actionList.push(action.menuCode)
        })
      }
      if (item.children && !item.action) {
        deep(item.children)
      }
    }
  }
  deep(list)
  return actionList
}

module.exports = router
