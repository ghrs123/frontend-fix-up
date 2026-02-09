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
import { Plus, Pencil, Trash2, Loader2, GraduationCap } from 'lucide-react';

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

interface GrammarTopic {
  id: string;
  name: string;
  category: string;
  explanation: string;
  explanation_portuguese: string | null;
  examples: { en: string; pt?: string }[];
  difficulty: DifficultyLevel;
  order_index: number;
}

const difficultyColors: Record<DifficultyLevel, string> = {
  beginner: 'bg-green-500/10 text-green-600',
  intermediate: 'bg-yellow-500/10 text-yellow-600',
  advanced: 'bg-red-500/10 text-red-600',
};

export function AdminGrammarTab() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; topic?: GrammarTopic }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string } | null>(null);

  const [form, setForm] = useState({
    name: '',
    category: '',
    explanation: '',
    explanation_portuguese: '',
    examples: '',
    difficulty: 'beginner' as DifficultyLevel,
    order_index: 0,
  });

  const { data: topics, isLoading } = useQuery({
    queryKey: ['admin-grammar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grammar_topics')
        .select('*')
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data.map(t => ({ ...t, examples: (t.examples as { en: string; pt?: string }[]) || [] })) as GrammarTopic[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => {
      const examples = data.examples
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [en, pt] = line.split('|').map(s => s.trim());
          return { en, pt };
        });

      const payload = {
        name: data.name,
        category: data.category,
        explanation: data.explanation,
        explanation_portuguese: data.explanation_portuguese || null,
        examples,
        difficulty: data.difficulty,
        order_index: data.order_index,
      };

      if (data.id) {
        const { error } = await supabase.from('grammar_topics').update(payload).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('grammar_topics').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Tópico guardado!');
      queryClient.invalidateQueries({ queryKey: ['admin-grammar'] });
      queryClient.invalidateQueries({ queryKey: ['grammar-topics'] });
      setModal({ open: false });
      resetForm();
    },
    onError: () => toast.error('Erro ao guardar tópico'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('grammar_topics').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tópico eliminado!');
      queryClient.invalidateQueries({ queryKey: ['admin-grammar'] });
      setDeleteDialog(null);
    },
    onError: () => toast.error('Erro ao eliminar'),
  });

  const resetForm = () => {
    setForm({ name: '', category: '', explanation: '', explanation_portuguese: '', examples: '', difficulty: 'beginner', order_index: 0 });
  };

  const openEdit = (topic: GrammarTopic) => {
    setForm({
      name: topic.name,
      category: topic.category,
      explanation: topic.explanation,
      explanation_portuguese: topic.explanation_portuguese || '',
      examples: topic.examples.map(e => e.pt ? `${e.en} | ${e.pt}` : e.en).join('\n'),
      difficulty: topic.difficulty,
      order_index: topic.order_index,
    });
    setModal({ open: true, topic });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tópicos de Gramática</h2>
        <Button onClick={() => { resetForm(); setModal({ open: true }); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo Tópico
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : topics?.length === 0 ? (
        <Card className="py-8">
          <CardContent className="text-center">
            <GraduationCap className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p>Nenhum tópico ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {topics?.map(topic => (
            <Card key={topic.id}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{topic.name}</CardTitle>
                    <CardDescription>{topic.category} • {topic.examples.length} exemplos</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={difficultyColors[topic.difficulty]}>{topic.difficulty}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(topic)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ open: true, id: topic.id })}>
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
            <DialogTitle>{modal.topic ? 'Editar Tópico' : 'Novo Tópico'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Ex: Verbs, Nouns" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
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
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input type="number" value={form.order_index} onChange={e => setForm(f => ({ ...f, order_index: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Explicação (Inglês)</Label>
              <Textarea value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Explicação (Português)</Label>
              <Textarea value={form.explanation_portuguese} onChange={e => setForm(f => ({ ...f, explanation_portuguese: e.target.value }))} rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Exemplos (um por linha, formato: EN | PT)</Label>
              <Textarea value={form.examples} onChange={e => setForm(f => ({ ...f, examples: e.target.value }))} rows={4} placeholder="I am happy | Eu sou feliz" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal({ open: false })}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate({ ...form, id: modal.topic?.id })} disabled={saveMutation.isPending}>
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
