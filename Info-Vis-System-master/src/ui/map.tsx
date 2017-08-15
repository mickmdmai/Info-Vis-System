import Component, { React } from './component'
import * as fetch from 'isomorphic-fetch'
import * as d3 from 'd3'
import { Simulation, SimulationNodeDatum, Selection, EnterElement, ScaleOrdinal } from 'd3'
import * as topojson from 'topojson'

import electoral, { colors, Candidate } from './data/electoral'

import abbr, { state } from './data/abbr'

if (process.env.NODE_ENV !== 'production') {
	window['d3'] = d3
}

if (process.env.NODE_ENV !== 'production') {
	window['topojson'] = topojson
}

export type GeometryType = 'Polygon' | 'Feature'

export interface StateGeometry {
	geometry: {
		coordinates: number[][][]
		type: GeometryType
	}
	properties: {
		name: string
	}
	type: GeometryType
}

export interface ElectoralNode extends SimulationNodeDatum {
	id: string
	r: number
	abbr: string
	name: string
	candidate: Candidate
}

export type Mode = 'detailed' | 'electoral'

export interface MapProps {
	mode: Mode
}

export default class Map extends Component<MapProps, {}> {
	width = 960
	height = 540
	
	element: SVGSVGElement
	
	simulation: Simulation<ElectoralNode, any>
	
	us
	
	initial = [] as ElectoralNode[]
	
	nodes = [] as ElectoralNode[]
	
	svg: Selection<SVGSVGElement, any, HTMLElement, any>
	
	bubble: Selection<Element | EnterElement | Document | Window, any, HTMLElement, any>
	
	states: Selection<Element | EnterElement | Document | Window, StateGeometry, Element | EnterElement | Document | Window, any>
	
	circles: Selection<Element | EnterElement | Document | Window, ElectoralNode, Element | EnterElement | Document | Window, any>
	
	texts: Selection<Element | EnterElement | Document | Window, ElectoralNode, Element | EnterElement | Document | Window, any>
	
	colorScale
	
	async load() {
		if (process.env.NODE_ENV !== 'production') {
			window['map'] = this
		}
		
		const response = await fetch('us-states.json', {
			method: 'GET',
			credentials: 'same-origin'
		})
		this.us = await response.json()
		
		if (process.env.NODE_ENV !== 'production') {
			window['us'] = this.us
		}
		
		while (!this.element) {
			await this.frame()
		}
		
		this.svg = d3.select<SVGSVGElement, any>(this.element).append('g')
		
		// Drawing the state map. Base map taken from http://bl.ocks.org/rveciana/a2a1c21ca1c71cd3ec116cc911e5fce9
		// Modified heavily to use GeoJSON, merge data with geometries
		// Later in the file, we merge with more data, add fill function, add interactions
		const projection = d3.geoAlbersUsa()
		const path = d3.geoPath().projection(projection)
		
		const features = (this.us.features as StateGeometry[]).filter(d => electoral[state[d.properties.name]])
		
		this.states = this.svg.append('g')
			.selectAll('.state')
			.data<StateGeometry>(features)
			.enter()
			.append('path')
			.attr('class', 'state')
			.attr('d', path)
			.each(d => {
				const abbr = state[d.properties.name]
				const extract = electoral[abbr]
				const electors = Array.isArray(extract) ? extract : [extract]
				
				const centroid = path.centroid(d)
				
				for (const elector of electors) {
					this.initial.push({
						id: abbr,
						x: centroid[0],
						y: centroid[1],
						r: Math.sqrt(elector.votes * 100),
						abbr,
						candidate: elector.candidate,
						name: d.properties.name
					})
				}
			})
		
		const DC = this.initial.find(d => d.abbr === 'DC')
		const VA = this.initial.find(d => d.abbr === 'VA')
		const MD = this.initial.find(d => d.abbr === 'MD')
		// const KS = nodes.find(d => d.abbr === 'KS')
		
		DC.x = (VA.x + MD.x) / 2
		DC.y = (VA.y + MD.y) / 2
		
		this.nodes = JSON.parse(JSON.stringify(this.initial))
		
		this.bubble = this.svg.append('g')
		
		// Initializing bubble map nodes
		this.circles = this.bubble.selectAll('circle')
			.data(this.nodes)
			.enter()
			.append('circle')
			
		this.texts = this.bubble.selectAll('text')
			.data(this.nodes)
			.enter()
			.append('text')
		
		this.states.style('fill', 'black')
		
		this.circles
			.attr('r', d => d.r)
			.attr('cx', d => d.x)
			.attr('cy', d => d.y)
			.style('fill', d => colors[d.candidate])
			.attr('visibility', 'hidden')
			.on('mousemove', d => {
				const abbr = state[d.name]
				const extract = electoral[abbr]
				const electors = Array.isArray(extract) ? extract : [extract]
				var tip = '<h4>' + d.name + '</h4>';
				
				for (const elector of electors) {
					tip += '<p>' + elector.candidate + ': ' + elector.votes + '<p>'
				}
				d3.select('#detailtip')
					.style('visibility', 'visible')
					.style('left', d3.event.pageX + 'px')
					.style('top', d3.event.pageY + 'px')
					.html(tip)
			})
			.on('mouseout', d => {
				d3.select('#detailtip')
					.style('visibility', 'hidden')
			})
		this.texts
			.attr('x', d => d.x)
			.attr('y', d => d.y)
			.attr('dy', 4)
			.attr('text-anchor', 'middle')
			.style('fill', 'white')
			.attr('font-size', 12)
			.text(d => d.abbr)
			.style('pointer-events', 'none')
		
		this.ojan()
	}
	
