import { AppLayout } from '@/components/AppLayout';
import { AuthGuard } from '@/components/AuthGuard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminTextsTab } from '@/components/admin/AdminTextsTab';
import { AdminGrammarTab } from '@/components/admin/AdminGrammarTab';
import { AdminVocabularyTab } from '@/components/admin/AdminVocabularyTab';
import { AdminQuizTab } from '@/components/admin/AdminQuizTab';
import { AdminExercisesTab } from '@/components/admin/AdminExercisesTab';

function AdminContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administração</h1>
        <p className="text-muted-foreground">Gerir todo o conteúdo da aplicação</p>
      </div>

      <Tabs defaultValue="texts">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="texts">Textos</TabsTrigger>
          <TabsTrigger value="grammar">Gramática</TabsTrigger>
          <TabsTrigger value="vocabulary">Vocabulário</TabsTrigger>
          <TabsTrigger value="quiz">Quizzes</TabsTrigger>
          <TabsTrigger value="exercises">Exercícios</TabsTrigger>
        </TabsList>

        <TabsContent value="texts">
          <AdminTextsTab />
        </TabsContent>

        <TabsContent value="grammar">
          <AdminGrammarTab />
        </TabsContent>

        <TabsContent value="vocabulary">
          <AdminVocabularyTab />
        </TabsContent>

        <TabsContent value="quiz">
          <AdminQuizTab />
        </TabsContent>

        <TabsContent value="exercises">
          <AdminExercisesTab />
        </TabsContent>
      </Tabs>
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
