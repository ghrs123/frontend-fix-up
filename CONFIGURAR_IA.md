# ⚙️ Configuração da IA para Exercícios

## Problema

A funcionalidade de **geração de exercícios com IA** requer configuração de uma API de IA.

## ✅ Opções Disponíveis

Agora suporta **3 provedores de IA**:

### 🟢 Opção 1: Google Gemini (RECOMENDADO - GRATUITO)

**Vantagens:**
- ✅ **Totalmente gratuito** até 15 requisições/minuto
- ✅ Boa qualidade de resposta
- ✅ Fácil de configurar

**Como Configurar:**

1. **Obter API Key**:
   - Acesse: https://aistudio.google.com/app/apikey
   - Clique em "Get API key" ou "Create API key"
   - Copie a chave

2. **Configurar no Supabase**:
   ```bash
   supabase secrets set AI_PROVIDER=gemini
   supabase secrets set GEMINI_API_KEY=SUA_CHAVE_AQUI
   ```

3. **Redeploy da função**:
   ```bash
   supabase functions deploy generate-practice
   ```

---

### 🔵 Opção 2: OpenAI (ChatGPT)

**Vantagens:**
- ✅ Melhor qualidade de resposta
- ✅ Modelo gpt-4o-mini é barato (~$0.15/1M tokens)
- ✅ Amplamente testado

**Desvantagens:**
- ❌ Requer pagamento (mas muito barato)

**Como Configurar:**

1. **Obter API Key**:
   - Acesse: https://platform.openai.com/api-keys
   - Crie uma conta (se necessário)
   - Adicione créditos (mínimo $5)
   - Crie uma nova API key

2. **Configurar no Supabase**:
   ```bash
   supabase secrets set AI_PROVIDER=openai
   supabase secrets set OPENAI_API_KEY=sk-proj-...
   ```

3. **Redeploy da função**:
   ```bash
   supabase functions deploy generate-practice
   ```

**Modelos disponíveis:**
- `gpt-4o-mini` - Rápido e barato (recomendado)
- `gpt-4o` - Melhor qualidade, mais caro
- `gpt-3.5-turbo` - Mais barato, qualidade ok

---

### 🟣 Opção 3: Lovable (Original)

**Como Configurar:**

1. **Obter API Key**:
   - Acesse: https://lovable.dev
   - Vá em Settings → API Keys
   - Gere uma nova chave

2. **Configurar no Supabase**:
   ```bash
   supabase secrets set AI_PROVIDER=lovable
   supabase secrets set LOVABLE_API_KEY=SUA_CHAVE_AQUI
   ```

3. **Redeploy da função**:
   ```bash
   supabase functions deploy generate-practice
   ```

---

## 🚀 Quickstart (Google Gemini - Gratuito)

```bash
# 1. Obter chave em: https://aistudio.google.com/app/apikey

# 2. Configurar
supabase secrets set AI_PROVIDER=gemini
supabase secrets set GEMINI_API_KEY=SUA_CHAVE_AQUI

# 3. Deploy
supabase functions deploy generate-practice

# 4. Verificar
supabase secrets list
```

---

## Como Testar

Após configurar a chave:

1. **Login na aplicação**
2. **Adicione alguns flashcards** (mínimo 5 palavras)
3. **Vá em Prática → Exercícios com IA**
4. **Selecione tipo e dificuldade**
5. **Clique em "Gerar Exercícios"**

**Esperado**: Geração de 5 exercícios personalizados com base nos seus flashcards

---

## Requisitos

- ✅ Usuário autenticado
- ✅ Mínimo 5 flashcards ativos
- ❌ `LOVABLE_API_KEY` configurada
- ✅ Edge Function deployada

---

## Erros Comuns

### "A função de IA não está configurada"
- **Causa**: Edge Function não deployada ou secret não configurado
- **Solução**: Deploy da função e configurar `LOVABLE_API_KEY`

### "Precisas de ter flashcards para gerar exercícios"
- **Causa**: Usuário não tem flashcards
- **Solução**: Importar vocabulário base e criar flashcards

### "Créditos AI esgotados"
- **Causa**: Limite de API excedido
- **Solução**: Aguardar renovação ou usar outro plano

---

## Alternativa Sem Custo

Se não quiser usar API paga, pode:

1. **Gerar exercícios manualmente** (sem IA)
2. **Usar templates predefinidos** baseados em dificuldade
3. **Implementar geração local simples** (sem IA avançada)

---

**Última atualização**: 2026-02-12
