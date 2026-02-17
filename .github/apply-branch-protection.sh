#!/bin/bash
# Script para aplicar proteção à branch main usando GitHub CLI
# Requer: gh (GitHub CLI) instalado e autenticado
#
# Nota: Este script já possui permissões de execução (+x)
# Se necessário, adicione permissões: chmod +x .github/apply-branch-protection.sh
#
# Uso: .github/apply-branch-protection.sh

set -e

REPO="ghrs123/frontend-fix-up"
BRANCH="main"

echo "🔒 Aplicando proteção à branch $BRANCH no repositório $REPO..."

# Verifica se gh CLI está instalado
if ! command -v gh &> /dev/null; then
    echo "❌ Erro: GitHub CLI (gh) não está instalado."
    echo "Instale em: https://cli.github.com/"
    exit 1
fi

# Verifica autenticação
if ! gh auth status &> /dev/null; then
    echo "❌ Erro: Não autenticado no GitHub CLI."
    echo "Execute: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI está instalado e autenticado"

# Aplica branch protection usando a API do GitHub
echo ""
echo "📋 Configurando branch protection rules..."

# Nota: O GitHub CLI não tem comando direto para branch protection
# Usando a API REST diretamente
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/$REPO/branches/$BRANCH/protection" \
  --input .github/branch-protection-config.json

echo ""
echo "✅ Proteção aplicada com sucesso!"
echo ""
echo "📖 Configurações aplicadas:"
echo "   - Pull Requests obrigatórios"
echo "   - Mínimo de 1 aprovação"
echo "   - Status checks obrigatórios (CI deve passar)"
echo "   - Revisão do Code Owner"
echo "   - Conversas devem ser resolvidas"
echo "   - Force pushes desabilitados"
echo "   - Deleção da branch desabilitada"
echo ""
echo "🔍 Visualize as regras em:"
echo "   https://github.com/$REPO/settings/branches"
