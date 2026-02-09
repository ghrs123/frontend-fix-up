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
import { Plus, Pencil, Trash2, Loader2, PenLine, Upload, Volume2 } from 'lucide-react';

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
type ExerciseType = 'translation' | 'writing' | 'comprehension' | 'listening';

interface Exercise {
  id: string;
  title: string;
  exercise_type: ExerciseType;
  instructions: string;
  instructions_portuguese: string | null;
  content: string;
  content_portuguese: string | null;
  reference_answer: string | null;
  hints: { text: string }[] | null;
  audio_url: string | null;
  category: string;
  difficulty: DifficultyLevel;
}

const difficultyColors: Record<DifficultyLevel, string> = {
  beginner: 'bg-green-500/10 text-green-600',
  intermediate: 'bg-yellow-500/10 text-yellow-600',
  advanced: 'bg-red-500/10 text-red-600',
};

const exerciseTypeLabels: Record<ExerciseType, string> = {
  translation: 'Tradução',
  writing: 'Escrita',
  comprehension: 'Compreensão',
  listening: 'Listening',
};

export function AdminExercisesTab() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; exercise?: Exercise }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    exercise_type: 'translation' as ExerciseType,
    instructions: '',
    instructions_portuguese: '',
    content: '',
    content_portuguese: '',
    reference_answer: '',
    hints: '',
    audio_url: '',
    category: 'general',
    difficulty: 'beginner' as DifficultyLevel,
  });

  const { data: exercises, isLoading } = useQuery({
    queryKey: ['admin-exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practice_exercises')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(ex => ({
        ...ex,
        hints: (ex.hints as { text: string }[] | null),
      })) as Exercise[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => {
      const hints = data.hints
        .split('\n')
        .filter(line => line.trim())
        .map(text => ({ text: text.trim() }));

      const payload = {
        title: data.title,
        exercise_type: data.exercise_type,
        instructions: data.instructions,
        instructions_portuguese: data.instructions_portuguese || null,
        content: data.content,
        content_portuguese: data.content_portuguese || null,
        reference_answer: data.reference_answer || null,
        hints: hints.length > 0 ? hints : null,
        audio_url: data.audio_url || null,
        category: data.category,
        difficulty: data.difficulty,
      };

      if (data.id) {
        const { error } = await supabase.from('practice_exercises').update(payload).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('practice_exercises').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Exercício guardado!');
      queryClient.invalidateQueries({ queryKey: ['admin-exercises'] });
      queryClient.invalidateQueries({ queryKey: ['practice-exercises'] });
      setModal({ open: false });
      resetForm();
    },
    onError: () => toast.error('Erro ao guardar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('practice_exercises').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Exercício eliminado!');
      queryClient.invalidateQueries({ queryKey: ['admin-exercises'] });
      setDeleteDialog(null);
    },
    onError: () => toast.error('Erro ao eliminar'),
  });

  const resetForm = () => {
    setForm({
      title: '',
      exercise_type: 'translation',
      instructions: '',
      instructions_portuguese: '',
      content: '',
      content_portuguese: '',
      reference_answer: '',
      hints: '',
      audio_url: '',
      category: 'general',
      difficulty: 'beginner',
    });
  };

  const openEdit = (ex: Exercise) => {
    setForm({
      title: ex.title,
      exercise_type: ex.exercise_type,
      instructions: ex.instructions,
      instructions_portuguese: ex.instructions_portuguese || '',
      content: ex.content,
      content_portuguese: ex.content_portuguese || '',
      reference_answer: ex.reference_answer || '',
      hints: ex.hints?.map(h => h.text).join('\n') || '',
      audio_url: ex.audio_url || '',
      category: ex.category,
      difficulty: ex.difficulty,
    });
    setModal({ open: true, exercise: ex });
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `exercise-${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('audio')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('audio')
        .getPublicUrl(fileName);

      setForm(f => ({ ...f, audio_url: publicUrl }));
      toast.success('Áudio carregado!');
    } catch (err) {
      toast.error('Erro ao carregar áudio');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Exercícios de Prática</h2>
          <p className="text-sm text-muted-foreground">Tradução, escrita, compreensão e listening</p>
        </div>
        <Button onClick={() => { resetForm(); setModal({ open: true }); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo Exercício
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : exercises?.length === 0 ? (
        <Card className="py-8">
          <CardContent className="text-center">
            <PenLine className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p>Nenhum exercício ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {exercises?.map(ex => (
            <Card key={ex.id}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div>
                      <CardTitle className="text-base">{ex.title}</CardTitle>
                      <CardDescription>{exerciseTypeLabels[ex.exercise_type]} • {ex.category}</CardDescription>
                    </div>
                    {ex.audio_url && <Volume2 className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={difficultyColors[ex.difficulty]}>{ex.difficulty}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(ex)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ open: true, id: ex.id })}>
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
            <DialogTitle>{modal.exercise ? 'Editar Exercício' : 'Novo Exercício'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.exercise_type} onValueChange={v => setForm(f => ({ ...f, exercise_type: v as ExerciseType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="translation">Tradução</SelectItem>
                    <SelectItem value="writing">Escrita</SelectItem>
                    <SelectItem value="comprehension">Compreensão</SelectItem>
                    <SelectItem value="listening">Listening</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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

            <div className="space-y-2">
              <Label>Instruções (EN)</Label>
              <Textarea value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Instruções (PT)</Label>
              <Textarea value={form.instructions_portuguese} onChange={e => setForm(f => ({ ...f, instructions_portuguese: e.target.value }))} rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Conteúdo Principal (EN)</Label>
              <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Conteúdo (PT) - para exercícios de tradução</Label>
              <Textarea value={form.content_portuguese} onChange={e => setForm(f => ({ ...f, content_portuguese: e.target.value }))} rows={4} />
            </div>

            <div className="space-y-2">
              <Label>Resposta de Referência</Label>
              <Textarea value={form.reference_answer} onChange={e => setForm(f => ({ ...f, reference_answer: e.target.value }))} rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Dicas (uma por linha)</Label>
              <Textarea value={form.hints} onChange={e => setForm(f => ({ ...f, hints: e.target.value }))} rows={3} placeholder="Use o Present Perfect&#10;Lembre-se da concordância verbal" />
            </div>

            {form.exercise_type === 'listening' && (
              <div className="space-y-2">
                <Label>Áudio</Label>
                <div className="flex gap-2">
                  <Input 
                    value={form.audio_url} 
                    onChange={e => setForm(f => ({ ...f, audio_url: e.target.value }))} 
                    placeholder="URL do áudio"
                    className="flex-1"
                  />
                  <Button variant="outline" disabled={uploading} asChild>
                    <label className="cursor-pointer">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      <input type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
                    </label>
                  </Button>
                </div>
                {form.audio_url && <audio controls src={form.audio_url} className="w-full mt-2" />}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal({ open: false })}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate({ ...form, id: modal.exercise?.id })} disabled={saveMutation.isPending}>
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