	ojan() {
		const self = this
		
		const stateToAbbr = state
			
		const width = this.width
		const height = this.height

		const resetRect = this.svg.append('rect')
			.attr('width', width)
			.attr('height', height)
			.style('fill', 'none')

		const svg = this.svg
		
		this.colorScale = (d => (d['D. Trump'].votes > d['H. Clinton'].votes) ? '#F44336' : '#2196F3')

		const colorScale = this.colorScale

		const legendWidth = 200
		const legendHeight = 45
		const legendSvg = d3.select('#legend').append('svg')
			.attr('width', legendWidth)
			.attr('height', legendHeight)

		const detailWidth = 960
		const detailHeight = 50
		const detail_x = d3.scaleBand()
							.range([0, detailWidth])

		const detailSvg = d3.select('#detailview')
			.append('svg')
			.attr('width', detailWidth)
			.attr('height', detailHeight)

		const projection = d3.geoAlbersUsa()
		const path = d3.geoPath()
				.projection(projection)


		let updateFunc = updateDetailView
		let selection
		let centered = null


		function changeDetailView(viewUpdate) {
			updateFunc = (viewUpdate === 'equal') ? updateDetailView : updateDetailViewDistorted
			updateFunc(selection)
		}
		
		d3.selectAll('input')
			.data(['equal', 'popular'])
			.on('change', changeDetailView)

		d3.csv('presidential_general_election_2016_by_county.csv', function (error, data) {
			data.forEach(d => {
				d.vote_pct = +d.vote_pct
				d.votes = +d.votes
			})
			// Aggregating election data into hierarchy
			// All original stuff
			const hierarchy = {name: 'United States', children: [], results: {}}
			const countyData = []
			let prevFips = 0
			let prevState = 0
			let stateAcc = {}
			const usAcc = {}
			let countyTotal = 0
			let stateTotal = 0
			let usTotal = 0
			for (let i = 0; i < data.length; i++) {
				if (prevState !== data[i].state) {
					if (hierarchy.children.length > 0) {
						hierarchy.children[hierarchy.children.length - 1].total_votes = stateTotal
						hierarchy.children[hierarchy.children.length - 1].results = stateAcc
						for (const name in hierarchy.children[hierarchy.children.length - 1].results) {
							if (hierarchy.children[hierarchy.children.length - 1].results.hasOwnProperty(name)) {
								hierarchy.children[hierarchy.children.length - 1].results[name].vote_pct = hierarchy.children[hierarchy.children.length - 1].results[name].votes / stateTotal
							}
						}
						stateAcc = {}
						stateTotal = 0
					}
					hierarchy.children.push({
						name: data[i].state,
						children: []
					})
				}
				if (prevFips !== data[i].fips) {
					if (countyData.length > 0) {
						countyData[countyData.length - 1].total_votes = countyTotal
						for (const name in countyData[countyData.length - 1].results) {
							if (countyData[countyData.length - 1].results.hasOwnProperty(name)) {
								countyData[countyData.length - 1].results[name].vote_pct = countyData[countyData.length - 1].results[name].votes / countyTotal
							}
						}
						countyTotal = 0
						hierarchy.children[hierarchy.children.length - 1].children.push(countyData[countyData.length - 1])
					}

					countyData.push({name: data[i].geo_name, results: {}, state: data[i].state, fips: data[i].fips})
				}
				countyData[countyData.length - 1].results[data[i].name] = {
					party: data[i].individual_party,
					votes: data[i].votes,
					vote_pct: data[i].vote_pct
				}
				if (!stateAcc[data[i].name]) {
					stateAcc[data[i].name] = {votes: 0, vote_pct: 0}
				}
				stateAcc[data[i].name].votes += data[i].votes

				if (!usAcc[data[i].name]) {
					usAcc[data[i].name] = {votes: 0, vote_pct: 0}
				}
				usAcc[data[i].name].votes += data[i].votes

				countyTotal += data[i].votes
				stateTotal += data[i].votes
				usTotal += data[i].votes

				prevState = data[i].state
				prevFips = data[i].fips
			}
			hierarchy.results = usAcc
			hierarchy.total_votes = usTotal
			for (const name in hierarchy.results) {
				if (hierarchy.results.hasOwnProperty(name)) {
					hierarchy.results[name].vote_pct = hierarchy.results[name].votes / usTotal
				}
			}

			const us = self.us
				// give STATE_ABBR props
			us.features.forEach(d => d.properties.STATE_ABBR = stateToAbbr[d.properties.name])
			us.features = us.features.filter(d => d.properties.STATE_ABBR !== undefined && d.properties.STATE_ABBR !== 'DC')
				// transfer election properties to map stuff
			for (let i = 0; i < us.features.length; i++) {
					const state = hierarchy.children.find(d => d.name === us.features[i].properties.name)
					if (state) {
						us.features[i].properties.results = state.results
						us.features[i].properties.total_votes = state.total_votes
						us.features[i].properties.children = state.children
					}
				}

			// Modifying the states more to change fill and add interactions
			const states = self.states
					.style('fill', d => (d.properties.results) ? colorScale(d.properties.results) : 'black')
					.on('click', d => {
						svg.selectAll('.state')
							.filter(s => s.properties.name === selection.name)
							.style('fill', s => colorScale(s.properties.results))
						selection = d.properties
						updateFunc(selection)
						if (centered) {
							svg.selectAll('.state')
								.filter(s => s.properties.name === centered.properties.name)
								.style('fill', s => colorScale(s.properties.results))
							svg.selectAll('.' + stateToAbbr[centered.properties.name])
								.style('pointer-events', 'none')
								.transition().duration(750)
								.style('opacity', 0)
								.attr('visibility', 'hidden')
							popFromStatView(1)
							pushToStatView(d.properties)
						}
						// Click to zoom
						// Taken from https://bl.ocks.org/mbostock/2206590
						let x, y, k

						if (d && centered !== d) {
							const centroid = path.centroid(d)
							x = centroid[0]
							y = centroid[1]
							k = (d.properties.name === 'Texas') ? 2 : 4
							centered = d
						} else {
							x = width / 2
							y = height / 2
							k = 1
							centered = null
						}

						svg.transition()
							.duration(750)
							.attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')')
							.style('stroke-width', 1.5 / k + 'px')

						centered = d
						svg.selectAll('.' + stateToAbbr[d.properties.name])
							.style('pointer-events', (centered != null) ? 'auto' : 'none')
							.transition().duration(750)
							.style('opacity', (centered != null) ? 1 : 0)
							.attr('visibility', (centered != null) ? 'none' : 'hidden')
						d3.event.stopPropagation()
					})
					.on('mouseover', d => {
						svg.selectAll('.state')
							.filter(s => s.properties.name === d.properties.name)
							.style('fill', s => d3.color(colorScale(s.properties.results)).darker(0.5))
						detailSvg.selectAll('.detailrect')
							.filter(s => s.name === d.properties.name)
							.style('fill', s => d3.color(colorScale(s.results)).darker(0.5))
						pushToStatView(d.properties)
					})
					.on('mouseout', d => {
						if (!selection || d.properties.name !== selection.name) {
							svg.selectAll('.state')
								.filter(s => s === d)
								.style('fill', s => colorScale(s.properties.results))
							detailSvg.selectAll('.detailrect')
								.filter(s => s.name === d.properties.name)
								.style('fill', s => colorScale(s.results))
							popFromStatView((centered) ? 2 : 1)
						}
					})
			
			svg.on('click', function () {
					d3.select('#detailtip')
							.style('visibility', 'hidden')
					selection = hierarchy
					svg.selectAll('.state')
						.filter(s => s.properties.results)
						.style('fill', s => colorScale(s.properties.results))
					svg.transition()
						.duration(750)
						.attr('transform', '')
						.style('stroke-width', 1.5 + 'px')
						
					if (centered)  {
						svg.selectAll('.' + stateToAbbr[centered.properties.name])
							.transition()
							.duration(750)
							.style('opacity', 0)
							.style('pointer-events', 'none')
							.on('end', () => { svg.selectAll('.' + stateToAbbr[centered.properties.name]).attr('visibility', 'hidden') })
								
						popFromStatView(1)
						centered = null
					}
					updateFunc(selection)
				})
			selection = hierarchy
			updateFunc(hierarchy)
			pushToStatView(hierarchy)
			resetRect.on('click', function () {
					selection = hierarchy
					updateFunc(selection)
				})
			d3.json('county.json', function (error, county_data) {
				const counties = svg.append('g')
					.attr('class', 'counties')

				const countyGroups = {}
				for (let i = 0; i < hierarchy.children.length; i++) {
					countyGroups[hierarchy.children[i].name] = counties.append('g')
						.attr('class', stateToAbbr[hierarchy.children[i].name])
						.style('opacity', 0)
						.attr('visibility', 'hidden')
						.style('pointer-events', 'none')
				}
				const county_hovered = null
				for (let i =  0; i < county_data.objects.county.geometries.length; i++) {
					// Drawing county map
					// Base code taken from same place as state map
					// Modified heavily to draw on county at a time in each state's 'g' element
					// Add properties, fill, and interactions
					const c = county_data.objects.county.geometries[i]
					const match = countyData.find(d => +d.fips === +c.id)
					if (match) {
						const statename = match.state
						c.properties = {}
						c.properties.name = match.name
						c.properties.results = match.results
						c.properties.total_votes = match.total_votes
						countyGroups[match.state].append('path')
						.datum(topojson.feature(county_data, c))
						.attr('class', 'county')
						.attr('d', path)
						.style('fill', c => colorScale(c.properties.results))
						.on('mousemove', c => {
							d3.select('#detailtip')
								.style('visibility', 'visible')
								.style('left', d3.event.pageX + 'px')
								.style('top', d3.event.pageY + 'px')
								.html('<h4>' + c.properties.name + '</h4>' +
									'<p>Clinton: ' + (c.properties.results['H. Clinton'].vote_pct * 100).toFixed(2) + '%</p>' +
									'<p>Trump: '   + (c.properties.results['D. Trump'].vote_pct * 100).toFixed(2) + '%</p>')
						})
						.on('mouseover', d => {
							svg.selectAll('.county')
								.filter(c => c === d)
								.style('fill', s => d3.color(colorScale(s.properties.results)).darker(0.5))
							detailSvg.selectAll('.detailrect')
								.filter(s => s.name === d.properties.name)
								.style('fill', s => d3.color(colorScale(s.results)).darker(0.5))
							pushToStatView(d.properties)
						})
						.on('mouseout', d => {
							svg.selectAll('.county')
								.filter(c => c === d)
								.style('fill', s => colorScale(s.properties.results))
							detailSvg.selectAll('.detailrect')
								.filter(s => s.name === d.properties.name)
								.style('fill', s => colorScale(s.results))
							d3.select('#detailtip')
								.style('visibility', 'hidden')
							popFromStatView(2)
						})
					}
				}
			})

			legendSvg.append('rect')
				.attr('x', 0)
				.attr('y', 0)
				.attr('width', 20)
				.attr('height', 20)
				.style('fill', colorScale({'D. Trump': {votes: 1}, 'H. Clinton': {votes: 0}}))

			legendSvg.append('rect')
				.attr('x', 0)
				.attr('y', legendHeight - 20)
				.attr('width', 20)
				.attr('height', 20)
				.style('fill', colorScale({'D. Trump': {votes: 0}, 'H. Clinton': {votes: 1}}))

			legendSvg.append('text')
				.attr('x', '30px')
				.attr('y', 0)
				.attr('dy', '1.0em')
				.attr('text-anchor', 'start')
				.text('Trump (Republican)')

			legendSvg.append('text')
				.attr('x', '30px')
				.attr('y', legendHeight)
				.attr('dy', '-0.2em')
				.attr('text-anchor', 'start')
				.text('Clinton (Democrat)')
		})

