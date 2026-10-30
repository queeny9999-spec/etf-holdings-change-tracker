import fs from 'node:fs';
let source = fs.readFileSync('_work/scripts/verify-official-20261029.mjs', 'utf8')
  .replaceAll('20261029', '20261030').replaceAll('2026/10/29', '2026/10/30').replaceAll('10/29', '10/30');
await import(`data:text/javascript,${encodeURIComponent(source)}`);
