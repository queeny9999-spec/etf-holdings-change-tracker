$ErrorActionPreference = 'Stop'
$u = 'https://www.twse.com.tw/rwd/zh/afterTrading/MI_INDEX?response=json&date=20261113&type=ALLBUT0999'
Invoke-WebRequest -Uri $u -OutFile '_work/data/twse-mi-index-20261113.json' -UseBasicParsing -Headers @{ 'Cache-Control' = 'no-cache'; 'User-Agent' = 'Mozilla/5.0' }
Get-Item '_work/data/twse-mi-index-20261113.json' | Select-Object Name, Length
$source = Get-Content -Raw '_work/scripts/fetch-20261022-inputs.ps1'
Invoke-Expression ($source.Replace('20261022', '20261113'))
