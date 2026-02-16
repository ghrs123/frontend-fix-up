# English Study App

Uma aplicação completa para aprender inglês, construída com React, TypeScript, Tailwind CSS e Supabase.

## 🚀 Funcionalidades

### Para Estudantes
- **📖 Leitura Interativa**: Leia textos em inglês e clique nas palavras para ver definições
- **🃏 Flashcards**: Memorize vocabulário com repetição espaçada (algoritmo SM2)
- **📚 Gramática**: Aprenda regras gramaticais com explicações em português e inglês
- **🏆 Quiz**: Teste os seus conhecimentos com questões interativas
- **✍️ Prática**: Exercícios de tradução, escrita e compreensão
- **📊 Progresso**: Acompanhe o seu progresso de aprendizagem

### Para Administradores
- Gestão completa de textos, gramática, vocabulário, quizzes e exercícios
- Painel de administração protegido por roles

## 🛠️ Stack Tecnológica

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6

## 📁 Estrutura do Projeto

```
├── src/
│   ├── components/       # Componentes React reutilizáveis
│   │   ├── admin/       # Componentes do painel de administração
│   │   └── ui/          # Componentes shadcn/ui
│   ├── contexts/        # Contextos React (Theme)
│   ├── hooks/           # Custom hooks (useAuth, etc.)
│   ├── integrations/    # Integrações (Supabase client & types)
│   ├── lib/             # Utilitários (SM2 algorithm, utils)
│   ├── pages/           # Páginas da aplicação
│   └── data/            # Dados estáticos
├── supabase/
│   ├── migrations/      # Migrações da base de dados
│   └── seeds/           # Dados de seed para popular a BD
└── public/              # Assets estáticos
```

## 🗄️ Base de Dados

### Tabelas Principais
- `texts` - Textos para leitura
- `grammar_topics` - Tópicos de gramática
- `base_vocabulary` - Vocabulário base (importável para flashcards)
- `flashcards` - Flashcards pessoais dos utilizadores
- `flashcard_reviews` - Histórico de revisões
- `quiz_questions` - Questões de quiz
- `practice_exercises` - Exercícios de prática
- `profiles` - Perfis de utilizadores
- `user_roles` - Roles (admin/user)
- `user_progress` - Progresso dos utilizadores

### Seeds
Os ficheiros de seed estão em `supabase/seeds/`:
- `001_grammar_topics.sql` - 12 tópicos de gramática
- `002_texts_beginner.sql` - 10 textos iniciantes
- `003_texts_intermediate.sql` - 10 textos intermédios
- `004_texts_advanced.sql` - 10 textos avançados
- `005_base_vocabulary.sql` - 60+ palavras de vocabulário

## 🔐 Autenticação e Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) em todas as tabelas
- Sistema de roles (admin/user) com função `has_role()`
- Perfis criados automaticamente via trigger

## 🚀 Como Começar

### Desenvolvimento Local

```bash
# Clonar o repositório
git clone https://github.com/ghrs123/english-study-app.git

# Navegar para o diretório
cd english-study-app

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

Para desenvolvimento local, crie um ficheiro `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

## ✅ CI/CD (GitHub Actions + Pages)

Este repositório inclui CI/CD com GitHub Actions em [.github/workflows/ci.yml](.github/workflows/ci.yml):

- **CI** em PRs e pushes para `main`: `lint`, `test` e `build`.
- **CD** (deploy) para **GitHub Pages** em pushes para `main`.

### Configurar variáveis para o build do Pages

No GitHub, vai a **Settings → Secrets and variables → Actions → Variables** e adiciona:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- (opcional) `VITE_SUPABASE_PROJECT_ID`

### Ativar o GitHub Pages

No GitHub, vai a **Settings → Pages** e em **Build and deployment** escolhe **Source: GitHub Actions**.

### Popular a Base de Dados

Execute os ficheiros de seed em ordem:

```bash
# Usando psql
psql -h <host> -U postgres -d postgres -f supabase/seeds/001_grammar_topics.sql
psql -h <host> -U postgres -d postgres -f supabase/seeds/002_texts_beginner.sql
# ... etc
```

## 🔗 Links

- **Repositório**: https://github.com/ghrs123/english-study-app
- **Lovable Project**: https://lovable.dev/projects/196988dd-950a-4079-aa54-d586c5fe5d04

## 📝 Licença

MIT
