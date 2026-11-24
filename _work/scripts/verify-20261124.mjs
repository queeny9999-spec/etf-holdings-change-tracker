import fs from 'node:fs';
const source = fs.readFileSync('_work/scripts/verify-20261022.mjs', 'utf8')
  .replaceAll('20261022', '20261124').replaceAll('2026/10/22', '2026/11/24')
  .replaceAll('10/22', '11/24').replaceAll("!== '四'", "!== '二'");
await import(`data:text/javascript,${encodeURIComponent(source)}`);
