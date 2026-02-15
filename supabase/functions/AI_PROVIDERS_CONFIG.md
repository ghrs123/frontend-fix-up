# Configuração de AI Providers

Este documento explica como configurar os diferentes provedores de IA (OpenAI, Gemini, Lovable) nas Edge Functions do Supabase.

## 🔧 Variáveis de Ambiente

Todas as funções agora suportam **3 provedores de IA**:

### 1. OpenAI (Recomendado) ⭐

**Vantagens:**
- Qualidade superior
- Streaming nativo
- JSON mode confiável
- Suporte a function calling

**Configuração:**
```bash
# No Supabase Dashboard > Project Settings > Edge Functions > Secrets
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```

**Modelos disponíveis:**
- `gpt-4o-mini` (padrão, rápido e económico)
- `gpt-4o` (melhor qualidade, mais caro)
- `gpt-4-turbo`

**Custo estimado:**
- gpt-4o-mini: ~$0.15 / 1M tokens input, ~$0.60 / 1M tokens output
- gpt-4o: ~$2.50 / 1M tokens input, ~$10.00 / 1M tokens output

### 2. Google Gemini (Gratuito) 🆓

**Vantagens:**
- Gratuito até 15 RPM (requests per minute)
- 1 milhão de tokens/dia grátis
- Boa qualidade

**Limitações:**
- Limite de 15 pedidos/minuto (tier gratuito)
- Streaming menos robusto

**Configuração:**
```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxx
```

**Como obter API key:**
1. Aceder a https://aistudio.google.com/app/apikey
2. Criar nova API key
3. Copiar e adicionar ao Supabase

**Modelos disponíveis:**
- `gemini-1.5-flash` (padrão, rápido)
- `gemini-1.5-pro` (melhor qualidade)
- `gemini-2.0-flash-exp` (experimental)

### 3. Lovable Gateway (Original)

**Vantagens:**
- Integração original do projeto
- Usa créditos Lovable

**Limitações:**
- Depende de créditos Lovable
- Menos controlo sobre modelos

**Configuração:**
```bash
AI_PROVIDER=lovable
LOVABLE_API_KEY=your_lovable_key
```

**Modelo usado:**
- `google/gemini-1.5-flash` (CORRIGIDO de `gemini-3-flash-preview`)

## 📋 Funções e Comportamento

### ai-chat (Conversação)
- **OpenAI**: Streaming SSE nativo
- **Gemini**: Resposta convertida para SSE
- **Lovable**: Streaming SSE nativo

### generate-practice (Exercícios)
- **OpenAI**: JSON mode + response_format
- **Gemini**: responseMimeType: "application/json"
- **Lovable**: Function calling com schema

### review-writing (Correção de Textos)
- **OpenAI**: JSON mode + response_format
- **Gemini**: responseMimeType: "application/json"
- **Lovable**: Function calling com schema

### translate-definition (Tradução)
- **OpenAI**: JSON mode + response_format
- **Gemini**: responseMimeType: "application/json"
- **Lovable**: Function calling com schema

## 🚀 Como Configurar no Supabase

### Via Dashboard (Recomendado)

1. Aceder ao Supabase Dashboard
2. Ir para **Project Settings** > **Edge Functions**
3. Na secção **Secrets**, adicionar:
   - `AI_PROVIDER` (valor: `openai`, `gemini` ou `lovable`)
   - `OPENAI_API_KEY` (se usar OpenAI)
   - `GEMINI_API_KEY` (se usar Gemini)
   - `LOVABLE_API_KEY` (se usar Lovable)

### Via CLI

```bash
# Configurar provider
supabase secrets set AI_PROVIDER=openai

# Configurar API keys
supabase secrets set OPENAI_API_KEY=sk-proj-xxxxx
supabase secrets set GEMINI_API_KEY=AIzaSyxxxxx
supabase secrets set LOVABLE_API_KEY=your_key
```

## 🔄 Mudança de Provider

Para mudar de provider, basta alterar a variável `AI_PROVIDER`:

```bash
# Mudar para OpenAI
supabase secrets set AI_PROVIDER=openai

# Mudar para Gemini (gratuito)
supabase secrets set AI_PROVIDER=gemini

# Mudar para Lovable
supabase secrets set AI_PROVIDER=lovable
```

**Nota:** Não é necessário reiniciar as funções. As alterações são aplicadas na próxima invocação.

## 💡 Recomendações

### Para Desenvolvimento/Testes
- **Gemini** (gratuito, 15 RPM suficiente para testes)

### Para Produção (Baixo Volume)
- **Gemini** (gratuito até 1M tokens/dia)

### Para Produção (Alto Volume)
- **OpenAI gpt-4o-mini** (melhor custo-benefício)

### Para Máxima Qualidade
- **OpenAI gpt-4o** (mais caro, melhor qualidade)

## 🐛 Troubleshooting

### Erro: "OPENAI_API_KEY not configured"
- Verificar se a variável está definida no Supabase
- Verificar se `AI_PROVIDER=openai`

### Erro: "Rate limit exceeded" (Gemini)
- Limite de 15 RPM no tier gratuito
- Considerar upgrade ou mudar para OpenAI

### Erro: "No content in response"
- Verificar logs da função: `supabase functions logs <function-name>`
- Verificar se a API key é válida

### Erro: "AI gateway error" (Lovable)
- Verificar créditos Lovable
- Verificar se o modelo está correto (`gemini-1.5-flash`)

## 📊 Comparação de Custos

| Provider | Modelo | Custo (1M tokens) | Limite Gratuito |
|----------|--------|-------------------|-----------------|
| Gemini | gemini-1.5-flash | Grátis | 15 RPM, 1M tokens/dia |
| OpenAI | gpt-4o-mini | ~$0.15-0.60 | Nenhum |
| OpenAI | gpt-4o | ~$2.50-10.00 | Nenhum |
| Lovable | gemini-1.5-flash | Créditos Lovable | Depende do plano |

## 🔐 Segurança

- **NUNCA** commitar API keys no código
- Usar sempre variáveis de ambiente
- Rodar as keys periodicamente
- Monitorizar uso para detetar abusos
