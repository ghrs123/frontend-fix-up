import { useState } from "react";
import { Layout } from "@/components/Layout";
import { QuizQuestion } from "@/components/QuizQuestion";
import { Button } from "@/components/ui/button";
import { quizData } from "@/data/quizzes";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  RotateCcw, 
  CheckCircle2,
  XCircle,
  Target
} from "lucide-react";

const QuizPage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQuestion = quizData[currentIndex];
  const progress = ((currentIndex) / quizData.length) * 100;

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setCorrectAnswers(correctAnswers + 1);
    } else {
      setIncorrectAnswers(incorrectAnswers + 1);
    }

    if (currentIndex < quizData.length - 1) {
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 100);
    } else {
      setTimeout(() => {
        setIsCompleted(true);
      }, 100);
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setIsCompleted(false);
  };

  const scorePercentage = Math.round((correctAnswers / quizData.length) * 100);

  const getScoreMessage = () => {
    if (scorePercentage >= 90) return { emoji: "🏆", message: "Excelente! Você é um mestre!" };
    if (scorePercentage >= 70) return { emoji: "🌟", message: "Muito bom! Continue assim!" };
    if (scorePercentage >= 50) return { emoji: "💪", message: "Bom trabalho! Pratique mais!" };
    return { emoji: "📚", message: "Continue estudando!" };
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Quiz de Gramática</h1>
          <p className="text-muted-foreground">
            Teste seus conhecimentos de inglês
          </p>
        </div>

        {!isCompleted ? (
          <>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Questão {currentIndex + 1} de {quizData.length}</span>
                <span>{Math.round(progress)}% completo</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-success/10 rounded-xl p-4 border border-success/20">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-success">Corretas</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{correctAnswers}</p>
              </div>
              <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/20">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Incorretas</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{incorrectAnswers}</p>
              </div>
            </div>

            {/* Question */}
            <QuizQuestion
              question={currentQuestion.question}
              options={currentQuestion.options}
              correctAnswer={currentQuestion.correctAnswer}
              explanation={currentQuestion.explanation}
              onAnswer={handleAnswer}
            />
          </>
        ) : (
          <div className="bg-card rounded-2xl shadow-card border border-border p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center animate-pulse-ring">
              <Trophy className="h-10 w-10 text-primary-foreground" />
            </div>
            
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {getScoreMessage().emoji} Quiz Completo!
            </h2>
            <p className="text-muted-foreground mb-6">
              {getScoreMessage().message}
            </p>

            {/* Score Display */}
            <div className="bg-muted/50 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Target className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold text-foreground">Sua Pontuação</span>
              </div>
              <p className="text-5xl font-bold text-gradient mb-2">
                {scorePercentage}%
              </p>
              <p className="text-muted-foreground">
                {correctAnswers} de {quizData.length} questões corretas
              </p>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-success/10 rounded-xl p-4">
                <p className="text-sm text-muted-foreground">Respostas corretas</p>
                <p className="text-3xl font-bold text-success">{correctAnswers}</p>
              </div>
              <div className="bg-destructive/10 rounded-xl p-4">
                <p className="text-sm text-muted-foreground">Respostas incorretas</p>
                <p className="text-3xl font-bold text-destructive">{incorrectAnswers}</p>
              </div>
            </div>

            <Button onClick={resetQuiz} size="lg" className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default QuizPage;
