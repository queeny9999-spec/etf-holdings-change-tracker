import fs from 'node:fs';
const source = fs.readFileSync('_work/scripts/check-20261022-inputs.mjs', 'utf8')
  .replaceAll('20261022', '20261112')
  .replaceAll('2026/10/22', '2026/11/12')
  .replace(
    "if (calendar.stat !== 'ok' || calendar.queryYear !== 2026) throw new Error('TWSE calendar unavailable');",
    "const mi = JSON.parse(fs.readFileSync(`_work/data/twse-mi-index-${rawDate}.json`, 'utf8'));\nconst tradingDayEvidence = mi.stat === 'OK' && mi.date === rawDate && mi.tables.some((table) => table && Array.isArray(table.data) && table.data.length > 0);\nif ((calendar.stat !== 'ok' || calendar.queryYear !== 2026) && !tradingDayEvidence) throw new Error('TWSE calendar unavailable and MI_INDEX trading-day evidence missing');"
  );
await import(`data:text/javascript,${encodeURIComponent(source)}`);
