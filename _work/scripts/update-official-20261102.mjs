import fs from 'node:fs';
const check = 'file:///D:/workspace/P002_etf-holdings-change-tracker/_work/scripts/check-official-20261102-inputs.mjs';
let source = fs.readFileSync('_work/scripts/update-all-20261022.mjs', 'utf8')
  .replace("import './check-20261022-inputs.mjs';", `await import('${check}');`)
  .replaceAll('20261022', '20261102').replaceAll('2026/10/22', '2026/11/02')
  .replaceAll('10/22', '11/02').replaceAll("const priorDate = '10/21'", "const priorDate = '10/30'")
  .replaceAll("const weekday = '四'", "const weekday = '一'");
source = source
  .replace(/function parseXiaoyuAmounts\(\) \{[\s\S]*?\n\}\n\n/, '')
  .replace(/const xiaoyuAmounts = parseXiaoyuAmounts\(\);\nconst inst = JSON\.parse\([\s\S]*?\nif \(inst\.slash !== date\) throw new Error\([^\n]*\);\n\n/, 'const xiaoyuAmounts = {};\n');
await import(`data:text/javascript,${encodeURIComponent(source)}`);
