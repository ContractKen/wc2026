// Primary brand colour per nation (vivid, readable on the dark theme). Used to
// tint the app accent to the user's top-followed team. Teams not listed keep
// the default app magenta.
export const TEAM_COLORS: Record<string, string> = {
  ARG: '#75aadb', BRA: '#ffd000', FRA: '#3a6ad4', ENG: '#e4002b', ESP: '#d7263d',
  POR: '#00a14b', NED: '#ff6a13', GER: '#e0b400', BEL: '#e30613', CRO: '#e02233',
  URU: '#4aa3df', COL: '#fcd116', MEX: '#0a9d58', USA: '#3c78d8', CAN: '#ff2a2a',
  MAR: '#c1272d', SEN: '#19a85b', JPN: '#d4163c', KOR: '#2b6cd4', SUI: '#ff2a2a',
  SWE: '#f9cf00', NOR: '#d3304b', AUT: '#ed2939', SCO: '#2f6fd0', TUR: '#e30a17',
  EGY: '#e21126', GHA: '#19a85b', CIV: '#ff8200', ECU: '#ffd100', PAR: '#e0392b',
  AUS: '#f5c518', IRN: '#27a653', KSA: '#1b8f4d', QAT: '#a01545', RSA: '#1aa05a',
  ALG: '#15a05a', TUN: '#e21126', PAN: '#d22030', NZL: '#dadada', UZB: '#3aa0e0',
}

export function teamColor(code: string): string | undefined {
  return TEAM_COLORS[code]
}
