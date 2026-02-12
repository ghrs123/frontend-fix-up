# Supabase - Documentação de Integração

## O que é Supabase?
Supabase é uma plataforma backend open source que oferece autenticação, banco de dados PostgreSQL, armazenamento de arquivos e APIs em tempo real. Ele facilita o desenvolvimento de aplicações web/mobile, fornecendo serviços prontos para uso.

## Como integrar Supabase ao seu projeto

### 1. Criação do Projeto
- Acesse https://app.supabase.com
- Crie um novo projeto, defina o nome, senha do banco e região.
- Aguarde a provisão do projeto.

### 2. Configuração das variáveis de ambiente
No arquivo `.env` do seu frontend, adicione:
```
VITE_SUPABASE_URL=<Project URL>
VITE_SUPABASE_PUBLISHABLE_KEY=<Publishable API Key>
```
Esses valores são encontrados no painel do Supabase após criar o projeto.

### 3. Inicialização no código
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
```

### 4. Autenticação OAuth (Google/GitHub)
- Ative o provedor desejado em Authentication > Settings > OAuth Providers.
- Insira o Client ID e Client Secret obtidos do Google Cloud Console ou GitHub.
- Adicione o Callback URL do Supabase nas configurações do provedor.

### 5. Uso de funcionalidades
- Autenticação: login, registro, OAuth.
- Banco de dados: consultas, inserções, atualizações.
- Storage: upload/download de arquivos.
- Realtime: escuta de eventos no banco.

### 6. Segurança
- Use Row Level Security (RLS) para proteger dados.
- Nunca exponha a chave secreta do Supabase no frontend.

---
Se precisar de exemplos práticos ou documentação avançada, consulte https://supabase.com/docs ou peça mais detalhes!
