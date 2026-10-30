import fs from 'node:fs';
const rawDate = '20261030', date = '2026/10/30';
const decode = value => value.replaceAll('&quot;', '"').replaceAll('&amp;', '&').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const checkEzmoney = (file, code) => {
  const html = fs.readFileSync(`_work/data/${file}`, 'utf8');
  const match = html.match(/<div id="DataAsset" data-content="([^"]*)"/);
  if (!match) throw new Error(`DataAsset missing: ${file}`);
  const assets = JSON.parse(decode(match[1])), stock = assets.find(x => x.AssetCode === 'ST');
  const rows = stock.Details.filter(x => x.AssetCode === 'ST');
  const current = rows[0]?.TranDate?.slice(0, 10).replaceAll('-', '/');
  if (current !== date || rows.length < 1) throw new Error(`${code} official data not ready: ${JSON.stringify({date:current,rows:rows.length})}`);
  return {date: current, rows: rows.length};
};
const calendar = JSON.parse(fs.readFileSync(`_work/data/twse-holidays-${rawDate}.json`, 'utf8'));
if (calendar.stat !== 'ok' || calendar.queryYear !== 2026 || calendar.data.some(([day, name]) => day === '2026-10-30' && !name.includes('開始交易') && !name.includes('最後交易'))) throw new Error('TWSE non-trading day or calendar unavailable');
const fuhwa = JSON.parse(fs.readFileSync(`_work/data/ETF23-${rawDate}-alt.json`, 'utf8'));
if (fuhwa.date !== date || fuhwa.rows.length < 1) throw new Error(`00991A official workbook not ready: ${JSON.stringify({date:fuhwa.date,rows:fuhwa.rows.length})}`);
console.log(JSON.stringify({official:{'00981A':checkEzmoney(`ezmoney-49YTW-check-${rawDate}.html`,'00981A'),'00403A':checkEzmoney(`ezmoney-63YTW-check-${rawDate}.html`,'00403A'),'00991A':{date:fuhwa.date,rows:fuhwa.rows.length,nav:fuhwa.nav,stockWeight:fuhwa.stockWeight}}},null,2));
