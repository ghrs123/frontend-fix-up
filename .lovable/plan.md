
# Plano de Implementação - English Study App Completa

## Resumo Executivo

Este plano transforma a aplicação atual de estudo de inglês (que usa dados locais estáticos) numa plataforma completa com backend real usando **Supabase**, conforme especificado na documentação fornecida.

---

## Situação Atual vs Objetivo

| Aspeto | Atual | Objetivo |
|--------|-------|----------|
| **Dados** | Ficheiros locais (vocabulary.ts, quizzes.ts) | Base de dados Supabase com textos, flashcards, gramática |
| **Autenticação** | Nenhuma | Supabase Auth com login social |
| **Backend** | Nenhum | Supabase Edge Functions + Database |
| **Funcionalidades** | Flashcards básicos, Quiz simples | Leitura interativa, dicionário, spaced repetition (SM2), gramática, painel admin |
| **Router** | react-router-dom | react-router-dom (manter) |
| **Progresso** | Não persistido | Rastreamento completo por utilizador |

---

## Fases de Implementação

### Fase 1: Configuração do Backend Supabase

**Duração estimada:** ~30 minutos

**Tarefas:**
1. Ativar Supabase Cloud (Lovable Cloud) no projeto
2. Criar schema de base de dados com 7 tabelas:
   - `texts` - Textos para leitura
   - `flashcards` - Cartões de vocabulário
   - `flashcard_reviews` - Histórico de revisões SM2
   - `grammar_topics` - Tópicos de gramática
   - `user_progress` - Progresso do utilizador
   - `word_definitions` - Cache de definições
   - `user_profiles` - Perfis com roles (user/admin)
3. Configurar Row Level Security (RLS) para cada tabela
4. Criar políticas de acesso (público para leitura, autenticado para escrita)

**Schema principal:**
```text
texts
├── id (uuid, PK)
├── title (text)
├── content (text) - Conteúdo inglês
├── content_portuguese (text) - Tradução
├── difficulty (enum: beginner/intermediate/advanced)
├── category (text)
├── audio_url (text, nullable)
├── word_count (integer)
├── created_at/updated_at

flashcards
├── id (uuid, PK)
├── user_id (uuid, FK users)
├── word (text)
├── translation (text)
├── example_sentence (text)
├── definition (text)
├── pronunciation (text)
├── text_id (uuid, FK texts, nullable)
├── ease_factor (decimal, default 2.5)
├── interval (integer, default 0)
├── next_review_at (timestamp)
├── created_at/updated_at

grammar_topics
├── id (uuid, PK)
├── name (text)
├── category (text)
├── explanation (text)
├── explanation_portuguese (text)
├── examples (jsonb)
├── difficulty (enum)
├── created_at/updated_at
```

---

### Fase 2: Sistema de Autenticação

**Duração estimada:** ~20 minutos

**Tarefas:**
1. Integrar Supabase Auth
2. Criar componentes de login/registo
3. Implementar hook `useAuth` para gerir sessão
4. Criar página de autenticação
5. Adicionar proteção de rotas para páginas que requerem login
6. Criar perfil de utilizador após registo

**Componentes a criar:**
- `src/hooks/useAuth.ts` - Hook de autenticação
- `src/pages/AuthPage.tsx` - Página de login/registo
- `src/components/AuthGuard.tsx` - Proteção de rotas

---

### Fase 3: Layout e Navegação

**Duração estimada:** ~25 minutos

**Tarefas:**
1. Atualizar Layout com Sidebar usando shadcn/ui
2. Criar `AppSidebar.tsx` com navegação completa:
   - Home
   - Leitura (Reading)
   - Flashcards
   - Gramática
   - Progresso
   - Admin (condicional)
3. Implementar header com toggle de sidebar e info do utilizador
4. Adicionar suporte a tema claro/escuro

**Estrutura de navegação:**
```text
├── / (Home)
├── /reading (Lista de textos)
├── /read/:id (Leitura de texto)
├── /flashcards (Revisão de flashcards)
├── /grammar (Tópicos de gramática)
├── /progress (Dashboard de progresso)
├── /admin (Painel de administração)
└── /auth (Login/Registo)
```

---

### Fase 4: Páginas de Conteúdo

**Duração estimada:** ~45 minutos

**4.1 - Reading Page (Lista de Textos)**
- Grid de cards com textos disponíveis
- Filtros por dificuldade e categoria
- Indicador de progresso de leitura
- Query: `supabase.from('texts').select()`

**4.2 - Read Page (Leitura Interativa)**
- Componente `TextReader` com palavras clicáveis
- Toggle para mostrar/ocultar tradução portuguesa
- Clique em palavra abre `DictionaryModal`
- Botão para salvar palavra como flashcard

**4.3 - Grammar Page**
- Lista de tópicos organizados por categoria
- Cards expansíveis com explicação e exemplos
- Indicador de tópicos estudados

**4.4 - Progress Dashboard**
- Cards com estatísticas (palavras aprendidas, textos lidos, etc)
- Gráficos de progresso usando recharts (já instalado)
- Histórico de atividades recentes

---

### Fase 5: Sistema de Flashcards com Spaced Repetition

**Duração estimada:** ~40 minutos

**Tarefas:**
1. Implementar algoritmo SM2 para spaced repetition:
   - Calcular próxima revisão baseado em qualidade (0-5)
   - Ajustar ease factor e interval
2. Atualizar `FlashcardsPage` com 3 abas:
   - **Review**: Cards agendados para hoje
   - **Review All**: Todos os cards
   - **All Cards**: Lista visual de todos os flashcards
3. Criar componente `FlashcardReviewer`:
   - Animação de flip
   - Botões: Easy (5), Good (3), Hard (1), Again (0)
