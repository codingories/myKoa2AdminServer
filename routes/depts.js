const router = require('koa-router')()
const util = require('./../utils/util')
const Dept = require('./../models/deptSchema')

router.prefix('/dept')

// 部门树形列表
router.get('/list', async (ctx) => {
  let {deptName} = ctx.request.query
  let params = {}
  if (deptName) params.deptName = deptName
  const rootList = await Dept.find(params)
  if (deptName) {
    ctx.body = util.success(rootList)
  } else {
    let treeList = getTreeDept(rootList, null, [])
    ctx.body = util.success(treeList)
  }
})

// 部门操作: 创建,编辑,删除
router.post('/operate', async (ctx) => {
  const {_id, action, ...params} = ctx.request.body
  let res, info
  try {
    if (action === 'create') {
      res = await Dept.create(params)
      info = '创建成功'
    } else if (action === 'edit') {
      params.update = new Date()
      res = await Dept.findByIdAndUpdate(_id, params)
      info = '编辑成功'
    } else if (action === 'delete') {
      res = await Dept.findByIdAndDelete(_id)
      info = '删除成功'
    }
    ctx.body = util.success('', info)
  } catch (error) {
    ctx.body = util.fail(`操作失败：${error.stack}`)
  }
})

// 递归拼接树形列表
function getTreeDept(rootList, id, list) {
  for (let i = 0; i < rootList.length; i++) {
    let item = rootList[i]
    if (String(item.parentId.slice().pop()) === String(id)) {
      list.push(item._doc)
    }
  }
  list.map(item => {
    item.children = []
    getTreeDept(rootList, item._id, item.children)
    if (item.children.length === 0) {
      delete item.children
    }
  })
  return list
}

module.exports = router
