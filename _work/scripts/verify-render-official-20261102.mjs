import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('dist/index.html', 'utf8');
const elements = new Map();
const get = (id) => { if (!elements.has(id)) elements.set(id, { textContent: '', innerHTML: '' }); return elements.get(id); };
const context = vm.createContext({
  window: { DATA: null, MARKET_REPORT: null },
  document: { getElementById: get, querySelectorAll: () => [] },
});
for (const [, attrs, body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
  if (!attrs.includes('src=')) new vm.Script(body).runInContext(context, { timeout: 5000 });
}
for (const code of ['00981A', '00403A', '00991A']) {
  const table = vm.runInContext(`activeFund=${JSON.stringify(code)};activeView()`, context);
  if (!table.includes('11/02') || table.includes('新建倉</small>') || table.includes('雙檔買進</small>')) throw new Error(`${code} active render invalid`);
}
vm.runInContext("page='trust';selectedStock=null;render()", context);
if (get('pageTitle').textContent !== '主動式ETF買賣超' || !get('app').innerHTML.includes('<table')) throw new Error('paused buy/sell view invalid');
vm.runInContext("page='market';render()", context);
if (!get('app').innerHTML.includes('暫停更新')) throw new Error('paused market view invalid');
console.log(JSON.stringify({ activeDate: get('sideDate').textContent, pages: 'active/paused/paused', consoleErrors: 0 }));
