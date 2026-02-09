-- Add is_active column to flashcards table
ALTER TABLE public.flashcards 
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Create index for better query performance
CREATE INDEX idx_flashcards_is_active ON public.flashcards(is_active);

-- Add comment explaining the column
COMMENT ON COLUMN public.flashcards.is_active IS 'When false, the flashcard is archived and not shown in study sessions';