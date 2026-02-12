# 🚀 Quickstart: Google Gemini (GRATUITO)

## 📋 Configuração em 3 Minutos

### 1️⃣ Obter API Key Gratuita

1. Acesse: **https://aistudio.google.com/app/apikey**
2. Faça login com sua conta Google
3. Clique em **"Get API key"** ou **"Create API key"**
4. Copie a chave (formato: `AIza...`)

---

### 2️⃣ Configurar no Supabase

Abra o PowerShell e execute:

```powershell
# Definir provedor como Gemini
supabase secrets set AI_PROVIDER=gemini

# Configurar chave da API (substitua pela sua)
supabase secrets set GEMINI_API_KEY=AIzaSyC...
```

---

### 3️⃣ Redeploy da Função

```powershell
supabase functions deploy generate-practice
```

**Aguarde** a mensagem: `Deployed Functions on project...`

---

### 4️⃣ Verificar Configuração

```powershell
supabase secrets list
```

**Deve aparecer:**
- ✅ `AI_PROVIDER`
- ✅ `GEMINI_API_KEY`

---

### 5️⃣ Testar na Aplicação

1. **Login** na aplicação
2. **Adicione flashcards** (mínimo 5 palavras):
   - Vá em Flashcards
   - Clique em "Importar Vocabulário"
   - Selecione palavras
   - Importe

3. **Gerar exercícios**:
   - Vá em Prática → Exercícios com IA
   - Selecione tipo e dificuldade
   - Clique em "Gerar Exercícios"

**✅ Sucesso!** Se aparecer 5 exercícios, está funcionando!

---

## ⚠️ Troubleshooting

### "A função de IA não está configurada"
```powershell
# Verificar se secrets foram configurados
supabase secrets list

# Redeployar função
supabase functions deploy generate-practice
```

### "Precisas de ter flashcards"
- Adicione pelo menos 5 flashcards antes de gerar exercícios
- Vá em Flashcards → Importar Vocabulário

### "Erro ao gerar exercícios"
```powershell
# Ver logs da função
supabase functions logs generate-practice

# Verificar se API key é válida
# Acesse: https://aistudio.google.com/app/apikey
```

---

## 📊 Limites Gratuitos

**Google Gemini (Tier Gratuito):**
- ✅ 15 requisições por minuto
- ✅ 1500 requisições por dia
- ✅ Sem necessidade de cartão de crédito
- ✅ Suficiente para uso pessoal/estudos

**Cada geração de exercício = 1 requisição**

---

## 🔄 Trocar para Outro Provedor

### OpenAI (ChatGPT):
```powershell
supabase secrets set AI_PROVIDER=openai
supabase secrets set OPENAI_API_KEY=sk-proj-...
supabase functions deploy generate-practice
```

### Lovable:
```powershell
supabase secrets set AI_PROVIDER=lovable
supabase secrets set LOVABLE_API_KEY=...
supabase functions deploy generate-practice
```

---

## ✅ Checklist

- [ ] Conta Google criada
- [ ] API Key do Gemini obtida
- [ ] `AI_PROVIDER=gemini` configurado
- [ ] `GEMINI_API_KEY` configurado
- [ ] Função redeployada
- [ ] Secrets verificados
- [ ] Flashcards adicionados (5+)
- [ ] Teste realizado

---

**Data**: 2026-02-12  
**Tempo estimado**: 3-5 minutos  
**Custo**: 100% Gratuito 💰
