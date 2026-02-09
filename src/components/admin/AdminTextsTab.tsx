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
import { Plus, Pencil, Trash2, Loader2, BookOpen, Upload, Volume2 } from 'lucide-react';

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

interface Text {
  id: string;
  title: string;
  content: string;
  content_portuguese: string | null;
  difficulty: DifficultyLevel;
  category: string;
  word_count: number | null;
  audio_url: string | null;
}

const difficultyColors: Record<DifficultyLevel, string> = {
  beginner: 'bg-green-500/10 text-green-600',
  intermediate: 'bg-yellow-500/10 text-yellow-600',
  advanced: 'bg-red-500/10 text-red-600',
};

export function AdminTextsTab() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; text?: Text }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    content: '',
    content_portuguese: '',
    difficulty: 'beginner' as DifficultyLevel,
    category: '',
    audio_url: '',
  });

  const { data: texts, isLoading } = useQuery({
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

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => {
      const wordCount = data.content.split(/\s+/).filter(w => w.length > 0).length;
      const payload = {
        title: data.title,
        content: data.content,
        content_portuguese: data.content_portuguese || null,
        difficulty: data.difficulty,
        category: data.category,
        word_count: wordCount,
        audio_url: data.audio_url || null,
      };
      
      if (data.id) {
        const { error } = await supabase.from('texts').update(payload).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('texts').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Texto guardado!');
      queryClient.invalidateQueries({ queryKey: ['admin-texts'] });
      queryClient.invalidateQueries({ queryKey: ['texts'] });
      setModal({ open: false });
      resetForm();
    },
    onError: () => toast.error('Erro ao guardar texto'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('texts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Texto eliminado!');
      queryClient.invalidateQueries({ queryKey: ['admin-texts'] });
      setDeleteDialog(null);
    },
    onError: () => toast.error('Erro ao eliminar'),
  });

  const resetForm = () => {
    setForm({ title: '', content: '', content_portuguese: '', difficulty: 'beginner', category: '', audio_url: '' });
  };

  const openEdit = (text: Text) => {
    setForm({
      title: text.title,
      content: text.content,
      content_portuguese: text.content_portuguese || '',
      difficulty: text.difficulty,
      category: text.category,
      audio_url: text.audio_url || '',
    });
    setModal({ open: true, text });
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}.${ext}`;
      
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
        <h2 className="text-xl font-semibold">Textos de Leitura</h2>
        <Button onClick={() => { resetForm(); setModal({ open: true }); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo Texto
        </Button>
      </div>

      {isLoading ? (
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
                  <div className="flex items-center gap-2">
                    <div>
                      <CardTitle className="text-base">{text.title}</CardTitle>
                      <CardDescription>{text.category} • {text.word_count} palavras</CardDescription>
                    </div>
                    {text.audio_url && <Volume2 className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={difficultyColors[text.difficulty]}>{text.difficulty}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(text)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ open: true, id: text.id })}>
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
            <DialogTitle>{modal.text ? 'Editar Texto' : 'Novo Texto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
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
              <Label>Conteúdo (Inglês)</Label>
              <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={6} />
            </div>
            <div className="space-y-2">
              <Label>Tradução (Português)</Label>
              <Textarea value={form.content_portuguese} onChange={e => setForm(f => ({ ...f, content_portuguese: e.target.value }))} rows={6} />
            </div>
            <div className="space-y-2">
              <Label>Áudio (opcional)</Label>
              <div className="flex gap-2">
                <Input 
                  value={form.audio_url} 
                  onChange={e => setForm(f => ({ ...f, audio_url: e.target.value }))} 
                  placeholder="URL do áudio ou faça upload"
                  className="flex-1"
                />
                <Button variant="outline" disabled={uploading} asChild>
                  <label className="cursor-pointer">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <input type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
                  </label>
                </Button>
              </div>
              {form.audio_url && (
                <audio controls src={form.audio_url} className="w-full mt-2" />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal({ open: false })}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate({ ...form, id: modal.text?.id })} disabled={saveMutation.isPending}>
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
