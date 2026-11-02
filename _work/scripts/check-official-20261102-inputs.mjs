import fs from 'node:fs';

const rawDate = '20261102';
const date = '2026/11/02';
const decode = (value) => value.replaceAll('&quot;', '"').replaceAll('&amp;', '&').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const readEzmoney = (file, code) => {
  const match = fs.readFileSync(`_work/data/${file}`, 'utf8').match(/<div id="DataAsset" data-content="([^"]*)"/);
  if (!match) throw new Error(`DataAsset missing: ${file}`);
  const assets = JSON.parse(decode(match[1]));
  const stock = assets.find((x) => x.AssetCode === 'ST');
  const nav = assets.find((x) => x.AssetCode === 'NAV');
  const rows = stock.Details.filter((x) => x.AssetCode === 'ST');
  const result = { date: rows[0].TranDate.slice(0, 10).replaceAll('-', '/'), rows: rows.length, nav: Number(assets.find((x) => x.AssetCode === 'P_UNIT').Value).toFixed(2), stockWeight: `${(Number(stock.Value) / Number(nav.Value) * 100).toFixed(3)}%` };
  if (result.date !== date || !result.rows) throw new Error(`${code} not ready: ${JSON.stringify(result)}`);
  return result;
};
const calendar = JSON.parse(fs.readFileSync(`_work/data/twse-holidays-${rawDate}.json`, 'utf8'));
if (calendar.stat !== 'ok' || calendar.queryYear !== 2026) throw new Error('TWSE calendar unavailable');
const fuhwa = JSON.parse(fs.readFileSync(`_work/data/ETF23-${rawDate}-alt.json`, 'utf8'));
if (fuhwa.date !== date || !fuhwa.rows.length) throw new Error(`00991A workbook not ready: ${JSON.stringify({ date: fuhwa.date, rows: fuhwa.rows.length })}`);
console.log(JSON.stringify({ official: { '00981A': readEzmoney(`ezmoney-49YTW-check-${rawDate}.html`, '00981A'), '00403A': readEzmoney(`ezmoney-63YTW-check-${rawDate}.html`, '00403A'), '00991A': { date: fuhwa.date, rows: fuhwa.rows.length, nav: fuhwa.nav, stockWeight: fuhwa.stockWeight } } }, null, 2));
