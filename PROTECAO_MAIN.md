# 🔒 Proteção da Branch Main - Guia Rápido

## O que foi configurado?

✅ **Arquivo CODEOWNERS** (`.github/CODEOWNERS`)
- Define @ghrs123 como proprietário de todo o código
- Força revisão obrigatória em todos os Pull Requests

✅ **Workflow de Proteção** (`.github/workflows/branch-protection.yml`)
- Valida que PRs não vêm da branch main
- Verifica configurações de proteção
- Alerta sobre pushes diretos

✅ **Documentação Completa** (`BRANCH_PROTECTION.md`)
- Passo a passo para configurar no GitHub
- Workflow recomendado
- Solução de problemas

## 🚀 Como usar (Próximos Passos)

### 1. Configurar Proteção no GitHub (OBRIGATÓRIO)

Acesse: https://github.com/ghrs123/frontend-fix-up/settings/branches

1. Clique em "Add rule"
2. Branch name pattern: `main`
3. Marque:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1 aprovação)
   - ✅ Require status checks to pass (adicione: `validate`, `test`)
   - ✅ Include administrators
4. Salve a configuração

### 2. Workflow do Dia a Dia

```bash
# 1. Criar nova branch
git checkout -b feature/minha-funcionalidade

# 2. Fazer mudanças e commit
git add .
git commit -m "feat: adiciona nova funcionalidade"

# 3. Push da branch
git push origin feature/minha-funcionalidade

# 4. No GitHub: criar Pull Request
# 5. Aguardar CI passar
# 6. Revisar e aprovar (como @ghrs123)
# 7. Fazer merge
```

### 3. O que NÃO fazer

❌ Nunca: `git push origin main` (push direto)
❌ Nunca trabalhar diretamente na branch main localmente
❌ Nunca fazer merge sem aprovação

## ✅ Verificar se está funcionando

```bash
# Este comando deve FALHAR (branch protegida):
git checkout main
echo "teste" >> test.txt
git add test.txt
git commit -m "teste"
git push origin main
# ❌ Esperado: GitHub rejeita o push

# Este comando deve FUNCIONAR:
git checkout -b test/verificacao
git push origin test/verificacao
# ✅ Esperado: Push aceito
```

## 📚 Mais Informações

- Documentação completa: [BRANCH_PROTECTION.md](BRANCH_PROTECTION.md)
- Configuração do workflow: [.github/workflows/branch-protection.yml](.github/workflows/branch-protection.yml)
- CODEOWNERS: [.github/CODEOWNERS](.github/CODEOWNERS)

## 🆘 Ajuda

Se encontrar problemas, consulte a seção "Problemas Comuns" em [BRANCH_PROTECTION.md](BRANCH_PROTECTION.md#-problemas-comuns).
