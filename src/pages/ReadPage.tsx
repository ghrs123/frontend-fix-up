import { useState, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { DictionaryModal } from '@/components/DictionaryModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Eye, EyeOff, Volume2, Loader2, Square } from 'lucide-react';

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

interface Text {
  id: string;
  title: string;
  content: string;
  content_portuguese: string | null;
  difficulty: DifficultyLevel;
  category: string;
  audio_url: string | null;
  word_count: number | null;
}

const difficultyColors: Record<DifficultyLevel, string> = {
  beginner: 'bg-green-500/10 text-green-600 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const difficultyLabels: Record<DifficultyLevel, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

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
  return voices.find(v => v.lang.startsWith('en-') && !v.lang.startsWith('pt-')) || null;
}

export default function ReadPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showTranslation, setShowTranslation] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [englishVoice, setEnglishVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Load and select voice
  useEffect(() => {
    const selectVoice = () => {
      const voices = speechSynthesis.getVoices();
      console.log('🎤 ReadPage - Total vozes disponíveis:', voices.length);
      
      if (voices.length === 0) {
        console.warn('⚠️ Nenhuma voz carregada ainda');
        return;
      }
      
      // List all available voices for debugging
      voices.forEach(v => {
        console.log(`  - ${v.name} (${v.lang})`);
      });
      
      const voice = getEnglishVoice();
      if (voice) {
        console.log('✅ ReadPage - Voz em INGLÊS selecionada:', voice.name, voice.lang);
        setEnglishVoice(voice);
      } else {
        console.error('❌ ReadPage - NENHUMA voz em inglês encontrada!');
        console.error('⚠️ Você precisa instalar vozes em inglês no Windows!');
        // DO NOT use Portuguese voice for English text - set to null
        setEnglishVoice(null);
        
        // Show warning to user once
        toast.error('Vozes em inglês não encontradas', {
          description: 'Instale vozes em inglês no Windows para ouvir os textos.',
          duration: 8000,
        });
      }
    };
    
    selectVoice();
    
    // Try again after a short delay to ensure voices are loaded
    const timeout = setTimeout(selectVoice, 100);
    
    speechSynthesis.addEventListener('voiceschanged', selectVoice);
    return () => {
      clearTimeout(timeout);
      speechSynthesis.removeEventListener('voiceschanged', selectVoice);
    };
  }, []);

  const { data: text, isLoading } = useQuery({
    queryKey: ['text', id],
    queryFn: async () => {
      if (!id) throw new Error('No text ID');
      const { data, error } = await supabase
        .from('texts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Text;
    },
    enabled: !!id,
  });

  // Mark text as read
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) return;
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          text_id: id,
          progress_type: 'reading',
          completed: true,
          completed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,text_id,progress_type'
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Texto marcado como lido!');
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
    },
  });

  const handleWordClick = useCallback((word: string) => {
    // Clean the word (remove punctuation)
    const cleanWord = word.replace(/[.,!?;:'"()]/g, '').toLowerCase();
    if (cleanWord.length > 1) {
      setSelectedWord(cleanWord);
      setIsDictionaryOpen(true);
    }
  }, []);

  const speakText = useCallback(() => {
    console.log('🔊 Tentando falar texto em INGLÊS...');
    console.log('  - Texto disponível:', !!text?.content);
    console.log('  - Voz em inglês disponível:', !!englishVoice);
    console.log('  - Voz nome:', englishVoice?.name);
    
    if (!text?.content) {
      console.error('❌ Sem conteúdo de texto');
      toast.error('Conteúdo de texto não disponível');
      return;
    }
    
    // If already speaking, stop
    if (isSpeaking) {
      console.log('⏸️ Parando fala...');
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    
    // Try to get English voice
    let voiceToUse = englishVoice;
    
    if (!voiceToUse) {
      console.warn('⚠️ Voz em inglês não carregada, tentando buscar...');
      const voices = speechSynthesis.getVoices();
      console.log('  - Vozes disponíveis agora:', voices.length);
      
      if (voices.length > 0) {
        // List all voices
        voices.forEach(v => {
          console.log(`    - ${v.name} (${v.lang})`);
        });
        
        // ONLY accept English voices - NO Portuguese fallback
        voiceToUse = getEnglishVoice();
        
        if (voiceToUse) {
          console.log('✅ Voz em INGLÊS obtida:', voiceToUse.name, voiceToUse.lang);
          setEnglishVoice(voiceToUse);
        } else {
          console.error('❌ NENHUMA voz em INGLÊS encontrada no sistema');
          console.error('⚠️ Somente vozes em português disponíveis');
          console.error('⚠️ NÃO vou falar texto em inglês com voz portuguesa');
          
          toast.error('Nenhuma voz em inglês instalada', {
            description: 'Por favor, instale vozes em inglês no Windows para ouvir os textos em inglês.',
            duration: 10000,
          });
          return;
        }
      } else {
        console.error('❌ Nenhuma voz disponível no sistema');
        toast.error('Nenhuma voz disponível. Recarregue a página.');
        return;
      }
    }
    
    // Final check: make sure it's actually an English voice
    if (!voiceToUse.lang.startsWith('en')) {
      console.error('❌ ERRO: Voz selecionada NÃO é em inglês:', voiceToUse.name, voiceToUse.lang);
      console.error('⚠️ Não vou falar texto em inglês com voz', voiceToUse.lang);
      toast.error('Erro: Voz em inglês não disponível', {
        description: 'A voz selecionada não é em inglês. Instale vozes em inglês no Windows.',
        duration: 10000,
      });
      return;
    }
    
    console.log('✅ Usando voz em INGLÊS:', voiceToUse.name, voiceToUse.lang);
    console.log('▶️ Iniciando fala...');
    
    // Cancel any previous speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text.content);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.voice = voiceToUse;
    
    utterance.onstart = () => {
      console.log('✓ Fala iniciou');
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      console.log('✓ Fala terminou');
      setIsSpeaking(false);
    };
    utterance.onerror = (e) => {
      console.error('❌ Erro na fala:', e);
      setIsSpeaking(false);
      toast.error('Erro ao reproduzir áudio');
    };
    
    speechSynthesis.speak(utterance);
  }, [text?.content, isSpeaking, englishVoice]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  const renderInteractiveText = (content: string) => {
    const words = content.split(/(\s+)/);
    return words.map((word, index) => {
      if (/^\s+$/.test(word)) {
        return <span key={index}>{word}</span>;
      }
      return (
        <span
          key={index}
          onClick={() => handleWordClick(word)}
          className="cursor-pointer hover:bg-primary/20 hover:text-primary rounded px-0.5 transition-colors"
        >
          {word}
        </span>
      );
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!text) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Texto não encontrado</h2>
          <Button asChild className="mt-4">
            <Link to="/reading">Voltar à lista</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/reading">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{text.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={difficultyColors[text.difficulty]}>
                {difficultyLabels[text.difficulty]}
              </Badge>
              <span className="text-muted-foreground text-sm">{text.category}</span>
              {text.word_count && (
                <span className="text-muted-foreground text-sm">• {text.word_count} palavras</span>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-translation"
              checked={showTranslation}
              onCheckedChange={setShowTranslation}
            />
            <Label htmlFor="show-translation" className="flex items-center gap-2">
              {showTranslation ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              Mostrar tradução
            </Label>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={isSpeaking ? "secondary" : "outline"} 
              size="sm" 
              onClick={speakText}
            >
              {isSpeaking ? (
                <>
                  <Square className="mr-2 h-4 w-4" />
                  Parar
                </>
              ) : (
                <>
                  <Volume2 className="mr-2 h-4 w-4" />
                  Ouvir
                </>
              )}
            </Button>
            {isAuthenticated && (
              <Button 
                size="sm" 
                onClick={() => markAsReadMutation.mutate()}
                disabled={markAsReadMutation.isPending}
              >
                Marcar como lido
              </Button>
            )}
          </div>
        </div>

        {/* Text Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Texto em Inglês</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed whitespace-pre-line">
              {renderInteractiveText(text.content)}
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              💡 Clique em qualquer palavra para ver a definição
            </p>
          </CardContent>
        </Card>

        {/* Translation */}
        {text.content_portuguese && (
          <Card className={showTranslation ? '' : 'opacity-50'}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {showTranslation ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                Tradução
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showTranslation ? (
                <p className="text-lg leading-relaxed whitespace-pre-line">
                  {text.content_portuguese}
                </p>
              ) : (
                <p className="text-muted-foreground italic">
                  Ative o switch acima para ver a tradução
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dictionary Modal */}
      <DictionaryModal
        word={selectedWord}
        open={isDictionaryOpen}
        onOpenChange={setIsDictionaryOpen}
        textId={text.id}
      />
    </AppLayout>
  );
}
