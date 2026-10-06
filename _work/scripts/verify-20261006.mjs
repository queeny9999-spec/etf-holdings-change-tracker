import crypto from 'node:crypto';
import fs from 'node:fs';

const rawDate = '20261006';
const date = '2026/10/06';
const shortDate = '10/06';
const targets = ['dist/index.html', 'outputs/index.html', 'outputs/etf-tracker-live.html'];
const html = fs.readFileSync('dist/index.html', 'utf8');

function decode(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

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

function parseEzmoney(file) {
  const src = fs.readFileSync(`_work/data/${file}`, 'utf8');
  const match = src.match(/<div id="DataAsset" data-content="([^"]*)"/);
  if (!match) throw new Error(`DataAsset missing: ${file}`);
  const assets = JSON.parse(decode(match[1]));
  const stock = assets.find((item) => item.AssetCode === 'ST');
  const nav = assets.find((item) => item.AssetCode === 'NAV');
  const perUnit = assets.find((item) => item.AssetCode === 'P_UNIT');
  return {
    rows: stock.Details.filter((row) => row.AssetCode === 'ST').length,
    nav: Number(perUnit.Value).toFixed(2),
    stockWeight: `${((Number(stock.Value) / Number(nav.Value)) * 100).toFixed(3)}%`,
  };
}

const dates = extract('dates', ';\nconst days=');
const days = extract('days', ';\nconst source=');
const source = extract('source', ';\nconst archivedSource=');
const changes = extract('verifiedChanges', ';\nconst fundNotes=');
const notes = extract('fundNotes', ';\nwindow.MARKET_REPORT=');
const xiaoyuMatch = html.match(/const xiaoyuAmounts=({[\s\S]*?});\r?\nfunction xiaoyuMetrics/);
if (!xiaoyuMatch) throw new Error('Cannot find xiaoyuAmounts');
const xiaoyuAmounts = Function(`"use strict"; return (${xiaoyuMatch[1]});`)();

const data = JSON.parse(fs.readFileSync(`_work/data/xiaoyu-data-${rawDate}.js`, 'utf8').replace(/^window\.DATA\s*=\s*/, '').replace(/;\s*$/s, ''));
const fuhwa = JSON.parse(fs.readFileSync(`_work/data/ETF23-${rawDate}-alt.json`, 'utf8'));
const expected = {
  '00981A': parseEzmoney(`ezmoney-49YTW-check-${rawDate}.html`),
  '00403A': parseEzmoney(`ezmoney-63YTW-check-${rawDate}.html`),
  '00991A': { rows: fuhwa.rows.length, nav: fuhwa.nav, stockWeight: fuhwa.stockWeight },
};

if (dates[0] !== shortDate) throw new Error(`Latest date is ${dates[0]}`);
if (days[0] !== '二') throw new Error(`Latest weekday is ${days[0]}`);
if (!html.includes(`data.js?v=${rawDate}`)) throw new Error('data.js cachebuster was not updated');
if (!html.includes(`inst.json?v=${rawDate}`)) throw new Error('inst.json cachebuster was not updated');

for (const [code, check] of Object.entries(expected)) {
  const fund = source[code];
  const item = data.etfs.find((etf) => etf.code === code);
  if (fund.date !== date) throw new Error(`${code} source date is ${fund.date}`);
  if (fund.rows.length !== check.rows) throw new Error(`${code} has ${fund.rows.length} rows`);
  if (fund.nav !== check.nav) throw new Error(`${code} nav is ${fund.nav}`);
  if (fund.stockWeight !== check.stockWeight) throw new Error(`${code} stockWeight is ${fund.stockWeight}`);
  if (!changes[code][shortDate] || Object.keys(changes[code][shortDate]).length === 0) throw new Error(`${code} has no ${shortDate} changes`);
  if (!notes[code].includes(shortDate)) throw new Error(`${code} note was not updated`);
  if (xiaoyuAmounts[code]?.date !== date) throw new Error(`${code} Xiaoyu date missing`);
  if (!item || item.date !== rawDate) throw new Error(`${code} Xiaoyu source missing`);
  if (xiaoyuAmounts[code].buy !== item.buy_amt || xiaoyuAmounts[code].sell !== Math.abs(item.sell_amt) || xiaoyuAmounts[code].net !== item.net) {
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
    changeCount: Object.keys(changes[code][shortDate]).length,
    xiaoyu: xiaoyuAmounts[code],
  }])),
}, null, 2));
