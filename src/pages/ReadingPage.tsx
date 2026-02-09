import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Search, CheckCircle } from 'lucide-react';

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

interface Text {
  id: string;
  title: string;
  content: string;
  content_portuguese: string | null;
  difficulty: DifficultyLevel;
  category: string;
  word_count: number | null;
  created_at: string;
}

const difficultyColors: Record<DifficultyLevel, string> = {
  beginner: 'bg-green-500/10 text-green-600 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const difficultyLabels: Record<DifficultyLevel, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

export default function ReadingPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: texts, isLoading } = useQuery({
    queryKey: ['texts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('texts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Text[];
    },
  });

  // Fetch read texts for the current user
  const { data: readTextIds } = useQuery({
    queryKey: ['user-progress-reading', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_progress')
        .select('text_id')
        .eq('user_id', user.id)
        .eq('progress_type', 'reading')
        .eq('completed', true);

      if (error) throw error;
      return data.map(p => p.text_id) as string[];
    },
    enabled: !!user,
  });

  const categories = texts 
    ? [...new Set(texts.map(t => t.category))]
    : [];

  const filteredTexts = texts?.filter(text => {
    const matchesSearch = text.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         text.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'all' || text.difficulty === difficultyFilter;
    const matchesCategory = categoryFilter === 'all' || text.category === categoryFilter;
    return matchesSearch && matchesDifficulty && matchesCategory;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leitura</h1>
          <p className="text-muted-foreground">
            Escolha um texto para praticar a leitura e aprender novas palavras
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar textos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Dificuldade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="beginner">Iniciante</SelectItem>
              <SelectItem value="intermediate">Intermediário</SelectItem>
              <SelectItem value="advanced">Avançado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Text Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTexts?.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum texto encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros ou adicione novos textos no painel de administração.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTexts?.map((text) => {
              const isRead = readTextIds?.includes(text.id);
              return (
                <Card 
                  key={text.id} 
                  className={`group hover:shadow-md transition-shadow relative ${isRead ? 'border-green-500/50 bg-green-500/5' : ''}`}
                >
                  {isRead && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-green-500 text-white border-0 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Lido
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-1">{text.title}</CardTitle>
                      <Badge variant="outline" className={difficultyColors[text.difficulty]}>
                        {difficultyLabels[text.difficulty]}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <span>{text.category}</span>
                      {text.word_count && (
                        <>
                          <span>•</span>
                          <span>{text.word_count} palavras</span>
                        </>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {text.content}
                    </p>
                    <Button asChild className="w-full" variant={isRead ? "outline" : "default"}>
                      <Link to={`/read/${text.id}`}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        {isRead ? 'Ler novamente' : 'Ler texto'}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
