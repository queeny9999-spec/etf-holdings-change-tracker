$ErrorActionPreference = 'Stop'
$from = '20261021'
$to = '20261022'
$replacements = @(
    @{ From = "parse-fuhwa-$from.py"; To = "parse-fuhwa-$to.py" },
    @{ From = "check-$from-inputs.mjs"; To = "check-$to-inputs.mjs" },
    @{ From = "update-all-$from.mjs"; To = "update-all-$to.mjs" },
    @{ From = "verify-$from.mjs"; To = "verify-$to.mjs" },
    @{ From = "fetch-$from-inputs.ps1"; To = "fetch-$to-inputs.ps1" }
)
foreach ($item in $replacements) {
    $source = "_work/scripts/$($item.From)"
    $target = "_work/scripts/$($item.To)"
    if (!(Test-Path -LiteralPath $target)) {
        $content = Get-Content -LiteralPath $source -Raw
        $content = $content.Replace($from, $to).Replace('2026/10/21', '2026/10/22').Replace("'10/21'", "'10/22'").Replace("'10/20'", "'10/21'").Replace("'三'", "'四'")
        [System.IO.File]::WriteAllText((Join-Path (Get-Location) $target), $content, [System.Text.UTF8Encoding]::new($false))
    }
}
& ".\_work\scripts\fetch-$to-inputs.ps1"
