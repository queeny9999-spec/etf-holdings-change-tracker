import fs from 'node:fs';

const targets = ['dist/index.html', 'outputs/index.html', 'outputs/etf-tracker-live.html'];
const official = {
  '00981A': { date: '2026/09/22', assetDate: '2026/09/22', netAssets: '290308879151', units: '9579709000', nav: '30.30', stockWeight: '97.595%', url: 'https://www.ezmoney.com.tw/ETF/Fund/Info?FundCode=49YTW', rows: [
    ['2330','台積電','11864000','10.050%'],['2454','聯發科','5186000','9.250%'],['2383','台光電','4750000','7.950%'],['3037','欣興','20300000','7.830%'],['3017','奇鋐','5949000','6.950%'],['3653','健策','2512000','5.040%'],['2327','國巨*','25107000','4.940%'],['2303','聯電','89118000','4.910%'],['2308','台達電','7420000','4.860%'],['6223','旺矽','2544000','4.680%'],['2345','智邦','6464000','4.260%'],['6669','緯穎','5582561','4.070%'],['3711','日月光投控','16811000','4.010%'],['8046','南電','9037000','3.630%'],['3665','貿聯-KY','3943848','3.050%'],['6274','台燿','5696000','2.830%'],['6805','富世達','1773000','1.530%'],['5274','信驊','207900','1.500%'],['2449','京元電子','13138450','1.430%'],['3443','創意','413000','1.190%'],['4958','臻鼎-KY','3543000','0.600%'],['6510','精測','400000','0.510%'],['3264','欣銓','5182000','0.490%'],['2368','金像電','1363000','0.490%'],['8210','勤誠','1159000','0.360%'],['8996','高力','485000','0.280%'],['6278','台表科','3248000','0.240%'],['6515','穎崴','95000','0.190%'],['6271','同欣電','2222000','0.170%'],['6191','精成科','3988000','0.120%'],['3376','新日興','1740000','0.110%'],['2313','華通','501000','0.040%'],['2002','中鋼','5163000','0.030%'],['8358','金居','1000','0.000%'],['3661','世芯-KY','1000','0.000%'],['2439','美律','1000','0.000%'],['1590','亞德客-KY','1000','0.000%'],['3008','大立光','1000','0.000%'],['2382','廣達','1000','0.000%'],['6187','萬潤','1000','0.000%'],['4979','華星光','1000','0.000%'],['2408','南亞科','1000','0.000%'],['2637','慧洋-KY','1000','0.000%'],['2360','致茂','1000','0.000%'],['6488','環球晶','1000','0.000%'],['4966','譜瑞-KY','1000','0.000%'],['8150','南茂','1000','0.000%'],['2317','鴻海','1000','0.000%'],['5347','世界','1000','0.000%'],['2481','強茂','5000','0.000%']
  ]},
  '00403A': { date: '2026/09/22', assetDate: '2026/09/22', netAssets: '156851592219', units: '14583019000', priorRows: [['3533','嘉澤','40000','0.040%']], nav: '10.76', stockWeight: '93.137%', url: 'https://www.ezmoney.com.tw/ETF/Fund/Info?FundCode=63YTW', rows: [
    ['2330','台積電','9400000','14.740%'],['2454','聯發科','2210000','7.300%'],['3017','奇鋐','2850000','6.160%'],['2303','聯電','60000000','6.120%'],['3037','欣興','8460000','6.040%'],['2383','台光電','1600000','4.960%'],['3653','健策','1115000','4.140%'],['6223','旺矽','1100000','3.750%'],['2308','台達電','2900000','3.510%'],['3443','創意','646000','3.450%'],['2327','國巨*','8000000','2.910%'],['6669','緯穎','1867956','2.520%'],['2345','智邦','2060000','2.520%'],['3189','景碩','4000000','2.320%'],['8046','南電','2770000','2.060%'],['1303','南亞','13500000','1.990%'],['3665','貿聯-KY','1293000','1.850%'],['6274','台燿','1900000','1.740%'],['6488','環球晶','2800000','1.730%'],['8996','高力','1625000','1.710%'],['5274','信驊','120500','1.610%'],['6805','富世達','840000','1.340%'],['3008','大立光','280000','1.140%'],['2360','致茂','680000','1.060%'],['2449','京元電子','4000000','0.810%'],['2408','南亞科','2000000','0.630%'],['2059','川湖','75000','0.610%'],['2317','鴻海','3200000','0.520%'],['7769','鴻勁','130000','0.510%'],['3450','聯鈞','1500000','0.500%'],['3211','順達','2000000','0.490%'],['3711','日月光投控','1000000','0.440%'],['3583','辛耘','800000','0.360%'],['6442','光聖','350000','0.340%'],['2481','強茂','3000000','0.330%'],['2882','國泰金','4000000','0.290%'],['2404','漢唐','250000','0.180%'],['2455','全新','386000','0.130%'],['1560','中砂','191000','0.120%'],['1717','長興','1500000','0.070%'],['6285','啟碁','350000','0.050%'],['2301','光寶科','300000','0.050%'],['8358','金居','100000','0.030%'],['3264','欣銓','1000','0.000%'],['2337','旺宏','1000','0.000%'],['8299','群聯','1000','0.000%'],['6196','帆宣','1000','0.000%'],['6239','力成','1000','0.000%'],['2049','上銀','1000','0.000%'],['2344','華邦電','1000','0.000%']
  ]},
};

