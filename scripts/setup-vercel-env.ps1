# Reads .env.local and uploads env vars to Vercel (after: npx vercel link)
# Usage: powershell -File scripts/setup-vercel-env.ps1

$envFile = Join-Path $PSScriptRoot ".." ".env.local" | Resolve-Path -ErrorAction SilentlyContinue
if (-not $envFile) {
  Write-Error ".env.local not found"
  exit 1
}

$vars = @(
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "AUTH_SECRET",
  "AUTH_URL"
)

$content = Get-Content $envFile -Raw
$map = @{}
foreach ($line in ($content -split "`n")) {
  $t = $line.Trim()
  if (-not $t -or $t.StartsWith("#")) { continue }
  $eq = $t.IndexOf("=")
  if ($eq -lt 1) { continue }
  $key = $t.Substring(0, $eq).Trim()
  $val = $t.Substring($eq + 1).Trim()
  $map[$key] = $val
}

Write-Host "Uploading env vars to Vercel (Production + Preview + Development)...`n"

foreach ($name in $vars) {
  if (-not $map.ContainsKey($name) -or -not $map[$name]) {
    if ($name -eq "AUTH_SECRET") {
      Write-Host "Generating new AUTH_SECRET for production..."
      $map[$name] = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    } elseif ($name -eq "AUTH_URL") {
      Write-Host "SKIP AUTH_URL — set manually after first deploy to your Vercel URL"
      continue
    } else {
      Write-Warning "Missing $name in .env.local"
      continue
    }
  }

  $value = $map[$name]
  foreach ($target in @("production", "preview", "development")) {
    Write-Host "  $name ($target)"
    $value | npx vercel env add $name $target --force 2>$null
    if ($LASTEXITCODE -ne 0) {
      Write-Warning "    failed — run: npx vercel link first"
    }
  }
}

Write-Host "`nDone. Next: npx vercel --prod"
