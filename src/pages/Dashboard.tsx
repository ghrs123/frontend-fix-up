import { Layout } from "@/components/Layout";
import { StatsCard } from "@/components/StatsCard";
import { ProgressCard } from "@/components/ProgressCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Book, 
  GraduationCap, 
  MessageSquare, 
  Flame, 
  Target, 
  TrendingUp,
  Clock,
  Star,
  ArrowRight
} from "lucide-react";

const Dashboard = () => {
  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Olá! 👋 Vamos estudar inglês?
          </h1>
          <p className="text-muted-foreground">
            Continue de onde parou e alcance suas metas de hoje.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Dias de sequência"
            value={7}
            icon={Flame}
            color="accent"
            trend={{ value: 14, isPositive: true }}
            subtitle="Continue assim!"
          />
          <StatsCard
            title="Palavras aprendidas"
            value={128}
            icon={Book}
            color="primary"
            trend={{ value: 23, isPositive: true }}
          />
          <StatsCard
            title="Quiz respondidos"
            value={45}
            icon={GraduationCap}
            color="success"
          />
          <StatsCard
            title="Horas de estudo"
            value="12h"
            icon={Clock}
            color="warning"
            subtitle="Esta semana"
          />
        </div>

        {/* Progress Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Seu Progresso
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ProgressCard
              title="Vocabulário"
              value={128}
              total={500}
              icon={Book}
              color="primary"
            />
            <ProgressCard
              title="Gramática"
              value={45}
              total={100}
              icon={GraduationCap}
              color="success"
            />
            <ProgressCard
              title="Conversação"
              value={12}
              total={50}
              icon={MessageSquare}
              color="accent"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Comece agora
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/flashcards" className="group">
              <div className="bg-card rounded-2xl shadow-card border border-border p-6 hover:shadow-hover transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl gradient-primary">
                    <Book className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Flashcards</h3>
                <p className="text-sm text-muted-foreground">
                  Aprenda novas palavras com cartões de memória interativos.
                </p>
              </div>
            </Link>

            <Link to="/quiz" className="group">
              <div className="bg-card rounded-2xl shadow-card border border-border p-6 hover:shadow-hover transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl gradient-success">
                    <GraduationCap className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-success transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Quiz de Gramática</h3>
                <p className="text-sm text-muted-foreground">
                  Teste seus conhecimentos com exercícios interativos.
                </p>
              </div>
            </Link>

            <Link to="/practice" className="group">
              <div className="bg-card rounded-2xl shadow-card border border-border p-6 hover:shadow-hover transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl gradient-accent">
                    <MessageSquare className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Prática</h3>
                <p className="text-sm text-muted-foreground">
                  Pratique leitura e escrita com exercícios contextuais.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Daily Goal */}
        <div className="bg-card rounded-2xl shadow-card border border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/20">
                <Star className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Meta Diária</h3>
                <p className="text-sm text-muted-foreground">
                  Complete 10 flashcards e 5 questões de quiz
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">60%</p>
              <p className="text-sm text-muted-foreground">completo</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
