import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Search } from 'lucide-react';

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
  beginner: 'bg-green-500/10 text-green-600 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const difficultyLabels: Record<DifficultyLevel, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

export default function GrammarPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: topics, isLoading } = useQuery({
    queryKey: ['grammar-topics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grammar_topics')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data.map(topic => ({
        ...topic,
        examples: (topic.examples as { en: string; pt?: string }[]) || []
      })) as GrammarTopic[];
    },
  });

  const categories = topics 
    ? [...new Set(topics.map(t => t.category))]
    : [];

  const filteredTopics = topics?.filter(topic => {
    const matchesSearch = topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         topic.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'all' || topic.difficulty === difficultyFilter;
    const matchesCategory = categoryFilter === 'all' || topic.category === categoryFilter;
    return matchesSearch && matchesDifficulty && matchesCategory;
  });

  // Group topics by category
  const groupedTopics = filteredTopics?.reduce((acc, topic) => {
    if (!acc[topic.category]) {
      acc[topic.category] = [];
    }
    acc[topic.category].push(topic);
    return acc;
  }, {} as Record<string, GrammarTopic[]>);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gramática</h1>
          <p className="text-muted-foreground">
            Aprenda as regras gramaticais do inglês com explicações claras e exemplos
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar tópicos..."
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

        {/* Topics */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : Object.keys(groupedTopics || {}).length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum tópico encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros ou adicione novos tópicos no painel de administração.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTopics || {}).map(([category, categoryTopics]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle>{category}</CardTitle>
                  <CardDescription>{categoryTopics.length} tópico(s)</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {categoryTopics.map((topic) => (
                      <AccordionItem key={topic.id} value={topic.id}>
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-2 flex-1 pr-4">
                            <span>{topic.name}</span>
                            <Badge variant="outline" className={difficultyColors[topic.difficulty]}>
                              {difficultyLabels[topic.difficulty]}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-2">
                            <div>
                              <h4 className="font-medium mb-2">Explicação (EN)</h4>
                              <p className="text-muted-foreground whitespace-pre-line">
                                {topic.explanation}
                              </p>
                            </div>

                            {topic.explanation_portuguese && (
                              <div>
                                <h4 className="font-medium mb-2">Explicação (PT)</h4>
                                <p className="text-muted-foreground whitespace-pre-line">
                                  {topic.explanation_portuguese}
                                </p>
                              </div>
                            )}

                            {topic.examples && topic.examples.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Exemplos</h4>
                                <ul className="space-y-2">
                                  {topic.examples.map((example, idx) => (
                                    <li key={idx} className="border-l-2 border-primary/50 pl-3">
                                      <p className="font-medium">{example.en}</p>
                                      {example.pt && (
                                        <p className="text-sm text-muted-foreground">{example.pt}</p>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
