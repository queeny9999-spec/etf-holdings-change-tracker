import fs from 'node:fs';
const source = fs.readFileSync('_work/scripts/verify-20261022.mjs', 'utf8')
  .replaceAll('20261022', '20261105').replaceAll('2026/10/22', '2026/11/05')
  .replaceAll('10/22', '11/05').replaceAll("days[0] !== '四'", "days[0] !== '四'");
await import(`data:text/javascript,${encodeURIComponent(source)}`);
