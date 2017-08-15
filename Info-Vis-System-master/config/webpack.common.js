'use strict'

const { DefinePlugin } = require('webpack')

module.exports = {
	prod(config) {
		config.plugins.push(new DefinePlugin({
			'process.env': {
				NODE_ENV: JSON.stringify('production'),
				APP_ENV: JSON.stringify('browser')
			}
		}))
	}
}
