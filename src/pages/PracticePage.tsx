import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { AuthGuard } from '@/components/AuthGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  PenLine, 
  Languages, 
  FileQuestion,
  CheckCircle2,
  RotateCcw,
  Eye,
  EyeOff,
  Lightbulb,
  Volume2,
  Sparkles
} from 'lucide-react';
import { AIPracticeExercises } from '@/components/AIPracticeExercises';

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

interface Text {
  id: string;
  title: string;
  content: string;
  content_portuguese: string | null;
  difficulty: DifficultyLevel;
  category: string;
}

const difficultyColors: Record<DifficultyLevel, string> = {
  beginner: 'bg-green-500/10 text-green-600',
  intermediate: 'bg-yellow-500/10 text-yellow-600',
  advanced: 'bg-red-500/10 text-red-600',
};

// Translation exercise component
function TranslationExercise({ texts }: { texts: Text[] }) {
  const [selectedText, setSelectedText] = useState<Text | null>(null);
  const [userTranslation, setUserTranslation] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [direction, setDirection] = useState<'en-pt' | 'pt-en'>('en-pt');

  const getVoiceForLanguage = (lang: string): SpeechSynthesisVoice | null => {
    const voices = speechSynthesis.getVoices();
    
    if (lang.startsWith('en')) {
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
    } else if (lang.startsWith('pt')) {
      const preferredVoices = [
        'Google português',
        'Microsoft Maria',
        'Joana',
        'Luciana',
      ];
      
      for (const preferred of preferredVoices) {
        const voice = voices.find(v => v.name.includes(preferred));
        if (voice) return voice;
      }
    }
    
    return voices.find(v => v.lang.startsWith(lang.substring(0, 2))) || null;
  };

  const handleSelectText = (textId: string) => {
    const text = texts.find(t => t.id === textId);
    if (text) {
      setSelectedText(text);
      setUserTranslation('');
      setShowAnswer(false);
    }
  };

  const sourceText = direction === 'en-pt' ? selectedText?.content : selectedText?.content_portuguese;
  const targetText = direction === 'en-pt' ? selectedText?.content_portuguese : selectedText?.content;

  const speakText = () => {
    if (!sourceText) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(sourceText);
    utterance.lang = direction === 'en-pt' ? 'en-US' : 'pt-PT';
    utterance.rate = 0.9;
    
    const voice = getVoiceForLanguage(utterance.lang);
    if (voice) utterance.voice = voice;
    
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Select onValueChange={handleSelectText}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecione um texto..." />
          </SelectTrigger>
          <SelectContent>
            {texts.filter(t => t.content_portuguese).map(text => (
              <SelectItem key={text.id} value={text.id}>
                {text.title} ({text.difficulty})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={direction} onValueChange={(v) => setDirection(v as 'en-pt' | 'pt-en')}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en-pt">Inglês → Português</SelectItem>
            <SelectItem value="pt-en">Português → Inglês</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedText ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Texto Original ({direction === 'en-pt' ? 'EN' : 'PT'})
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={speakText}>
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-muted-foreground leading-relaxed">{sourceText}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PenLine className="h-5 w-5" />
                Sua Tradução ({direction === 'en-pt' ? 'PT' : 'EN'})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={userTranslation}
                onChange={(e) => setUserTranslation(e.target.value)}
                placeholder="Escreva a sua tradução aqui..."
                rows={8}
              />
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="flex-1"
                >
                  {showAnswer ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  {showAnswer ? 'Esconder' : 'Ver Resposta'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => { setUserTranslation(''); setShowAnswer(false); }}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {showAnswer && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium mb-2">Tradução de referência:</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{targetText}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="text-center">
            <Languages className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Selecione um texto</h3>
            <p className="text-muted-foreground">
              Escolha um texto para praticar a tradução
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Writing feedback types
interface GrammarError {
  error: string;
  correction: string;
  explanation: string;
}

interface WritingFeedback {
  score: number;
  grammar: GrammarError[];
  vocabulary: string;
  structure: string;
  positives: string[];
  suggestions: string[];
  corrected_text: string;
}

// Writing exercise component
function WritingExercise() {
  const [prompt, setPrompt] = useState<{ topic: string; hints: string[] } | null>(null);
  const [userWriting, setUserWriting] = useState('');
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showCorrected, setShowCorrected] = useState(false);

  const prompts = [
    { topic: "Descreva a sua rotina diária em inglês", hints: ["Use presente simples", "Inclua horários", "Mencione atividades"] },
    { topic: "Escreva sobre o seu lugar favorito", hints: ["Use adjetivos descritivos", "Explique por que gosta", "Descreva o ambiente"] },
    { topic: "Conte sobre uma viagem memorável", hints: ["Use passado simples", "Descreva os eventos", "Inclua sentimentos"] },
    { topic: "Escreva uma carta para um amigo", hints: ["Use saudações formais", "Faça perguntas", "Partilhe novidades"] },
    { topic: "Descreva o seu trabalho ou estudos", hints: ["Use vocabulário profissional", "Explique responsabilidades", "Mencione desafios"] },
    { topic: "Escreva sobre os seus hobbies", hints: ["Use present simple para rotinas", "Explique por que gosta", "Dê exemplos"] },
    { topic: "Descreva a sua família", hints: ["Use vocabulário de família", "Descreva características", "Mencione atividades em família"] },
    { topic: "Escreva sobre o seu fim de semana ideal", hints: ["Use would para hipóteses", "Descreva atividades", "Inclua lugares"] },
  ];

  const getRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * prompts.length);
    setPrompt(prompts[randomIndex]);
    setUserWriting('');
    setFeedback(null);
    setShowCorrected(false);
  };

  const getAIFeedback = async () => {
    if (!userWriting.trim() || wordCount < 5) {
      toast.error('Escreve pelo menos algumas palavras para receber feedback.');
      return;
    }
    setIsReviewing(true);
    setFeedback(null);
    try {
      const { data, error } = await supabase.functions.invoke('review-writing', {
        body: { text: userWriting, topic: prompt?.topic },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setFeedback(data);
      toast.success('Feedback recebido!');
    } catch (err: any) {
      console.error('Review writing error:', err);
      toast.error('Erro ao obter feedback. Tenta novamente.');
    } finally {
      setIsReviewing(false);
    }
  };

  const wordCount = userWriting.trim().split(/\s+/).filter(w => w.length > 0).length;

  const scoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 5) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">Exercício de Escrita</h3>
          <p className="text-sm text-muted-foreground">Pratique a sua escrita em inglês e receba feedback da IA</p>
        </div>
        <Button onClick={getRandomPrompt}>
          <Lightbulb className="mr-2 h-4 w-4" />
          Novo Tema
        </Button>
      </div>

      {prompt ? (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Tema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-medium">{prompt.topic}</p>
                <div>
                  <p className="text-sm font-medium mb-2">Dicas:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {prompt.hints.map((hint, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        {hint}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Sua Escrita</CardTitle>
                  <Badge variant="secondary">{wordCount} palavras</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={userWriting}
                  onChange={(e) => setUserWriting(e.target.value)}
                  placeholder="Escreva aqui em inglês..."
                  rows={12}
                  className="resize-none"
                />
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => { setUserWriting(''); setFeedback(null); setShowCorrected(false); }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Limpar
                  </Button>
                  <Button onClick={getAIFeedback} disabled={isReviewing || wordCount < 5}>
                    {isReviewing ? (
                      <><Sparkles className="mr-2 h-4 w-4 animate-spin" /> A analisar...</>
                    ) : (
                      <><Sparkles className="mr-2 h-4 w-4" /> Feedback IA</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Feedback Section */}
          {feedback && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Feedback da IA
              </h3>

              {/* Score */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className={`text-4xl font-bold ${scoreColor(feedback.score)}`}>
                      {feedback.score}/10
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2 flex-wrap">
                        {feedback.positives.map((p, i) => (
                          <Badge key={i} variant="secondary" className="bg-green-500/10 text-green-600">
                            ✓ {p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Grammar Errors */}
              {feedback.grammar.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Erros Gramaticais ({feedback.grammar.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {feedback.grammar.map((g, i) => (
                      <div key={i} className="rounded-lg border p-3 space-y-1">
                        <div className="flex items-start gap-2">
                          <span className="text-destructive line-through text-sm">{g.error}</span>
                          <span className="text-primary text-sm font-medium">→ {g.correction}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{g.explanation}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Vocabulary & Structure */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="text-lg">Vocabulário</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-muted-foreground">{feedback.vocabulary}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-lg">Estrutura</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-muted-foreground">{feedback.structure}</p></CardContent>
                </Card>
              </div>

              {/* Suggestions */}
              {feedback.suggestions.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">Sugestões de Melhoria</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feedback.suggestions.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Lightbulb className="h-4 w-4 mt-0.5 text-yellow-500 shrink-0" />
                          <span className="text-muted-foreground">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Corrected Text */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Texto Corrigido</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setShowCorrected(!showCorrected)}>
                      {showCorrected ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                      {showCorrected ? 'Esconder' : 'Ver'}
                    </Button>
                  </div>
                </CardHeader>
                {showCorrected && (
                  <CardContent>
                    <p className="text-sm whitespace-pre-line text-muted-foreground leading-relaxed">
                      {feedback.corrected_text}
                    </p>
                  </CardContent>
                )}
              </Card>
            </div>
          )}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="text-center">
            <PenLine className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Comece a escrever</h3>
            <p className="text-muted-foreground mb-4">
              Clique em "Novo Tema" para obter um tópico de escrita
            </p>
            <Button onClick={getRandomPrompt}>
              <Lightbulb className="mr-2 h-4 w-4" />
              Novo Tema
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Comprehension exercise component
function ComprehensionExercise({ texts }: { texts: Text[] }) {
  const [selectedText, setSelectedText] = useState<Text | null>(null);
  const [showText, setShowText] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});

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

  const handleSelectText = (textId: string) => {
    const text = texts.find(t => t.id === textId);
    if (text) {
      setSelectedText(text);
      setAnswers({});
      setShowText(true);
    }
  };

  const speakText = () => {
    if (!selectedText?.content) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(selectedText.content);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    
    const voice = getEnglishVoice();
    if (voice) utterance.voice = voice;
    
    speechSynthesis.speak(utterance);
  };

  const questions = [
    { id: 'main-idea', question: 'Qual é a ideia principal do texto?' },
    { id: 'vocabulary', question: 'Liste 3 palavras novas que você aprendeu:' },
    { id: 'summary', question: 'Resuma o texto em 2-3 frases:' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Select onValueChange={handleSelectText}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecione um texto..." />
          </SelectTrigger>
          <SelectContent>
            {texts.map(text => (
              <SelectItem key={text.id} value={text.id}>
                {text.title} ({text.difficulty})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedText ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{selectedText.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={difficultyColors[selectedText.difficulty]}>
                    {selectedText.difficulty}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={speakText}>
                    <Volume2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowText(!showText)}
                  >
                    {showText ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showText ? (
                <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
                  {selectedText.content}
                </p>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <EyeOff className="mx-auto h-8 w-8 mb-2" />
                  <p>Texto escondido para testar a memória</p>
                  <Button variant="link" onClick={() => setShowText(true)}>
                    Mostrar texto
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Questões de Compreensão</CardTitle>
              <CardDescription>Responda às perguntas sobre o texto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((q, idx) => (
                <div key={q.id} className="space-y-2">
                  <label className="font-medium text-sm">
                    {idx + 1}. {q.question}
                  </label>
                  <Textarea
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    placeholder="Escreva a sua resposta..."
                    rows={3}
                  />
                </div>
              ))}

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setAnswers({})}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Limpar
                </Button>
                <Button onClick={() => toast.success('Respostas guardadas! Continue praticando.')}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Concluir
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="text-center">
            <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Selecione um texto</h3>
            <p className="text-muted-foreground">
              Escolha um texto para praticar a compreensão
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PracticeContent() {
  const { data: texts, isLoading } = useQuery({
    queryKey: ['practice-texts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('texts')
        .select('*')
        .order('difficulty', { ascending: true });
      if (error) throw error;
      return data as Text[];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Prática</h1>
        <p className="text-muted-foreground">
          Exercícios de tradução, escrita e compreensão
        </p>
      </div>

      <Tabs defaultValue="ai" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="ai">
            <Sparkles className="mr-2 h-4 w-4 hidden sm:inline" />
            IA
          </TabsTrigger>
          <TabsTrigger value="translation">
            <Languages className="mr-2 h-4 w-4 hidden sm:inline" />
            Tradução
          </TabsTrigger>
          <TabsTrigger value="writing">
            <PenLine className="mr-2 h-4 w-4 hidden sm:inline" />
            Escrita
          </TabsTrigger>
          <TabsTrigger value="comprehension">
            <FileQuestion className="mr-2 h-4 w-4 hidden sm:inline" />
            Compreensão
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai">
          <AIPracticeExercises />
        </TabsContent>

        <TabsContent value="translation">
          <TranslationExercise texts={texts || []} />
        </TabsContent>

        <TabsContent value="writing">
          <WritingExercise />
        </TabsContent>

        <TabsContent value="comprehension">
          <ComprehensionExercise texts={texts || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function PracticePage() {
  return (
    <AuthGuard>
      <AppLayout>
        <PracticeContent />
      </AppLayout>
    </AuthGuard>
  );
}
