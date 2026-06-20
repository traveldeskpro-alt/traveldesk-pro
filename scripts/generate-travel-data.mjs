/**
 * generate-travel-data.mjs
 *
 * Produces src/lib/airlines.ts and src/lib/airports.ts from
 * OpenFlights data (via airline-codes and @nwpr/airport-codes devDependencies).
 *
 * Run: node scripts/generate-travel-data.mjs
 *
 * Neither package is imported by the Next.js app at runtime.
 * The generated .ts files are committed and bundled statically.
 *
 * Data sources:
 *   Airlines  — airline-codes@1.1.2  (OpenFlights, synced weekly)
 *   Airports  — @nwpr/airport-codes@3.0.3  (OpenFlights / OurAirports)
 */

import { createRequire } from 'module';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ─── 14 IATA CODE CORRECTIONS ─────────────────────────────────────────────────
// OpenFlights data carries stale IATA assignments (codes get reassigned when an
// airline shuts down and a new carrier takes the same code). Each entry below
// overrides the OpenFlights name with the current operating airline.
const AIRLINE_CORRECTIONS = {
  OV: 'SalamAir',               // was: Estonian Air
  '3L': 'Air Arabia Abu Dhabi', // was: Intersky
  '5W': 'Wizz Air Abu Dhabi',   // was: Astraeus
  PA: 'Airblue',                // was: Parmiss Airlines
  ER: 'Serene Air',             // was: Fly Europa
  PF: 'AirSial',                // was: Primera Air
  '9P': 'Fly Jinnah',           // was: Pelangi
  IF: 'Fly Baghdad',            // was: Islas Airways
  B9: 'Iran Airtour',           // was: Air Bangladesh
  QB: 'Qeshm Air',              // was: Georgian National Airlines
  HH: 'Taban Air',              // was: Air Hamburg
  ZV: 'Zagros Airlines',        // was: V Air
  I5: 'AIX Connect',            // was: Indonesia Sky
  QP: 'Akasa Air',              // was: Air Kenya
};

// ─── PRIORITY COUNTRIES for airports (all airports included) ──────────────────
const PRIORITY_COUNTRIES = new Set([
  'Oman', 'Iran', 'Iraq', 'Pakistan', 'India',
  'United Arab Emirates', 'Saudi Arabia', 'Bahrain', 'Qatar', 'Kuwait',
  'Bangladesh', 'Sri Lanka', 'Nepal', 'Philippines', 'Indonesia',
  'Malaysia', 'Thailand', 'Singapore', 'Turkey', 'Ethiopia', 'Kenya',
  'Jordan', 'Lebanon', 'Yemen', 'Egypt', 'Sudan', 'Somalia', 'Djibouti',
  'Afghanistan', 'Myanmar', 'Vietnam', 'Cambodia',
]);

// Secondary countries — include all with IATA codes (major global hubs)
const SECONDARY_COUNTRIES = new Set([
  'United Kingdom', 'Germany', 'France', 'Netherlands', 'Spain', 'Italy',
  'Switzerland', 'Austria', 'Belgium', 'Portugal', 'Sweden', 'Norway',
  'Denmark', 'Finland', 'Poland', 'Czech Republic', 'Hungary', 'Romania',
  'Greece', 'Russia', 'Ukraine', 'United States', 'Canada', 'Mexico',
  'Brazil', 'Argentina', 'Colombia', 'Chile', 'Peru',
  'Australia', 'New Zealand', 'Japan', 'South Korea', 'China', 'Hong Kong',
  'Taiwan', 'Macao', 'South Africa', 'Nigeria', 'Ghana', 'Tanzania',
  'Uganda', 'Rwanda', 'Morocco', 'Tunisia', 'Algeria', 'Libya',
  'Kazakhstan', 'Uzbekistan', 'Azerbaijan', 'Georgia', 'Armenia',
  'Maldives', 'Bhutan', 'Brunei', 'Laos', 'Fiji', 'Papua New Guinea',
]);

