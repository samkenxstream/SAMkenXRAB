# Get the list of APIs to migrate.
$apis = Get-Content apis/apis.json | ConvertFrom-Json
$candidateApis = $apis.apis | Where-Object {
     $_.type -eq "grpc" -and $_.autoGenerator -ne "OwlBot"
}

foreach ($api in $candidateApis) {
    # Check out a new branch for this API.
    $apiId = $api.id
    $branch = "owlbot-$apiId"
    git checkout -b $branch
    if ($LASTEXITCODE) {
        Write-Debug "Failed to create branch $branch.  I assume it already exists."
        continue;
    }

    # Set autoGenerator to OwlBot
    $api | Add-Member -NotePropertyName autoGenerator -NotePropertyValue "OwlBot"
    try {
        # Write the change
        ConvertTo-Json -Depth 100 $apis | Out-File apis/apis.json -Encoding utf8
    } finally {
        $api.PSObject.Properties.Remove('autoGenerator')
    }

    dotnet run -p tools/Google.Cloud.Tools.ReleaseManager generate-projects $apiId

    break;
}


