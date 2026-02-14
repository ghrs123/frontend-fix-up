import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { AuthGuard } from '@/components/AuthGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Layers, 
  Volume2, 
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Download,
  Archive,
  ArchiveRestore
} from 'lucide-react';
import { ImportVocabularyModal } from '@/components/ImportVocabularyModal';
import { calculateSM2, isDueForReview, formatInterval, getQualityLabel, getQualityVariant } from '@/lib/sm2';

interface Flashcard {
  id: string;
  word: string;
  translation: string;
  definition: string | null;
  example_sentence: string | null;
  pronunciation: string | null;
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review_at: string;
  created_at: string;
  is_active: boolean;
}

function FlashcardsContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewMode, setReviewMode] = useState<'due' | 'all'>('due');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [cardToArchive, setCardToArchive] = useState<Flashcard | null>(null);
  const [englishVoice, setEnglishVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [portugueseVoice, setPortugueseVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [newCard, setNewCard] = useState({
    word: '',
    translation: '',
    definition: '',
    example_sentence: '',
    pronunciation: '',
  });

  // Detect language of text
  const detectLanguage = (text: string): 'en' | 'pt' => {
    // Portuguese indicators
    const portugueseChars = /[àáâãçéêíóôõú]/i;
    const portugueseWords = /\b(o|a|os|as|um|uma|de|da|do|em|para|com|que|não|sim|está|são)\b/i;
    
    if (portugueseChars.test(text) || portugueseWords.test(text)) {
      return 'pt';
    }
    return 'en';
  };

  // Load and select voices once on component mount
  useEffect(() => {
    const selectVoices = () => {
      const voices = speechSynthesis.getVoices();
      console.log('🎤 Flashcards - Total vozes disponíveis:', voices.length);
      
      if (voices.length === 0) {
        console.warn('⚠️ Nenhuma voz carregada ainda');
        return;
      }
      
      // List all available voices for debugging
      voices.forEach(v => {
        console.log(`  - ${v.name} (${v.lang})`);
      });

      // Select English voice
      const englishVoices = voices.filter(v => v.lang.startsWith('en'));
      const preferredEnglish = [
        'Google UK English Female',
        'Google UK English Male', 
        'Google US English',
        'Microsoft Zira Desktop',
        'Microsoft David Desktop',
        'Microsoft Zira',
        'Microsoft David',
      ];
      
      let selectedEnglish = null;
      for (const preferred of preferredEnglish) {
        selectedEnglish = voices.find(v => v.name.includes(preferred));
        if (selectedEnglish) break;
      }
      // ONLY use English voices for English - NO fallback to other languages
      selectedEnglish = selectedEnglish || englishVoices[0];
      
      if (selectedEnglish) {
        console.log('✅ VOZ INGLÊS:', selectedEnglish.name, '|', selectedEnglish.lang);
        setEnglishVoice(selectedEnglish);
      } else {
        console.error('❌ NENHUMA voz em inglês encontrada');
        console.error('⚠️ Instale vozes em inglês no Windows!');
        setEnglishVoice(null);
        toast.error('Vozes em inglês não encontradas', {
          description: 'Instale vozes em inglês no Windows para ouvir palavras em inglês.',
          duration: 8000,
        });
      }

      // Select Portuguese voice
      const portugueseVoices = voices.filter(v => v.lang.startsWith('pt'));
      const preferredPortuguese = [
        'Google português',
        'Microsoft Maria',
        'Joana',
        'Luciana',
      ];
      
      let selectedPortuguese = null;
      for (const preferred of preferredPortuguese) {
        selectedPortuguese = voices.find(v => v.name.includes(preferred));
        if (selectedPortuguese) break;
      }
      selectedPortuguese = selectedPortuguese || portugueseVoices[0];
      
      if (selectedPortuguese) {
        console.log('✅ VOZ PORTUGUÊS:', selectedPortuguese.name, '|', selectedPortuguese.lang);
        setPortugueseVoice(selectedPortuguese);
      } else {
        console.warn('⚠️ Nenhuma voz em português encontrada');
      }
    };

    selectVoices();
    
    // Try again after a short delay
    const timeout = setTimeout(selectVoices, 100);
    
    speechSynthesis.addEventListener('voiceschanged', selectVoices);
    
    return () => {
      clearTimeout(timeout);
      speechSynthesis.removeEventListener('voiceschanged', selectVoices);
    };
  }, []);

  // Fetch active flashcards
  const { data: flashcards, isLoading } = useQuery({
    queryKey: ['flashcards', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('next_review_at', { ascending: true });

      if (error) throw error;
      return data as Flashcard[];
    },
    enabled: !!user,
  });

  // Fetch archived flashcards
  const { data: archivedFlashcards, isLoading: isLoadingArchived } = useQuery({
    queryKey: ['flashcards-archived', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', false)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as Flashcard[];
    },
    enabled: !!user,
  });

  // Filter cards based on mode
  const cardsToReview = useMemo(() => {
    if (!flashcards) return [];
    if (reviewMode === 'all') return flashcards;
    return flashcards.filter(card => isDueForReview(card.next_review_at));
  }, [flashcards, reviewMode]);

  const currentCard = cardsToReview[currentIndex];
  const progress = cardsToReview.length > 0 ? ((currentIndex + 1) / cardsToReview.length) * 100 : 0;

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ cardId, quality }: { cardId: string; quality: number }) => {
      if (!user || !currentCard) return;

      const result = calculateSM2({
        quality,
        easeFactor: currentCard.ease_factor,
        interval: currentCard.interval,
        repetitions: currentCard.repetitions,
      });

      // Update flashcard
      const { error: updateError } = await supabase
        .from('flashcards')
        .update({
          ease_factor: result.easeFactor,
          interval: result.interval,
          repetitions: result.repetitions,
          next_review_at: result.nextReviewAt.toISOString(),
        })
        .eq('id', cardId);

      if (updateError) throw updateError;

      // Log review
      const { error: logError } = await supabase
        .from('flashcard_reviews')
        .insert({
          flashcard_id: cardId,
          user_id: user.id,
          quality,
          ease_factor_before: currentCard.ease_factor,
          ease_factor_after: result.easeFactor,
          interval_before: currentCard.interval,
          interval_after: result.interval,
        });

      if (logError) throw logError;

      return result;
    },
    onSuccess: (result) => {
      if (result) {
        toast.success(`Próxima revisão: ${formatInterval(result.interval)}`);
      }
      setIsFlipped(false);
      
      // Move to next card or reset
      if (currentIndex < cardsToReview.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setCurrentIndex(0);
        queryClient.invalidateQueries({ queryKey: ['flashcards'] });
        toast.success('Sessão de revisão concluída!');
      }
    },
    onError: () => {
      toast.error('Erro ao salvar revisão');
    },
  });

  // Add flashcard mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from('flashcards')
        .insert({
          user_id: user.id,
          word: newCard.word,
          translation: newCard.translation,
          definition: newCard.definition || null,
          example_sentence: newCard.example_sentence || null,
          pronunciation: newCard.pronunciation || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Flashcard adicionado!');
      setNewCard({ word: '', translation: '', definition: '', example_sentence: '', pronunciation: '' });
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
    },
    onError: () => {
      toast.error('Erro ao adicionar flashcard');
    },
  });

  // Archive flashcard mutation (soft delete)
  const archiveMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase
        .from('flashcards')
        .update({ is_active: false })
        .eq('id', cardId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Flashcard arquivado! Pode reativá-lo mais tarde.');
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      queryClient.invalidateQueries({ queryKey: ['flashcards-archived'] });
    },
    onError: () => {
      toast.error('Erro ao arquivar flashcard');
    },
  });

  // Restore flashcard mutation
  const restoreMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase
        .from('flashcards')
        .update({ is_active: true })
        .eq('id', cardId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Flashcard reativado!');
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      queryClient.invalidateQueries({ queryKey: ['flashcards-archived'] });
    },
    onError: () => {
      toast.error('Erro ao reativar flashcard');
    },
  });

  const handleReview = (quality: number) => {
    if (!currentCard) return;
    reviewMutation.mutate({ cardId: currentCard.id, quality });
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCard.word || !newCard.translation) {
      toast.error('Preencha a palavra e a tradução');
      return;
    }
    addMutation.mutate();
  };

  const speakWord = (word: string) => {
    const language = detectLanguage(word);
    let voice = language === 'en' ? englishVoice : portugueseVoice;
    
    console.log(`🔊 Tentando falar: "${word}" | Idioma detectado: ${language}`);
    
    // Try to get voice dynamically if not loaded
    if (!voice) {
      console.warn('⚠️ Voz não carregada ainda, tentando obter...');
      const voices = speechSynthesis.getVoices();
      
      if (voices.length > 0) {
        if (language === 'en') {
          // ONLY get English voice - NO Portuguese fallback
          voice = voices.find(v => v.lang.startsWith('en') && v.name.includes('English')) || 
                  voices.find(v => v.lang.startsWith('en'));
          
          if (voice) {
            console.log('✅ Voz em INGLÊS obtida:', voice.name, voice.lang);
            setEnglishVoice(voice);
          } else {
            console.error('❌ NENHUMA voz em INGLÊS disponível');
            console.error('⚠️ NÃO vou falar palavra em inglês com voz portuguesa');
            toast.error('Nenhuma voz em inglês instalada', {
              description: 'Instale vozes em inglês no Windows para ouvir palavras em inglês.',
              duration: 10000,
            });
            return;
          }
        } else {
          // Get Portuguese voice
          voice = voices.find(v => v.lang.startsWith('pt'));
          if (voice) {
            console.log('✅ Voz em PORTUGUÊS obtida:', voice.name, voice.lang);
            setPortugueseVoice(voice);
          } else {
            console.error('❌ Nenhuma voz em português disponível');
            toast.error('Voz em português não disponível');
            return;
          }
        }
      } else {
        console.error('❌ Nenhuma voz disponível no sistema');
        toast.error('Nenhuma voz disponível. Recarregue a página.');
        return;
      }
    }
    
    // CRITICAL: Verify the voice language matches detected language
    const voiceLang = voice.lang.substring(0, 2); // 'en' or 'pt'
    if (voiceLang !== language) {
      console.error(`❌ ERRO: Voz (${voice.lang}) NÃO corresponde ao idioma (${language})`);
      console.error(`⚠️ Palavra "${word}" é ${language === 'en' ? 'INGLÊS' : 'PORTUGUÊS'} mas voz é ${voiceLang}`);
      
      toast.error(`Voz em ${language === 'en' ? 'inglês' : 'português'} não disponível`, {
        description: `Instale vozes em ${language === 'en' ? 'inglês' : 'português'} no Windows.`,
        duration: 10000,
      });
      return;
    }

    console.log(`✅ Usando voz ${language === 'en' ? 'INGLÊS' : 'PORTUGUÊS'}:`, voice.name, voice.lang);
    
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = language === 'en' ? 'en-US' : 'pt-PT';
    utterance.rate = 0.85;
    utterance.voice = voice;
    
    utterance.onstart = () => console.log('▶️ Fala iniciou');
    utterance.onend = () => console.log('✓ Fala terminou');
    utterance.onerror = (e) => {
      console.error('❌ Erro na fala:', e);
      toast.error('Erro ao reproduzir áudio');
    };
    
    speechSynthesis.speak(utterance);
  };

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < cardsToReview.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full max-w-md mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
          <p className="text-muted-foreground">
            Revise o seu vocabulário com repetição espaçada
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddCard}>
              <DialogHeader>
                <DialogTitle>Novo Flashcard</DialogTitle>
                <DialogDescription>
                  Adicione uma nova palavra ao seu vocabulário
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="word">Palavra (Inglês) *</Label>
                  <Input
                    id="word"
                    value={newCard.word}
                    onChange={(e) => setNewCard({ ...newCard, word: e.target.value })}
                    placeholder="Hello"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="translation">Tradução (Português) *</Label>
                  <Input
                    id="translation"
                    value={newCard.translation}
                    onChange={(e) => setNewCard({ ...newCard, translation: e.target.value })}
                    placeholder="Olá"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pronunciation">Pronúncia</Label>
                  <Input
                    id="pronunciation"
                    value={newCard.pronunciation}
                    onChange={(e) => setNewCard({ ...newCard, pronunciation: e.target.value })}
                    placeholder="/həˈloʊ/"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="definition">Definição</Label>
                  <Textarea
                    id="definition"
                    value={newCard.definition}
                    onChange={(e) => setNewCard({ ...newCard, definition: e.target.value })}
                    placeholder="A greeting used when meeting someone"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="example">Exemplo</Label>
                  <Textarea
                    id="example"
                    value={newCard.example_sentence}
                    onChange={(e) => setNewCard({ ...newCard, example_sentence: e.target.value })}
                    placeholder="Hello, how are you?"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Adicionar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <ImportVocabularyModal open={isImportModalOpen} onOpenChange={setIsImportModalOpen} />

      <Tabs defaultValue="review" className="space-y-6">
        <TabsList>
          <TabsTrigger value="review">Revisar</TabsTrigger>
          <TabsTrigger value="all">Todos os Cards</TabsTrigger>
          <TabsTrigger value="archived">
            Arquivados ({archivedFlashcards?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-6">
          {/* Mode selector */}
          <div className="flex gap-2">
            <Button
              variant={reviewMode === 'due' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setReviewMode('due'); setCurrentIndex(0); setIsFlipped(false); }}
            >
              Pendentes ({flashcards?.filter(c => isDueForReview(c.next_review_at)).length || 0})
            </Button>
            <Button
              variant={reviewMode === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setReviewMode('all'); setCurrentIndex(0); setIsFlipped(false); }}
            >
              Todos ({flashcards?.length || 0})
            </Button>
          </div>

          {cardsToReview.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-primary mb-4" />
                <h3 className="text-lg font-medium">
                  {reviewMode === 'due' 
                    ? 'Nenhum card pendente!' 
                    : 'Nenhum flashcard ainda'}
                </h3>
                <p className="text-muted-foreground">
                  {reviewMode === 'due'
                    ? 'Volte mais tarde ou revise todos os cards.'
                    : 'Clique em "Adicionar" para criar novos flashcards.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Card {currentIndex + 1} de {cardsToReview.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>

              {/* Card */}
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>

                <Card 
                  className="flex-1 max-w-lg mx-auto cursor-pointer min-h-[300px] transition-all duration-300"
                  onClick={handleFlip}
                >
                  <CardContent className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center">
                    {!isFlipped ? (
                      <>
                        <p className="text-3xl font-bold mb-2">{currentCard?.word}</p>
                        {currentCard?.pronunciation && (
                          <p className="text-muted-foreground mb-4">{currentCard.pronunciation}</p>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); speakWord(currentCard?.word || ''); }}
                        >
                          <Volume2 className="h-5 w-5" />
                        </Button>
                        <p className="text-sm text-muted-foreground mt-4">
                          Clique para ver a resposta
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold mb-2">{currentCard?.translation}</p>
                        {currentCard?.definition && (
                          <p className="text-muted-foreground mb-2">{currentCard.definition}</p>
                        )}
                        {currentCard?.example_sentence && (
                          <p className="text-sm italic text-muted-foreground">
                            "{currentCard.example_sentence}"
                          </p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  disabled={currentIndex === cardsToReview.length - 1}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>

              {/* Rating buttons */}
              {isFlipped && (
                <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                  {[0, 1, 3, 5].map((quality) => (
                    <Button
                      key={quality}
                      variant={getQualityVariant(quality)}
                      onClick={() => handleReview(quality)}
                      disabled={reviewMutation.isPending}
                      className="flex-1 min-w-[80px]"
                    >
                      {reviewMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        getQualityLabel(quality)
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="all">
          {!flashcards || flashcards.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum flashcard ainda</h3>
                <p className="text-muted-foreground">
                  Adicione palavras através da leitura de textos.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {flashcards.map((card) => (
                <Card key={card.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{card.word}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={isDueForReview(card.next_review_at) ? 'destructive' : 'secondary'}>
                          {isDueForReview(card.next_review_at) ? 'Pendente' : formatInterval(card.interval)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setCardToArchive(card)}
                          disabled={archiveMutation.isPending}
                          title="Arquivar flashcard"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {card.pronunciation && (
                      <CardDescription>{card.pronunciation}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{card.translation}</p>
                    {card.definition && (
                      <p className="text-sm text-muted-foreground mt-1">{card.definition}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="archived">
          {isLoadingArchived ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : !archivedFlashcards || archivedFlashcards.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <Archive className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum flashcard arquivado</h3>
                <p className="text-muted-foreground">
                  Flashcards arquivados aparecerão aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {archivedFlashcards.map((card) => (
                <Card key={card.id} className="opacity-75">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{card.word}</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreMutation.mutate(card.id)}
                        disabled={restoreMutation.isPending}
                        className="gap-1"
                      >
                        <ArchiveRestore className="h-4 w-4" />
                        Reativar
                      </Button>
                    </div>
                    {card.pronunciation && (
                      <CardDescription>{card.pronunciation}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{card.translation}</p>
                    {card.definition && (
                      <p className="text-sm text-muted-foreground mt-1">{card.definition}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!cardToArchive} onOpenChange={(open) => !open && setCardToArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar flashcard?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja arquivar o flashcard "{cardToArchive?.word}"? 
              Pode reativá-lo mais tarde na aba "Arquivados".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (cardToArchive) {
                  archiveMutation.mutate(cardToArchive.id);
                  setCardToArchive(null);
                }
              }}
            >
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function FlashcardsPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <FlashcardsContent />
      </AppLayout>
    </AuthGuard>
  );
}
