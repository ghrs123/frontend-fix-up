import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Volume2, Plus, BookOpen, Loader2, Languages } from 'lucide-react';

interface DictionaryModalProps {
  word: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  textId?: string;
}

interface WordDefinition {
  word: string;
  definition: string | null;
  translation: string | null;
  phonetic: string | null;
  audio_url: string | null;
  part_of_speech: string | null;
  examples: string[];
}

interface TranslationData {
  translation: string;
  definition_pt: string;
  examples_pt?: string[];
}

// Get the best English voice available
function getEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices();
  const preferredVoices = [
    'Google UK English Female',
    'Google UK English Male',
    'Google US English',
    'Microsoft Zira Desktop',
    'Microsoft David Desktop',
    'Microsoft Zira',
    'Microsoft David',
    'Samantha',
    'Daniel',
    'Karen',
    'Alex',
  ];
  for (const preferred of preferredVoices) {
    const voice = voices.find(v => v.name.includes(preferred));
    if (voice) return voice;
  }
  const englishVoice = voices.find(v =>
    v.lang.startsWith('en-') &&
    !v.lang.startsWith('pt-') &&
    (v.lang.includes('GB') || v.lang.includes('US') || v.lang.includes('AU') || v.name.toLowerCase().includes('english'))
  );
  if (englishVoice) return englishVoice;
  return voices.find(v => v.lang.startsWith('en-')) || null;
}

const TRANSLATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-definition`;

export function DictionaryModal({ word, open, onOpenChange, textId }: DictionaryModalProps) {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [englishVoice, setEnglishVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [portugueseVoice, setPortugueseVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Detect language of text
  const detectLanguage = (text: string): 'en' | 'pt' => {
    const portugueseChars = /[àáâãçéêíóôõú]/i;
    const portugueseWords = /\b(o|a|os|as|um|uma|de|da|do|em|para|com|que|não|sim|está|são)\b/i;
    if (portugueseChars.test(text) || portugueseWords.test(text)) return 'pt';
    return 'en';
  };

  useEffect(() => {
    const selectVoices = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length === 0) return;
      
      const enVoice = getEnglishVoice();
      if (enVoice) setEnglishVoice(enVoice);
      
      const ptVoice = voices.find(v => v.lang.startsWith('pt'));
      if (ptVoice) setPortugueseVoice(ptVoice);
    };
    
    selectVoices();
    speechSynthesis.addEventListener('voiceschanged', selectVoices);
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', selectVoices);
    };
  }, []);

  // Fetch definition from cache or API
  const { data: definition, isLoading } = useQuery({
    queryKey: ['word-definition', word],
    queryFn: async () => {
      if (!word) return null;

      const { data: cached } = await supabase
        .from('word_definitions')
        .select('*')
        .eq('word', word.toLowerCase())
        .maybeSingle();

      if (cached) {
        return {
          ...cached,
          examples: (cached.examples as string[]) || [],
        } as WordDefinition;
      }

      try {
        const response = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
        );

        if (!response.ok) {
          return {
            word, definition: null, translation: null, phonetic: null,
            audio_url: null, part_of_speech: null, examples: [],
          } as WordDefinition;
        }

        const data = await response.json();
        const entry = data[0];
        const meaning = entry?.meanings?.[0];
        const definitionData = meaning?.definitions?.[0];

        const result: WordDefinition = {
          word: entry?.word || word,
          definition: definitionData?.definition || null,
          translation: null,
          phonetic: entry?.phonetic || entry?.phonetics?.[0]?.text || null,
          audio_url: entry?.phonetics?.find((p: any) => p.audio)?.audio || null,
          part_of_speech: meaning?.partOfSpeech || null,
          examples: definitionData?.example ? [definitionData.example] : [],
        };

        if (isAuthenticated && result.definition) {
          await supabase.from('word_definitions').insert({
            word: word.toLowerCase(),
            definition: result.definition,
            phonetic: result.phonetic,
            audio_url: result.audio_url,
            part_of_speech: result.part_of_speech,
            examples: result.examples,
            source: 'api',
          }).select();
        }

        return result;
      } catch (err) {
        console.error('Error fetching definition:', err);
        return {
          word, definition: null, translation: null, phonetic: null,
          audio_url: null, part_of_speech: null, examples: [],
        } as WordDefinition;
      }
    },
    enabled: !!word && open,
  });

  // Auto-translate definition with AI
  const { data: translationData, isLoading: isTranslating } = useQuery({
    queryKey: ['word-translation', word, definition?.definition],
    queryFn: async (): Promise<TranslationData | null> => {
      if (!word || !definition?.definition) return null;

      // Check if we already have a translation cached in word_definitions
      if (definition.translation) {
        return {
          translation: definition.translation,
          definition_pt: '',
          examples_pt: [],
        };
      }

      try {
        const resp = await fetch(TRANSLATE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            word: definition.word,
            definition: definition.definition,
            examples: definition.examples,
          }),
        });

        if (!resp.ok) return null;

        const data = await resp.json() as TranslationData;

        // Cache the translation
        if (data.translation) {
          await supabase
            .from('word_definitions')
            .update({ translation: data.translation })
            .eq('word', word.toLowerCase());
        }

        return data;
      } catch (err) {
        console.error('Translation error:', err);
        return null;
      }
    },
    enabled: !!word && open && !!definition?.definition,
    staleTime: Infinity,
  });

  const addFlashcardMutation = useMutation({
    mutationFn: async () => {
      if (!user || !word || !definition) throw new Error('Missing data');

      const { error } = await supabase.from('flashcards').insert({
        user_id: user.id,
        word: word,
        translation: translationData?.translation || definition.translation || '',
        definition: definition.definition || '',
        example_sentence: definition.examples?.[0] || '',
        pronunciation: definition.phonetic || '',
        text_id: textId || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Palavra adicionada aos flashcards!');
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('Esta palavra já está nos seus flashcards.');
      } else {
        toast.error('Erro ao adicionar palavra.');
      }
    },
  });

  const speakWord = useCallback(() => {
    if (!word) return;
    speechSynthesis.cancel();

    if (definition?.audio_url) {
      const audio = new Audio(definition.audio_url);
      audio.playbackRate = 0.9;
      setIsSpeaking(true);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => {
        setIsSpeaking(false);
        speakWithSynthesis(word);
      };
      audio.play().catch(() => {
        setIsSpeaking(false);
        speakWithSynthesis(word);
      });
    } else {
      speakWithSynthesis(word);
    }
  }, [word, definition?.audio_url]);

  const speakWithSynthesis = (text: string) => {
<<<<<<< Updated upstream
    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      const voice = getEnglishVoice();
      if (voice) utterance.voice = voice;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    };

    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
      speechSynthesis.addEventListener('voiceschanged', () => speak(), { once: true });
    } else {
      speak();
=======
    const language = detectLanguage(text);
    const voice = language === 'en' ? englishVoice : portugueseVoice;
    
    if (!voice) {
      console.warn('⚠️ Voz não disponível para:', language);
      setIsSpeaking(false);
      return;
>>>>>>> Stashed changes
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'en' ? 'en-US' : 'pt-PT';
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.voice = voice;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speechSynthesis.speak(utterance);
  };

  if (!word) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <span className="capitalize">{word}</span>
            {definition?.phonetic && (
              <span className="text-muted-foreground font-normal text-sm">
                {definition.phonetic}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={speakWord}
              disabled={isSpeaking}
              className="ml-auto"
            >
              {isSpeaking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </DialogTitle>
          {definition?.part_of_speech && (
            <DialogDescription className="italic">
              {definition.part_of_speech}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : definition?.definition ? (
            <>
              {/* Translation badge */}
              {(translationData?.translation || definition.translation) && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <Languages className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-semibold text-primary text-lg">
                    {translationData?.translation || definition.translation}
                  </span>
                </div>
              )}
              {isTranslating && !translationData && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">A traduzir...</span>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-1">Definition</h4>
                <p className="text-muted-foreground">{definition.definition}</p>
              </div>

              {/* Translated definition */}
              {translationData?.definition_pt && (
                <div>
                  <h4 className="font-medium mb-1 flex items-center gap-1.5">
                    <Languages className="h-3.5 w-3.5 text-primary" />
                    Definição em Português
                  </h4>
                  <p className="text-muted-foreground">{translationData.definition_pt}</p>
                </div>
              )}

              {definition.examples && definition.examples.length > 0 && (
                <div>
                  <h4 className="font-medium mb-1">Example</h4>
                  <p className="text-muted-foreground italic">"{definition.examples[0]}"</p>
                  {translationData?.examples_pt?.[0] && (
                    <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1">
                      <Languages className="h-3 w-3 text-primary shrink-0" />
                      <span className="italic">"{translationData.examples_pt[0]}"</span>
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Definição não encontrada para "{word}".
            </p>
          )}
        </div>

        <DialogFooter>
          {isAuthenticated && definition?.definition && (
            <Button
              onClick={() => addFlashcardMutation.mutate()}
              disabled={addFlashcardMutation.isPending}
            >
              {addFlashcardMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Adicionar aos Flashcards
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
