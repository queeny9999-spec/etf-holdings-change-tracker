import json
import re
import sys

import openpyxl


src, dst = sys.argv[1:3]
rows = list(openpyxl.load_workbook(src, data_only=True).active.values)
date = str(rows[2][0]).replace("日期: ", "")
net_assets = str(rows[4][0]).replace(",", "")
units = str(rows[6][0]).replace(",", "")
start = next(i + 1 for i, row in enumerate(rows) if row[0] == "證券代號")
stocks = [row for row in rows[start:] if row[0] and re.fullmatch(r"\d{4}", str(row[0]))]
assert date == "2026/10/13" and stocks, "Official workbook date or holdings unavailable"
with open("_work/data/fhtrust-ETF23-check-20261013.html", encoding="utf-8") as source:
    html = source.read()
nav_match = re.search(r"fundState-type[^>]*>\s*淨值\s*</div>\s*<div[^>]*>\s*([\d.]+)\s*</div>\s*<div[^>]*>\s*(\d{4}/\d{2}/\d{2})", html)
weight_match = re.search(r"<span>權重</span>\s*<span>([\d.]+%)</span>", html)
stock_weight = weight_match.group(1) if nav_match and nav_match.group(2) == date and weight_match else ""
data = {
    "date": date,
    "nav": str(rows[8][0]),
    "netAssets": net_assets,
    "units": units,
    "stockWeight": stock_weight,
    "rows": [[str(row[0]), str(row[1]), str(row[2]).replace(",", ""), str(row[4])] for row in stocks],
}
with open(dst, "w", encoding="utf-8") as output:
    json.dump(data, output, ensure_ascii=False, indent=2)
print(json.dumps({key: value for key, value in data.items() if key != "rows"}, ensure_ascii=False))

