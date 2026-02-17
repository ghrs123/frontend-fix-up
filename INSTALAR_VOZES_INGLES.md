# 🔊 Como Instalar Vozes em Inglês no Windows

## ⚠️ PROBLEMA IDENTIFICADO

Seu Windows **NÃO tem vozes em inglês instaladas**.

O sistema encontrou apenas **5 vozes**, todas em **português**.

Por isso, ao tentar ouvir textos em inglês, o sistema estava usando voz portuguesa (que soa estranho).

## ✅ SOLUÇÃO: Instalar Vozes em Inglês

### Método 1: Configurações do Windows (Mais Fácil)

#### Windows 11:

1. **Abra Configurações** (Win + I)
2. Vá em **Hora e idioma** → **Idioma & região**
3. Clique em **Adicionar idioma**
4. Pesquise e selecione **Inglês (Estados Unidos)** ou **English (United States)**
5. Marque as opções:
   - ✅ Instalar pacote de voz
   - ✅ Conversão de texto em fala
6. Clique em **Instalar**
7. Aguarde o download (pode demorar alguns minutos)

#### Windows 10:

1. **Abra Configurações** (Win + I)
2. Vá em **Hora e Idioma** → **Idioma**
3. Clique em **Adicionar um idioma**
4. Pesquise **Inglês (Estados Unidos)**
5. Selecione e clique em **Avançar**
6. Marque:
   - ✅ Instalar pacote de voz
   - ✅ Conversão de texto em fala
7. Clique em **Instalar**

### Método 2: Verificar Vozes Já Instaladas

Pode ser que você já tenha vozes instaladas mas desabilitadas:

1. **Painel de Controle** → **Relógio e Região** → **Idioma**
2. Clique em **Opções** ao lado de "Português"
3. Verifique se há **"Conversão de texto em fala"** instalado
4. Faça o mesmo para **"English (United States)"** se estiver na lista

### Método 3: PowerShell (Avançado)

```powershell
# Abrir PowerShell como Administrador
Add-WindowsCapability -Online -Name "Language.TextToSpeech~~~en-US~0.0.1.0"
```

## 🔍 Como Verificar se Funcionou

### 1. Teste no Navegador

Abra o console (F12) e cole:

```javascript
// Listar todas as vozes
const voices = speechSynthesis.getVoices();
console.log('Total de vozes:', voices.length);
voices.forEach(v => console.log(v.name, '-', v.lang));

// Você deve ver algo como:
// Microsoft Zira Desktop - en-US
// Microsoft David Desktop - en-US
// Microsoft Aria - en-US
```

### 2. Teste na Aplicação

1. **Recarregue a página completamente** (Ctrl+Shift+R)
2. Abra o console (F12)
3. Clique no botão **Ouvir** (🔊)
4. Você deve ver:

```
🎤 ReadPage - Total vozes disponíveis: 10+
✅ ReadPage - Voz em INGLÊS selecionada: Microsoft Zira en-US
✅ Usando voz em INGLÊS: Microsoft Zira en-US
▶️ Iniciando fala...
✓ Fala iniciou
```

## 🎯 Vozes Recomendadas

O sistema vai procurar por estas vozes (em ordem de preferência):

### Vozes Google (melhor qualidade):
- Google UK English Female
- Google UK English Male
- Google US English

### Vozes Microsoft (padrão Windows):
- Microsoft Zira Desktop (feminina)
- Microsoft David Desktop (masculina)
- Microsoft Aria (feminina, mais natural)

### Vozes macOS (se usar Chrome no Mac):
- Samantha
- Daniel
- Karen

## ❌ O Que NÃO Fazer

**Antes da correção**, o sistema usava a voz portuguesa como "fallback":
- ❌ Tentava falar inglês com voz portuguesa
- ❌ Soava muito estranho e incompreensível

**Agora**, o sistema é mais rigoroso:
- ✅ **NÃO** fala se não houver voz em inglês
- ✅ Mostra mensagem clara pedindo para instalar vozes
- ✅ Lista todas as vozes disponíveis no console

## 🔧 Resolução de Problemas

### Instalei mas não aparece

1. **Reinicie o navegador** completamente (feche TODAS as abas)
2. **Reinicie o Windows** (as vozes só carregam após reiniciar)
3. Verifique se o pacote foi realmente instalado

### Ainda só aparece 5 vozes

- As 5 vozes que você tem são todas em português
- Você **precisa instalar** o pacote de idioma inglês
- Siga o **Método 1** acima

### "Failed to fetch" ou erro de API

- Isso não está relacionado às vozes - é problema de rede ou API externa
- As vozes são do Windows, funcionam offline

### Chrome não reconhece as vozes novas

```javascript
// Cole no console para forçar reload das vozes
speechSynthesis.getVoices().forEach(v => console.log(v.name));
// Se não aparecer, reabra o Chrome completamente
```

## 📚 Referências

- [Microsoft: Adicionar idiomas](https://support.microsoft.com/pt-br/windows/adicionar-e-alterar-idiomas-de-teclado-de-entrada-e-exibi%C3%A7%C3%A3o-12a10cb4-8626-9b77-0ccb-5013e0c7c7a2)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

## ✅ Checklist

Antes de testar novamente:

- [ ] Instalei o pacote de idioma inglês (Estados Unidos)
- [ ] Marquei "Conversão de texto em fala"
- [ ] Reiniciei o Windows
- [ ] Reabri o navegador
- [ ] Recarreguei a página (Ctrl+Shift+R)
- [ ] Abri o console (F12)
- [ ] Testei o botão Ouvir

---

**Após instalar as vozes**, você terá:
- 🇬🇧 Textos em inglês falados com voz inglesa
- 🇧🇷 Textos em português falados com voz portuguesa
- 🎯 Detecção automática do idioma
- ✅ Funcionamento em todos os componentes
