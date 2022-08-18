/**
  * 维护用户ID自增长表
  */
const mongoose = require('mongoose')
const userSchema = mongoose.Schema({
  _id: String,
  sequence_value: Number
})


// 集合的model名称，数据库表的名称
module.exports = mongoose.model("counter", userSchema, "counters")
