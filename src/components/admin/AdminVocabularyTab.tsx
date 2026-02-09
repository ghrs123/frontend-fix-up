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
import { Plus, Pencil, Trash2, Loader2, Layers, Upload, Volume2 } from 'lucide-react';

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

interface Vocabulary {
  id: string;
  word: string;
  translation: string;
  pronunciation: string | null;
  definition: string | null;
  example_sentence: string | null;
  example_translation: string | null;
  category: string;
  difficulty: DifficultyLevel;
  audio_url: string | null;
}

const difficultyColors: Record<DifficultyLevel, string> = {
  beginner: 'bg-green-500/10 text-green-600',
  intermediate: 'bg-yellow-500/10 text-yellow-600',
  advanced: 'bg-red-500/10 text-red-600',
};

export function AdminVocabularyTab() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; vocab?: Vocabulary }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    word: '',
    translation: '',
    pronunciation: '',
    definition: '',
    example_sentence: '',
    example_translation: '',
    category: 'general',
    difficulty: 'beginner' as DifficultyLevel,
    audio_url: '',
  });

  const { data: vocabulary, isLoading } = useQuery({
    queryKey: ['admin-vocabulary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('base_vocabulary')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Vocabulary[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => {
      const payload = {
        word: data.word,
        translation: data.translation,
        pronunciation: data.pronunciation || null,
        definition: data.definition || null,
        example_sentence: data.example_sentence || null,
        example_translation: data.example_translation || null,
        category: data.category,
        difficulty: data.difficulty,
        audio_url: data.audio_url || null,
      };

      if (data.id) {
        const { error } = await supabase.from('base_vocabulary').update(payload).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('base_vocabulary').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Vocabulário guardado!');
      queryClient.invalidateQueries({ queryKey: ['admin-vocabulary'] });
      queryClient.invalidateQueries({ queryKey: ['base-vocabulary'] });
      setModal({ open: false });
      resetForm();
    },
    onError: () => toast.error('Erro ao guardar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('base_vocabulary').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Vocabulário eliminado!');
      queryClient.invalidateQueries({ queryKey: ['admin-vocabulary'] });
      setDeleteDialog(null);
    },
    onError: () => toast.error('Erro ao eliminar'),
  });

  const resetForm = () => {
    setForm({ word: '', translation: '', pronunciation: '', definition: '', example_sentence: '', example_translation: '', category: 'general', difficulty: 'beginner', audio_url: '' });
  };

  const openEdit = (vocab: Vocabulary) => {
    setForm({
      word: vocab.word,
      translation: vocab.translation,
      pronunciation: vocab.pronunciation || '',
      definition: vocab.definition || '',
      example_sentence: vocab.example_sentence || '',
      example_translation: vocab.example_translation || '',
      category: vocab.category,
      difficulty: vocab.difficulty,
      audio_url: vocab.audio_url || '',
    });
    setModal({ open: true, vocab });
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `vocab-${Date.now()}.${ext}`;
      
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
          <h2 className="text-xl font-semibold">Vocabulário Base</h2>
          <p className="text-sm text-muted-foreground">Palavras disponíveis para todos os utilizadores</p>
        </div>
        <Button onClick={() => { resetForm(); setModal({ open: true }); }}>
          <Plus className="mr-2 h-4 w-4" /> Nova Palavra
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : vocabulary?.length === 0 ? (
        <Card className="py-8">
          <CardContent className="text-center">
            <Layers className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p>Nenhuma palavra ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {vocabulary?.map(vocab => (
            <Card key={vocab.id}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div>
                      <CardTitle className="text-base">{vocab.word}</CardTitle>
                      <CardDescription>{vocab.translation}</CardDescription>
                    </div>
                    {vocab.audio_url && <Volume2 className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={difficultyColors[vocab.difficulty]}>{vocab.difficulty}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(vocab)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ open: true, id: vocab.id })}>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modal.vocab ? 'Editar Palavra' : 'Nova Palavra'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Palavra (EN)</Label>
                <Input value={form.word} onChange={e => setForm(f => ({ ...f, word: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Tradução (PT)</Label>
                <Input value={form.translation} onChange={e => setForm(f => ({ ...f, translation: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Pronúncia</Label>
                <Input value={form.pronunciation} onChange={e => setForm(f => ({ ...f, pronunciation: e.target.value }))} placeholder="/həˈloʊ/" />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Ex: Business, Travel" />
              </div>
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
            <div className="space-y-2">
              <Label>Definição</Label>
              <Textarea value={form.definition} onChange={e => setForm(f => ({ ...f, definition: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Frase de Exemplo (EN)</Label>
              <Input value={form.example_sentence} onChange={e => setForm(f => ({ ...f, example_sentence: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Tradução do Exemplo (PT)</Label>
              <Input value={form.example_translation} onChange={e => setForm(f => ({ ...f, example_translation: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Áudio (opcional)</Label>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal({ open: false })}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate({ ...form, id: modal.vocab?.id })} disabled={saveMutation.isPending}>
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
