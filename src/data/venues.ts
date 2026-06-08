import type { Venue } from '../lib/types'

// Keyed by ESPN venue id (matches the venueId on each fixture).
// Capacities are approximate tournament configurations.
export const VENUES: Record<string, Venue> = {
  '1672': {
    id: '1672',
    name: 'Estadio Azteca',
    altName: 'Estadio Banorte',
    city: 'Mexico City',
    country: 'Mexico',
    capacity: 83000,
    tidbit:
      'Hosts the opening match. The only stadium ever to host two World Cup finals (1970 and 1986) — the stage for Pelé’s last title and Maradona’s "Hand of God." Sits at ~2,200m altitude, which visiting teams feel.',
  },
  '5009': {
    id: '5009',
    name: 'Estadio Akron',
    city: 'Guadalajara',
    country: 'Mexico',
    capacity: 49000,
    tidbit:
      'Home of Liga MX giants Chivas. A striking sunken bowl with a living-grass-covered roof ring, designed to look like a volcano rising from the landscape.',
  },
  '10143': {
    id: '10143',
    name: 'BMO Field',
    city: 'Toronto',
    country: 'Canada',
    capacity: 45000,
    tidbit:
      'Home of Toronto FC, temporarily expanded for the World Cup. Will stage Canada’s first-ever men’s World Cup match on home soil.',
  },
  '9115': {
    id: '9115',
    name: 'SoFi Stadium',
    city: 'Inglewood (Los Angeles)',
    country: 'USA',
    capacity: 70000,
    tidbit:
      'A $5-billion engineering marvel home to the Rams and Chargers, wrapped under a translucent roof with a massive double-sided 4K halo videoboard hanging over the field.',
  },
  '5960': {
    id: '5960',
    name: "Levi's Stadium",
    city: 'Santa Clara (San Francisco Bay)',
    country: 'USA',
    capacity: 68500,
    tidbit:
      'Home of the San Francisco 49ers and one of the greenest NFL venues — solar panels and a living green roof earned it LEED Gold certification.',
  },
  '4727': {
    id: '4727',
    name: 'MetLife Stadium',
    city: 'East Rutherford (New York/New Jersey)',
    country: 'USA',
    capacity: 82500,
    tidbit:
      'Hosts the Final on July 19. Shared by the NFL’s Giants and Jets, it’s the largest stadium in the league and the centerpiece of the New York/New Jersey bid.',
  },
  '10660': {
    id: '10660',
    name: 'Gillette Stadium',
    city: 'Foxborough (Boston)',
    country: 'USA',
    capacity: 65000,
    tidbit:
      'Home of the six-time Super Bowl champion New England Patriots and the Revolution, with its signature lighthouse and bridge towering over one end.',
  },
  '4370': {
    id: '4370',
    name: 'BC Place',
    city: 'Vancouver',
    country: 'Canada',
    capacity: 54000,
    tidbit:
      'A downtown waterfront stadium crowned by the world’s largest cable-supported retractable roof, keeping the famous Vancouver rain out.',
  },
  '6262': {
    id: '6262',
    name: 'NRG Stadium',
    city: 'Houston',
    country: 'USA',
    capacity: 72000,
    tidbit:
      'The first NFL stadium built with a retractable roof — fully climate-controlled, a serious advantage against the Texas summer heat.',
  },
  '3871': {
    id: '3871',
    name: 'AT&T Stadium',
    altName: '"Jerry World"',
    city: 'Arlington (Dallas)',
    country: 'USA',
    capacity: 80000,
    tidbit:
      'Home of the Dallas Cowboys and one of the busiest 2026 venues, hosting a semifinal. Famous for its colossal center-hung videoboard and a retractable roof and end-zone doors.',
  },
  '1421': {
    id: '1421',
    name: 'Lincoln Financial Field',
    city: 'Philadelphia',
    country: 'USA',
    capacity: 69000,
    tidbit:
      'Home of the Philadelphia Eagles, "The Linc" is known for one of the most passionate (and notoriously rowdy) crowds in American sport.',
  },
  '6351': {
    id: '6351',
    name: 'Estadio BBVA',
    altName: 'El Gigante de Acero',
    city: 'Monterrey',
    country: 'Mexico',
    capacity: 53000,
    tidbit:
      '"The Steel Giant," home of Rayados. Its open end frames a postcard view of the Cerro de la Silla mountain, one of the most beautiful backdrops in world football.',
  },
  '7485': {
    id: '7485',
    name: 'Mercedes-Benz Stadium',
    city: 'Atlanta',
    country: 'USA',
    capacity: 71000,
    tidbit:
      'Home of Atlanta United and the Falcons, famous for its camera-shutter retractable roof and a 360° "halo" videoboard ringing the entire bowl.',
  },
  '4485': {
    id: '4485',
    name: 'Lumen Field',
    city: 'Seattle',
    country: 'USA',
    capacity: 69000,
    tidbit:
      'Home of the Seahawks and the Sounders’ huge soccer following — its design traps crowd noise, making it one of the loudest stadiums anywhere.',
  },
  '4643': {
    id: '4643',
    name: 'Hard Rock Stadium',
    city: 'Miami Gardens',
    country: 'USA',
    capacity: 65000,
    tidbit:
      'Hosts the third-place playoff. Home of the Miami Dolphins, recently modernized with a sweeping canopy that shades fans from the Florida sun.',
  },
  '10897': {
    id: '10897',
    name: 'Arrowhead Stadium',
    altName: 'GEHA Field',
    city: 'Kansas City',
    country: 'USA',
    capacity: 76000,
    tidbit:
      'Home of the Chiefs and a Guinness World Record holder for the loudest crowd roar ever measured at a sports stadium — 142.2 decibels.',
  },
}
