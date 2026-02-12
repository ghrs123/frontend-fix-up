# Script para executar seeds individuais via SQL Editor
# Gerado automaticamente

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  RESUMO: Por que os seeds nao funcionaram" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "[PROBLEMA] O comando 'supabase db query' NAO EXISTE" -ForegroundColor Red
Write-Host ""
Write-Host "Voce executou:" -ForegroundColor White
Write-Host "  Get-Content *.sql | supabase db query" -ForegroundColor Gray
Write-Host ""
Write-Host "Mas esse comando nao existe na Supabase CLI!" -ForegroundColor Red
Write-Host ""
Write-Host "Comandos disponiveis:" -ForegroundColor White
Write-Host "  - supabase db diff" -ForegroundColor Gray
Write-Host "  - supabase db dump" -ForegroundColor Gray
Write-Host "  - supabase db pull" -ForegroundColor Gray
Write-Host "  - supabase db push" -ForegroundColor Gray
Write-Host "  - supabase db reset" -ForegroundColor Gray
Write-Host "  - supabase db start" -ForegroundColor Gray
Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  SOLUCAO: Como executar os seeds" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Green
Write-Host ""
Write-Host "OPCAO 1 - SQL Editor (RECOMENDADO)" -ForegroundColor Yellow
Write-Host "  1. Abra: https://supabase.com/dashboard/project/trcnlengiehlzoxekijd/sql/new" -ForegroundColor Cyan
Write-Host "  2. Copie o conteudo do arquivo: supabase\seed.sql" -ForegroundColor White
Write-Host "  3. Cole no SQL Editor" -ForegroundColor White
Write-Host "  4. Clique em 'Run'" -ForegroundColor White
Write-Host ""
Write-Host "OPCAO 2 - Via CLI (pode dar erro)" -ForegroundColor Yellow
Write-Host "  Execute: supabase db push --include-seed --yes" -ForegroundColor Cyan
Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[INFO] Arquivo consolidado já está criado em:" -ForegroundColor Green
Write-Host "       supabase\seed.sql" -ForegroundColor White
Write-Host ""
Write-Host "Deseja abrir a URL do SQL Editor? [S/N]" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq 'S' -or $response -eq 's') {
    Start-Process "https://supabase.com/dashboard/project/trcnlengiehlzoxekijd/sql/new"
    Write-Host ""
    Write-Host "[OK] Navegador aberto!" -ForegroundColor Green
    Write-Host "     Agora copie o conteudo de supabase\seed.sql e cole no editor." -ForegroundColor White
}

Write-Host ""
Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
