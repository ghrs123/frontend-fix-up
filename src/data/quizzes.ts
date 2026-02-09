export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: "grammar" | "vocabulary" | "reading" | "listening";
  level: "beginner" | "intermediate" | "advanced";
}

export const quizData: QuizQuestion[] = [
  {
    id: 1,
    question: "Complete the sentence: 'If I _____ rich, I would travel the world.'",
    options: ["am", "was", "were", "be"],
    correctAnswer: 2,
    explanation: "No segundo condicional (situações hipotéticas), usamos 'were' para todos os sujeitos, incluindo 'I'. Esta é uma regra especial do modo subjuntivo.",
    category: "grammar",
    level: "intermediate"
  },
  {
    id: 2,
    question: "Which sentence is correct?",
    options: [
      "She don't like coffee.",
      "She doesn't likes coffee.",
      "She doesn't like coffee.",
      "She not like coffee."
    ],
    correctAnswer: 2,
    explanation: "Com 'he', 'she' e 'it', usamos 'doesn't' (does not) como auxiliar negativo, e o verbo principal fica na forma base (sem 's').",
    category: "grammar",
    level: "beginner"
  },
  {
    id: 3,
    question: "What is the past participle of 'write'?",
    options: ["writed", "wrote", "written", "writing"],
    correctAnswer: 2,
    explanation: "'Write' é um verbo irregular: write → wrote (passado simples) → written (particípio passado). Usado em tempos perfeitos: 'I have written'.",
    category: "grammar",
    level: "beginner"
  },
  {
    id: 4,
    question: "'She has been studying for three hours.' This sentence is in:",
    options: [
      "Present Perfect",
      "Present Perfect Continuous",
      "Past Perfect",
      "Past Perfect Continuous"
    ],
    correctAnswer: 1,
    explanation: "Present Perfect Continuous (has/have + been + verbo-ing) é usado para ações que começaram no passado e continuam até o presente, enfatizando a duração.",
    category: "grammar",
    level: "intermediate"
  },
  {
    id: 5,
    question: "Choose the correct relative pronoun: 'The book _____ I bought is interesting.'",
    options: ["who", "which", "whom", "whose"],
    correctAnswer: 1,
    explanation: "'Which' é usado para coisas e animais. 'Who' é para pessoas. Neste caso, 'book' é uma coisa, então usamos 'which' (ou 'that').",
    category: "grammar",
    level: "intermediate"
  },
  {
    id: 6,
    question: "What does 'ubiquitous' mean?",
    options: [
      "Rare and valuable",
      "Present everywhere",
      "Very old",
      "Extremely beautiful"
    ],
    correctAnswer: 1,
    explanation: "'Ubiquitous' significa 'presente em todos os lugares ao mesmo tempo', como smartphones que são ubíquos na sociedade moderna.",
    category: "vocabulary",
    level: "advanced"
  },
  {
    id: 7,
    question: "Which word is the opposite of 'ancient'?",
    options: ["Old", "Modern", "Classic", "Historic"],
    correctAnswer: 1,
    explanation: "'Ancient' significa muito antigo, então seu oposto é 'modern' (moderno). 'Old', 'classic' e 'historic' têm conotações diferentes.",
    category: "vocabulary",
    level: "beginner"
  },
  {
    id: 8,
    question: "Complete: 'By the time she arrived, we _____ already left.'",
    options: ["have", "had", "has", "were"],
    correctAnswer: 1,
    explanation: "Past Perfect (had + particípio) é usado para uma ação que aconteceu antes de outra ação no passado. 'Had left' aconteceu antes de 'arrived'.",
    category: "grammar",
    level: "intermediate"
  },
  {
    id: 9,
    question: "Which is a correct use of the passive voice?",
    options: [
      "The book was wrote by her.",
      "The book was written by her.",
      "The book written by her.",
      "The book is wrote by her."
    ],
    correctAnswer: 1,
    explanation: "Na voz passiva, usamos 'be + particípio passado'. O particípio de 'write' é 'written' (não 'wrote'), então a forma correta é 'was written'.",
    category: "grammar",
    level: "intermediate"
  },
  {
    id: 10,
    question: "'I wish I _____ speak French fluently.'",
    options: ["can", "could", "would", "should"],
    correctAnswer: 1,
    explanation: "Após 'wish' para expressar desejos sobre o presente, usamos o passado simples ou 'could'. 'Could' indica habilidade desejada.",
    category: "grammar",
    level: "advanced"
  }
];
