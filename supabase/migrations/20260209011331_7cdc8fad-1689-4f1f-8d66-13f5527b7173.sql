-- Tabela de vocabulário base (flashcards públicos)
CREATE TABLE public.base_vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word TEXT NOT NULL,
    translation TEXT NOT NULL,
    pronunciation TEXT,
    definition TEXT,
    example_sentence TEXT,
    example_translation TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    difficulty difficulty_level NOT NULL DEFAULT 'beginner',
    audio_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de questões de quiz personalizadas
CREATE TABLE public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'multiple_choice', -- multiple_choice, fill_blank, true_false
    options JSONB, -- para múltipla escolha: [{text: "...", correct: true/false}]
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    explanation_portuguese TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    difficulty difficulty_level NOT NULL DEFAULT 'beginner',
    grammar_topic_id UUID REFERENCES grammar_topics(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de exercícios de prática
CREATE TABLE public.practice_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    exercise_type TEXT NOT NULL, -- translation, writing, comprehension, listening
    instructions TEXT NOT NULL,
    instructions_portuguese TEXT,
    content TEXT NOT NULL, -- texto/prompt principal
    content_portuguese TEXT,
    reference_answer TEXT, -- resposta de referência
    hints JSONB, -- dicas: [{text: "..."}]
    audio_url TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    difficulty difficulty_level NOT NULL DEFAULT 'beginner',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.base_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_exercises ENABLE ROW LEVEL SECURITY;

-- Policies para base_vocabulary
CREATE POLICY "Base vocabulary is viewable by everyone" 
ON public.base_vocabulary FOR SELECT USING (true);

CREATE POLICY "Admins can manage base vocabulary" 
ON public.base_vocabulary FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies para quiz_questions
CREATE POLICY "Quiz questions are viewable by everyone" 
ON public.quiz_questions FOR SELECT USING (true);

CREATE POLICY "Admins can manage quiz questions" 
ON public.quiz_questions FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies para practice_exercises  
CREATE POLICY "Practice exercises are viewable by everyone" 
ON public.practice_exercises FOR SELECT USING (true);

CREATE POLICY "Admins can manage practice exercises" 
ON public.practice_exercises FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers para updated_at
CREATE TRIGGER update_base_vocabulary_updated_at
BEFORE UPDATE ON public.base_vocabulary
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quiz_questions_updated_at
BEFORE UPDATE ON public.quiz_questions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_practice_exercises_updated_at
BEFORE UPDATE ON public.practice_exercises
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket para áudios
INSERT INTO storage.buckets (id, name, public) VALUES ('audio', 'audio', true);

-- Storage policies
CREATE POLICY "Audio files are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'audio');

CREATE POLICY "Admins can upload audio files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'audio' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update audio files" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'audio' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete audio files" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'audio' AND has_role(auth.uid(), 'admin'::app_role));