import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuizQuestionProps {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  onAnswer: (isCorrect: boolean) => void;
}

export function QuizQuestion({ question, options, correctAnswer, explanation, onAnswer }: QuizQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (index: number) => {
    if (showResult) return;
    
    setSelectedAnswer(index);
    setShowResult(true);
    
    setTimeout(() => {
      onAnswer(index === correctAnswer);
      setSelectedAnswer(null);
      setShowResult(false);
    }, 2000);
  };

  const getOptionStyle = (index: number) => {
    if (!showResult) {
      return selectedAnswer === index 
        ? "border-primary bg-primary/5" 
        : "border-border hover:border-primary/50 hover:bg-muted/50";
    }
    
    if (index === correctAnswer) {
      return "border-success bg-success/10";
    }
    
    if (selectedAnswer === index && index !== correctAnswer) {
      return "border-destructive bg-destructive/10";
    }
    
    return "border-border opacity-50";
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card rounded-2xl shadow-card border border-border p-8">
        <h3 className="text-xl font-semibold text-foreground mb-6">{question}</h3>
        
        <div className="space-y-3">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={showResult}
              className={cn(
                "w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center justify-between",
                getOptionStyle(index)
              )}
            >
              <span className="text-foreground">{option}</span>
              {showResult && index === correctAnswer && (
                <Check className="h-5 w-5 text-success" />
              )}
              {showResult && selectedAnswer === index && index !== correctAnswer && (
                <X className="h-5 w-5 text-destructive" />
              )}
            </button>
          ))}
        </div>

        {showResult && explanation && (
          <div className="mt-6 p-4 rounded-xl bg-muted/50 animate-fade-in">
            <p className="text-sm font-medium text-foreground mb-1">Explicação:</p>
            <p className="text-muted-foreground">{explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
