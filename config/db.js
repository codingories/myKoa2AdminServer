/**
 * 数据库连接
 */

const mongoose = require('mongoose')
const config = require('./index')
const log4js = require("../utils/log4j")


mongoose.connect(config.URL, {
  useUnifiedTopology: true,// 处理警告
  authSource: "my-manager",// 必填
  auth: {
    username: 'Ories',
    password: 'Aa69712201'
  }
});

const db = mongoose.connection;

db.on('error', () => {
  log4js.error('***数据库连接失败***')
})

db.on('open', () => {
  log4js.info('***数据库连接成功***')
})
