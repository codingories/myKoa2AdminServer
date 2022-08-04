const mongoose = require('mongoose')
const userSchema = mongoose.Schema({
  "userId": Number,
  "userName": String,
  "userPwd": String,
  "userEmail": String,
  "mobile": String,
  "sex": Number, // 性别 0：男 1：女
  "deptId": [],
  "job": String,
  "state": {
    type: Number,
    default: 1
  }, // 1: 在职 2: 离职 3: 试用期
  "role": {
    type: Number,
    default: 1
  }, // 用户角色 0：系统管理员 1：普通用户
  "roleList": [],
  "createTime": {
    type: Date,
    default: Date.now()
  }, // 创建时间
  "lastLoginTime": {
    type: Date,
    default: Date.now()
  }, // 更新时间
  remark: String // 使用remark字段方便拓展
})
// 通过mongoose.model定义模型，第一个是模型名称，第二个是配置，第三个是数据库的集合名称，也就是表名称
module.exports = mongoose.model("users", userSchema, "users")