		function updateDetailView(data) {
			const sorted = data.children.filter(d => d.results).sort((a, b) => (a.results['D. Trump'].vote_pct > a.results['H. Clinton'].vote_pct) ? 1 : -1)
			detail_x.domain(sorted.map(c => c.name))
			drawDetailView(data, (x => (d => x(d.name)))(detail_x), (x => (d => x.bandwidth()))(detail_x))
		}

		function updateDetailViewDistorted(data) {
			const sortedObjs = data.children.filter(d => d.results).sort((a, b) => (a.results['D. Trump'].vote_pct > a.results['H. Clinton'].vote_pct) ? 1 : -1)
			sortedObjs[0].acc = sortedObjs[0].total_votes
			for (let i = 1; i < sortedObjs.length; i++) {
				sortedObjs[i].acc = sortedObjs[i - 1].acc + sortedObjs[i].total_votes
			}
			const x = d3.scaleLinear()
				.range([0, detailWidth])
				.domain([0, d3.max(sortedObjs, d => d.acc)])
			drawDetailView(data, (x => (d => x(d.acc) - x(d.total_votes)))(x), (x => (d => x(d.total_votes)))(x))
		}

		function drawDetailView(data, xFunc, widthFunc) {
			d3.select('#detaillabel')
				.html('<h4>' + data.name + ': Popular Results' + '</h4>' +
					'<p>Clinton: ' + (data.results['H. Clinton'].vote_pct * 100).toFixed(2) + '%</p>' +
					'<p>Trump: '   + (data.results['D. Trump'].vote_pct * 100).toFixed(2) + '%</p>')

			const sorted = data.children.filter(d => d.results).sort((a, b) => a.results['D. Trump'].votes - b.results['D. Trump'].votes)

			// Drawing the bar chart type vis on the bottom
			// All original stuff
			const objRects = detailSvg.selectAll('.detailrect')
				.data(sorted, d => d.name + d.total_votes)

			objRects.transition().duration(1000)
				.attr('x', c => xFunc(c))
				.attr('width', c => widthFunc(c))

			objRects.enter()
				.append('rect')
				.attr('class', 'detailrect')
				.on('mousemove', d => {
						d3.select('#detailtip')
							.style('visibility', 'visible')
							.style('left', d3.event.pageX + 'px')
							.style('top', d3.event.pageY + 'px')
							.html('<h4>' + d.name + '</h4>' +
								'<p>Clinton: ' + (d.results['H. Clinton'].vote_pct * 100).toFixed(2) + '%</p>' +
								'<p>Trump: '   + (d.results['D. Trump'].vote_pct * 100).toFixed(2) + '%</p>')
				})
				.on('mouseover', d => {
					svg.selectAll('path')
						.filter(p => p.properties.total_votes === d.total_votes)
						.style('fill', p => d3.color(colorScale(p.properties.results)).darker(0.5))
					detailSvg.selectAll('.detailrect')
						.filter(r => r === d)
						.style('fill', r => d3.color(colorScale(r.results)).darker(0.5))
					pushToStatView(d)
				})
				.on('mouseout', d => {
					svg.selectAll('path')
						.filter(p => p.properties.total_votes === d.total_votes)
						.style('fill', p => colorScale(p.properties.results))
					detailSvg.selectAll('.detailrect')
						.filter(r => r === d)
						.style('fill', r => colorScale(r.results))
					d3.select('#detailtip')
						.style('visibility', 'hidden')
					popFromStatView((d.state) ? 2 : 1)
				})
				.on('click', d => {
					let clicked = null
					svg.selectAll('path')
						.filter(p => p.properties.total_votes == d.total_votes)
						.each(p => clicked = p);
					svg.selectAll('.state')
						.filter(s => s.properties.name === selection.name)
						.style('fill', s => colorScale(s.properties.results))
					selection = clicked.properties
					updateFunc(selection)
					svg.selectAll('.county')
						.attr('visibility', 'none')
						.transition().duration(1000)
						.style('opacity', 1)
					if (centered && centered !== d) {
						svg.selectAll('.' + stateToAbbr[centered.properties.name])
							.style('pointer-events', 'none')
							.transition().duration(750)
							.style('opacity', 0)
							.attr('visibility', 'hidden')
					}
					let x, y, k

				 if (clicked && centered !== clicked) {
					const centroid = path.centroid(clicked)
					x = centroid[0]
					y = centroid[1]
					k = (clicked.properties.name === 'Texas') ? 2 : 4
					centered = clicked
				  } else {
					x = width / 2
					y = height / 2
					k = 1
					centered = null
				  }

				 svg.transition()
					  .duration(750)
					  .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')')
					  .style('stroke-width', 1.5 / k + 'px')

					centered = clicked
					svg.selectAll('.' + stateToAbbr[clicked.properties.name])
						.style('pointer-events', (centered != null) ? 'auto' : 'none')
						.transition().duration(750)
						.style('opacity', (centered != null) ? 1 : 0)
						.attr('visibility', (centered != null) ? 'none' : 'hidden')
					d3.event.stopPropagation()
				})
				.transition().duration(1000)
				.attr('y', 0)
				.attr('x', c => xFunc(c))
				.attr('width', c => widthFunc(c))
				.attr('height', detailHeight)
				.style('fill', c => (c.results) ? colorScale(c.results) : 'black')
			detailSvg.selectAll('.detailrect')
				.data(sorted, d => d.name + d.total_votes).exit().remove()
		}

		function formatDefaultDetailView(usData) {
			const label = {}
			label.name = usData.name
			label.total_votes = usData.total_votes
			label.results = usData.results
			const objs = usData.children
			return {label, objs}
		}

		function formatStateDetailView(stateData) {
			const label = {}
			label.name = stateData.name
			label.total_votes = stateData.total_votes
			label.results = stateData.results
			const objs = stateData.children
			return {label, objs}
		}

		function pushToStatView(data) {
			// Drawing the stat panel
			// Not really a vis, but marking it as original
			const statview = d3.select('#statview').append('div')
			statview.append('h4')
				.text(data.name)
			statview.append('p')
				.text('Total votes: ' + data.total_votes.toLocaleString())
			let i = 0
			const resTable = statview.append('table')
			for (const res in data.results) {
				if (i < 4) {
					if (data.results.hasOwnProperty(res)) {
						const row = resTable.append('tr')
						row.append('td')
							.style('text-align', 'left')
							.text(res)
						row.append('td')
							.style('text-align', 'right')
							.text(data.results[res].votes.toLocaleString())
						row.append('td')
							.style('text-align', 'right')
							.text((data.results[res].vote_pct * 100).toFixed(2).toLocaleString() + '%')
					}
					i++
				} else {
					break
				}
			}
		}

		function popFromStatView(finalSize) {
			const statview = d3.select('#statview')
			statview.selectAll('div')
				.filter((d, i) => i >= finalSize)
				.remove()
		}
	}
	
	randomStateTransitions() {
		const stateTransitions = {} as {[abbr: string]: number}
		
		this.states.each(d => stateTransitions[d.properties.name] = Math.random() * 500)
		
		return stateTransitions
	}
	
	change(props: MapProps) {
		const detailWidth = 960
		const detailHeight = 50
		if (props.mode !== this.props.mode) {
			
			if (props.mode === 'electoral') {
				const stateTransitions = this.randomStateTransitions()
				// Hiding the normal map with transitions
				this.states
					.transition()
					.delay(d => stateTransitions[d.properties.name])
					.duration(500)
					.style('fill', 'black')
					.style('pointer-events', 'none')

				d3.select('#detailview').select('svg')
					.style('pointer-events', 'none')
					.transition()
					.duration(500)
					.style('opacity', 0)

				d3.select('#detailview').selectAll('form')
					.transition()
					.duration(500)
					.style('opacity', 0)

				var electoralAcc = []
				for (var s in state) {
					if (state.hasOwnProperty(s)) {
						const abbr = state[s]
						const extract = electoral[abbr]
						const electors = Array.isArray(extract) ? extract : [extract]
						electors.forEach(d => {
							if (d) {
								var acc = electoralAcc.find(e => e.candidate == d.candidate)
								if (!acc) {
									electoralAcc.push({
										'candidate': d.candidate,
										'votes': d.votes
									})
								} else {
									acc.votes += d.votes
								}
							}
						})
					}
				}
				var cand1 = electoralAcc.sort((a,b) => a.votes < b.votes)[0]
				var cand2 = electoralAcc.sort((a,b) => a.votes < b.votes)[1]

				this.prevDetailLabel = d3.select('#detaillabel').html()
				d3.select('#detaillabel')
					.html('<h4>United States: Electoral Results<h4>' + 
						'<p>' + cand1.candidate + ': ' + cand1.votes + '</p>' +
						'<p>' + cand2.candidate + ': ' + cand2.votes + '</p>')
				
				const circles = this.circles.size()
				
				let finished = 0
				
				// Starting the force layout
				this.circles
					.attr('r', 0)
					.style('fill', d => colors[d.candidate])
					.attr('visibility', 'visible')
					.transition()
					.delay(d => stateTransitions[d.name])
					.duration(500)
					.attr('r', d => d.r)
					.on('end', () => {
						finished++
						if (finished !== circles) {
							return
						}
						this.simulation = d3.forceSimulation<ElectoralNode>()
							.force('charge', d3.forceManyBody().strength(10))
							.force('collide', d3.forceCollide<ElectoralNode>().radius(d => d.r))
						this.simulation.nodes(this.nodes)
							.on('tick', () => {
								this.circles
									.attr('cx', d => d.x)
									.attr('cy', d => d.y)
								this.texts
									.attr('x', d => d.x)
									.attr('y', d => d.y)
							})
					})
			}
			if (props.mode === 'detailed') {
				const stateTransitions = this.randomStateTransitions()
				
				if (this.simulation) {
					this.simulation.stop()
				}
				// Showing the normal map with transitions
				this.states
					.transition()
					.delay(d => stateTransitions[d.properties.name] + 500)
					.duration(500)
					.style('fill', d => (d.properties as any).results ? this.colorScale((d.properties as any).results) : 'black')
					.style('pointer-events', 'all')

				d3.select('#detailview').select('svg')
					.style('pointer-events', 'all')
					.transition()
					.duration(500)
					.style('opacity', 1)

				d3.select('#detailview').selectAll('form')
					.transition()
					.duration(500)
					.style('opacity', 1)

				d3.select('#detaillabel')
					.html(this.prevDetailLabel)
				
				this.texts
					.transition()
					.delay(d => stateTransitions[d.name])
					.duration(500)
					.attr('x', (d, i) => this.initial[i].x)
					.attr('y', (d, i) => this.initial[i].y)
				
				const circles = this.circles.size()
				
				let finished = 0
				
				// Resetting the force layout
				this.circles
					.transition()
					.delay(d => stateTransitions[d.name])
					.duration(500)
					.attr('cx', (d, i) => this.initial[i].x)
					.attr('cy', (d, i) => this.initial[i].y)
					.transition()
					.duration(500)
					.attr('r', d => 0)
					.on('end', () => {
						finished++
						if (finished !== circles) {
							return
						}
						this.circles.attr('visibility', 'hidden')
				
						this.initial.forEach((v, i) => {
							const node = this.nodes[i]
							for (const k in v) {
								node[k] = v[k]
							}
						})
					})
			}
		}
	}
	
	componentWillUnmount() {
		if (this.simulation) {
			this.simulation.stop()
		}
	}
	
	render() {
		return (
			<svg
				ref={ref => ref ? this.element = ref : null}
				width={this.width}
				height={this.height}
			/>
		)
	}
}
