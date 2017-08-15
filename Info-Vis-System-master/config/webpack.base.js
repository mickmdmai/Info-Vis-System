'use strict'

const path = require('path')

const node = {};

['fs', 'net'].forEach(m => node[m] = 'empty')

module.exports = {
	entry: './src/ui/main.tsx',
	output: {
		filename: './public/bundle.js'
	},
	module: {
		loaders: [
			{
				test: /\.tsx?$/,
				loader: 'awesome-typescript-loader'
			},
			{
				test: /\.json$/,
				loader: 'json-loader'
			}
		]
	},
	node,
	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.jsx'],
		alias: {}
	},
	plugins: []
}
