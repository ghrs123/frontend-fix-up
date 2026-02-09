import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { AuthGuard } from '@/components/AuthGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Plus, Pencil, Trash2, Loader2, BookOpen, GraduationCap } from 'lucide-react';

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

interface Text {
  id: string;
  title: string;
  content: string;
  content_portuguese: string | null;
  difficulty: DifficultyLevel;
  category: string;
  word_count: number | null;
}

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

function AdminContent() {
  const queryClient = useQueryClient();
  
  // State for modals
  const [textModal, setTextModal] = useState<{ open: boolean; text?: Text }>({ open: false });
  const [grammarModal, setGrammarModal] = useState<{ open: boolean; topic?: GrammarTopic }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: 'text' | 'grammar'; id: string } | null>(null);

  // Form states
  const [textForm, setTextForm] = useState({
    title: '',
    content: '',
    content_portuguese: '',
    difficulty: 'beginner' as DifficultyLevel,
    category: '',
  });

  const [grammarForm, setGrammarForm] = useState({
    name: '',
    category: '',
    explanation: '',
    explanation_portuguese: '',
    examples: '',
    difficulty: 'beginner' as DifficultyLevel,
    order_index: 0,
  });

  // Fetch data
  const { data: texts, isLoading: textsLoading } = useQuery({
    queryKey: ['admin-texts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('texts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Text[];
    },
  });

  const { data: grammarTopics, isLoading: grammarLoading } = useQuery({
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

  // Mutations
  const saveTextMutation = useMutation({
    mutationFn: async (data: typeof textForm & { id?: string }) => {
      const wordCount = data.content.split(/\s+/).filter(w => w.length > 0).length;
      
      if (data.id) {
        const { error } = await supabase
          .from('texts')
          .update({ ...data, word_count: wordCount })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('texts')
          .insert({ ...data, word_count: wordCount });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Texto guardado!');
      queryClient.invalidateQueries({ queryKey: ['admin-texts'] });
      queryClient.invalidateQueries({ queryKey: ['texts'] });
      setTextModal({ open: false });
      resetTextForm();
    },
    onError: () => toast.error('Erro ao guardar texto'),
  });

  const saveGrammarMutation = useMutation({
    mutationFn: async (data: typeof grammarForm & { id?: string }) => {
      const examples = data.examples
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [en, pt] = line.split('|').map(s => s.trim());
          return { en, pt };
        });

      if (data.id) {
        const { error } = await supabase
          .from('grammar_topics')
          .update({ ...data, examples })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('grammar_topics')
          .insert({ ...data, examples });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Tópico guardado!');
      queryClient.invalidateQueries({ queryKey: ['admin-grammar'] });
      queryClient.invalidateQueries({ queryKey: ['grammar-topics'] });
      setGrammarModal({ open: false });
      resetGrammarForm();
    },
    onError: () => toast.error('Erro ao guardar tópico'),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: 'text' | 'grammar'; id: string }) => {
      const table = type === 'text' ? 'texts' : 'grammar_topics';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { type }) => {
      toast.success('Item eliminado!');
      queryClient.invalidateQueries({ queryKey: type === 'text' ? ['admin-texts'] : ['admin-grammar'] });
      setDeleteDialog(null);
    },
    onError: () => toast.error('Erro ao eliminar'),
  });

  const resetTextForm = () => {
    setTextForm({ title: '', content: '', content_portuguese: '', difficulty: 'beginner', category: '' });
  };

  const resetGrammarForm = () => {
    setGrammarForm({ name: '', category: '', explanation: '', explanation_portuguese: '', examples: '', difficulty: 'beginner', order_index: 0 });
  };

  const openEditText = (text: Text) => {
    setTextForm({
      title: text.title,
      content: text.content,
      content_portuguese: text.content_portuguese || '',
      difficulty: text.difficulty,
      category: text.category,
    });
    setTextModal({ open: true, text });
  };

  const openEditGrammar = (topic: GrammarTopic) => {
    setGrammarForm({
      name: topic.name,
      category: topic.category,
      explanation: topic.explanation,
      explanation_portuguese: topic.explanation_portuguese || '',
      examples: topic.examples.map(e => e.pt ? `${e.en} | ${e.pt}` : e.en).join('\n'),
      difficulty: topic.difficulty,
      order_index: topic.order_index,
    });
    setGrammarModal({ open: true, topic });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administração</h1>
        <p className="text-muted-foreground">Gerir conteúdo da aplicação</p>
      </div>

      <Tabs defaultValue="texts">
        <TabsList>
          <TabsTrigger value="texts">Textos</TabsTrigger>
          <TabsTrigger value="grammar">Gramática</TabsTrigger>
        </TabsList>

        <TabsContent value="texts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Textos de Leitura</h2>
            <Button onClick={() => { resetTextForm(); setTextModal({ open: true }); }}>
              <Plus className="mr-2 h-4 w-4" /> Novo Texto
            </Button>
          </div>

          {textsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : texts?.length === 0 ? (
            <Card className="py-8">
              <CardContent className="text-center">
                <BookOpen className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p>Nenhum texto ainda</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {texts?.map(text => (
                <Card key={text.id}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{text.title}</CardTitle>
                        <CardDescription>{text.category} • {text.word_count} palavras</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={difficultyColors[text.difficulty]}>{text.difficulty}</Badge>
                        <Button variant="ghost" size="icon" onClick={() => openEditText(text)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ open: true, type: 'text', id: text.id })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="grammar" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Tópicos de Gramática</h2>
            <Button onClick={() => { resetGrammarForm(); setGrammarModal({ open: true }); }}>
              <Plus className="mr-2 h-4 w-4" /> Novo Tópico
            </Button>
          </div>

          {grammarLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : grammarTopics?.length === 0 ? (
            <Card className="py-8">
              <CardContent className="text-center">
                <GraduationCap className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p>Nenhum tópico ainda</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {grammarTopics?.map(topic => (
                <Card key={topic.id}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{topic.name}</CardTitle>
                        <CardDescription>{topic.category}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={difficultyColors[topic.difficulty]}>{topic.difficulty}</Badge>
                        <Button variant="ghost" size="icon" onClick={() => openEditGrammar(topic)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ open: true, type: 'grammar', id: topic.id })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Text Modal */}
      <Dialog open={textModal.open} onOpenChange={(open) => setTextModal({ open })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{textModal.text ? 'Editar Texto' : 'Novo Texto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={textForm.title} onChange={e => setTextForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input value={textForm.category} onChange={e => setTextForm(f => ({ ...f, category: e.target.value }))} placeholder="Ex: Business, Travel" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dificuldade</Label>
              <Select value={textForm.difficulty} onValueChange={v => setTextForm(f => ({ ...f, difficulty: v as DifficultyLevel }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Iniciante</SelectItem>
                  <SelectItem value="intermediate">Intermediário</SelectItem>
                  <SelectItem value="advanced">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Conteúdo (Inglês)</Label>
              <Textarea value={textForm.content} onChange={e => setTextForm(f => ({ ...f, content: e.target.value }))} rows={6} />
            </div>
            <div className="space-y-2">
              <Label>Tradução (Português)</Label>
              <Textarea value={textForm.content_portuguese} onChange={e => setTextForm(f => ({ ...f, content_portuguese: e.target.value }))} rows={6} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTextModal({ open: false })}>Cancelar</Button>
            <Button onClick={() => saveTextMutation.mutate({ ...textForm, id: textModal.text?.id })} disabled={saveTextMutation.isPending}>
              {saveTextMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grammar Modal */}
      <Dialog open={grammarModal.open} onOpenChange={(open) => setGrammarModal({ open })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{grammarModal.topic ? 'Editar Tópico' : 'Novo Tópico'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={grammarForm.name} onChange={e => setGrammarForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input value={grammarForm.category} onChange={e => setGrammarForm(f => ({ ...f, category: e.target.value }))} placeholder="Ex: Verbs, Nouns" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Dificuldade</Label>
                <Select value={grammarForm.difficulty} onValueChange={v => setGrammarForm(f => ({ ...f, difficulty: v as DifficultyLevel }))}>
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
                <Input type="number" value={grammarForm.order_index} onChange={e => setGrammarForm(f => ({ ...f, order_index: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Explicação (Inglês)</Label>
              <Textarea value={grammarForm.explanation} onChange={e => setGrammarForm(f => ({ ...f, explanation: e.target.value }))} rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Explicação (Português)</Label>
              <Textarea value={grammarForm.explanation_portuguese} onChange={e => setGrammarForm(f => ({ ...f, explanation_portuguese: e.target.value }))} rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Exemplos (um por linha, formato: EN | PT)</Label>
              <Textarea value={grammarForm.examples} onChange={e => setGrammarForm(f => ({ ...f, examples: e.target.value }))} rows={4} placeholder="I am happy | Eu sou feliz" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrammarModal({ open: false })}>Cancelar</Button>
            <Button onClick={() => saveGrammarMutation.mutate({ ...grammarForm, id: grammarModal.topic?.id })} disabled={saveGrammarMutation.isPending}>
              {saveGrammarMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog?.open} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteDialog && deleteMutation.mutate({ type: deleteDialog.type, id: deleteDialog.id })}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthGuard requireAdmin>
      <AppLayout>
        <AdminContent />
      </AppLayout>
    </AuthGuard>
  );
}
