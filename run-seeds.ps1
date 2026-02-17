# Script para executar todos os seeds no banco Supabase
# Este script consolida todos os arquivos SQL e os executa no banco de dados

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Executando Seeds no Banco Supabase" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# Obtém todos os arquivos SQL da pasta seeds, ordenados por nome
$seedFiles = Get-ChildItem "$PSScriptRoot\supabase\seeds\*.sql" | Sort-Object Name

if ($seedFiles.Count -eq 0) {
    Write-Host "[ERRO] Nenhum arquivo de seed encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Encontrados $($seedFiles.Count) arquivos de seed" -ForegroundColor Green
Write-Host ""

# Cria um arquivo temporário consolidado
$consolidatedFile = "$PSScriptRoot\supabase\seed.sql"
$consolidatedContent = @"
-- ===================================================================
-- Seeds consolidados - Gerado automaticamente
-- Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- ===================================================================

"@

foreach ($file in $seedFiles) {
    Write-Host "  -> Adicionando: $($file.Name)" -ForegroundColor Yellow
    
    $consolidatedContent += @"

-- -------------------------------------------------------------------
-- Arquivo: $($file.Name)
-- -------------------------------------------------------------------

"@
    
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Corrigir ON CONFLICT se necessário
    if ($content -match 'ON CONFLICT \(word\) DO UPDATE SET') {
        $content = $content -replace 'ON CONFLICT \(word\) DO UPDATE SET[^\;]+\;', 'ON CONFLICT (word) DO NOTHING;'
    }
    
    $consolidatedContent += $content + "`r`n"
}

# Salva o arquivo consolidado com encoding UTF-8
[System.IO.File]::WriteAllText($consolidatedFile, $consolidatedContent, [System.Text.Encoding]::UTF8)

Write-Host ""
Write-Host "[OK] Arquivo consolidado criado: supabase\seed.sql" -ForegroundColor Green
Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Proximos Passos" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "OPÇÃO 1 - Via Supabase CLI (Recomendado):" -ForegroundColor White
Write-Host "  1. Execute: " -NoNewline -ForegroundColor White
Write-Host "supabase db push --include-seed" -ForegroundColor Green
Write-Host ""
Write-Host "OPÇÃO 2 - Via SQL Editor (Manual):" -ForegroundColor White
Write-Host "  1. Acesse: https://supabase.com/dashboard/project/tjduhugyqcaiygexpptp/sql" -ForegroundColor Cyan
Write-Host "  2. Abra o arquivo: supabase\seed.sql" -ForegroundColor White
Write-Host "  3. Copie todo o conteúdo e execute no SQL Editor" -ForegroundColor White
Write-Host ""
Write-Host "OPÇÃO 3 - Via psql (Se instalado):" -ForegroundColor White
Write-Host "  Execute o comando que será exibido depois de obter a connection string" -ForegroundColor White
Write-Host ""
