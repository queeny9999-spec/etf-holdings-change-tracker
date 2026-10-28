import fs from 'node:fs';
const source = fs.readFileSync('_work/scripts/verify-20261022.mjs', 'utf8')
  .replaceAll('20261022', '20261028').replaceAll('2026/10/22', '2026/10/28').replaceAll('10/22', '10/28').replaceAll("days[0] !== '四'", "days[0] !== '二'");
await import(`data:text/javascript,${encodeURIComponent(source)}`);
