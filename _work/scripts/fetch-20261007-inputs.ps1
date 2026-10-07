$ErrorActionPreference = 'Stop'
$rawDate = '20261007'
$sources = @(
    @{ Uri = 'https://www.twse.com.tw/rwd/zh/holidaySchedule/holidaySchedule?response=json&queryYear=115'; File = "twse-holidays-$rawDate.json" },
    @{ Uri = 'https://www.ezmoney.com.tw/ETF/Fund/Info?FundCode=49YTW'; File = "ezmoney-49YTW-check-$rawDate.html" },
    @{ Uri = 'https://www.ezmoney.com.tw/ETF/Fund/Info?FundCode=63YTW'; File = "ezmoney-63YTW-check-$rawDate.html" },
    @{ Uri = "https://www.fhtrust.com.tw/api/assetsExcel/ETF23/$rawDate"; File = "ETF23-$rawDate-alt.xlsx" },
    @{ Uri = "https://xiaoyu-etf.pages.dev/data.js?v=$rawDate"; File = "xiaoyu-data-$rawDate.js" },
    @{ Uri = "https://xiaoyu-etf.pages.dev/data/inst.json?v=$rawDate"; File = "xiaoyu-inst-$rawDate.json" }
)

foreach ($source in $sources) {
    Invoke-WebRequest -Uri $source.Uri -OutFile "_work/data/$($source.File)" -UseBasicParsing -Headers @{ 'Cache-Control' = 'no-cache' } -TimeoutSec 45
    Get-Item -LiteralPath "_work/data/$($source.File)" | Select-Object Name, Length
}

& 'C:\Users\queen\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -X utf8 '_work/scripts/parse-fuhwa-20261007.py' "_work/data/ETF23-$rawDate-alt.xlsx" "_work/data/ETF23-$rawDate-alt.json"
if ($LASTEXITCODE -ne 0) { throw 'Official workbook parsing failed' }
node "_work/scripts/check-$rawDate-inputs.mjs"
if ($LASTEXITCODE -ne 0) { throw 'Source validation failed' }
