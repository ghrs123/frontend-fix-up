# ✅ PROBLEMA DOS SEEDS CORRIGIDO

## O Erro que Você Recebeu

```
ERROR: 21000: ON CONFLICT DO UPDATE command cannot affect row a second time
HINT: Ensure that no rows proposed for insertion within the same command have duplicate constrained values.
```

## A Causa

Os arquivos de seed de vocabulário usavam:

```sql
ON CONFLICT (word) DO UPDATE SET
  translation = EXCLUDED.translation,
  ...
```

Quando há **palavras duplicadas no mesmo INSERT**, o PostgreSQL não permite fazer UPDATE múltiplos na mesma linha, causando o erro.

## A Solução ✅

Mudei todas as ocorrências para:

```sql
ON CONFLICT (word) DO NOTHING;
```

Agora, se houver duplicatas:
- ✅ A primeira ocorrência será inserida
- ✅ Duplicatas serão ignoradas (sem erro)
- ✅ O comando é executado com sucesso

## Arquivos Corrigidos

1. ✅ **seed.sql** (arquivo consolidado) - 13 ocorrências corrigidas
2. ✅ **Todos os arquivos vocabulary*.sql** individuais (13 arquivos) - corrigidos na origem

## Agora Você Pode Aplicar os Seeds

### MÉTODO RECOMENDADO: SQL Editor

1. **Abrir SQL Editor**:
   - Acesse: https://supabase.com/dashboard/project/trcnlengiehlzoxekijd/sql/new

2. **Copiar e Executar**:
   - Abra: `supabase\seed.sql`
   - Selecione TUDO (Ctrl+A)
   - Copie (Ctrl+C)
   - Cole no SQL Editor (Ctrl+V)
   - Clique em **"Run"** ou pressione Ctrl+Enter

3. **Aguardar**:
   - A execução pode levar 10-30 segundos
   - Você verá mensagens de sucesso

4. **Verificar**:
   - Vá em **Table Editor**: https://supabase.com/dashboard/project/trcnlengiehlzoxekijd/editor
   - Verifique as tabelas:
     - `grammar_topics` - deve ter ~12 registros
     - `texts` - deve ter vários registros por nível
     - `vocabulary` - deve ter centenas de palavras

### MÉTODO ALTERNATIVO: Via CLI

```powershell
supabase db push --include-seed --yes
```

**Nota**: Este método pode funcionar agora que o erro SQL foi corrigido.

## Resultado Esperado

Após executar com sucesso, você verá:

```
Seeding data from supabase/seed.sql...
✅ Seed data applied successfully
```

E as tabelas no Supabase estarão populadas com:
- 📚 12 tópicos de gramática
- 📖 Textos de leitura (beginner, intermediate, advanced)
- 📝 Centenas de palavras de vocabulário

## Próximos Passos

1. ✅ Seeds corrigidos
2. 🔲 **EXECUTAR seeds no SQL Editor** ← FAZ AGORA!
3. 🔲 Verificar dados no Table Editor
4. 🔲 Testar aplicação frontend
5. 🔲 Remover mocks (se necessário)
6. 🔲 Testar login Google/GitHub

---

**Data da correção**: 2026-02-12 02:11
**Arquivos afetados**: seed.sql + 13 arquivos vocabulary*.sql
