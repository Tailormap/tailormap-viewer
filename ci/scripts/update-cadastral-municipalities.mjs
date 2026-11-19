#!/usr/bin/env node
/**
 * Regenerates projects/shared/src/lib/helpers/cadastral-municipality-list.ts from the Kadaster IMKAD waardelijst
 * "KadastraleGemeente". Run by hand (npm run update-cadastral-municipalities) when Kadaster publishes a waardelijsten
 * release that changes KadastraleGemeente, then review the printed summary and the git diff, and commit.
 *
 * The output holds one entry per kadastrale gemeente name with its AKR codes (column "Toelichting"). Expired rows
 * (DatumTot on or before today) are left out. The file is only written when the result passes validation, so a broken
 * download never overwrites good data.
 *
 * Plain Node >= 24, no dependencies.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const SOURCE_URL = 'https://developer.kadaster.nl/schemas/waardelijsten/KadastraleGemeente/KadastraleGemeente.csv';
const OUTPUT_FILE = fileURLToPath(new URL('../../projects/shared/src/lib/helpers/cadastral-municipality-list.ts', import.meta.url));
const AKR_CODE = /^[A-Z]{3}\d{2}$/;
const MIN_CODES = 1000;

/** Parses RFC 4180 CSV: quoted fields, "" escapes, separators and line breaks inside quotes, CRLF or LF. */
function parseCsv(text, separator = ',') {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === separator) {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') {
        i++;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (inQuotes) {
    throw new Error('Unterminated quoted field in CSV');
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter(r => r.length > 1 || r[0] !== '');
}

/** Today in Europe/Amsterdam as YYYY-MM-DD (en-CA formats dates that way). */
function todayInAmsterdam() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function fail(message) {
  console.error(`Error: ${message}`);
  console.error('The data file was not changed.');
  process.exit(1);
}

async function download() {
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    fail(`Downloading ${SOURCE_URL} failed: HTTP ${response.status} ${response.statusText}`);
  }
  return (await response.text()).replace(/^﻿/, '');
}

function toEntries(rows, today) {
  const [ header, ...data ] = rows;
  const column = name => {
    const index = header.findIndex(h => h.trim() === name);
    if (index === -1) {
      fail(`Column "${name}" not found in the CSV header: ${header.join(', ')}`);
    }
    return index;
  };
  const nameColumn = column('Waarde');
  const dateUntilColumn = column('DatumTot');
  const codesColumn = column('Toelichting');

  const codesByName = new Map();
  let expired = 0;
  for (const row of data) {
    const name = (row[nameColumn] ?? '').trim();
    const dateUntil = (row[dateUntilColumn] ?? '').trim();
    if (dateUntil !== '' && dateUntil <= today) {
      expired++;
      continue;
    }
    const codes = (row[codesColumn] ?? '').split(';').map(c => c.trim()).filter(c => AKR_CODE.test(c));
    if (name === '') {
      fail(`Row without a name: ${row.join(',')}`);
    }
    if (codes.length === 0) {
      console.warn(`Skipped "${name}": no valid AKR code in "${row[codesColumn] ?? ''}"`);
      continue;
    }
    codesByName.set(name, [ ...(codesByName.get(name) ?? []), ...codes ]);
  }

  const entries = [...codesByName]
    .map(([ name, codes ]) => ({ name, codes: [...new Set(codes)].sort() }))
    .sort((a, b) => a.name.localeCompare(b.name, 'nl'));
  return { entries, expired };
}

function validate(entries) {
  const nameByCode = new Map();
  for (const entry of entries) {
    for (const code of entry.codes) {
      if (nameByCode.has(code)) {
        fail(`AKR code ${code} occurs for both "${nameByCode.get(code)}" and "${entry.name}"`);
      }
      nameByCode.set(code, entry.name);
    }
  }
  if (nameByCode.size < MIN_CODES) {
    fail(`Only ${nameByCode.size} AKR codes found, expected more than ${MIN_CODES}`);
  }
  return nameByCode;
}

/** Reads the current data file, if any, to report what changed. */
async function readPrevious() {
  try {
    const text = await readFile(OUTPUT_FILE, 'utf8');
    const json = text.match(/=\s*(\[.*\]);\s*$/m)?.[1];
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

function printSummary(previous, entries, nameByCode, expired) {
  const previousNames = new Set(previous.map(e => e.name));
  const names = new Set(entries.map(e => e.name));
  const previousNameByCode = new Map(previous.flatMap(e => e.codes.map(c => [ c, e.name ])));
  const list = items => items.length === 0 ? '-' : items.join(', ');

  console.log(`${entries.length} kadastrale gemeenten with ${nameByCode.size} AKR codes (${expired} expired rows skipped).`);
  if (previous.length === 0) {
    console.log('No previous list found, nothing to compare with.');
    return;
  }
  console.log(`Added names:   ${list([...names].filter(n => !previousNames.has(n)))}`);
  console.log(`Removed names: ${list([...previousNames].filter(n => !names.has(n)))}`);
  console.log(`Added codes:   ${list([...nameByCode.keys()].filter(c => !previousNameByCode.has(c)).sort())}`);
  console.log(`Removed codes: ${list([...previousNameByCode.keys()].filter(c => !nameByCode.has(c)).sort())}`);
  const moved = [...nameByCode]
    .filter(([ code, name ]) => previousNameByCode.has(code) && previousNameByCode.get(code) !== name)
    .map(([ code, name ]) => `${code} (${previousNameByCode.get(code)} -> ${name})`);
  console.log(`Moved codes:   ${list(moved)}`);
}

function render(entries, today) {
  return [
    '// Generated by ci/scripts/update-cadastral-municipalities.mjs, do not edit.',
    `// Source: ${SOURCE_URL}`,
    `// Last updated: ${today}`,
    "import type { CadastralMunicipalityModel } from './cadastral-municipality.model';",
    '',
    '/**',
    ' * Source: Kadaster IMKAD waardelijst "KadastraleGemeente". The CSV column "Waarde" is mapped to `name` and',
    ' * "Toelichting" (semicolon separated) to `codes`. Expired entries (a "DatumTot" on or before the day the list was',
    ' * generated) are left out, because the PDOK Locatieserver contains no parcels for them.',
    ' *',
    ' * To update this list, run `npm run update-cadastral-municipalities`, review the summary and the diff, and commit.',
    ' */',
    '// eslint-disable-next-line max-len, object-curly-spacing, comma-spacing, array-bracket-spacing',
    `export const CADASTRAL_MUNICIPALITY_LIST: CadastralMunicipalityModel[] = ${JSON.stringify(entries)};`,
    '',
  ].join('\n');
}

const today = todayInAmsterdam();
const rows = parseCsv(await download());
const { entries, expired } = toEntries(rows, today);
const nameByCode = validate(entries);
printSummary(await readPrevious(), entries, nameByCode, expired);
await writeFile(OUTPUT_FILE, render(entries, today));
console.log(`Wrote ${OUTPUT_FILE}`);
