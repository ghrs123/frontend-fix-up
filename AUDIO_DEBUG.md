# 🔊 Debug de Áudio - Guia Completo

## ✅ Correções Aplicadas

1. **Logs detalhados** em todos os componentes
2. **Mecanismo de fallback** - tenta obter voz mesmo se não carregou
3. **Retry automático** - tenta novamente após 100ms
4. **Mensagens de erro** para o usuário

## 📋 Como Testar

### 1. Recarregue a Página
- **Ctrl+Shift+R** (limpa cache completo)

### 2. Abra o Console
- Pressione **F12**
- Vá na aba **Console**

### 3. Veja os Logs ao Carregar
Você deve ver:
```
🎤 Flashcards - Total vozes disponíveis: 15
✅ VOZ INGLÊS: Microsoft Zira | en-US
✅ VOZ PORTUGUÊS: Microsoft Maria | pt-PT
```

### 4. Clique em Ouvir (🔊)
Você deve ver:
```
🔊 Falando: hello | Idioma: en | Voz: Microsoft Zira
▶️ Iniciou
✓ Terminou
```

## ❌ Se NÃO sair som:

### Verifique os logs:
1. **"Nenhuma voz carregada ainda"**
   - Aguarde 2 segundos e tente novamente
   - As vozes podem demorar para carregar

2. **"Voz não disponível"**
   - Recarregue a página (Ctrl+Shift+R)
   - Seu navegador pode não ter vozes instaladas

3. **"Erro: ..."**
   - Copie o erro e me envie

### Teste manual no Console:
Cole este código no console:
```javascript
// Listar todas as vozes
const voices = speechSynthesis.getVoices();
console.log('Total de vozes:', voices.length);
voices.forEach(v => console.log(v.name, '-', v.lang));

// Testar fala
const u = new SpeechSynthesisUtterance('hello');
u.voice = voices.find(v => v.lang.startsWith('en'));
speechSynthesis.speak(u);
```

## 📝 Sobre Tradução de Palavras

### Por que algumas palavras não têm tradução?

A aplicação usa a **Free Dictionary API** que:
- ✅ Tem palavras comuns em inglês
- ❌ Não tem todas as palavras (técnicas, gírias, nomes próprios)
- ❌ Não tem traduções em português (só definições em inglês)

### Palavras que geralmente NÃO têm:
- Nomes próprios (John, Mary, Microsoft)
- Gírias muito recentes
- Termos técnicos muito específicos
- Palavras compostas com hífen

### Palavras que geralmente TÊM:
- Palavras comuns (hello, world, cat, dog)
- Verbos básicos (go, run, eat, sleep)
- Adjetivos comuns (big, small, happy, sad)

## 🔧 Soluções Rápidas

### Som não funciona:
1. Recarregue a página completamente (Ctrl+Shift+R)
2. Verifique se o volume do navegador não está mudo
3. Teste em modo anônimo (Ctrl+Shift+N)
4. Tente outro navegador (Chrome, Edge)

### Palavra sem tradução:
✅ **Isso é NORMAL** - nem todas as palavras estão no dicionário
- O áudio ainda deve funcionar
- A palavra aparecerá mas sem definição

### Voz em português sendo usada para inglês:
1. Recarregue a página
2. Veja os logs - deve mostrar 2 vozes diferentes
3. Teste palavras claramente em inglês (hello, world)

## 📊 Logs que Indicam Problema

❌ **Ruim:**
```
⚠️ Nenhuma voz carregada ainda
❌ Nenhuma voz disponível
```

✅ **Bom:**
```
✅ VOZ INGLÊS: Microsoft Zira | en-US
🔊 Falando: hello | Idioma: en | Voz: Microsoft Zira
▶️ Iniciou
✓ Terminou
```

## 🆘 O Que Enviar se Continuar com Problema

1. **Copie TODOS os logs** do console desde que abriu a página
2. **Diga qual página**: Flashcards? Leitura? Prática?
3. **Diga qual palavra** tentou ouvir
4. **Diga o que aconteceu**: Sem som? Voz errada? Erro?

---

**Importante:** As vozes são do seu sistema Windows/Chrome - se não tiver vozes instaladas, o áudio não funcionará.
