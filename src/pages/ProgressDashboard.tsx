import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Layers, 
  GraduationCap, 
  TrendingUp,
  Calendar,
  Target,
  Award
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export default function ProgressDashboard() {
  const { user, isAuthenticated } = useAuth();

  // Fetch user stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const [
        { count: flashcardsCount },
        { count: textsReadCount },
        { count: reviewsCount },
        { data: flashcards }
      ] = await Promise.all([
        supabase.from('flashcards').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('user_progress').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('progress_type', 'reading').eq('completed', true),
        supabase.from('flashcard_reviews').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('flashcards').select('next_review_at').eq('user_id', user.id),
      ]);

      const dueToday = flashcards?.filter(f => 
        new Date(f.next_review_at!) <= new Date()
      ).length || 0;

      return {
        totalFlashcards: flashcardsCount || 0,
        textsRead: textsReadCount || 0,
        totalReviews: reviewsCount || 0,
        dueToday,
      };
    },
    enabled: isAuthenticated,
  });

  // Fetch recent reviews for chart
  const { data: recentReviews } = useQuery({
    queryKey: ['recent-reviews', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data } = await supabase
        .from('flashcard_reviews')
        .select('reviewed_at, quality')
        .eq('user_id', user.id)
        .gte('reviewed_at', sevenDaysAgo.toISOString())
        .order('reviewed_at', { ascending: true });

      // Group by day
      const grouped = (data || []).reduce((acc, review) => {
        const date = new Date(review.reviewed_at).toLocaleDateString('pt-PT', { weekday: 'short' });
        if (!acc[date]) {
          acc[date] = { day: date, reviews: 0, correct: 0 };
        }
        acc[date].reviews++;
        if (review.quality >= 3) acc[date].correct++;
        return acc;
      }, {} as Record<string, { day: string; reviews: number; correct: number }>);

      return Object.values(grouped);
    },
    enabled: isAuthenticated,
  });

  // Fetch content stats
  const { data: contentStats } = useQuery({
    queryKey: ['content-stats'],
    queryFn: async () => {
      const [
        { count: textsCount },
        { count: grammarCount }
      ] = await Promise.all([
        supabase.from('texts').select('*', { count: 'exact', head: true }),
        supabase.from('grammar_topics').select('*', { count: 'exact', head: true }),
      ]);

      return {
        totalTexts: textsCount || 0,
        totalGrammar: grammarCount || 0,
      };
    },
  });

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold">Faça login para ver o seu progresso</h2>
          <p className="text-muted-foreground mt-2">
            O progresso é guardado automaticamente quando está autenticado.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Progresso</h1>
          <p className="text-muted-foreground">
            Acompanhe o seu progresso de aprendizagem
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flashcards</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalFlashcards || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.dueToday || 0} para revisar hoje
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Textos Lidos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.textsRead || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    de {contentStats?.totalTexts || 0} disponíveis
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revisões</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalReviews || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    total de revisões
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gramática</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contentStats?.totalGrammar || 0}</div>
              <p className="text-xs text-muted-foreground">
                tópicos disponíveis
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revisões nos últimos 7 dias</CardTitle>
              <CardDescription>Número de flashcards revisados por dia</CardDescription>
            </CardHeader>
            <CardContent>
              {recentReviews && recentReviews.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={recentReviews}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="reviews" fill="hsl(var(--primary))" name="Revisões" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="correct" fill="hsl(var(--primary) / 0.5)" name="Corretas" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  Sem dados de revisão ainda
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progresso de Leitura</CardTitle>
              <CardDescription>Textos lidos vs disponíveis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Textos lidos</span>
                  <span className="font-medium">
                    {stats?.textsRead || 0} / {contentStats?.totalTexts || 0}
                  </span>
                </div>
                <Progress 
                  value={contentStats?.totalTexts ? ((stats?.textsRead || 0) / contentStats.totalTexts) * 100 : 0} 
                />
              </div>

              <div className="pt-4 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Revisões pendentes</p>
                    <p className="text-sm text-muted-foreground">
                      {stats?.dueToday || 0} flashcards para hoje
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Award className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Continue assim!</p>
                    <p className="text-sm text-muted-foreground">
                      A consistência é a chave do sucesso
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
