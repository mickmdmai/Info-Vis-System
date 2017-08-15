export type Candidate = 'Clinton' | 'Trump' | 'Powell' | 'Spotted Eagle' | 'Paul' | 'Kasich' | 'Sanders'

export const Clinton = 'Clinton'
export const Trump = 'Trump'
export const Powell = 'Powell'
export const SpottedEagle = 'Spotted Eagle'
export const Paul = 'Paul'
export const Kasich = 'Kasich'
export const Sanders = 'Sanders'

export interface CandidateColors {
	[candidate: string]: string
}

import * as Colors from '../colors'

export const colors = {
	[Clinton]: Colors.blue[500],
	[Trump]: Colors.red[500],
	[Powell]: '#9C27B0',
	[SpottedEagle]: '#009688',
	[Paul]: '#FFC107',
	[Kasich]: '#E91E63',
	[Sanders]: '#4CAF50'
} as CandidateColors

export interface StateElectoral {
	[state: string]: StateElectors[] | StateElectors
}

export interface StateElectors {
	candidate: Candidate
	votes: number
}

export const electoral = {
	AK: {
		candidate: Trump,
		votes: 3
	},
	WA: [{
		candidate: Clinton,
		votes: 8
	}, {
		candidate: Powell,
		votes: 3
	}, {
		candidate: SpottedEagle,
		votes: 1
	}],
	OR: {
		candidate: Clinton,
		votes: 7
	},
	CA: {
		candidate: Clinton,
		votes: 55
	},
	HI: [{
		candidate: Clinton,
		votes: 3
	}, {
		candidate: Sanders,
		votes: 1
	}],
	ID: {
		candidate: Trump,
		votes: 4
	},
	NV: {
		candidate: Clinton,
		votes: 6
	},
	UT: {
		candidate: Trump,
		votes: 6
	},
	AZ: {
		candidate: Trump,
		votes: 11
	},
	MT: {
		candidate: Trump,
		votes: 3
	},
	WY: {
		candidate: Trump,
		votes: 3
	},
	CO: {
		candidate: Clinton,
		votes: 9
	},
	NM: {
		candidate: Clinton,
		votes: 5
	},
	ND: {
		candidate: Trump,
		votes: 3
	},
	SD: {
		candidate: Trump,
		votes: 3
	},
	KS: {
		candidate: Trump,
		votes: 6
	},
	OK: {
		candidate: Trump,
		votes: 7
	},
	TX: [{
		candidate: Trump,
		votes: 36
	}, {
		candidate: Paul,
		votes: 1
	}, {
		candidate: Kasich,
		votes: 1
	}],
	NE: {
		candidate: Trump,
		votes: 5
	},
	IA: {
		candidate: Trump,
		votes: 6
	},
	MN: {
		candidate: Clinton,
		votes: 10
	},
	MO: {
		candidate: Trump,
		votes: 10
	},
	AR: {
		candidate: Trump,
		votes: 6
	},
	LA: {
		candidate: Trump,
		votes: 8
	},
	WI: {
		candidate: Trump,
		votes: 10
	},
	IL: {
		candidate: Clinton,
		votes: 20
	},
	TN: {
		candidate: Trump,
		votes: 11
	},
	MS: {
		candidate: Trump,
		votes: 6
	},
	MI: {
		candidate: Trump,
		votes: 16
	},
	IN: {
		candidate: Trump,
		votes: 11
	},
	KY: {
		candidate: Trump,
		votes: 8
	},
	AL: {
		candidate: Trump,
		votes: 9
	},
	FL: {
		candidate: Trump,
		votes: 29
	},
	OH: {
		candidate: Trump,
		votes: 18
	},
	GA: {
		candidate: Trump,
		votes: 16
	},
	PA: {
		candidate: Trump,
		votes: 20
	},
	WV: {
		candidate: Trump,
		votes: 5
	},
	VA: {
		candidate: Clinton,
		votes: 13
	},
	NC: {
		candidate: Trump,
		votes: 15
	},
	SC: {
		candidate: Trump,
		votes: 9
	},
	DC: {
		candidate: Clinton,
		votes: 3
	},
	MD: {
		candidate: Clinton,
		votes: 10
	},
	DE: {
		candidate: Clinton,
		votes: 3
	},
	NJ: {
		candidate: Clinton,
		votes: 14
	},
	NY: {
		candidate: Clinton,
		votes: 29
	},
	CT: {
		candidate: Clinton,
		votes: 7
	},
	RI: {
		candidate: Clinton,
		votes: 4
	},
	VT: {
		candidate: Clinton,
		votes: 3
	},
	MA: {
		candidate: Clinton,
		votes: 11
	},
	NH: {
		candidate: Clinton,
		votes: 4
	},
	ME: [{
		candidate: Clinton,
		votes: 3
	}, {
		candidate: Trump,
		votes: 1
	}]
} as StateElectoral

export default electoral
