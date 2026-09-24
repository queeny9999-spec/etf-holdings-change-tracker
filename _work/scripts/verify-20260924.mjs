import crypto from 'node:crypto';
import fs from 'node:fs';

const targets = ['dist/index.html', 'outputs/index.html', 'outputs/etf-tracker-live.html'];
const html = fs.readFileSync('dist/index.html', 'utf8');

function extract(name, terminator) {
  const start = html.indexOf(`const ${name}=`);
  if (start < 0) throw new Error(`Cannot find ${name}`);
  const valueStart = start + `const ${name}=`.length;
  const end = html.indexOf(terminator, valueStart);
  if (end < 0) throw new Error(`Cannot find terminator for ${name}`);
  return Function(`"use strict"; return (${html.slice(valueStart, end)});`)();
}

function hash(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

const dates = extract('dates', ';\nconst days=');
const days = extract('days', ';\nconst source=');
const source = extract('source', ';\nconst archivedSource=');
const changes = extract('verifiedChanges', ';\nconst fundNotes=');
const notes = extract('fundNotes', ';\nwindow.MARKET_REPORT=');
const xiaoyuMatch = html.match(/const xiaoyuAmounts=({[\s\S]*?});\r?\nfunction xiaoyuMetrics/);
if (!xiaoyuMatch) throw new Error('Cannot find xiaoyuAmounts');
const xiaoyuAmounts = Function(`"use strict"; return (${xiaoyuMatch[1]});`)();

const expected = {
  '00981A': { nav: '31.07', stockWeight: '97.038%', sell: 73.03, net: -73.03 },
  '00403A': { nav: '10.96', stockWeight: '93.382%', sell: 57.38, net: -52.8 },
  '00991A': { nav: '18.27', stockWeight: '98.879%', sell: 10.22, net: -8.78 },
};

if (dates[0] !== '09/24') throw new Error(`Latest date is ${dates[0]}`);
if (days[0] !== '四') throw new Error(`Latest weekday is ${days[0]}`);
if (!html.includes('data.js?v=20260924')) throw new Error('data.js cachebuster was not updated');
if (!html.includes('inst.json?v=20260924')) throw new Error('inst.json cachebuster was not updated');

for (const [code, check] of Object.entries(expected)) {
  const fund = source[code];
  if (fund.date !== '2026/09/24') throw new Error(`${code} source date is ${fund.date}`);
  if (fund.rows.length !== 50) throw new Error(`${code} has ${fund.rows.length} rows`);
  if (fund.nav !== check.nav) throw new Error(`${code} nav is ${fund.nav}`);
  if (fund.stockWeight !== check.stockWeight) throw new Error(`${code} stockWeight is ${fund.stockWeight}`);
  if (!changes[code]['09/24'] || Object.keys(changes[code]['09/24']).length === 0) {
    throw new Error(`${code} has no 09/24 changes`);
  }
  if (!notes[code].includes('09/24')) throw new Error(`${code} note was not updated`);
  if (xiaoyuAmounts[code]?.date !== '2026/09/24') throw new Error(`${code} Xiaoyu date missing`);
  if (xiaoyuAmounts[code].sell !== check.sell || xiaoyuAmounts[code].net !== check.net) {
    throw new Error(`${code} Xiaoyu amount mismatch`);
  }
}

const hashes = Object.fromEntries(targets.map((file) => [file, hash(file)]));
if (new Set(Object.values(hashes)).size !== 1) throw new Error(`HTML targets are not identical: ${JSON.stringify(hashes)}`);

console.log(JSON.stringify({
  latest: dates[0],
  hashes,
  funds: Object.fromEntries(Object.keys(expected).map((code) => [code, {
    date: source[code].date,
    rows: source[code].rows.length,
    nav: source[code].nav,
    stockWeight: source[code].stockWeight,
    changeCount: Object.keys(changes[code]['09/24']).length,
    xiaoyu: xiaoyuAmounts[code],
  }])),
}, null, 2));
