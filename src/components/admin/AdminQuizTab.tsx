import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Plus, Pencil, Trash2, Loader2, Trophy, X } from 'lucide-react';

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
type QuestionType = 'multiple_choice' | 'fill_blank' | 'true_false';

interface QuizQuestion {
  id: string;
  question: string;
  question_type: QuestionType;
  options: { text: string; correct: boolean }[] | null;
  correct_answer: string;
  explanation: string | null;
  explanation_portuguese: string | null;
  category: string;
  difficulty: DifficultyLevel;
}

const difficultyColors: Record<DifficultyLevel, string> = {
  beginner: 'bg-green-500/10 text-green-600',
  intermediate: 'bg-yellow-500/10 text-yellow-600',
  advanced: 'bg-red-500/10 text-red-600',
};

const questionTypeLabels: Record<QuestionType, string> = {
  multiple_choice: 'Múltipla Escolha',
  fill_blank: 'Preencher Lacuna',
  true_false: 'Verdadeiro/Falso',
};

export function AdminQuizTab() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; question?: QuizQuestion }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string } | null>(null);

  const [form, setForm] = useState({
    question: '',
    question_type: 'multiple_choice' as QuestionType,
    options: [{ text: '', correct: false }, { text: '', correct: false }, { text: '', correct: false }, { text: '', correct: false }],
    correct_answer: '',
    explanation: '',
    explanation_portuguese: '',
    category: 'general',
    difficulty: 'beginner' as DifficultyLevel,
  });

  const { data: questions, isLoading } = useQuery({
    queryKey: ['admin-quiz'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(q => ({
        ...q,
        options: (q.options as { text: string; correct: boolean }[] | null),
      })) as QuizQuestion[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => {
      let options = null;
      let correctAnswer = data.correct_answer;

      if (data.question_type === 'multiple_choice') {
        options = data.options.filter(o => o.text.trim());
        correctAnswer = options.find(o => o.correct)?.text || '';
      } else if (data.question_type === 'true_false') {
        options = [{ text: 'True', correct: data.correct_answer === 'True' }, { text: 'False', correct: data.correct_answer === 'False' }];
      }

      const payload = {
        question: data.question,
        question_type: data.question_type,
        options,
        correct_answer: correctAnswer,
        explanation: data.explanation || null,
        explanation_portuguese: data.explanation_portuguese || null,
        category: data.category,
        difficulty: data.difficulty,
      };

      if (data.id) {
        const { error } = await supabase.from('quiz_questions').update(payload).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('quiz_questions').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Questão guardada!');
      queryClient.invalidateQueries({ queryKey: ['admin-quiz'] });
      queryClient.invalidateQueries({ queryKey: ['quiz-questions'] });
      setModal({ open: false });
      resetForm();
    },
    onError: () => toast.error('Erro ao guardar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Questão eliminada!');
      queryClient.invalidateQueries({ queryKey: ['admin-quiz'] });
      setDeleteDialog(null);
    },
    onError: () => toast.error('Erro ao eliminar'),
  });

  const resetForm = () => {
    setForm({
      question: '',
      question_type: 'multiple_choice',
      options: [{ text: '', correct: false }, { text: '', correct: false }, { text: '', correct: false }, { text: '', correct: false }],
      correct_answer: '',
      explanation: '',
      explanation_portuguese: '',
      category: 'general',
      difficulty: 'beginner',
    });
  };

  const openEdit = (q: QuizQuestion) => {
    const options = q.options || [{ text: '', correct: false }, { text: '', correct: false }, { text: '', correct: false }, { text: '', correct: false }];
    while (options.length < 4) options.push({ text: '', correct: false });
    
    setForm({
      question: q.question,
      question_type: q.question_type,
      options: options as { text: string; correct: boolean }[],
      correct_answer: q.correct_answer,
      explanation: q.explanation || '',
      explanation_portuguese: q.explanation_portuguese || '',
      category: q.category,
      difficulty: q.difficulty,
    });
    setModal({ open: true, question: q });
  };

  const updateOption = (index: number, text: string) => {
    setForm(f => ({
      ...f,
      options: f.options.map((o, i) => i === index ? { ...o, text } : o),
    }));
  };

  const setCorrectOption = (index: number) => {
    setForm(f => ({
      ...f,
      options: f.options.map((o, i) => ({ ...o, correct: i === index })),
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Questões de Quiz</h2>
          <p className="text-sm text-muted-foreground">Perguntas personalizadas para testes</p>
        </div>
        <Button onClick={() => { resetForm(); setModal({ open: true }); }}>
          <Plus className="mr-2 h-4 w-4" /> Nova Questão
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : questions?.length === 0 ? (
        <Card className="py-8">
          <CardContent className="text-center">
            <Trophy className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p>Nenhuma questão ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {questions?.map(q => (
            <Card key={q.id}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base line-clamp-1">{q.question}</CardTitle>
                    <CardDescription>{questionTypeLabels[q.question_type]} • {q.category}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={difficultyColors[q.difficulty]}>{q.difficulty}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(q)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ open: true, id: q.id })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modal.open} onOpenChange={(open) => setModal({ open })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modal.question ? 'Editar Questão' : 'Nova Questão'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pergunta</Label>
              <Textarea value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} rows={2} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.question_type} onValueChange={v => setForm(f => ({ ...f, question_type: v as QuestionType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                    <SelectItem value="fill_blank">Preencher Lacuna</SelectItem>
                    <SelectItem value="true_false">Verdadeiro/Falso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Dificuldade</Label>
                <Select value={form.difficulty} onValueChange={v => setForm(f => ({ ...f, difficulty: v as DifficultyLevel }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Iniciante</SelectItem>
                    <SelectItem value="intermediate">Intermediário</SelectItem>
                    <SelectItem value="advanced">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.question_type === 'multiple_choice' && (
              <div className="space-y-2">
                <Label>Opções (marque a correta)</Label>
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Checkbox 
                      checked={opt.correct} 
                      onCheckedChange={() => setCorrectOption(i)} 
                    />
                    <Input 
                      value={opt.text} 
                      onChange={e => updateOption(i, e.target.value)} 
                      placeholder={`Opção ${i + 1}`}
                    />
                  </div>
                ))}
              </div>
            )}

            {form.question_type === 'fill_blank' && (
              <div className="space-y-2">
                <Label>Resposta Correta</Label>
                <Input value={form.correct_answer} onChange={e => setForm(f => ({ ...f, correct_answer: e.target.value }))} placeholder="Palavra que preenche a lacuna" />
                <p className="text-xs text-muted-foreground">Use ___ na pergunta para indicar onde a lacuna está</p>
              </div>
            )}

            {form.question_type === 'true_false' && (
              <div className="space-y-2">
                <Label>Resposta Correta</Label>
                <Select value={form.correct_answer} onValueChange={v => setForm(f => ({ ...f, correct_answer: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="True">Verdadeiro</SelectItem>
                    <SelectItem value="False">Falso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Explicação (EN)</Label>
              <Textarea value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Explicação (PT)</Label>
              <Textarea value={form.explanation_portuguese} onChange={e => setForm(f => ({ ...f, explanation_portuguese: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal({ open: false })}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate({ ...form, id: modal.question?.id })} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog?.open} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteDialog && deleteMutation.mutate(deleteDialog.id)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
