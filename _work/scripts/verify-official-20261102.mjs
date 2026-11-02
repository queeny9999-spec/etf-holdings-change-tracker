import fs from 'node:fs';
const source = fs.readFileSync('_work/scripts/verify-official-20261029.mjs', 'utf8')
  .replaceAll('20261029', '20261102').replaceAll('2026/10/29', '2026/11/02').replaceAll('10/29', '11/02');
await import(`data:text/javascript,${encodeURIComponent(source)}`);
