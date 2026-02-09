import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, Loader2, BookOpen, Volume2, Download, Check } from 'lucide-react';

interface BaseVocabulary {
  id: string;
  word: string;
  translation: string;
  definition: string | null;
  pronunciation: string | null;
  example_sentence: string | null;
  example_translation: string | null;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  audio_url: string | null;
}

interface ImportVocabularyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const difficultyColors = {
  beginner: 'bg-green-500/10 text-green-600 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const difficultyLabels = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

export function ImportVocabularyModal({ open, onOpenChange }: ImportVocabularyModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fetch base vocabulary
  const { data: vocabulary, isLoading } = useQuery({
    queryKey: ['base-vocabulary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('base_vocabulary')
        .select('*')
        .order('word', { ascending: true });

      if (error) throw error;
      return data as BaseVocabulary[];
    },
    enabled: open,
  });

  // Fetch user's existing flashcards to check duplicates
  const { data: userFlashcards } = useQuery({
    queryKey: ['user-flashcard-words', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('flashcards')
        .select('word')
        .eq('user_id', user.id);

      if (error) throw error;
      return data.map(f => f.word.toLowerCase());
    },
    enabled: open && !!user,
  });

  // Get unique categories
  const categories = [...new Set(vocabulary?.map(v => v.category) || [])].sort();

  // Filter vocabulary
  const filteredVocabulary = vocabulary?.filter(v => {
    const matchesSearch = v.word.toLowerCase().includes(search.toLowerCase()) ||
      v.translation.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || v.category === category;
    const matchesDifficulty = difficulty === 'all' || v.difficulty === difficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  }) || [];

  // Check if word already exists in user's flashcards
  const isAlreadyAdded = (word: string) => {
    return userFlashcards?.includes(word.toLowerCase()) || false;
  };

  // Toggle selection
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Select all visible
  const selectAllVisible = () => {
    const newSelected = new Set(selectedIds);
    filteredVocabulary.forEach(v => {
      if (!isAlreadyAdded(v.word)) {
        newSelected.add(v.id);
      }
    });
    setSelectedIds(newSelected);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!user || selectedIds.size === 0) return;

      const selectedVocab = vocabulary?.filter(v => selectedIds.has(v.id)) || [];
      
      const flashcardsToInsert = selectedVocab.map(v => ({
        user_id: user.id,
        word: v.word,
        translation: v.translation,
        definition: v.definition,
        pronunciation: v.pronunciation,
        example_sentence: v.example_sentence,
      }));

      const { error } = await supabase
        .from('flashcards')
        .insert(flashcardsToInsert);

      if (error) throw error;
      return flashcardsToInsert.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} palavra(s) importada(s) com sucesso!`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      queryClient.invalidateQueries({ queryKey: ['user-flashcard-words'] });
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Erro ao importar vocabulário');
    },
  });

  // Speak word
  const speakWord = (word: string, e: React.MouseEvent) => {
    e.stopPropagation();
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-GB';
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Importar Vocabulário Base
          </DialogTitle>
          <DialogDescription>
            Selecione palavras do vocabulário base para adicionar aos seus flashcards pessoais
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar palavra ou tradução..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Nível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="beginner">Iniciante</SelectItem>
              <SelectItem value="intermediate">Intermediário</SelectItem>
              <SelectItem value="advanced">Avançado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Selection actions */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAllVisible}>
              Selecionar visíveis
            </Button>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Limpar
            </Button>
          </div>
          <span className="text-muted-foreground">
            {selectedIds.size} selecionado(s)
          </span>
        </div>

        {/* Vocabulary list */}
        <ScrollArea className="flex-1 min-h-[300px] border rounded-lg">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredVocabulary.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <BookOpen className="mx-auto h-12 w-12 mb-4" />
              <p>Nenhuma palavra encontrada</p>
              <p className="text-sm">Tente ajustar os filtros</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredVocabulary.map((vocab) => {
                const alreadyAdded = isAlreadyAdded(vocab.word);
                const isSelected = selectedIds.has(vocab.id);
                
                return (
                  <div
                    key={vocab.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      alreadyAdded 
                        ? 'bg-muted/50 opacity-60 cursor-not-allowed' 
                        : isSelected 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-muted/50'
                    }`}
                    onClick={() => !alreadyAdded && toggleSelection(vocab.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={alreadyAdded}
                      onCheckedChange={() => !alreadyAdded && toggleSelection(vocab.id)}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{vocab.word}</span>
                        {vocab.pronunciation && (
                          <span className="text-sm text-muted-foreground">{vocab.pronunciation}</span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => speakWord(vocab.word, e)}
                        >
                          <Volume2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {vocab.translation}
                        {vocab.definition && ` — ${vocab.definition}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {vocab.category}
                      </Badge>
                      <Badge className={difficultyColors[vocab.difficulty]}>
                        {difficultyLabels[vocab.difficulty]}
                      </Badge>
                      {alreadyAdded && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Adicionado
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => importMutation.mutate()}
            disabled={selectedIds.size === 0 || importMutation.isPending}
          >
            {importMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Importar {selectedIds.size > 0 && `(${selectedIds.size})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
