import fs from 'node:fs';
const source = fs.readFileSync('_work/scripts/verify-20261022.mjs', 'utf8')
  .replaceAll('20261022', '20261125').replaceAll('2026/10/22', '2026/11/25')
  .replaceAll('10/22', '11/25').replaceAll("!== '四'", "!== '三'");
await import(`data:text/javascript,${encodeURIComponent(source)}`);
