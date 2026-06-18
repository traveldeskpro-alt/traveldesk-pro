export interface Airport {
  code: string;
  city: string;
  country: string;
}

export const AIRPORTS: Airport[] = [
  // Oman
  { code: 'MCT', city: 'Muscat', country: 'Oman' },
  { code: 'SLL', city: 'Salalah', country: 'Oman' },
  { code: 'MSH', city: 'Masirah', country: 'Oman' },

  // UAE
  { code: 'DXB', city: 'Dubai', country: 'UAE' },
  { code: 'AUH', city: 'Abu Dhabi', country: 'UAE' },
  { code: 'SHJ', city: 'Sharjah', country: 'UAE' },
  { code: 'RKT', city: 'Ras Al Khaimah', country: 'UAE' },

  // Saudi Arabia
  { code: 'JED', city: 'Jeddah', country: 'Saudi Arabia' },
  { code: 'RUH', city: 'Riyadh', country: 'Saudi Arabia' },
  { code: 'DMM', city: 'Dammam', country: 'Saudi Arabia' },
  { code: 'MED', city: 'Madinah', country: 'Saudi Arabia' },
  { code: 'TUU', city: 'Tabuk', country: 'Saudi Arabia' },

  // Qatar
  { code: 'DOH', city: 'Doha', country: 'Qatar' },

  // Bahrain
  { code: 'BAH', city: 'Bahrain', country: 'Bahrain' },

  // Kuwait
  { code: 'KWI', city: 'Kuwait City', country: 'Kuwait' },

  // Iraq
  { code: 'BGW', city: 'Baghdad', country: 'Iraq' },
  { code: 'BSR', city: 'Basra', country: 'Iraq' },
  { code: 'ISU', city: 'Sulaymaniyah', country: 'Iraq' },
  { code: 'EBL', city: 'Erbil', country: 'Iraq' },

  // Iran
  { code: 'IKA', city: 'Tehran', country: 'Iran' },
  { code: 'MHD', city: 'Mashhad', country: 'Iran' },

  // Jordan
  { code: 'AMM', city: 'Amman', country: 'Jordan' },

  // Lebanon
  { code: 'BEY', city: 'Beirut', country: 'Lebanon' },

  // Egypt
  { code: 'CAI', city: 'Cairo', country: 'Egypt' },
  { code: 'HRG', city: 'Hurghada', country: 'Egypt' },
  { code: 'SSH', city: 'Sharm el-Sheikh', country: 'Egypt' },

  // Pakistan
  { code: 'KHI', city: 'Karachi', country: 'Pakistan' },
  { code: 'LHE', city: 'Lahore', country: 'Pakistan' },
  { code: 'ISB', city: 'Islamabad', country: 'Pakistan' },
  { code: 'PEW', city: 'Peshawar', country: 'Pakistan' },
  { code: 'UET', city: 'Quetta', country: 'Pakistan' },
  { code: 'MUX', city: 'Multan', country: 'Pakistan' },

  // India
  { code: 'DEL', city: 'Delhi', country: 'India' },
  { code: 'BOM', city: 'Mumbai', country: 'India' },
  { code: 'BLR', city: 'Bengaluru', country: 'India' },
  { code: 'MAA', city: 'Chennai', country: 'India' },
  { code: 'HYD', city: 'Hyderabad', country: 'India' },
  { code: 'COK', city: 'Kochi', country: 'India' },
  { code: 'CCU', city: 'Kolkata', country: 'India' },
  { code: 'AMD', city: 'Ahmedabad', country: 'India' },
  { code: 'TRV', city: 'Thiruvananthapuram', country: 'India' },
  { code: 'IXJ', city: 'Jammu', country: 'India' },
  { code: 'SXR', city: 'Srinagar', country: 'India' },

  // Bangladesh
  { code: 'DAC', city: 'Dhaka', country: 'Bangladesh' },
  { code: 'CGP', city: 'Chittagong', country: 'Bangladesh' },

  // Sri Lanka
  { code: 'CMB', city: 'Colombo', country: 'Sri Lanka' },

  // Nepal
  { code: 'KTM', city: 'Kathmandu', country: 'Nepal' },

  // Philippines
  { code: 'MNL', city: 'Manila', country: 'Philippines' },
  { code: 'CEB', city: 'Cebu', country: 'Philippines' },

  // Ethiopia / East Africa
  { code: 'ADD', city: 'Addis Ababa', country: 'Ethiopia' },
  { code: 'NBO', city: 'Nairobi', country: 'Kenya' },

  // Turkey
  { code: 'IST', city: 'Istanbul', country: 'Turkey' },
  { code: 'SAW', city: 'Istanbul Sabiha', country: 'Turkey' },
  { code: 'AYT', city: 'Antalya', country: 'Turkey' },
  { code: 'ESB', city: 'Ankara', country: 'Turkey' },

  // Europe
  { code: 'LHR', city: 'London Heathrow', country: 'UK' },
  { code: 'LGW', city: 'London Gatwick', country: 'UK' },
  { code: 'MAN', city: 'Manchester', country: 'UK' },
  { code: 'CDG', city: 'Paris Charles de Gaulle', country: 'France' },
  { code: 'FRA', city: 'Frankfurt', country: 'Germany' },
  { code: 'AMS', city: 'Amsterdam', country: 'Netherlands' },
  { code: 'MAD', city: 'Madrid', country: 'Spain' },
  { code: 'FCO', city: 'Rome Fiumicino', country: 'Italy' },
  { code: 'MXP', city: 'Milan Malpensa', country: 'Italy' },
  { code: 'ZRH', city: 'Zurich', country: 'Switzerland' },
  { code: 'VIE', city: 'Vienna', country: 'Austria' },

  // North America
  { code: 'JFK', city: 'New York JFK', country: 'USA' },
  { code: 'LAX', city: 'Los Angeles', country: 'USA' },
  { code: 'ORD', city: 'Chicago O\'Hare', country: 'USA' },
  { code: 'YYZ', city: 'Toronto Pearson', country: 'Canada' },

  // Asia Pacific
  { code: 'SIN', city: 'Singapore', country: 'Singapore' },
  { code: 'KUL', city: 'Kuala Lumpur', country: 'Malaysia' },
  { code: 'BKK', city: 'Bangkok Suvarnabhumi', country: 'Thailand' },
  { code: 'HKG', city: 'Hong Kong', country: 'Hong Kong' },
  { code: 'PEK', city: 'Beijing Capital', country: 'China' },
  { code: 'PVG', city: 'Shanghai Pudong', country: 'China' },
  { code: 'NRT', city: 'Tokyo Narita', country: 'Japan' },
  { code: 'ICN', city: 'Seoul Incheon', country: 'South Korea' },
  { code: 'SYD', city: 'Sydney', country: 'Australia' },
];

export const AIRPORT_OPTIONS = AIRPORTS.map((a) => ({
  value: a.code,
  label: `${a.code} — ${a.city}, ${a.country}`,
}));

export function getAirportByCode(code: string): Airport | undefined {
  return AIRPORTS.find((a) => a.code === code);
}
