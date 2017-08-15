'use strict'

const config = require('./webpack.web')
const common = require('./webpack.common')

common.prod(config)

module.exports = config
