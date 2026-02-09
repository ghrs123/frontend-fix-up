import { useState, useCallback, useEffect } from "react";
import { RotateCcw, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FlashcardProps {
  word: string;
  translation: string;
  example?: string;
  phonetic?: string;
  onKnow?: () => void;
  onDontKnow?: () => void;
}

// Get the best English voice available
function getEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices();
  
  // Prefer native English voices in this order
  const preferredVoices = [
    'Google UK English Female',
    'Google UK English Male', 
    'Google US English',
    'Microsoft Zira',
    'Microsoft David',
    'Samantha', // macOS
    'Daniel', // macOS UK
    'Karen', // macOS Australian
    'Alex', // macOS
  ];
  
  // First try to find a preferred voice
  for (const preferred of preferredVoices) {
    const voice = voices.find(v => v.name.includes(preferred));
    if (voice) return voice;
  }
  
  // Then look for any English voice
  const englishVoice = voices.find(v => 
    v.lang.startsWith('en-') && 
    (v.lang.includes('GB') || v.lang.includes('US') || v.lang.includes('AU'))
  );
  if (englishVoice) return englishVoice;
  
  // Fallback to any English voice
  return voices.find(v => v.lang.startsWith('en')) || null;
}

export function Flashcard({ word, translation, example, phonetic, onKnow, onDontKnow }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // Load voices when component mounts
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesLoaded(true);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const handleSpeak = useCallback((text: string) => {
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-GB"; // British English tends to be clearer
    utterance.rate = 0.85; // Slower rate for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to use a good English voice
    const voice = getEnglishVoice();
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speechSynthesis.speak(utterance);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      <div 
        className="perspective-1000 h-80 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div 
          className={cn(
            "relative w-full h-full transition-transform duration-500 preserve-3d",
            isFlipped && "rotate-y-180"
          )}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden rounded-2xl bg-card shadow-card border border-border p-8 flex flex-col items-center justify-center">
            <div className="absolute top-4 right-4">
              <Button
                variant="ghost"
                size="icon"
                disabled={isSpeaking}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeak(word);
                }}
              >
                {isSpeaking ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Inglês</p>
            <h2 className="text-4xl font-bold text-foreground mb-2">{word}</h2>
            {phonetic && (
              <p className="text-muted-foreground text-lg">{phonetic}</p>
            )}
            <p className="text-sm text-muted-foreground mt-6 flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Clique para virar
            </p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-card shadow-card border border-border p-8 flex flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground mb-2">Português</p>
            <h2 className="text-4xl font-bold text-foreground mb-4">{translation}</h2>
            {example && (
              <div className="mt-4 p-4 rounded-xl bg-muted/50 w-full">
                <p className="text-sm text-muted-foreground mb-1">Exemplo:</p>
                <p className="text-foreground italic">"{example}"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-6 justify-center">
        <Button
          variant="outline"
          size="lg"
          className="flex-1 max-w-40 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={onDontKnow}
        >
          Não sei
        </Button>
        <Button
          size="lg"
          className="flex-1 max-w-40 gradient-success text-success-foreground border-0"
          onClick={onKnow}
        >
          Sei
        </Button>
      </div>
    </div>
  );
}