4. Persistir progresso na base de dados

**Fórmula SM2:**
```text
Se qualidade >= 3:
  interval = anterior * easeFactor
  easeFactor = max(1.3, easeFactor + 0.1 - (5-q) * (0.08 + (5-q) * 0.02))
Senão:
  interval = 1
  easeFactor = mantém
```

---

### Fase 6: Dicionário Interativo

**Duração estimada:** ~30 minutos

**Tarefas:**
1. Criar `DictionaryModal.tsx`:
   - Mostra definição, tradução, exemplo
   - Pronunciação com síntese de voz (Web Speech API)
   - Botão "Adicionar aos Flashcards"
2. Implementar cache de definições na base de dados
3. Criar Edge Function para buscar definições (ou usar API externa como Free Dictionary API)

**Fluxo:**
```text
Utilizador clica palavra
    ↓
Verificar cache local
    ↓ (não encontrado)
Buscar no Supabase (word_definitions)
    ↓ (não encontrado)
Chamar API externa
    ↓
Salvar no cache
    ↓
Exibir no modal
```

---

### Fase 7: Painel de Administração

**Duração estimada:** ~35 minutos

**Tarefas:**
1. Criar `AdminPage.tsx` com tabs:
   - **Add Text**: Formulário para criar textos
   - **Add Grammar**: Formulário para criar tópicos
   - **Edit Texts**: Tabela com edição/eliminação
   - **Edit Flashcards**: Gestão de flashcards (admin)
   - **Edit Grammar**: Gestão de tópicos
2. Implementar componentes auxiliares:
   - `DataTable.tsx` - Tabela genérica
   - `DeleteConfirmDialog.tsx` - Confirmação de eliminação
   - `DifficultyBadge.tsx` - Badge visual de dificuldade
   - Modais de edição para cada entidade
3. Verificação de role admin (RLS + frontend)

---

### Fase 8: Dados Iniciais (Seed)

**Duração estimada:** ~15 minutos

**Tarefas:**
1. Popular base de dados com conteúdo inicial:
   - 5-10 textos de exemplo (beginner a advanced)
   - 10-15 tópicos de gramática
   - Vocabulário base
2. Criar script SQL para seed ou usar painel admin

---

## Ficheiros a Criar/Modificar

### Novos Ficheiros (~25)
```text
src/
├── hooks/
│   ├── useAuth.ts
│   ├── useFlashcards.ts
│   └── useWordSelection.ts
├── contexts/
│   └── ThemeContext.tsx
├── lib/
│   ├── supabase.ts
│   ├── sm2.ts (algoritmo spaced repetition)
│   └── constants.ts
├── types/
│   └── database.ts
├── pages/
│   ├── AuthPage.tsx
│   ├── ReadingPage.tsx
│   ├── ReadPage.tsx
│   ├── GrammarPage.tsx
│   └── ProgressDashboard.tsx
├── components/
│   ├── AppLayout.tsx
│   ├── AppSidebar.tsx
│   ├── TextReader.tsx
│   ├── DictionaryModal.tsx
│   ├── FlashcardReviewer.tsx
│   ├── AuthGuard.tsx
│   └── admin/
│       ├── DataTable.tsx
│       ├── DeleteConfirmDialog.tsx
│       ├── DifficultyBadge.tsx
│       ├── EditTextModal.tsx
│       ├── EditFlashcardModal.tsx
│       └── EditGrammarModal.tsx

supabase/migrations/
└── 001_create_tables.sql
```

### Ficheiros a Modificar (~10)
```text
src/App.tsx - Novas rotas
src/main.tsx - Provider de tema
src/index.css - Variáveis de tema
src/pages/Dashboard.tsx - Dados reais do Supabase
src/pages/FlashcardsPage.tsx - Sistema SM2 completo
src/pages/AdminPage.tsx - Funcionalidades admin
src/components/Layout.tsx - Integrar com sidebar
```

---

## Dependências Adicionais

Nenhuma nova dependência é necessária. O projeto já tem:
- `@tanstack/react-query` - Para gestão de estado do servidor
- `recharts` - Para gráficos de progresso
- `react-router-dom` - Para routing
- `sonner` - Para notificações toast
- Todos os componentes shadcn/ui necessários

---

## Considerações Técnicas

### Autenticação
- Usar Supabase Auth com email/password inicialmente
- Expandir para Google/GitHub OAuth posteriormente

### Performance
- Implementar paginação para listas grandes
- Cache de definições de palavras
- Queries otimizadas com select específico

### Segurança
- RLS em todas as tabelas
- Validação de role admin no backend
- Sanitização de inputs

### Mobile
- Layout responsivo já existente
- Sidebar colapsável em mobile
- Touch-friendly para flashcards

---

## Ordem de Implementação Recomendada

1. **Supabase Setup** - Base de dados e schema
2. **Autenticação** - Login/registo funcional
3. **Layout/Sidebar** - Navegação base
4. **Reading Flow** - Textos + Dicionário
5. **Flashcards SM2** - Sistema completo de revisão
6. **Gramática** - Tópicos e exemplos
7. **Progresso** - Dashboard com estatísticas
8. **Admin Panel** - Gestão de conteúdo
9. **Seed Data** - Conteúdo inicial
10. **Polish** - Refinamentos finais

---

## Resultado Esperado

Uma aplicação completa de estudo de inglês com:
- Leitura interativa de textos com tradução
- Dicionário integrado com síntese de voz
- Flashcards com algoritmo de spaced repetition (SM2)
- Estudo de gramática organizado
- Rastreamento de progresso do utilizador
- Painel de administração para gestão de conteúdo
- Autenticação segura com Supabase
- Interface moderna e responsiva
