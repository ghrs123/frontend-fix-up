import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  BookOpen, 
  PenLine, 
  CheckCircle2, 
  Lightbulb,
  Volume2,
  ArrowRight
} from "lucide-react";

interface Exercise {
  id: number;
  type: "reading" | "writing";
  title: string;
  content: string;
  question: string;
  answer?: string;
  tips?: string[];
}

const exercises: Exercise[] = [
  {
    id: 1,
    type: "reading",
    title: "A Day in London",
    content: "Yesterday, I visited London for the first time. The weather was surprisingly warm and sunny. I walked along the Thames River and saw Big Ben and the Houses of Parliament. Later, I had fish and chips at a traditional pub. It was absolutely delicious! In the evening, I watched a musical in the West End. What an amazing experience!",
    question: "What did the person eat for lunch?",
    answer: "fish and chips",
    tips: ["Look for words related to food", "Pay attention to the time of day mentioned"]
  },
  {
    id: 2,
    type: "writing",
    title: "Describe Your Weekend",
    content: "Write about what you did last weekend. Include where you went, who you were with, and how you felt.",
    question: "Write at least 3 sentences describing your weekend activities.",
    tips: ["Use past tense verbs", "Include time expressions (on Saturday, in the morning)", "Express your feelings (happy, tired, excited)"]
  },
  {
    id: 3,
    type: "reading",
    title: "Job Interview Tips",
    content: "Preparing for a job interview can be stressful, but following these tips can help. First, research the company thoroughly before the interview. Second, practice common interview questions with a friend. Third, dress professionally and arrive at least 15 minutes early. Finally, don't forget to send a thank-you email after the interview.",
    question: "How early should you arrive for a job interview?",
    answer: "at least 15 minutes early",
    tips: ["Scan the text for numbers", "Look for time-related phrases"]
  },
  {
    id: 4,
    type: "writing",
    title: "Write a Complaint Email",
    content: "You ordered a product online, but it arrived damaged. Write an email to customer service explaining the problem.",
    question: "Include: greeting, explain the problem, what you want them to do, closing.",
    tips: ["Start with 'Dear Customer Service' or 'To Whom It May Concern'", "Be polite but firm", "State clearly what resolution you expect"]
  }
];

const PracticePage = () => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);

  const exercise = exercises[currentExercise];

  const handleSpeak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  const handleSubmit = () => {
    if (!completed.includes(exercise.id)) {
      setCompleted([...completed, exercise.id]);
    }
    setShowAnswer(true);
  };

  const handleNext = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setUserAnswer("");
      setShowAnswer(false);
      setShowTips(false);
    }
  };

  const handlePrevious = () => {
    if (currentExercise > 0) {
      setCurrentExercise(currentExercise - 1);
      setUserAnswer("");
      setShowAnswer(false);
      setShowTips(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Prática</h1>
          <p className="text-muted-foreground">
            Exercícios de leitura e escrita para praticar inglês
          </p>
        </div>

        {/* Exercise Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {exercises.map((ex, index) => (
            <Button
              key={ex.id}
              variant={currentExercise === index ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setCurrentExercise(index);
                setUserAnswer("");
                setShowAnswer(false);
                setShowTips(false);
              }}
              className="flex-shrink-0"
            >
              {completed.includes(ex.id) && (
                <CheckCircle2 className="h-4 w-4 mr-1 text-success" />
              )}
              {ex.type === "reading" ? (
                <BookOpen className="h-4 w-4 mr-1" />
              ) : (
                <PenLine className="h-4 w-4 mr-1" />
              )}
              {index + 1}
            </Button>
          ))}
        </div>

        {/* Exercise Card */}
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          {/* Exercise Header */}
          <div className="p-6 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${exercise.type === "reading" ? "gradient-primary" : "gradient-accent"}`}>
                  {exercise.type === "reading" ? (
                    <BookOpen className="h-5 w-5 text-primary-foreground" />
                  ) : (
                    <PenLine className="h-5 w-5 text-accent-foreground" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    {exercise.type === "reading" ? "Leitura" : "Escrita"}
                  </span>
                  <h2 className="text-xl font-bold text-foreground">{exercise.title}</h2>
                </div>
              </div>
              {exercise.type === "reading" && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleSpeak(exercise.content)}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Exercise Content */}
          <div className="p-6">
            <div className="bg-muted/50 rounded-xl p-6 mb-6">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {exercise.content}
              </p>
            </div>

            {/* Question */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {exercise.type === "reading" ? "Pergunta:" : "Tarefa:"}
              </h3>
              <p className="text-muted-foreground">{exercise.question}</p>
            </div>

            {/* Answer Input */}
            <div className="mb-6">
              <Textarea
                placeholder="Digite sua resposta aqui..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="min-h-32 resize-none"
                disabled={showAnswer}
              />
            </div>

            {/* Tips Button */}
            {exercise.tips && !showAnswer && (
              <Button
                variant="outline"
                className="mb-4"
                onClick={() => setShowTips(!showTips)}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                {showTips ? "Esconder Dicas" : "Ver Dicas"}
              </Button>
            )}

            {/* Tips */}
            {showTips && exercise.tips && (
              <div className="bg-accent/10 rounded-xl p-4 mb-6 border border-accent/20 animate-fade-in">
                <h4 className="text-sm font-medium text-accent mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Dicas
                </h4>
                <ul className="space-y-1">
                  {exercise.tips.map((tip, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-accent">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Show Answer (for reading exercises) */}
            {showAnswer && exercise.answer && (
              <div className="bg-success/10 rounded-xl p-4 mb-6 border border-success/20 animate-fade-in">
                <h4 className="text-sm font-medium text-success mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Resposta Correta
                </h4>
                <p className="text-foreground">{exercise.answer}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              {!showAnswer ? (
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={!userAnswer.trim()}
                >
                  Verificar Resposta
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  onClick={handleNext}
                  disabled={currentExercise === exercises.length - 1}
                >
                  Próximo Exercício
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentExercise === 0}
          >
            Anterior
          </Button>
          <span className="text-muted-foreground">
            {currentExercise + 1} de {exercises.length}
          </span>
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentExercise === exercises.length - 1}
          >
            Próximo
          </Button>
        </div>

        {/* Completion Stats */}
        <div className="mt-8 bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Exercícios completos</span>
            <span className="text-lg font-bold text-foreground">
              {completed.length} / {exercises.length}
            </span>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PracticePage;
