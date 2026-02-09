-- Create enum types
CREATE TYPE public.difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table (SECURITY: roles must be separate from profiles)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    native_language TEXT DEFAULT 'pt',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create texts table (reading content)
CREATE TABLE public.texts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_portuguese TEXT,
    difficulty difficulty_level NOT NULL DEFAULT 'beginner',
    category TEXT NOT NULL DEFAULT 'general',
    audio_url TEXT,
    word_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flashcards table
CREATE TABLE public.flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    word TEXT NOT NULL,
    translation TEXT NOT NULL,
    example_sentence TEXT,
    definition TEXT,
    pronunciation TEXT,
    text_id UUID REFERENCES public.texts(id) ON DELETE SET NULL,
    ease_factor DECIMAL(4,2) NOT NULL DEFAULT 2.5,
    interval INTEGER NOT NULL DEFAULT 0,
    repetitions INTEGER NOT NULL DEFAULT 0,
    next_review_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flashcard_reviews table (history)
CREATE TABLE public.flashcard_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flashcard_id UUID REFERENCES public.flashcards(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    quality INTEGER NOT NULL CHECK (quality >= 0 AND quality <= 5),
    ease_factor_before DECIMAL(4,2) NOT NULL,
    ease_factor_after DECIMAL(4,2) NOT NULL,
    interval_before INTEGER NOT NULL,
    interval_after INTEGER NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create grammar_topics table
CREATE TABLE public.grammar_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    explanation TEXT NOT NULL,
    explanation_portuguese TEXT,
    examples JSONB DEFAULT '[]'::jsonb,
    difficulty difficulty_level NOT NULL DEFAULT 'beginner',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create word_definitions table (cache for dictionary)
CREATE TABLE public.word_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word TEXT NOT NULL UNIQUE,
    definition TEXT,
    translation TEXT,
    phonetic TEXT,
    audio_url TEXT,
    part_of_speech TEXT,
    examples JSONB DEFAULT '[]'::jsonb,
    source TEXT DEFAULT 'api',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_progress table
CREATE TABLE public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    text_id UUID REFERENCES public.texts(id) ON DELETE CASCADE,
    grammar_topic_id UUID REFERENCES public.grammar_topics(id) ON DELETE CASCADE,
    progress_type TEXT NOT NULL CHECK (progress_type IN ('reading', 'grammar', 'flashcard')),
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, text_id, progress_type),
    UNIQUE (user_id, grammar_topic_id, progress_type)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_texts_updated_at
    BEFORE UPDATE ON public.texts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at
    BEFORE UPDATE ON public.flashcards
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grammar_topics_updated_at
    BEFORE UPDATE ON public.grammar_topics
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON public.user_progress
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create security definer function for role checking (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Create function to auto-create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
    ON public.user_roles FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
    ON public.user_roles FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by owner"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for texts (public read, admin write)
CREATE POLICY "Texts are viewable by everyone"
    ON public.texts FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage texts"
    ON public.texts FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for flashcards
CREATE POLICY "Users can view their own flashcards"
    ON public.flashcards FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own flashcards"
    ON public.flashcards FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcards"
    ON public.flashcards FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcards"
    ON public.flashcards FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all flashcards"
    ON public.flashcards FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for flashcard_reviews
CREATE POLICY "Users can view their own reviews"
    ON public.flashcard_reviews FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reviews"
    ON public.flashcard_reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for grammar_topics (public read, admin write)
CREATE POLICY "Grammar topics are viewable by everyone"
    ON public.grammar_topics FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage grammar topics"
    ON public.grammar_topics FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for word_definitions (public read/write for caching)
CREATE POLICY "Word definitions are viewable by everyone"
    ON public.word_definitions FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can add definitions"
    ON public.word_definitions FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for user_progress
CREATE POLICY "Users can view their own progress"
    ON public.user_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own progress"
    ON public.user_progress FOR ALL
    USING (auth.uid() = user_id);