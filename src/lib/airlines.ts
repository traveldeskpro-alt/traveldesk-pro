export interface Airline {
  code: string;
  name: string;
}

export const AIRLINES: Airline[] = [
  // Gulf & Middle East
  { code: 'EK', name: 'Emirates' },
  { code: 'EY', name: 'Etihad Airways' },
  { code: 'WY', name: 'Oman Air' },
  { code: 'QR', name: 'Qatar Airways' },
  { code: 'FZ', name: 'flydubai' },
  { code: 'G9', name: 'Air Arabia' },
  { code: 'SV', name: 'Saudia' },
  { code: 'GF', name: 'Gulf Air' },
  { code: 'KU', name: 'Kuwait Airways' },
  { code: 'XY', name: 'flynas' },
  { code: 'F3', name: 'Flyadeal' },
  { code: 'OJ', name: 'Fly Jordan' },
  { code: 'RJ', name: 'Royal Jordanian' },
  { code: 'ME', name: 'Middle East Airlines' },
  { code: 'IY', name: 'Yemenia' },

  // South Asia
  { code: 'PK', name: 'Pakistan International Airlines' },
  { code: 'PA', name: 'Airblue' },
  { code: 'ER', name: 'Serene Air' },
  { code: 'AI', name: 'Air India' },
  { code: 'IX', name: 'Air India Express' },
  { code: '6E', name: 'IndiGo' },
  { code: 'SG', name: 'SpiceJet' },
  { code: 'UK', name: 'Vistara' },
  { code: 'G8', name: 'Go First' },
  { code: 'BG', name: 'Biman Bangladesh Airlines' },
  { code: 'BS', name: 'US-Bangla Airlines' },
  { code: 'UL', name: 'SriLankan Airlines' },
  { code: 'RA', name: 'Nepal Airlines' },

  // East Africa
  { code: 'ET', name: 'Ethiopian Airlines' },
  { code: 'KQ', name: 'Kenya Airways' },
  { code: 'QZ', name: 'Rwandair' },

  // Europe
  { code: 'BA', name: 'British Airways' },
  { code: 'LH', name: 'Lufthansa' },
  { code: 'AF', name: 'Air France' },
  { code: 'KL', name: 'KLM Royal Dutch Airlines' },
  { code: 'SK', name: 'Scandinavian Airlines' },
  { code: 'AY', name: 'Finnair' },
  { code: 'IB', name: 'Iberia' },
  { code: 'TP', name: 'TAP Air Portugal' },
  { code: 'OS', name: 'Austrian Airlines' },
  { code: 'LX', name: 'Swiss International Air Lines' },
  { code: 'TK', name: 'Turkish Airlines' },
  { code: 'VY', name: 'Vueling Airlines' },
  { code: 'U2', name: 'easyJet' },
  { code: 'FR', name: 'Ryanair' },

  // North America
  { code: 'AA', name: 'American Airlines' },
  { code: 'UA', name: 'United Airlines' },
  { code: 'DL', name: 'Delta Air Lines' },
  { code: 'AC', name: 'Air Canada' },
  { code: 'WS', name: 'WestJet' },

  // Asia Pacific
  { code: 'SQ', name: 'Singapore Airlines' },
  { code: 'CX', name: 'Cathay Pacific' },
  { code: 'MH', name: 'Malaysia Airlines' },
  { code: 'TG', name: 'Thai Airways' },
  { code: 'GA', name: 'Garuda Indonesia' },
  { code: 'PR', name: 'Philippine Airlines' },
  { code: 'CZ', name: 'China Southern Airlines' },
  { code: 'CA', name: 'Air China' },
  { code: 'MU', name: 'China Eastern Airlines' },
  { code: 'NH', name: 'All Nippon Airways' },
  { code: 'JL', name: 'Japan Airlines' },
  { code: 'KE', name: 'Korean Air' },
  { code: 'OZ', name: 'Asiana Airlines' },

  // Australia & Pacific
  { code: 'QF', name: 'Qantas' },
  { code: 'VA', name: 'Virgin Australia' },
  { code: 'NZ', name: 'Air New Zealand' },

  // Other
  { code: 'MS', name: 'EgyptAir' },
  { code: 'AT', name: 'Royal Air Maroc' },
  { code: 'SA', name: 'South African Airways' },
];

export const AIRLINE_OPTIONS = AIRLINES.map((a) => ({
  value: a.code,
  label: `${a.code} — ${a.name}`,
}));

export function getAirlineByCode(code: string): Airline | undefined {
  return AIRLINES.find((a) => a.code === code);
}
