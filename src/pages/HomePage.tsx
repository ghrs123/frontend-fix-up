import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Layers, 
  GraduationCap, 
  TrendingUp,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, user, profile } = useAuth();

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['home-stats', user?.id],
    queryFn: async () => {
      const [
        { count: textsCount },
        { count: grammarCount },
        flashcardsResult,
        dueResult
      ] = await Promise.all([
        supabase.from('texts').select('*', { count: 'exact', head: true }),
        supabase.from('grammar_topics').select('*', { count: 'exact', head: true }),
        user 
          ? supabase.from('flashcards').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
          : Promise.resolve({ count: 0 }),
        user
          ? supabase.from('flashcards').select('next_review_at').eq('user_id', user.id).lte('next_review_at', new Date().toISOString())
          : Promise.resolve({ data: [] })
      ]);

      return {
        texts: textsCount || 0,
        grammar: grammarCount || 0,
        flashcards: flashcardsResult.count || 0,
        due: dueResult.data?.length || 0,
      };
    },
  });

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Estudante';

  const features = [
    {
      icon: BookOpen,
      title: 'Leitura Interativa',
      description: 'Leia textos em inglês e clique nas palavras para ver definições',
      href: '/reading',
      color: 'bg-blue-500/10 text-blue-600',
    },
    {
      icon: Layers,
      title: 'Flashcards',
      description: 'Memorize vocabulário com repetição espaçada (SM2)',
      href: '/flashcards',
      color: 'bg-purple-500/10 text-purple-600',
      badge: stats?.due ? `${stats.due} pendente(s)` : undefined,
    },
    {
      icon: GraduationCap,
      title: 'Gramática',
      description: 'Aprenda regras gramaticais com explicações claras',
      href: '/grammar',
      color: 'bg-green-500/10 text-green-600',
    },
    {
      icon: TrendingUp,
      title: 'Progresso',
      description: 'Acompanhe o seu progresso de aprendizagem',
      href: '/progress',
      color: 'bg-orange-500/10 text-orange-600',
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center py-8 md:py-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
            <Sparkles className="h-4 w-4" />
            Aprenda inglês de forma eficaz
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            {isAuthenticated ? (
              <>Olá, <span className="text-primary">{displayName}</span>!</>
            ) : (
              <>Bem-vindo ao <span className="text-primary">EnglishStudy</span></>
            )}
          </h1>
          
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {isAuthenticated 
              ? 'Continue o seu percurso de aprendizagem. Que tal uma sessão de revisão?'
              : 'A sua plataforma completa para estudar inglês. Leitura, vocabulário, gramática e muito mais.'}
          </p>

          {!isAuthenticated && (
            <div className="mt-6 flex gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/auth">
                  Começar agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/reading">Explorar textos</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Quick Stats (authenticated) */}
        {isAuthenticated && stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Textos Disponíveis</CardDescription>
                <CardTitle className="text-3xl">{stats.texts}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Tópicos de Gramática</CardDescription>
                <CardTitle className="text-3xl">{stats.grammar}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Seus Flashcards</CardDescription>
                <CardTitle className="text-3xl">{stats.flashcards}</CardTitle>
              </CardHeader>
            </Card>
            <Card className={stats.due > 0 ? 'border-primary' : ''}>
              <CardHeader className="pb-2">
                <CardDescription>Revisões Pendentes</CardDescription>
                <CardTitle className="text-3xl">{stats.due}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.href} className="group hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`rounded-lg p-2 ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      {feature.badge && (
                        <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                          {feature.badge}
                        </span>
                      )}
                    </div>
                    <CardDescription className="mt-1">{feature.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" className="w-full justify-between group-hover:bg-muted">
                  <Link to={feature.href}>
                    Explorar
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
