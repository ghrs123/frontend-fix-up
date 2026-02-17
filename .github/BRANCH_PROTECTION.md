# Branch Protection for Main

Este documento descreve as configurações recomendadas para proteger a branch `main` no GitHub.

## 🔒 Por que Proteger a Main?

Proteger a branch principal é uma prática recomendada que:
- Previne pushes diretos acidentais
- Garante que todo código passe por revisão (Pull Requests)
- Assegura que os testes e CI passem antes do merge
- Mantém um histórico limpo e auditável

## ⚙️ Configurações Recomendadas

Para configurar a proteção da branch `main` no GitHub:

### 1. Acessar Configurações de Branch Protection

1. Acesse o repositório no GitHub
2. Vá em **Settings** → **Branches**
3. Clique em **Add branch protection rule** ou edite a regra existente

### 2. Configurações Básicas

**Branch name pattern:** `main`

### 3. Regras de Proteção Recomendadas

#### ✅ Require a pull request before merging
- **Obrigatório**: Exige que todas as mudanças sejam feitas via Pull Request
- **Opções recomendadas:**
  - ✅ Require approvals: **1** (pelo menos uma aprovação)
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from Code Owners (se usar CODEOWNERS)

#### ✅ Require status checks to pass before merging
- **Obrigatório**: Garante que o CI passe antes do merge
- **Status checks requeridos:**
  - `Lint, Test, Build` (do workflow CI)
  - Marque ✅ **Require branches to be up to date before merging**

#### ✅ Require conversation resolution before merging
- **Recomendado**: Garante que todos os comentários sejam resolvidos

#### ✅ Require signed commits (Opcional)
- **Opcional mas recomendado**: Aumenta a segurança verificando assinaturas

#### ✅ Require linear history (Opcional)
- **Opcional**: Força uso de rebase ou squash merge para histórico linear

#### ⚠️ Do not allow bypassing the above settings
- **Importante**: Não permite que administradores pulem as regras
- Desmarque esta opção se precisar de emergências

#### 🔒 Restrict pushes that create matching branches
- **Recomendado**: Restringe quem pode criar branches que correspondem ao padrão
- Deixe vazio para permitir que todos criem branches

### 4. Outras Configurações

#### Rules applied to everyone including administrators
- ✅ **Recomendado**: As regras se aplicam a todos, incluindo admins

#### Allow force pushes
- ❌ **Não recomendado**: Mantenha desabilitado para proteger o histórico

#### Allow deletions
- ❌ **Não recomendado**: Mantenha desabilitado para evitar deleção acidental

## 📋 Resumo das Configurações

```yaml
Branch: main

✅ Require pull request reviews
   - Required approvals: 1
   - Dismiss stale reviews: true

✅ Require status checks
   - Required checks: "Lint, Test, Build"
   - Require branches up to date: true

✅ Require conversation resolution: true

❌ Allow force pushes: false
❌ Allow deletions: false
```

## 🚀 Workflow Atual

O repositório já tem um workflow CI configurado em `.github/workflows/ci.yml` que:
1. Executa em todos os Pull Requests
2. Roda typecheck, lint, test e build
3. Bloqueia merge se falhar

## 👥 CODEOWNERS

Foi criado um arquivo `.github/CODEOWNERS` que define revisores automáticos.
Quando configurado com branch protection, garante que o code owner aprove mudanças.

## 🤖 Usando o Script Automático

O script `.github/apply-branch-protection.sh` já possui permissões de execução (+x).
Se necessário, você pode adicionar permissões com:

```bash
chmod +x .github/apply-branch-protection.sh
```

Então execute:

```bash
.github/apply-branch-protection.sh
```

## 🔗 Recursos

- [GitHub Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Requiring status checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-status-checks-before-merging)
- [CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)

## 📝 Notas

- As configurações devem ser aplicadas manualmente via interface do GitHub
- Não é possível configurar branch protection via código no repositório
- Administradores do repositório podem fazer as configurações em Settings → Branches