function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseFuhwa() {
  const { date, nav, stockWeight, rows } = JSON.parse(fs.readFileSync('_work/data/ETF23-20260922.json', 'utf8'));
  if (date !== '2026/09/22' || rows.length !== 50) throw new Error(`Unexpected Fuh Hwa parse: ${date}, ${rows.length}`);
  return { date, assetDate: '2026/09/22', netAssets: '79300118246', units: '4427416000', nav, stockWeight, url: 'https://www.fhtrust.com.tw/ETF/etf_detail/ETF23#stockhold', rows };
}

official['00991A'] = parseFuhwa();

function readConst(html, name, nextName) {
  const match = html.match(new RegExp(`const ${name}=([\\s\\S]*?);\\r?\\nconst ${nextName}=`));
  if (!match) throw new Error(`Cannot read ${name}`);
  return { text: match[1], value: Function(`"use strict"; return (${match[1]});`)() };
}
function replaceConst(html, name, oldText, value) {
  return html.replace(`const ${name}=${oldText};`, `const ${name}=${JSON.stringify(value, null, 2)};`);
}
function holdings(rows) { return Object.fromEntries(rows.map(([code,,shares]) => [code, Number(shares)])); }
function changes(next, prior) {
  const current = holdings(next), previous = holdings(prior), result = {};
  for (const code of new Set([...Object.keys(current), ...Object.keys(previous)])) {
    const delta = (current[code] || 0) - (previous[code] || 0);
    if (delta) result[code] = delta;
  }
  return result;
}

for (const target of targets) {
  let html = fs.readFileSync(target, 'utf8');
  const dates = readConst(html, 'dates', 'days');
  const days = readConst(html, 'days', 'source');
  const source = readConst(html, 'source', 'archivedSource');
  const verified = readConst(html, 'verifiedChanges', 'fundNotes');
  const notes = readConst(html, 'fundNotes', 'fundOrder');
  for (const code of Object.keys(official)) {
    verified.value[code]['09/22'] = changes(official[code].rows, source.value[code].rows);
    source.value[code] = { ...source.value[code], ...official[code] };
    notes.value[code] = `09/22 的持有股數與比重來自${code === '00991A' ? '復華' : '統一'}投信官網，09/22 欄位為較 09/21 官網快照的實際股數異動。`;
  }
  dates.value = ['09/22', ...dates.value.filter(d => d !== '09/22')].slice(0, 10);
  days.value = ['二', ...days.value].slice(0, 10);
  html = replaceConst(html, 'dates', dates.text, dates.value);
  html = replaceConst(html, 'days', days.text, days.value);
  html = replaceConst(html, 'source', source.text, source.value);
  html = replaceConst(html, 'verifiedChanges', verified.text, verified.value);
  html = replaceConst(html, 'fundNotes', notes.text, notes.value);
  html = html.replace(/<div class="status" id="status"><\/div>/, '<div class="status" id="status"></div>');
  fs.writeFileSync(target, html, 'utf8');
}

console.log(JSON.stringify(Object.fromEntries(Object.entries(official).map(([code, value]) => [code, { date: value.date, rows: value.rows.length, nav: value.nav, stockWeight: value.stockWeight }]))));
