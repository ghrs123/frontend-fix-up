import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { AuthGuard } from '@/components/AuthGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  GraduationCap, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw,
  Trophy,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

interface GrammarTopic {
  id: string;
  name: string;
  category: string;
  explanation: string;
  explanation_portuguese: string | null;
  examples: { en: string; pt?: string }[];
  difficulty: DifficultyLevel;
}

interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'fill_blank';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: DifficultyLevel;
}

const difficultyColors: Record<DifficultyLevel, string> = {
  beginner: 'bg-green-500/10 text-green-600 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-600 border-red-500/20',
};

// Generate quiz questions from grammar topics
function generateQuestionsFromTopics(topics: GrammarTopic[]): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  
  topics.forEach((topic) => {
    // Generate multiple choice questions from examples
    if (topic.examples && topic.examples.length >= 2) {
      const correctExample = topic.examples[0];
      const wrongOptions = generateWrongOptions(correctExample.en, topic.examples.slice(1));
      
      questions.push({
        id: `${topic.id}-mc-1`,
        type: 'multiple_choice',
        question: `Qual é a forma correta de usar ${topic.name}?`,
        options: shuffleArray([correctExample.en, ...wrongOptions]),
        correctAnswer: correctExample.en,
        explanation: topic.explanation_portuguese || topic.explanation,
        topic: topic.name,
        difficulty: topic.difficulty,
      });
    }

    // Generate fill-in-the-blank questions
    topic.examples.forEach((example, idx) => {
      const blankQuestion = createFillBlank(example.en);
      if (blankQuestion) {
        questions.push({
          id: `${topic.id}-fb-${idx}`,
          type: 'fill_blank',
          question: blankQuestion.question,
          correctAnswer: blankQuestion.answer,
          explanation: example.pt || topic.explanation_portuguese || topic.explanation,
          topic: topic.name,
          difficulty: topic.difficulty,
        });
      }
    });
  });

  return shuffleArray(questions);
}

function generateWrongOptions(correct: string, examples: { en: string }[]): string[] {
  const wrongOptions: string[] = [];
  
  examples.slice(0, 2).forEach(ex => {
    if (ex.en !== correct) {
      wrongOptions.push(ex.en);
    }
  });
  
  while (wrongOptions.length < 3) {
    const variations = [
      correct.replace(/\bam\b/g, 'is').replace(/\bis\b/g, 'am'),
      correct.replace(/\bhave\b/g, 'has').replace(/\bhas\b/g, 'have'),
      correct.replace(/\bwas\b/g, 'were').replace(/\bwere\b/g, 'was'),
    ].filter(v => v !== correct && !wrongOptions.includes(v));
    
    if (variations.length > 0) {
      wrongOptions.push(variations[0]);
    } else {
      break;
    }
  }
  
  return wrongOptions.slice(0, 3);
}

