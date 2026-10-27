import fs from 'node:fs';
const source = fs.readFileSync('_work/scripts/check-20261022-inputs.mjs', 'utf8')
  .replaceAll('20261022', '20261027').replaceAll('2026/10/22', '2026/10/27');
await import(`data:text/javascript,${encodeURIComponent(source)}`);
