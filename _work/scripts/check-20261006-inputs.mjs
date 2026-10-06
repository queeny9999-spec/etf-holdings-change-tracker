import fs from 'node:fs';

const rawDate = '20261006';
const date = '2026/10/06';

function decode(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function readEzmoney(file, code) {
  const html = fs.readFileSync(`_work/data/${file}`, 'utf8');
  const match = html.match(/<div id="DataAsset" data-content="([^"]*)"/);
  if (!match) throw new Error(`DataAsset missing: ${file}`);
  const assets = JSON.parse(decode(match[1]));
  const stock = assets.find((item) => item.AssetCode === 'ST');
  const nav = assets.find((item) => item.AssetCode === 'NAV');
  const perUnit = assets.find((item) => item.AssetCode === 'P_UNIT');
  const rows = stock.Details.filter((row) => row.AssetCode === 'ST');
  const result = {
    date: rows[0].TranDate.slice(0, 10).replaceAll('-', '/'),
    rows: rows.length,
    nav: Number(perUnit.Value).toFixed(2),
    stockWeight: `${((Number(stock.Value) / Number(nav.Value)) * 100).toFixed(3)}%`,
  };
  if (result.date !== date || result.rows < 1) throw new Error(`${code} not ready: ${JSON.stringify(result)}`);
  return result;
}

const fuhwa = JSON.parse(fs.readFileSync(`_work/data/ETF23-${rawDate}-alt.json`, 'utf8'));
if (fuhwa.date !== date || fuhwa.rows.length < 1) throw new Error(`00991A not ready: ${JSON.stringify({ date: fuhwa.date, rows: fuhwa.rows.length })}`);

const data = JSON.parse(fs.readFileSync(`_work/data/xiaoyu-data-${rawDate}.js`, 'utf8').replace(/^window\.DATA\s*=\s*/, '').replace(/;\s*$/s, ''));
const inst = JSON.parse(fs.readFileSync(`_work/data/xiaoyu-inst-${rawDate}.json`, 'utf8'));
if (data.meta.latest !== rawDate || inst.slash !== date) throw new Error(`Xiaoyu not ready: ${JSON.stringify({ data: data.meta, inst: inst.slash })}`);

console.log(JSON.stringify({
  official: {
    '00981A': readEzmoney(`ezmoney-49YTW-check-${rawDate}.html`, '00981A'),
    '00403A': readEzmoney(`ezmoney-63YTW-check-${rawDate}.html`, '00403A'),
    '00991A': { date: fuhwa.date, rows: fuhwa.rows.length, nav: fuhwa.nav, stockWeight: fuhwa.stockWeight },
  },
  xiaoyu: { data: data.meta.latest_slash, inst: inst.slash },
}, null, 2));