function createFillBlank(sentence: string): { question: string; answer: string } | null {
  const words = sentence.split(' ');
  if (words.length < 4) return null;
  
  const verbPatterns = /^(am|is|are|was|were|have|has|had|do|does|did|will|would|can|could|should|must|been|being|worked|works|working|played|plays|playing|went|goes|going|said|says|saying)$/i;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[.,!?]/g, '');
    if (verbPatterns.test(word) && word.length > 1) {
      const question = [...words.slice(0, i), '_____', ...words.slice(i + 1)].join(' ');
      return { question, answer: word.toLowerCase() };
    }
  }
  
  if (words.length > 3) {
    const idx = Math.floor(Math.random() * (words.length - 2)) + 1;
    const word = words[idx].replace(/[.,!?]/g, '');
    const question = [...words.slice(0, idx), '_____', ...words.slice(idx + 1)].join(' ');
    return { question, answer: word.toLowerCase() };
  }
  
  return null;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function QuizContent() {
  const [difficulty, setDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [fillAnswer, setFillAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [quizStarted, setQuizStarted] = useState(false);

  const { data: topics, isLoading } = useQuery({
    queryKey: ['quiz-topics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grammar_topics')
        .select('*')
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data.map(t => ({ ...t, examples: (t.examples as { en: string; pt?: string }[]) || [] })) as GrammarTopic[];
    },
  });

  const questions = useMemo(() => {
    if (!topics) return [];
    const filtered = difficulty === 'all' ? topics : topics.filter(t => t.difficulty === difficulty);
    return generateQuestionsFromTopics(filtered).slice(0, 10);
  }, [topics, difficulty]);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const handleSubmit = () => {
    if (!currentQuestion) return;
    
    const answer = currentQuestion.type === 'multiple_choice' ? selectedAnswer : fillAnswer.trim().toLowerCase();
    const correct = answer === currentQuestion.correctAnswer.toLowerCase();
    
    setIsCorrect(correct);
    setShowResult(true);
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));

    if (correct) {
      toast.success('Correto! 🎉');
    } else {
      toast.error('Incorreto. Veja a explicação.');
    }
  };

  const handleNext = () => {
    setShowResult(false);
    setSelectedAnswer('');
    setFillAnswer('');
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer('');
    setFillAnswer('');
    setShowResult(false);
    setScore({ correct: 0, total: 0 });
    setQuizStarted(false);
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setCurrentIndex(0);
    setScore({ correct: 0, total: 0 });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full max-w-2xl mx-auto" />
      </div>
    );
  }

  // Quiz completed
  if (quizStarted && currentIndex >= questions.length - 1 && showResult) {
    const percentage = Math.round((score.correct / score.total) * 100);
    
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quiz de Gramática</h1>
          <p className="text-muted-foreground">Teste os seus conhecimentos</p>
        </div>

        <Card className="max-w-2xl mx-auto py-12">
          <CardContent className="text-center space-y-6">
            <Trophy className="mx-auto h-16 w-16 text-yellow-500" />
            <div>
              <h2 className="text-2xl font-bold">Quiz Concluído!</h2>
              <p className="text-muted-foreground mt-2">
                Você acertou {score.correct} de {score.total} questões
              </p>
            </div>
            
            <div className="text-5xl font-bold text-primary">
              {percentage}%
            </div>
            
            <div className="flex justify-center gap-4">
              <Button onClick={handleRestart} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Recomeçar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz not started
  if (!quizStarted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quiz de Gramática</h1>
          <p className="text-muted-foreground">Teste os seus conhecimentos de gramática inglesa</p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Pronto para o desafio?</CardTitle>
            <CardDescription>
              Responda a 10 questões sobre gramática inglesa e teste os seus conhecimentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Dificuldade</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as DifficultyLevel | 'all')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="beginner">Iniciante</SelectItem>
                  <SelectItem value="intermediate">Intermediário</SelectItem>
                  <SelectItem value="advanced">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>• Questões de múltipla escolha e preenchimento de lacunas</p>
              <p>• Explicações detalhadas para cada resposta</p>
              <p>• {questions.length} questões disponíveis</p>
            </div>

            <Button onClick={startQuiz} className="w-full" size="lg" disabled={questions.length === 0}>
              Começar Quiz
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz in progress
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quiz de Gramática</h1>
        <p className="text-muted-foreground">Teste os seus conhecimentos</p>
      </div>

      {/* Progress */}
      <div className="max-w-2xl mx-auto space-y-2">
        <div className="flex justify-between text-sm">
          <span>Questão {currentIndex + 1} de {questions.length}</span>
          <span>{score.correct}/{score.total} corretas</span>
        </div>
        <Progress value={progress} />
      </div>

      {currentQuestion && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={difficultyColors[currentQuestion.difficulty]}>
                {currentQuestion.difficulty}
              </Badge>
              <Badge variant="secondary">{currentQuestion.topic}</Badge>
            </div>
            <CardTitle className="mt-4 text-xl">
              {currentQuestion.type === 'fill_blank' 
                ? 'Complete a frase:' 
                : 'Escolha a opção correta:'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg font-medium">{currentQuestion.question}</p>

            {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
              <RadioGroup 
                value={selectedAnswer} 
                onValueChange={setSelectedAnswer}
                disabled={showResult}
              >
                {currentQuestion.options.map((option, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "flex items-center space-x-3 rounded-lg border p-4 transition-colors",
                      showResult && option === currentQuestion.correctAnswer && "border-green-500 bg-green-50 dark:bg-green-950/20",
                      showResult && option === selectedAnswer && option !== currentQuestion.correctAnswer && "border-red-500 bg-red-50 dark:bg-red-950/20",
                      !showResult && "hover:bg-muted/50"
                    )}
                  >
                    <RadioGroupItem value={option} id={`option-${idx}`} />
                    <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                    {showResult && option === currentQuestion.correctAnswer && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    {showResult && option === selectedAnswer && option !== currentQuestion.correctAnswer && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === 'fill_blank' && (
              <div className="space-y-2">
                <Input
                  value={fillAnswer}
                  onChange={(e) => setFillAnswer(e.target.value)}
                  placeholder="Escreva a resposta..."
                  disabled={showResult}
                  className={cn(
                    showResult && isCorrect && "border-green-500",
                    showResult && !isCorrect && "border-red-500"
                  )}
                />
                {showResult && (
                  <p className={cn(
                    "text-sm",
                    isCorrect ? "text-green-600" : "text-red-600"
                  )}>
                    Resposta correta: <strong>{currentQuestion.correctAnswer}</strong>
                  </p>
                )}
              </div>
            )}

            {showResult && (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium mb-1">Explicação:</p>
                <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              {!showResult ? (
                <Button 
                  onClick={handleSubmit} 
                  disabled={
                    (currentQuestion.type === 'multiple_choice' && !selectedAnswer) ||
                    (currentQuestion.type === 'fill_blank' && !fillAnswer.trim())
                  }
                >
                  Verificar
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  {currentIndex < questions.length - 1 ? (
                    <>
                      Próxima
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    'Ver Resultado'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function QuizPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <QuizContent />
      </AppLayout>
    </AuthGuard>
  );
}
