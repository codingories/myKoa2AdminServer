const router = require('koa-router')()
const util = require('../utils/util')
const Menu = require('../models/menuSchema')

router.prefix('/menu')

// 菜单列表查询
router.get('/list', async (ctx) => {
  const {menuName, menuState} = ctx.request.query
  const params = {}
  if (menuName) params.menuName = menuName
  if (menuState) params.menuState = menuState
  let rootList = (await Menu.find(params)) || []
  const permissionList = util.getTreeMenu(rootList, null, [])
  ctx.body = util.success(permissionList)
})



// 菜单编辑、删除、新增功能
router.post('/operate', async (ctx) => {
  const {_id, action, ...params} = ctx.request.body
  let res, info
  try {
    if (action === 'add') {
      // 创建一条数据
      res = await Menu.create(params)
      info = '创建成功'
    } else if (action === 'edit') {
      params.updateTime = new Date()
      res = await Menu.findByIdAndUpdate(_id, params)
      info = '编辑成功'
    } else {
      // 删除一条
      res = await Menu.findByIdAndRemove(_id)
      //删除需要把子菜单（所有ID都是父级ID的都删掉）
      await Menu.deleteMany({parentId: {$all: [_id]}})
      info = '删除成功'
    }
    ctx.body = util.success('', info)
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }
})

module.exports = router
