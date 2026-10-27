import fs from 'node:fs';
const check = 'file:///D:/workspace/P002_etf-holdings-change-tracker/_work/scripts/check-20261027-inputs.mjs';
const source = fs.readFileSync('_work/scripts/update-all-20261022.mjs', 'utf8')
  .replace("import './check-20261022-inputs.mjs';", `await import('${check}');`)
  .replaceAll('20261022', '20261027').replaceAll('2026/10/22', '2026/10/27')
  .replaceAll('10/22', '10/27').replaceAll("const priorDate = '10/21'", "const priorDate = '10/22'")
  .replaceAll("const weekday = '四'", "const weekday = '一'");
await import(`data:text/javascript,${encodeURIComponent(source)}`);