// ─── GENERATE AIRLINES ────────────────────────────────────────────────────────
function generateAirlines() {
  const raw = require('airline-codes/airlines.json');

  // Valid IATA code: 2-3 uppercase ASCII alphanumeric characters only
  const VALID_IATA = /^[A-Z0-9]{2,3}$/;

  // Active airlines from OpenFlights (with corrections applied to names)
  const fromSource = raw
    .filter((a) => {
      const iata = (a.iata || '').trim();
      return VALID_IATA.test(iata) && a.active === 'Y';
    })
    .map((a) => {
      const code = a.iata.trim();
      const corrected = AIRLINE_CORRECTIONS[code];
      return { code, name: corrected ?? (a.name || '').trim(), corrected: !!corrected };
    })
    .filter((a) => a.name.length > 0);

  // Force-add any correction entries that weren't in the active list
  // (their IATA code was marked inactive in OpenFlights but the airline IS operating)
  const existingCodes = new Set(fromSource.map((a) => a.code));
  const forced = Object.entries(AIRLINE_CORRECTIONS)
    .filter(([code]) => !existingCodes.has(code))
    .map(([code, name]) => ({ code, name, corrected: true }));

  if (forced.length > 0) {
    console.log(`  Force-adding ${forced.length} correction(s) absent from active list: ${forced.map(a => a.code).join(', ')}`);
  }

  const airlines = [...fromSource, ...forced].sort((a, b) => {
    if (a.code < b.code) return -1;
    if (a.code > b.code) return 1;
    return 0;
  });

  // Deduplicate by code (keep first occurrence after sort)
  const seen = new Set();
  const deduped = airlines.filter((a) => {
    if (seen.has(a.code)) return false;
    seen.add(a.code);
    return true;
  });

  const lines = deduped.map((a) => {
    const comment = a.corrected ? ' // corrected' : '';
    return `  { code: '${a.code}', name: '${a.name.replace(/'/g, "\\'")}' },${comment}`;
  });

  const ts = `// AUTO-GENERATED by scripts/generate-travel-data.mjs — do not edit manually.
// Source: airline-codes@1.1.2 (OpenFlights.org) with ${Object.keys(AIRLINE_CORRECTIONS).length} IATA corrections.
// Active airlines with IATA codes: ${deduped.length}

export interface Airline {
  code: string;
  name: string;
}

export const AIRLINES: Airline[] = [
${lines.join('\n')}
];

export const AIRLINE_OPTIONS = AIRLINES.map((a) => ({
  value: a.code,
  label: \`\${a.code} — \${a.name}\`,
}));

export function getAirlineByCode(code: string): Airline | undefined {
  return AIRLINES.find((a) => a.code === code);
}
`;

  writeFileSync(join(root, 'src/lib/airlines.ts'), ts, 'utf8');
  console.log(`✓ airlines.ts written — ${deduped.length} airlines (${Object.keys(AIRLINE_CORRECTIONS).length} corrections applied)`);
}

// ─── GENERATE AIRPORTS ────────────────────────────────────────────────────────
function generateAirports() {
  const { airports: raw } = require('@nwpr/airport-codes');

  const filtered = raw
    .filter((a) => {
      const iata = (a.iata || '').trim();
      const city = (a.city || '').trim();
      const country = (a.country || '').trim();
      const name = (a.name || '');
      if (iata.length !== 3 || !city || !country) return false;
      // Include ALL airports from priority regions
      if (PRIORITY_COUNTRIES.has(country)) return true;
      // For secondary countries, only include airports with "International" in name
      // (reduces US from ~500 entries to ~80, Germany from ~30 to ~15, etc.)
      if (SECONDARY_COUNTRIES.has(country)) return name.toLowerCase().includes('international');
      return false;
    })
    .map((a) => ({
      code: a.iata.trim(),
      city: a.city.trim(),
      country: a.country.trim(),
    }))
    .sort((a, b) => {
      // Priority countries first, then alphabetical by country, then by code
      const aPri = PRIORITY_COUNTRIES.has(a.country) ? 0 : 1;
      const bPri = PRIORITY_COUNTRIES.has(b.country) ? 0 : 1;
      if (aPri !== bPri) return aPri - bPri;
      if (a.country < b.country) return -1;
      if (a.country > b.country) return 1;
      if (a.code < b.code) return -1;
      if (a.code > b.code) return 1;
      return 0;
    });

  // Deduplicate by IATA code
  const seen = new Set();
  const deduped = filtered.filter((a) => {
    if (seen.has(a.code)) return false;
    seen.add(a.code);
    return true;
  });

  const lines = deduped.map(
    (a) => `  { code: '${a.code}', city: '${a.city.replace(/'/g, "\\'")}', country: '${a.country.replace(/'/g, "\\'")}' },`,
  );

  const ts = `// AUTO-GENERATED by scripts/generate-travel-data.mjs — do not edit manually.
// Source: @nwpr/airport-codes@3.0.3 (OpenFlights / OurAirports).
// Priority regions (all airports) + major global airports: ${deduped.length} total.

export interface Airport {
  code: string;
  city: string;
  country: string;
}

export const AIRPORTS: Airport[] = [
${lines.join('\n')}
];

export const AIRPORT_OPTIONS = AIRPORTS.map((a) => ({
  value: a.code,
  label: \`\${a.code} — \${a.city}, \${a.country}\`,
}));

export function getAirportByCode(code: string): Airport | undefined {
  return AIRPORTS.find((a) => a.code === code);
}
`;

  writeFileSync(join(root, 'src/lib/airports.ts'), ts, 'utf8');
  console.log(`✓ airports.ts written — ${deduped.length} airports`);
}

// ─── RUN ──────────────────────────────────────────────────────────────────────
generateAirlines();
generateAirports();
console.log('Done.');
