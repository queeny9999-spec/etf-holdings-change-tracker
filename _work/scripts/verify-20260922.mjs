import fs from 'node:fs';

const targets = ['dist/index.html', 'outputs/index.html', 'outputs/etf-tracker-live.html'];
for (const target of targets) {
  const html = fs.readFileSync(target, 'utf8');
  const read = (name, nextName) => {
    const match = html.match(new RegExp(`const ${name}=([\\s\\S]*?);\\r?\\nconst ${nextName}=`));
    if (!match) throw new Error(`${target}: cannot read ${name}`);
    return Function(`"use strict"; return (${match[1]});`)();
  };
  const dates = read('dates', 'days');
  const source = read('source', 'archivedSource');
  const changes = read('verifiedChanges', 'fundNotes');
  if (!html.includes('data-page="active"') || !html.includes('data-page="trust"') || !html.includes('今日買進金額')) throw new Error(`${target}: dashboard`);
  if (dates[0] !== '09/22') throw new Error(`${target}: latest date`);
  if (source['00981A'].date !== '2026/09/22' || source['00981A'].rows.length !== 50 || source['00981A'].nav !== '30.30') throw new Error(`${target}: 00981A`);
  if (source['00403A'].date !== '2026/09/22' || source['00403A'].rows.length !== 50 || source['00403A'].nav !== '10.76') throw new Error(`${target}: 00403A`);
  if (source['00991A'].date !== '2026/09/22' || source['00991A'].rows.length !== 50 || source['00991A'].nav !== '17.91') throw new Error(`${target}: 00991A`);
  for (const fund of ['00981A', '00403A', '00991A']) {
    if (!Object.keys(changes[fund]['09/22']).length) throw new Error(`${target}: ${fund} empty 09/22 changes`);
  }
}
console.log(JSON.stringify({status: 'ok', updated: ['00981A', '00403A', '00991A'], date: '2026/09/22'}));
