import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';

type ExerciseType = 'mixed' | 'fill-blank' | 'translate' | 'match';
type Difficulty = 'beginner' | 'intermediate' | 'advanced';

interface FillBlankExercise {
  type: 'fill-blank';
  instruction: string;
  sentence: string;
  answer: string;
  hint?: string;
  options?: string[];
}

interface TranslateExercise {
  type: 'translate';
  instruction: string;
  sentence: string;
  answer: string;
  direction: 'en-pt' | 'pt-en';
}

interface MatchExercise {
  type: 'match';
  instruction: string;
  pairs: { english: string; portuguese: string }[];
}

type Exercise = FillBlankExercise | TranslateExercise | MatchExercise;

function FillBlankCard({ exercise, index }: { exercise: FillBlankExercise; index: number }) {
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const isCorrect = answer.trim().toLowerCase() === exercise.answer.toLowerCase();

  return (
    <Card className={checked ? (isCorrect ? 'border-green-500/50' : 'border-red-500/50') : ''}>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{index + 1}</Badge>
          <span className="text-sm text-muted-foreground">{exercise.instruction}</span>
        </div>
        <p className="text-lg font-medium">{exercise.sentence}</p>
        {exercise.hint && <p className="text-sm text-muted-foreground">💡 {exercise.hint}</p>}
        {exercise.options ? (
          <div className="grid grid-cols-2 gap-2">
            {exercise.options.map((opt) => (
              <Button
                key={opt}
                variant={answer === opt ? (checked ? (isCorrect ? 'default' : 'destructive') : 'default') : 'outline'}
                size="sm"
                onClick={() => { if (!checked) setAnswer(opt); }}
                disabled={checked}
              >
                {opt}
              </Button>
            ))}
          </div>
        ) : (
          <Input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Escreve a resposta..."
            disabled={checked}
          />
        )}
        <div className="flex items-center gap-2">
          {!checked ? (
            <Button size="sm" onClick={() => setChecked(true)} disabled={!answer}>
              Verificar
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <span className="flex items-center gap-1 text-primary text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" /> Correto!
                </span>
              ) : (
                <span className="flex items-center gap-1 text-destructive text-sm">
                  <XCircle className="h-4 w-4" /> Resposta: <strong>{exercise.answer}</strong>
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TranslateCard({ exercise, index }: { exercise: TranslateExercise; index: number }) {
  const [answer, setAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{index + 1}</Badge>
          <Badge variant="outline">{exercise.direction === 'en-pt' ? 'EN → PT' : 'PT → EN'}</Badge>
          <span className="text-sm text-muted-foreground">{exercise.instruction}</span>
        </div>
        <p className="text-lg font-medium">{exercise.sentence}</p>
        <Input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Escreve a tradução..."
        />
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowAnswer(!showAnswer)}>
            {showAnswer ? 'Esconder' : 'Ver Resposta'}
          </Button>
        </div>
        {showAnswer && (
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm"><strong>Resposta:</strong> {exercise.answer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MatchCard({ exercise, index }: { exercise: MatchExercise; index: number }) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [showAnswers, setShowAnswers] = useState(false);
  const shuffledPt = [...(exercise.pairs || [])].sort(() => Math.random() - 0.5);

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{index + 1}</Badge>
          <span className="text-sm text-muted-foreground">{exercise.instruction}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">English</p>
            {exercise.pairs?.map((p) => (
              <div key={p.english} className="p-2 rounded border text-sm">{p.english}</div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Português</p>
            {shuffledPt.map((p) => (
              <div key={p.portuguese} className="p-2 rounded border text-sm">{p.portuguese}</div>
            ))}
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowAnswers(!showAnswers)}>
          {showAnswers ? 'Esconder' : 'Ver Pares'}
        </Button>
        {showAnswers && (
          <div className="rounded-lg bg-muted p-3 space-y-1">
            {exercise.pairs?.map((p) => (
              <p key={p.english} className="text-sm flex items-center gap-2">
                <strong>{p.english}</strong> <ArrowRight className="h-3 w-3" /> {p.portuguese}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AIPracticeExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [exerciseType, setExerciseType] = useState<ExerciseType>('mixed');
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');

  const generateExercises = async () => {
    setIsLoading(true);
    setExercises([]);
    try {
      const { data, error } = await supabase.functions.invoke('generate-practice', {
        body: { exerciseType, difficulty },
      });

      if (error) {
        console.error('Function invocation error:', error);
        if (error.message?.includes('FunctionsRelayError') || error.message?.includes('not found')) {
          toast.error('A função de IA não está configurada. Por favor, contacte o administrador.');
          return;
        }
        throw error;
      }
      
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (!data?.exercises || data.exercises.length === 0) {
        toast.error('Nenhum exercício foi gerado. Verifica se tens flashcards adicionados.');
        return;
      }

      setExercises(data.exercises || []);
      toast.success('Exercícios gerados com sucesso!');
    } catch (err: unknown) {
      console.error('Generate exercises error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar exercícios.';
      
      if (errorMessage.includes('fetch')) {
        toast.error('Erro de conexão. Verifica a tua internet.');
      } else if (errorMessage.includes('Unauthorized')) {
        toast.error('Não autorizado. Faz login novamente.');
      } else {
        toast.error('Erro ao gerar exercícios. Tenta novamente mais tarde.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Exercícios com IA
          </CardTitle>
          <CardDescription>
            Gera exercícios personalizados baseados no teu vocabulário (flashcards)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <p className="text-sm text-foreground">
               <strong>Exercícios gerados por IA</strong> baseados nos teus flashcards.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
               Adiciona palavras aos teus flashcards para exercícios mais personalizados.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={exerciseType} onValueChange={(v) => setExerciseType(v as ExerciseType)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mixed">Misto</SelectItem>
                <SelectItem value="fill-blank">Preencher Espaços</SelectItem>
                <SelectItem value="translate">Tradução</SelectItem>
                <SelectItem value="match">Correspondência</SelectItem>
              </SelectContent>
            </Select>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Iniciante</SelectItem>
                <SelectItem value="intermediate">Intermédio</SelectItem>
                <SelectItem value="advanced">Avançado</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generateExercises} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Gerar Exercícios
            </Button>
          </div>
        </CardContent>
      </Card>

      {exercises.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{exercises.length} Exercícios</h3>
            <Button variant="outline" size="sm" onClick={generateExercises} disabled={isLoading}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Novos Exercícios
            </Button>
          </div>
          {exercises.map((ex, i) => {
            if (ex.type === 'fill-blank') return <FillBlankCard key={i} exercise={ex as FillBlankExercise} index={i} />;
            if (ex.type === 'translate') return <TranslateCard key={i} exercise={ex as TranslateExercise} index={i} />;
            if (ex.type === 'match') return <MatchCard key={i} exercise={ex as MatchExercise} index={i} />;
            return null;
          })}
        </div>
      )}

      {!isLoading && exercises.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Exercícios Personalizados com IA</h3>
            <p className="text-muted-foreground mb-4">
              Clica em "Gerar Exercícios" para criar exercícios baseados nas tuas palavras
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
