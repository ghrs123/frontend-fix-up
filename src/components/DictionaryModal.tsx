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
import { Volume2, Plus, BookOpen, Loader2 } from 'lucide-react';

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

// Get the best English voice available
function getEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices();
  
  // Prefer native English voices in this order
  const preferredVoices = [
    'Google UK English Female',
    'Google UK English Male', 
    'Google US English',
    'Microsoft Zira Desktop',
    'Microsoft David Desktop',
    'Microsoft Zira',
    'Microsoft David',
    'Samantha', // macOS
    'Daniel', // macOS UK
    'Karen', // macOS Australian
    'Alex', // macOS
  ];
  
  // First try to find a preferred voice
  for (const preferred of preferredVoices) {
    const voice = voices.find(v => v.name.includes(preferred));
    if (voice) return voice;
  }
  
  // Then look for any English voice, but NOT Portuguese
  const englishVoice = voices.find(v => 
    v.lang.startsWith('en-') && 
    !v.lang.startsWith('pt-') &&
    (v.lang.includes('GB') || v.lang.includes('US') || v.lang.includes('AU') || v.name.toLowerCase().includes('english'))
  );
  if (englishVoice) return englishVoice;
  
  // Fallback to any English voice
  return voices.find(v => v.lang.startsWith('en-')) || null;
}

export function DictionaryModal({ word, open, onOpenChange, textId }: DictionaryModalProps) {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Load voices
  useEffect(() => {
    speechSynthesis.getVoices();
  }, []);

  // Fetch definition from cache or API
  const { data: definition, isLoading, error } = useQuery({
    queryKey: ['word-definition', word],
    queryFn: async () => {
      if (!word) return null;

      // First, try to get from cache
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

      // If not cached, fetch from Free Dictionary API
      try {
        const response = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
        );

        if (!response.ok) {
          return {
            word,
            definition: null,
            translation: null,
            phonetic: null,
            audio_url: null,
            part_of_speech: null,
            examples: [],
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

        // Cache the result
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
          word,
          definition: null,
          translation: null,
          phonetic: null,
          audio_url: null,
          part_of_speech: null,
          examples: [],
        } as WordDefinition;
      }
    },
    enabled: !!word && open,
  });

  // Add to flashcards mutation
  const addFlashcardMutation = useMutation({
    mutationFn: async () => {
      if (!user || !word || !definition) throw new Error('Missing data');

      const { error } = await supabase.from('flashcards').insert({
        user_id: user.id,
        word: word,
        translation: definition.translation || '',
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
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    // If there's an audio URL from the API, use that first (highest quality)
    if (definition?.audio_url) {
      const audio = new Audio(definition.audio_url);
      audio.playbackRate = 0.9; // Slightly slower
      setIsSpeaking(true);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => {
        setIsSpeaking(false);
        // Fallback to speech synthesis if audio fails
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
    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8; // Slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Try to use a good English voice
      const voice = getEnglishVoice();
      if (voice) {
        utterance.voice = voice;
        console.log('Using voice:', voice.name, voice.lang);
      } else {
        console.warn('No English voice found');
      }
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      speechSynthesis.speak(utterance);
    };

    // Check if voices are loaded
    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
      // Wait for voices to load
      speechSynthesis.addEventListener('voiceschanged', () => {
        speak();
      }, { once: true });
    } else {
      speak();
    }
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
              <div>
                <h4 className="font-medium mb-1">Definição</h4>
                <p className="text-muted-foreground">{definition.definition}</p>
              </div>

              {definition.translation && (
                <div>
                  <h4 className="font-medium mb-1">Tradução</h4>
                  <p className="text-muted-foreground">{definition.translation}</p>
                </div>
              )}

              {definition.examples && definition.examples.length > 0 && (
                <div>
                  <h4 className="font-medium mb-1">Exemplo</h4>
                  <p className="text-muted-foreground italic">"{definition.examples[0]}"</p>
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
