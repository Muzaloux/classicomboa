export const CLASSICO_EVENT_KEY = 'el-classico-2026-10-25'
export const CLASSICO_EVENT_DATE = '2026-10-25'
export const CLASSICO_PREDICTION_OPENS_AT = '2026-10-25T00:00:00+01:00'
export const CLASSICO_KICKOFF_AT = '2026-10-25T20:30:00+01:00'

export const CLASSICO_TEAMS = [
  {
    id: 'barcelona',
    name: 'FC Barcelona',
    shortName: 'BARÇA',
    logo: '/images/barcamboa.png',
    players: [
      'J. García',
      'X. E. Font',
      'P. Cubarsí',
      'G. Martín',
      'J. Cancelo',
      'Rodri',
      'Pedri',
      'L. Yamal',
      'F. López',
      'A. Gordon',
      'Raphinha',
    ],
  },
  {
    id: 'real-madrid',
    name: 'Real Madrid',
    shortName: 'REAL MADRID',
    logo: '/images/realmboa.png',
    players: [
      'K. Mbappé',
      'Y. Diomande',
      'J. Bellingham',
      'A. Güler',
      'A. Tchouaméni',
      'F. Valverde',
      'M. Cucurella',
      'D. Huijsen',
      'I. Konaté',
      'D. Dumfries',
      'A. Lunin',
    ],
  },
] as const

export type ClassicoPredictionAvailability = {
  isEventDay: boolean
  isOpen: boolean
  opensAt: string
  closesAt: string
  serverNow: string
}

function cameroonDate(now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Douala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: string) => parts.find((value) => value.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function getClassicoPredictionAvailability(now = new Date()): ClassicoPredictionAvailability {
  const isEventDay = cameroonDate(now) === CLASSICO_EVENT_DATE
  const opensAt = Date.parse(CLASSICO_PREDICTION_OPENS_AT)
  const closesAt = Date.parse(CLASSICO_KICKOFF_AT)
  return {
    isEventDay,
    isOpen: isEventDay && now.getTime() >= opensAt && now.getTime() < closesAt,
    opensAt: new Date(opensAt).toISOString(),
    closesAt: new Date(closesAt).toISOString(),
    serverNow: now.toISOString(),
  }
}
