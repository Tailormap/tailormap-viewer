#!/usr/bin/env node
/**
 * Regenerates projects/admin-core/src/lib/helpers/municipality-list.ts from the PDOK Locatieserver. Run by hand
 * (npm run update-municipalities) when Dutch municipalities change (municipal mergers usually take effect on January 1st),
 * then review the printed summary and the git diff, and commit.
 *
 * The Locatieserver is used as source because the simple search filters on its `gemeentecode` field, so the codes in the
 * list are by definition the codes the search can filter on. The Locatieserver contains one document of type "gemeente"
 * per current municipality. It returns at most 100 rows per request, so the list is fetched in pages, sorted on code to
 * get a stable paging order. The file is only written when the result passes validation, so a broken download never
 * overwrites good data.
 *
 * Plain Node >= 24, no dependencies.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const SOURCE_URL = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/free';
const OUTPUT_FILE = fileURLToPath(new URL('../../projects/admin-core/src/lib/helpers/municipality-list.ts', import.meta.url));
const PAGE_SIZE = 100;
const MUNICIPALITY_CODE = /^\d{4}$/;
const PROVINCE_CODE = /^PV(\d{2})$/;
const MIN_MUNICIPALITIES = 300;
const PROVINCE_COUNT = 12;

/** Today in Europe/Amsterdam as YYYY-MM-DD (en-CA formats dates that way). */
function todayInAmsterdam() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function fail(message) {
  console.error(`Error: ${message}`);
  console.error('The data file was not changed.');
  process.exit(1);
}

async function fetchPage(start) {
  const url = new URL(SOURCE_URL);
  url.searchParams.set('q', '*:*');
  url.searchParams.set('fq', 'type:gemeente');
  url.searchParams.set('fl', 'gemeentecode,gemeentenaam,provinciecode,provincienaam');
  url.searchParams.set('sort', 'gemeentecode asc');
  url.searchParams.set('rows', String(PAGE_SIZE));
  url.searchParams.set('start', String(start));
  const response = await fetch(url);
  if (!response.ok) {
    fail(`Downloading ${url} failed: HTTP ${response.status} ${response.statusText}`);
  }
  const json = await response.json();
  if (!json?.response || !Array.isArray(json.response.docs) || typeof json.response.numFound !== 'number') {
    fail(`Unexpected response from ${url}: ${JSON.stringify(json).slice(0, 500)}`);
  }
  return json.response;
}

async function download() {
  const docs = [];
  let numFound = Infinity;
  for (let start = 0; start < numFound; start += PAGE_SIZE) {
    const page = await fetchPage(start);
    if (numFound !== Infinity && page.numFound !== numFound) {
      fail(`The number of municipalities changed while paging (${numFound} -> ${page.numFound}), try again`);
    }
    numFound = page.numFound;
    if (page.docs.length === 0) {
      break;
    }
    docs.push(...page.docs);
  }
  if (docs.length !== numFound) {
    fail(`Received ${docs.length} municipalities, but the Locatieserver reported ${numFound}`);
  }
  return docs;
}

function toEntries(docs) {
  const entries = docs.map(doc => {
    const municipalityCode = (doc.gemeentecode ?? '').trim();
    const municipality = (doc.gemeentenaam ?? '').trim();
    const provinceCode = PROVINCE_CODE.exec((doc.provinciecode ?? '').trim())?.[1];
    const province = (doc.provincienaam ?? '').trim();
    if (!MUNICIPALITY_CODE.test(municipalityCode) || municipality === '' || !provinceCode || province === '') {
      fail(`Invalid municipality: ${JSON.stringify(doc)}`);
    }
    return { municipalityCode, municipality, provinceCode, province };
  });
  return entries.sort((a, b) => a.municipality.localeCompare(b.municipality, 'nl'));
}

function validate(entries) {
  const assertUnique = (key, label) => {
    const seen = new Set();
    for (const entry of entries) {
      if (seen.has(entry[key])) {
        fail(`${label} ${entry[key]} occurs more than once`);
      }
      seen.add(entry[key]);
    }
  };
  assertUnique('municipalityCode', 'Municipality code');
  assertUnique('municipality', 'Municipality name');
  if (entries.length < MIN_MUNICIPALITIES) {
    fail(`Only ${entries.length} municipalities found, expected at least ${MIN_MUNICIPALITIES}`);
  }
  const provinces = new Map(entries.map(e => [ e.provinceCode, e.province ]));
  if (provinces.size !== PROVINCE_COUNT) {
    fail(`Found ${provinces.size} provinces, expected ${PROVINCE_COUNT}: ${[...provinces.values()].join(', ')}`);
  }
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

function printSummary(previous, entries) {
  const previousByCode = new Map(previous.map(e => [ e.municipalityCode, e ]));
  const byCode = new Map(entries.map(e => [ e.municipalityCode, e ]));
  const label = e => `${e.municipality} (${e.municipalityCode})`;
  const list = items => items.length === 0 ? '-' : items.join(', ');

  console.log(`${entries.length} municipalities.`);
  if (previous.length === 0) {
    console.log('No previous list found, nothing to compare with.');
    return;
  }
  console.log(`Added:    ${list(entries.filter(e => !previousByCode.has(e.municipalityCode)).map(label))}`);
  console.log(`Removed:  ${list(previous.filter(e => !byCode.has(e.municipalityCode)).map(label))}`);
  const changed = entries
    .filter(e => previousByCode.has(e.municipalityCode))
    .flatMap(e => {
      const p = previousByCode.get(e.municipalityCode);
      const changes = [];
      if (p.municipality !== e.municipality) {
        changes.push(`${e.municipalityCode}: name "${p.municipality}" -> "${e.municipality}"`);
      }
      if (p.provinceCode !== e.provinceCode || p.province !== e.province) {
        changes.push(`${label(e)}: province ${p.province} (${p.provinceCode}) -> ${e.province} (${e.provinceCode})`);
      }
      return changes;
    });
  console.log(`Changed:  ${list(changed)}`);
}

function render(entries, today) {
  return [
    '// Generated by ci/scripts/update-municipalities.mjs, do not edit.',
    `// Source: ${SOURCE_URL}?fq=type:gemeente`,
    `// Last updated: ${today}`,
    "import type { MunicipalityModel } from './municipality.model';",
    '',
    '/**',
    ' * Source: PDOK Locatieserver, documents of type "gemeente". The fields "gemeentecode", "gemeentenaam", "provinciecode"',
    ' * (without the "PV" prefix) and "provincienaam" are mapped to `municipalityCode`, `municipality`, `provinceCode` and',
    ' * `province`.',
    ' *',
    ' * To update this list, run `npm run update-municipalities`, review the summary and the diff, and commit.',
    ' */',
    '// eslint-disable-next-line max-len, object-curly-spacing, comma-spacing',
    `export const MUNICIPALITY_LIST: MunicipalityModel[] = ${JSON.stringify(entries)};`,
    '',
  ].join('\n');
}

const today = todayInAmsterdam();
const entries = toEntries(await download());
validate(entries);
printSummary(await readPrevious(), entries);
await writeFile(OUTPUT_FILE, render(entries, today));
console.log(`Wrote ${OUTPUT_FILE}`);
