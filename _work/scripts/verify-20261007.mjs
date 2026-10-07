import crypto from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';

const rawDate = '20261007';
const date = '2026/10/07';
const shortDate = '10/07';
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
    holdings: stock.Details.filter((row) => row.AssetCode === 'ST').map((row) => [String(row.DetailCode).trim(), String(row.DetailName).trim(), String(Math.round(Number(row.Share))), `${Number(row.NavRate).toFixed(3)}%`]),
    nav: Number(perUnit.Value).toFixed(2),
    netAssets: String(nav.Value),
    units: String(assets.find((item) => item.AssetCode === 'OUT_UNIT').Value),
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
const prior = JSON.parse(fs.readFileSync(`_work/data/prior-success-${rawDate}.json`, 'utf8'));
const expected = {
  '00981A': parseEzmoney(`ezmoney-49YTW-check-${rawDate}.html`),
  '00403A': parseEzmoney(`ezmoney-63YTW-check-${rawDate}.html`),
  '00991A': { rows: fuhwa.rows.length, holdings: fuhwa.rows, nav: fuhwa.nav, netAssets: fuhwa.netAssets, units: fuhwa.units, stockWeight: fuhwa.stockWeight },
};

if (dates[0] !== shortDate) throw new Error(`Latest date is ${dates[0]}`);
if (days[0] !== '三') throw new Error(`Latest weekday is ${days[0]}`);
if (!html.includes(`data.js?v=${rawDate}`)) throw new Error('data.js cachebuster was not updated');
if (!html.includes(`inst.json?v=${rawDate}`)) throw new Error('inst.json cachebuster was not updated');

for (const [code, check] of Object.entries(expected)) {
  const fund = source[code];
  const item = data.etfs.find((etf) => etf.code === code);
  if (fund.date !== date) throw new Error(`${code} source date is ${fund.date}`);
  if (fund.rows.length !== check.rows) throw new Error(`${code} has ${fund.rows.length} rows`);
  if (JSON.stringify(fund.rows) !== JSON.stringify(check.holdings)) throw new Error(`${code} official holdings mismatch`);
  if (fund.nav !== check.nav) throw new Error(`${code} nav is ${fund.nav}`);
  if (fund.netAssets !== check.netAssets || fund.units !== check.units) throw new Error(`${code} official fund assets or units mismatch`);
  if (fund.stockWeight !== check.stockWeight) throw new Error(`${code} stockWeight is ${fund.stockWeight}`);
  const currentShares = Object.fromEntries(fund.rows.map(([stock,, shares]) => [stock, Number(shares)]));
  const priorShares = Object.fromEntries(prior[code].rows.map(([stock,, shares]) => [stock, Number(shares)]));
  const delta = Object.fromEntries([...new Set([...Object.keys(currentShares), ...Object.keys(priorShares)])].map(stock => [stock, (currentShares[stock] || 0) - (priorShares[stock] || 0)]).filter(([, value]) => value !== 0));
  if (JSON.stringify(changes[code][shortDate]) !== JSON.stringify(delta)) throw new Error(`${code} daily share changes differ from prior success`);
  const displayed = new Set([...fund.rows, ...(fund.retiredRows || [])].map(([stock]) => stock));
  for (const day of dates) {
    for (const stock of Object.keys(changes[code][day] || {})) {
      if (!displayed.has(stock)) throw new Error(`${code} missing changed stock ${stock} on ${day}`);
    }
  }
  for (const row of fund.retiredRows || []) {
    if (row[2] !== '0' || row[3] !== '') throw new Error(`${code} invalid closed-position data`);
  }
  if (!notes[code].includes(shortDate)) throw new Error(`${code} note was not updated`);
  if (xiaoyuAmounts[code]?.date !== date) throw new Error(`${code} Xiaoyu date missing`);
  if (!item || item.date !== rawDate) throw new Error(`${code} Xiaoyu source missing`);
  if (xiaoyuAmounts[code].buy !== item.buy_amt || xiaoyuAmounts[code].sell !== (item.sell_amt == null ? null : Math.abs(item.sell_amt)) || xiaoyuAmounts[code].net !== item.net) {
    throw new Error(`${code} Xiaoyu amount mismatch`);
  }
}

const hashes = Object.fromEntries(targets.map((file) => [file, hash(file)]));
if (new Set(Object.values(hashes)).size !== 1) throw new Error(`HTML targets are not identical: ${JSON.stringify(hashes)}`);

const inst = JSON.parse(fs.readFileSync(`_work/data/xiaoyu-inst-${rawDate}.json`, 'utf8'));
if (inst.slash !== date || data.meta.latest !== rawDate) throw new Error('Xiaoyu report date mismatch');
const elements = new Map();
const context = vm.createContext({
  window: { DATA: data, MARKET_REPORT: inst },
  document: {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, { textContent: '', innerHTML: '' });
      return elements.get(id);
    },
    querySelectorAll: () => [],
  },
  fetch: () => new Promise(() => {}),
});
for (const [, attributes, body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
  if (!attributes.includes('src=')) new vm.Script(body).runInContext(context, { timeout: 5000 });
}
for (const code of Object.keys(expected)) {
  const table = vm.runInContext(`activeFund=${JSON.stringify(code)};activeView()`, context);
  if (table.includes('張</td>') || table.includes('class="date-col blank">—')) throw new Error(`${code} active table contains nonnumeric placeholders`);
  const shown = vm.runInContext(`changedRows(${JSON.stringify(code)}).map(row=>row[0])`, context);
  for (const day of dates) {
    for (const stock of Object.keys(changes[code][day] || {})) {
      if (!shown.includes(stock)) throw new Error(`${code} changed stock ${stock} not rendered`);
    }
  }
}
for (const page of ['trust', 'market']) {
  vm.runInContext(`page=${JSON.stringify(page)};selectedStock=null;render()`, context);
  if (!elements.get('app').innerHTML.includes('<table')) throw new Error(`${page} did not render Xiaoyu tables`);
  if (!elements.get('sideDate').textContent.includes(date)) throw new Error(`${page} rendered a stale date`);
}

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
