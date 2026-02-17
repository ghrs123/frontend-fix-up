# Configuração de Proteção da Branch Main

Este documento explica como configurar a proteção da branch `main` para garantir que apenas você (o proprietário do repositório) possa trabalhar diretamente nela.

## 🔒 Por que Proteger a Branch Main?

A proteção da branch `main` garante:
- Qualidade do código através de revisões obrigatórias
- Prevenção de commits acidentais ou não autorizados
- Histórico limpo e organizado do projeto
- Controle total sobre o que entra na branch principal

## 📋 Passos para Configurar no GitHub

### 1. Acessar as Configurações de Branch Protection

1. Acesse seu repositório no GitHub: https://github.com/ghrs123/frontend-fix-up
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Branches**
4. Na seção "Branch protection rules", clique em **Add rule** (Adicionar regra)

### 2. Configurar a Regra de Proteção

Configure a regra com as seguintes opções:

#### Branch name pattern (Padrão do nome da branch)
```
main
```

#### Proteções Recomendadas

Marque as seguintes opções:

✅ **Require a pull request before merging**
   - Isso força que todas as mudanças passem por um Pull Request
   - ✅ Marque também: "Require approvals" e defina para 1 aprovação
   - ✅ Marque: "Dismiss stale pull request approvals when new commits are pushed"

✅ **Require status checks to pass before merging**
   - Se você tiver CI/CD configurado, isso garante que os testes passem
   - ✅ Marque: "Require branches to be up to date before merging"
   - Adicione os checks necessários:
     - `test` (do workflow CI - .github/workflows/ci.yml)
     - `validate` (do workflow Branch Protection - .github/workflows/branch-protection.yml)

✅ **Require conversation resolution before merging**
   - Garante que todos os comentários foram resolvidos

✅ **Require signed commits** (Opcional, mas recomendado)
   - Aumenta a segurança exigindo commits assinados

✅ **Require linear history** (Opcional)
   - Mantém um histórico mais limpo sem merge commits

✅ **Include administrators**
   - **IMPORTANTE**: Marque esta opção para que as regras se apliquem também a você
   - Isso garante que você mesmo não possa fazer push direto na main

✅ **Restrict who can push to matching branches**
   - Clique em "Restrict pushes"
   - Deixe vazio ou adicione apenas seu usuário (@ghrs123)
   - Isso restringe quem pode fazer push direto (normalmente ninguém deveria)

✅ **Allow force pushes** - DEIXE DESMARCADO
   - Isso previne reescrita de histórico

✅ **Allow deletions** - DEIXE DESMARCADO
   - Isso previne a deleção acidental da branch

### 3. Salvar a Configuração

Clique em **Create** (Criar) ou **Save changes** (Salvar alterações) no final da página.

## 🔐 CODEOWNERS

Este repositório já possui um arquivo `.github/CODEOWNERS` que define você (@ghrs123) como o proprietário de todo o código. Isso significa que:

- Todos os Pull Requests automaticamente solicitarão sua revisão
- Nenhum PR pode ser mergeado sem sua aprovação

## 🚀 Workflow de Desenvolvimento

Com a proteção configurada, o workflow recomendado é:

### Para Você (Owner)

1. **Criar uma branch** para cada nova feature ou correção:
   ```bash
   git checkout -b feature/nova-funcionalidade
   ```

2. **Fazer commits** na branch:
   ```bash
   git add .
   git commit -m "Adiciona nova funcionalidade"
   git push origin feature/nova-funcionalidade
   ```

3. **Criar um Pull Request** no GitHub
   - Vá para o repositório no GitHub
   - Clique em "Pull requests" → "New pull request"
   - Selecione sua branch e clique em "Create pull request"

4. **Aguardar CI/CD** passar (se configurado)

5. **Revisar e aprovar** seu próprio PR (se permitido nas configurações)

6. **Fazer merge** do PR para a main

### Para Outros Colaboradores (se houver)

1. **Fork** o repositório (ou criar branch se tiverem acesso)
2. **Criar Pull Request** com as mudanças
3. **Aguardar sua aprovação** (@ghrs123)
4. Você revisa e faz merge se aprovar

## 🛡️ Proteções Adicionais

### GitHub Actions Workflow

O arquivo `.github/workflows/ci.yml` já está configurado para:
- Executar testes em todos os PRs
- Fazer deploy automático para GitHub Pages quando houver push na main
- Validar código com typecheck, lint e testes

### Configuração Local do Git

Para evitar commits acidentais na main localmente, você pode adicionar um git hook:

```bash
# Criar um pre-push hook
echo '#!/bin/bash
branch=$(git symbolic-ref --short HEAD)
if [ "$branch" = "main" ]; then
  echo "❌ Push direto para main não é permitido!"
  echo "Por favor, crie uma branch e um Pull Request."
  exit 1
fi
' > .git/hooks/pre-push

chmod +x .git/hooks/pre-push
```

## ✅ Verificar Configuração

Após configurar, você pode verificar se está funcionando:

1. Tente fazer push direto para main:
   ```bash
   git checkout main
   echo "teste" >> test.txt
   git add test.txt
   git commit -m "teste"
   git push origin main
   ```
   Deve ser bloqueado pelo GitHub.

2. Crie um PR e verifique se as verificações obrigatórias aparecem.

## 📚 Recursos Adicionais

- [Documentação GitHub - Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Documentação GitHub - CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [GitHub Actions - Workflows](https://docs.github.com/en/actions/using-workflows)

## 🆘 Problemas Comuns

### "Não consigo fazer merge do meu próprio PR"
- Verifique se você tem permissões de admin no repositório
- Verifique se marcou "Include administrators" nas regras de proteção
- Certifique-se de que os status checks estão passando

### "Os checks de CI não aparecem no PR"
- Verifique se o arquivo `.github/workflows/ci.yml` está na branch main
- Verifique se as GitHub Actions estão habilitadas no repositório
- Pode levar alguns minutos para o primeiro workflow aparecer

### "Preciso fazer um hotfix urgente"
- Se necessário, você pode temporariamente desabilitar a proteção
- Faça o fix
- Reabilite a proteção imediatamente
- Melhor prática: ainda assim, use um PR mesmo para hotfixes
