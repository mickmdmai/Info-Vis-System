import * as React from 'react'
import { PureComponent } from 'react'
import * as shallowequal from 'shallowequal'

export { React }

export default class Component<P, S> extends PureComponent<P, S> {
	
	constructor() {
		super()
		this.state = {} as any
	}
	
	componentWillMount() {
		if (typeof this['load'] === 'function') {
			const result = this['load']() as Promise<void>
			if (result) {
				result.catch(this.catcher)
			}
		}
	}
	
	componentWillReceiveProps(nextProps: P) {
		if (typeof this['change'] !== 'function') {
			return
		}
		if (shallowequal(this.props, nextProps)) {
			return
		}
		const result = this['change'](nextProps) as Promise<void>
		if (result) {
			result.catch(this.catcher)
		}
	}
	
	className(...classes: string[]) {
		return classes.filter(c => !!c).map(c => c.trim()).join(' ');
	}
	
	timeout(milliseconds: number) {
		return new Promise<void>(resolve => setTimeout(resolve, milliseconds))
	}
	
	frame() {
		return new Promise<void>(resolve => requestAnimationFrame(resolve as () => void))
	}
	
	update(state?: S) {
		if (state) {
			return new Promise<void>(resolve => this.setState(state, resolve))
		}
		return new Promise<void>(resolve => this.forceUpdate(resolve))
	}
	
	attach<T extends Function>(method: T) {
		const self = this
		return function () {
			const ret = method.apply(self, arguments) as Promise<any>
			if (ret) {
				return ret.catch(self.catcher)
			}
			return ret
		} as any as T
	}
	
	report(e: Error) {
		console.error(e.stack || e.message || e)
	}
	
	catcher = e => this.report(e)
	
	catchUpdate(state?: S) {
		return this.update(state).catch(this.catcher)
	}
	
	attachUpdate(state?: S) {
		return () => this.catchUpdate(state)
	}
	
	render() {
		return null
	}
}
