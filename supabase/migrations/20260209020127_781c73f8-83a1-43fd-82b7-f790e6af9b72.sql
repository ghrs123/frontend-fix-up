-- Add unique constraint on word column for base_vocabulary
ALTER TABLE base_vocabulary ADD CONSTRAINT base_vocabulary_word_unique UNIQUE (word);