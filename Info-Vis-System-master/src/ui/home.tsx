import Component, { React } from './component'

import Map, { Mode } from './map'

export default class Home extends Component<{}, {
	mode: Mode
}> {
	constructor() {
		super()
		
		this.state = {
			mode: 'detailed'
		}
	}
	
	render() {
		return (
			<div className="home">
				<div id="detailtip" className="tooltip"/>
				<div id="legend"/>
				<div className="buttons">
					<button
						className="red"
						disabled={this.state.mode === 'detailed'}
						onClick={this.attachUpdate({mode: 'detailed'})}
					>
						Detailed Map
					</button>
					<button
						className="purple"
						disabled={this.state.mode === 'electoral'}
						onClick={this.attachUpdate({mode: 'electoral'})}
					>
						Electoral Bubble Map
					</button>
				</div>
				<div className="main">
					<div id="mapview">
						<Map mode={this.state.mode}/>
					</div>
					<div id="statview">
					</div>
				</div>
				<div id="detailview">
					<form>
						<label><input type="radio" name="mode" value="updateDetailView" defaultChecked/> Equal</label>
						<label><input type="radio" name="mode" value="updateDetailViewDistorted"/> By Votes</label>
					</form>
					<div id="detaillabel"/>
				</div>
			</div>
		)
	}
}
