$path = "data/countries.json"
$json = Get-Content $path -Raw | ConvertFrom-Json
$mapping = @{
    'Estados Unidos' = @{ region = 'Norteamérica'; tags = @('ciudad','cultura'); year = 2023; favorite = $true }
    'México' = @{ region = 'Norteamérica'; tags = @('playa','cultura','gastronomía'); year = 2022; favorite = $true }
    'Guatemala' = @{ region = 'Centroamérica'; tags = @('aventura','cultura'); year = 2021; favorite = $false }
    'El Salvador' = @{ region = 'Centroamérica'; tags = @('naturaleza','cultura'); year = 2024; favorite = $false }
    'Costa Rica' = @{ region = 'Centroamérica'; tags = @('naturaleza','playa'); year = 2020; favorite = $true }
    'Panamá' = @{ region = 'Centroamérica'; tags = @('cultura','playa'); year = 2021; favorite = $false }
    'Colombia' = @{ region = 'Sudamérica'; tags = @('playa','ciudad'); year = 2023; favorite = $true }
    'Perú' = @{ region = 'Sudamérica'; tags = @('historia','aventura'); year = 2022; favorite = $false }
    'Paraguay' = @{ region = 'Sudamérica'; tags = @('naturaleza','cultura'); year = 2019; favorite = $false }
    'Brasil' = @{ region = 'Sudamérica'; tags = @('playa','cultura'); year = 2023; favorite = $false }
    'Argentina' = @{ region = 'Sudamérica'; tags = @('ciudad','gastronomía'); year = 2020; favorite = $false }
    'Inglaterra' = @{ region = 'Europa'; tags = @('historia','ciudad'); year = 2024; favorite = $true }
    'Francia' = @{ region = 'Europa'; tags = @('cultura','gastronomía'); year = 2024; favorite = $false }
    'Mónaco' = @{ region = 'Europa'; tags = @('lujo','playa'); year = 2024; favorite = $false }
    'Bélgica' = @{ region = 'Europa'; tags = @('cultura','ciudad'); year = 2023; favorite = $false }
    'Países Bajos' = @{ region = 'Europa'; tags = @('cultura','ciudad'); year = 2022; favorite = $false }
    'Alemania' = @{ region = 'Europa'; tags = @('historia','ciudad'); year = 2023; favorite = $false }
    'Italia' = @{ region = 'Europa'; tags = @('historia','gastronomía'); year = 2021; favorite = $true }
    'Suiza' = @{ region = 'Europa'; tags = @('montaña','naturaleza'); year = 2020; favorite = $false }
    'Ciudad del Vaticano' = @{ region = 'Europa'; tags = @('historia','cultura'); year = 2024; favorite = $false }
    'Portugal' = @{ region = 'Europa'; tags = @('playa','cultura'); year = 2023; favorite = $false }
    'España' = @{ region = 'Europa'; tags = @('gastronomía','cultura'); year = 2022; favorite = $false }
}

$newList = $json | ForEach-Object {
    $info = $mapping[$_.name]
    [PSCustomObject]@{
        name = $_.name
        description = $_.description
        places = $_.places
        activities = $_.activities
        experiences = $_.experiences
        photos = $_.photos
        region = if ($info) { $info.region } else { 'Desconocida' }
        tags = if ($info) { $info.tags } else { @() }
        year = if ($info) { $info.year } else { 2023 }
        favorite = if ($info) { $info.favorite } else { $false }
    }
}

$newList | ConvertTo-Json -Depth 5 | Set-Content -Path $path -Encoding utf8
Write-Host 'countries.json updated successfully.'
