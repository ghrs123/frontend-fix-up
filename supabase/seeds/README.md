# Database Seeds

This folder contains SQL seed files to populate the database with initial data.

## Seed Files

| File | Description |
|------|-------------|
| `001_grammar_topics.sql` | 12 grammar topics covering verb tenses, conditionals, voice, and more |
| `002_texts_beginner.sql` | 10 beginner-level reading texts |
| `003_texts_intermediate.sql` | 10 intermediate-level reading texts |
| `004_texts_advanced.sql` | 10 advanced-level reading texts |
| `005_base_vocabulary.sql` | 60+ vocabulary words across all difficulty levels |

## Running Seeds

### Using Supabase CLI

```bash
# Run all seeds in order
supabase db reset

# Or run individual seed files
psql -h <host> -U postgres -d postgres -f supabase/seeds/001_grammar_topics.sql
```

### Using Lovable Cloud

1. Go to your project's Cloud View
2. Navigate to "Run SQL"
3. Copy and paste the contents of each seed file
4. Execute the SQL

## Data Structure

### Grammar Topics
- Present Simple, Present Continuous, Past Simple, Present Perfect
- Future with Will
- Conditionals (Zero, First, Second)
- Passive Voice, Reported Speech
- Modal Verbs, Relative Clauses, Articles

### Texts
Each text includes:
- Title
- Content in English
- Portuguese translation
- Category (Daily Life, Travel, Health, etc.)
- Difficulty level
- Word count

### Vocabulary
Vocabulary is organized by:
- Category (Greetings, Verbs, Numbers, Time, Food, etc.)
- Difficulty (beginner, intermediate, advanced)
- Includes pronunciation, definitions, and example sentences

## Notes

- All INSERT statements use `ON CONFLICT DO NOTHING` to prevent duplicate entries
- Seeds are designed to be idempotent (can be run multiple times safely)
- The order of seed files matters: grammar topics should be seeded before quiz questions
