import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Flashcard } from "@/components/Flashcard";
import { Button } from "@/components/ui/button";
import { vocabularyData, VocabularyWord } from "@/data/vocabulary";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  RotateCcw,
  CheckCircle2
} from "lucide-react";

const FlashcardsPage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [knownWords, setKnownWords] = useState<number[]>([]);
  const [unknownWords, setUnknownWords] = useState<number[]>([]);
  const [shuffledWords, setShuffledWords] = useState<VocabularyWord[]>(vocabularyData);

  const currentWord = shuffledWords[currentIndex];
  const progress = ((currentIndex + 1) / shuffledWords.length) * 100;

  const handleKnow = () => {
    if (!knownWords.includes(currentWord.id)) {
      setKnownWords([...knownWords, currentWord.id]);
    }
    goToNext();
  };

  const handleDontKnow = () => {
    if (!unknownWords.includes(currentWord.id)) {
      setUnknownWords([...unknownWords, currentWord.id]);
    }
    goToNext();
  };

  const goToNext = () => {
    if (currentIndex < shuffledWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const shuffleWords = () => {
    const shuffled = [...shuffledWords].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    setCurrentIndex(0);
  };

  const resetProgress = () => {
    setCurrentIndex(0);
    setKnownWords([]);
    setUnknownWords([]);
    setShuffledWords(vocabularyData);
  };

  const isCompleted = currentIndex === shuffledWords.length - 1 && 
    (knownWords.includes(currentWord.id) || unknownWords.includes(currentWord.id));

  return (
    <Layout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Flashcards</h1>
          <p className="text-muted-foreground">
            Aprenda novas palavras de forma interativa
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Cartão {currentIndex + 1} de {shuffledWords.length}</span>
            <span>{Math.round(progress)}% completo</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-success/10 rounded-xl p-4 border border-success/20">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-success">Sei</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{knownWords.length}</p>
          </div>
          <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/20">
            <div className="flex items-center gap-2 mb-1">
              <RotateCcw className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Revisar</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{unknownWords.length}</p>
          </div>
        </div>

        {/* Flashcard */}
        {!isCompleted ? (
          <Flashcard
            word={currentWord.word}
            translation={currentWord.translation}
            phonetic={currentWord.phonetic}
            example={currentWord.example}
            onKnow={handleKnow}
            onDontKnow={handleDontKnow}
          />
        ) : (
          <div className="bg-card rounded-2xl shadow-card border border-border p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-success flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-success-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Parabéns! 🎉</h2>
            <p className="text-muted-foreground mb-6">
              Você completou todos os {shuffledWords.length} flashcards!
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-success/10 rounded-xl p-4">
                <p className="text-sm text-muted-foreground">Palavras conhecidas</p>
                <p className="text-2xl font-bold text-success">{knownWords.length}</p>
              </div>
              <div className="bg-destructive/10 rounded-xl p-4">
                <p className="text-sm text-muted-foreground">Para revisar</p>
                <p className="text-2xl font-bold text-destructive">{unknownWords.length}</p>
              </div>
            </div>
            <Button onClick={resetProgress} className="w-full">
              Recomeçar
            </Button>
          </div>
        )}

        {/* Navigation */}
        {!isCompleted && (
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={shuffleWords}>
                <Shuffle className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={resetProgress}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={goToNext}
              disabled={currentIndex === shuffledWords.length - 1}
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FlashcardsPage;
