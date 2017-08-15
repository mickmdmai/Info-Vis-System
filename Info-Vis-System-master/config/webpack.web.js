'use strict'

const config = require('./webpack.base')
const { SourceMapDevToolPlugin } = require('webpack')

config.plugins.push(new SourceMapDevToolPlugin())

module.exports = config
