import fs from 'node:fs';

let source = fs.readFileSync('_work/scripts/update-all-20261022.mjs', 'utf8')
  .replace(/import '.\/check-20261022-inputs\.mjs';\r?\n\r?\n/, '')
  .replaceAll('20261022', '20261029').replaceAll('2026/10/22', '2026/10/29')
  .replaceAll('10/22', '10/29').replaceAll("const priorDate = '10/21'", "const priorDate = '10/28'")
  .replaceAll("const weekday = '四'", "const weekday = '三'");

source = source.replace(/const xiaoyuAmounts = parseXiaoyuAmounts\(\);\r?\nconst inst = JSON\.parse\(fs\.readFileSync\(`_work\/data\/xiaoyu-inst-\$\{rawDate\}\.json`, 'utf8'\)\);\r?\nif \(inst\.slash !== date\) throw new Error\(`Xiaoyu inst report not ready: \$\{inst\.slash\}`\);/, 'const xiaoyuAmounts = {};');
const marker = '  html = html.replace("function changedRows(fund){return source[fund].rows.filter"';
const additions = [
  "  html = html.replace('<script src=\"https://xiaoyu-etf.pages.dev/data.js?v='+rawDate+'\"></script>', '<script>window.DATA=null;</script>');",
  "  { const start = html.indexOf('window.MARKET_REPORT=window.MARKET_REPORT||null;fetch('), end = html.indexOf('const fundOrder=', start); if (start >= 0 && end >= 0) html = html.slice(0, start) + 'window.MARKET_REPORT=null;' + html.slice(end); }",
  "  html = html.replace(\"const xiaoyuDate=window.DATA?.meta?.latest_slash||latestDate;\", \"const xiaoyuDate='2026/10/28';\");",
  "  html = html.replace(\"const m=window.MARKET_REPORT||{},r=m.report||{},stat=m.stat||[],date=m.slash||m.date||latestDate;\", \"const m=window.MARKET_REPORT||{},r=m.report||{},stat=m.stat||[],date=m.slash||m.date||'2026/10/28';\");",
  "  html = html.replaceAll('資料載入中…', '暫停更新');",
].join('\n') + '\n';
if (!source.includes(marker)) throw new Error('HTML patch marker missing');
source = source.replace(marker, additions + marker);

await import(`data:text/javascript,${encodeURIComponent(source)}`);
