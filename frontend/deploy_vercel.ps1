$env_vars = @{
    "VITE_API_BASE_URL" = "https://pfj-path-for-job.onrender.com"
    "VITE_FIREBASE_API_KEY" = "AIzaSyBySD8sSy2fUKEaPliCQ_VBufd_g8OzlFE"
    "VITE_FIREBASE_AUTH_DOMAIN" = "pathforjob0.firebaseapp.com"
    "VITE_FIREBASE_PROJECT_ID" = "pathforjob0"
    "VITE_FIREBASE_STORAGE_BUCKET" = "pathforjob0.firebasestorage.app"
    "VITE_FIREBASE_MESSAGING_SENDER_ID" = "432034563119"
    "VITE_FIREBASE_APP_ID" = "1:432034563119:web:d38f293cbc1795f03532da"
}

$token = "vcp_30LedHon0Kepc1Ba3SvtyuQVWlXSbQ64u3dEQGoWhNV9wUe3Bh1IeoqM"
$scope = "team_APxHQwQCR6LECoVqtdGauDzV"

foreach ($key in $env_vars.Keys) {
    $value = $env_vars[$key]
    Write-Host "Adding $key to production..."
    npx vercel env add $key production --value "$value" --yes --force --scope $scope --token=$token
}

Write-Host "Triggering new production deploy..."
npx vercel --prod --yes --scope $scope --token=$token
