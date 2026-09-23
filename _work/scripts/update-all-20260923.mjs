import fs from 'node:fs';

const targets = ['dist/index.html', 'outputs/index.html', 'outputs/etf-tracker-live.html'];
const date = '2026/09/23';
const shortDate = '09/23';
const weekday = '三';

function decode(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function ymdSlash(value) {
  const m = String(value).match(/(\d{4})[-/](\d{2})[-/](\d{2})/);
  return m ? `${m[1]}/${m[2]}/${m[3]}` : value;
}

function pct(value, digits = 3) {
  return `${Number(value).toFixed(digits)}%`;
}

function parseEzmoney(file, code, name) {
  const html = fs.readFileSync(`_work/data/${file}`, 'utf8');
  const match = html.match(/<div id="DataAsset" data-content="([^"]*)"/);
  if (!match) throw new Error(`DataAsset missing: ${file}`);
  const assets = JSON.parse(decode(match[1]));
  const stock = assets.find((item) => item.AssetCode === 'ST');
  const nav = assets.find((item) => item.AssetCode === 'NAV');
  const perUnit = assets.find((item) => item.AssetCode === 'P_UNIT');
  const rows = stock.Details
    .filter((row) => row.AssetCode === 'ST')
    .map((row) => [
      String(row.DetailCode).trim(),
      String(row.DetailName).trim(),
      String(Math.round(Number(row.Share))),
      pct(row.NavRate, 3),
    ]);
  return {
    name,
    issuer: '統一投信',
    date: ymdSlash(stock.Details[0].TranDate),
    assetDate: ymdSlash(stock.Details[0].TranDate),
    nav: Number(perUnit.Value).toFixed(2),
    stockWeight: nav?.Value && stock?.Value ? pct((Number(stock.Value) / Number(nav.Value)) * 100, 3) : '',
    url: `https://www.ezmoney.com.tw/ETF/Fund/Info?FundCode=${code === '00981A' ? '49YTW' : '63YTW'}`,
    rows,
  };
}

function parseXiaoyuAmounts() {
  const raw = fs.readFileSync('_work/data/xiaoyu-data-20260923.js', 'utf8')
    .replace(/^window\.DATA\s*=\s*/, '')
    .replace(/;\s*$/s, '');
  const data = JSON.parse(raw);
  const result = {};
  for (const code of ['00981A', '00403A', '00991A']) {
    const item = data.etfs.find((etf) => etf.code === code);
    if (!item || item.date !== '20260923') throw new Error(`Xiaoyu data missing for ${code}`);
    result[code] = {
      date,
      buy: item.buy_amt,
      sell: Math.abs(item.sell_amt),
      net: item.net,
    };
  }
  return result;
}

function readConst(html, name, nextName) {
  const match = html.match(new RegExp(`const ${name}=([\\s\\S]*?);\\r?\\nconst ${nextName}=`));
  if (!match) throw new Error(`Cannot read ${name}`);
  return { text: match[1], value: Function(`"use strict"; return (${match[1]});`)() };
}

function readBefore(html, name, marker) {
  const start = html.indexOf(`const ${name}=`);
  if (start < 0) throw new Error(`Cannot read ${name}`);
  const valueStart = start + `const ${name}=`.length;
  const end = html.indexOf(marker, valueStart);
  if (end < 0) throw new Error(`Cannot find marker for ${name}`);
  const text = html.slice(valueStart, end).replace(/;\s*$/, '');
  return { text, value: Function(`"use strict"; return (${text});`)() };
}

function replaceConst(html, name, oldText, value) {
  return html.replace(`const ${name}=${oldText};`, `const ${name}=${JSON.stringify(value, null, 2)};`);
}

function holdings(rows) {
  return Object.fromEntries(rows.map(([code,, shares]) => [code, Number(shares)]));
}

function changes(next, prior) {
  const current = holdings(next);
  const previous = holdings(prior);
  const result = {};
  for (const code of new Set([...Object.keys(current), ...Object.keys(previous)])) {
    const delta = (current[code] || 0) - (previous[code] || 0);
    if (delta) result[code] = delta;
  }
  return result;
}

const fuhwa = JSON.parse(fs.readFileSync('_work/data/ETF23-20260923.json', 'utf8'));
const official = {
  '00981A': parseEzmoney('ezmoney-49YTW-check-20260923.html', '00981A', '主動統一台股增長'),
  '00403A': parseEzmoney('ezmoney-63YTW-check-20260923.html', '00403A', '主動統一升級50'),
  '00991A': {
    name: '復華台灣未來50主動式ETF基金',
    issuer: '復華投信',
    date: fuhwa.date,
    assetDate: fuhwa.date,
    nav: fuhwa.nav,
    stockWeight: fuhwa.stockWeight,
    url: 'https://www.fhtrust.com.tw/ETF/etf_detail/ETF23#stockhold',
    rows: fuhwa.rows,
  },
};

for (const [code, fund] of Object.entries(official)) {
  if (fund.date !== date || fund.rows.length !== 50) {
    throw new Error(`${code} not ready: ${fund.date}, ${fund.rows.length} rows`);
  }
}

const xiaoyuAmounts = parseXiaoyuAmounts();

for (const target of targets) {
  let html = fs.readFileSync(target, 'utf8');
  const dates = readConst(html, 'dates', 'days');
  const days = readConst(html, 'days', 'source');
  const source = readConst(html, 'source', 'archivedSource');
  const verified = readConst(html, 'verifiedChanges', 'fundNotes');
  const notes = readBefore(html, 'fundNotes', '\nwindow.MARKET_REPORT=');

  for (const code of Object.keys(official)) {
    verified.value[code][shortDate] = changes(official[code].rows, source.value[code].rows);
    source.value[code] = { ...source.value[code], ...official[code] };
    notes.value[code] = `${shortDate} 的持有股數與比重來自${code === '00991A' ? '復華' : '統一'}投信官網，${shortDate} 欄位為較 09/22 官網快照的實際股數異動。`;
  }

  dates.value = [shortDate, ...dates.value.filter((d) => d !== shortDate)].slice(0, 10);
  days.value = [weekday, ...days.value].slice(0, 10);
  html = replaceConst(html, 'dates', dates.text, dates.value);
  html = replaceConst(html, 'days', days.text, days.value);
  html = replaceConst(html, 'source', source.text, source.value);
  html = replaceConst(html, 'verifiedChanges', verified.text, verified.value);
  html = replaceConst(html, 'fundNotes', notes.text, notes.value);
  html = html.replace(/const xiaoyuAmounts=\{[\s\S]*?\};\r?\nfunction xiaoyuMetrics/, `const xiaoyuAmounts=${JSON.stringify(xiaoyuAmounts)};\nfunction xiaoyuMetrics`);
  html = html.replace(/data\.js\?v=\d+/g, 'data.js?v=20260923');
  html = html.replace(/inst\.json\?v=\d+/g, 'inst.json?v=20260923');
  fs.writeFileSync(target, html, 'utf8');
}

console.log(JSON.stringify({
  official: Object.fromEntries(Object.entries(official).map(([code, fund]) => [code, {
    date: fund.date,
    rows: fund.rows.length,
    nav: fund.nav,
    stockWeight: fund.stockWeight,
  }])),
  xiaoyuAmounts,
}, null, 2));
