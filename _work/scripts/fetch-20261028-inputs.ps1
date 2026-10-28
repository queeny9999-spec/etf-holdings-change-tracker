$source = Get-Content -Raw '_work/scripts/fetch-20261022-inputs.ps1'
Invoke-Expression ($source.Replace('20261022', '20261028'))
