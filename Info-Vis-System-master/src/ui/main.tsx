import 'babel-polyfill'
import 'regenerator-runtime/runtime'

import * as React from 'react'
import * as ReactDOM from 'react-dom'

import Home from './home'

const div = window.document.getElementById('view')
div.removeAttribute('id')
div.removeAttribute('class')
ReactDOM.render(<Home/>, div)
