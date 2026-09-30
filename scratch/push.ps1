$files = git ls-files -m -o --exclude-standard
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Adding $file"
        git add $file
        git commit -m "Update $file"
        git push
    }
}
