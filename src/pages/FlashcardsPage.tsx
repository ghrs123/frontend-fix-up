import { useState, useMemo } from 'react';
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
import { toast } from 'sonner';
import { 
  Layers, 
  RotateCcw, 
  Volume2, 
  CheckCircle2, 
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Trash2
} from 'lucide-react';
import { calculateSM2, isDueForReview, formatInterval, getQualityLabel, getQualityVariant } from '@/lib/sm2';
import { cn } from '@/lib/utils';

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
}

function FlashcardsContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewMode, setReviewMode] = useState<'due' | 'all'>('due');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCard, setNewCard] = useState({
    word: '',
    translation: '',
    definition: '',
    example_sentence: '',
    pronunciation: '',
  });

  // Fetch flashcards
  const { data: flashcards, isLoading } = useQuery({
    queryKey: ['flashcards', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .order('next_review_at', { ascending: true });

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

  // Delete flashcard mutation
  const deleteMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', cardId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Flashcard removido!');
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
    },
    onError: () => {
      toast.error('Erro ao remover flashcard');
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

  // Get the best English voice available
  const getEnglishVoice = (): SpeechSynthesisVoice | null => {
    const voices = speechSynthesis.getVoices();
    
    const preferredVoices = [
      'Google UK English Female',
      'Google UK English Male', 
      'Google US English',
      'Microsoft Zira',
      'Microsoft David',
      'Samantha',
      'Daniel',
    ];
    
    for (const preferred of preferredVoices) {
      const voice = voices.find(v => v.name.includes(preferred));
      if (voice) return voice;
    }
    
    return voices.find(v => v.lang.startsWith('en')) || null;
  };

  const speakWord = (word: string) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-GB';
    utterance.rate = 0.85;
    
    const voice = getEnglishVoice();
    if (voice) utterance.voice = voice;
    
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

      <Tabs defaultValue="review" className="space-y-6">
        <TabsList>
          <TabsTrigger value="review">Revisar</TabsTrigger>
          <TabsTrigger value="all">Todos os Cards</TabsTrigger>
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
                      <Badge variant={isDueForReview(card.next_review_at) ? 'destructive' : 'secondary'}>
                        {isDueForReview(card.next_review_at) ? 'Pendente' : formatInterval(card.interval)}
                      </Badge>
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
