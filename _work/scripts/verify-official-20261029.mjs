import crypto from 'node:crypto';
import fs from 'node:fs';

const rawDate = '20261029', date = '2026/10/29', shortDate = '10/29';
const html = fs.readFileSync('dist/index.html', 'utf8');
const targets = ['dist/index.html', 'outputs/index.html', 'outputs/etf-tracker-live.html'];
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = (name, marker) => {
  const start = html.indexOf(`const ${name}=`), from = start + `const ${name}=`.length, end = html.indexOf(marker, from);
  if (start < 0 || end < 0) throw new Error(`missing ${name}`);
  return Function(`"use strict";return (${html.slice(from, end).replace(/;\s*$/, '')});`)();
};
const decode = value => value.replaceAll('&quot;', '"').replaceAll('&amp;', '&').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const ez = (file) => {
  const m = fs.readFileSync(`_work/data/${file}`, 'utf8').match(/<div id="DataAsset" data-content="([^"]*)"/);
  const a = JSON.parse(decode(m[1])), s = a.find(x => x.AssetCode === 'ST'), n = a.find(x => x.AssetCode === 'NAV');
  return { rows: s.Details.filter(x => x.AssetCode === 'ST').map(x => [String(x.DetailCode).trim(), String(x.DetailName).trim(), String(Math.round(Number(x.Share))), `${Number(x.NavRate).toFixed(3)}%`]), nav: Number(a.find(x => x.AssetCode === 'P_UNIT').Value).toFixed(2), netAssets: String(n.Value), units: String(a.find(x => x.AssetCode === 'OUT_UNIT').Value), stockWeight: `${(Number(s.Value) / Number(n.Value) * 100).toFixed(3)}%` };
};
const source = read('source', ';\nconst archivedSource='), changes = read('verifiedChanges', ';\nconst fundNotes='), dates = read('dates', ';\nconst days=');
const fuhwa = JSON.parse(fs.readFileSync(`_work/data/ETF23-${rawDate}-alt.json`, 'utf8'));
const expected = {'00981A': ez(`ezmoney-49YTW-check-${rawDate}.html`), '00403A': ez(`ezmoney-63YTW-check-${rawDate}.html`), '00991A': {rows:fuhwa.rows, nav:fuhwa.nav, netAssets:fuhwa.netAssets, units:fuhwa.units, stockWeight:fuhwa.stockWeight}};
if (dates[0] !== shortDate || html.includes('xiaoyu-etf.pages.dev')) throw new Error('date or Xiaoyu suspension invalid');
for (const [code, value] of Object.entries(expected)) {
  const fund = source[code];
  if (fund.date !== date || JSON.stringify(fund.rows) !== JSON.stringify(value.rows) || fund.nav !== value.nav || fund.netAssets !== value.netAssets || fund.units !== value.units || fund.stockWeight !== value.stockWeight) throw new Error(`${code} official data mismatch`);
}
const hashes = Object.fromEntries(targets.map(file => [file, hash(file)]));
if (new Set(Object.values(hashes)).size !== 1) throw new Error('HTML files differ');
console.log(JSON.stringify({date, hashes, changes: Object.fromEntries(Object.keys(expected).map(code => [code, Object.keys(changes[code][shortDate]).length]))}, null, 2));
