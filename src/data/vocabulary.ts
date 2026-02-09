export interface VocabularyWord {
  id: number;
  word: string;
  translation: string;
  phonetic: string;
  example: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
}

export const vocabularyData: VocabularyWord[] = [
  {
    id: 1,
    word: "Accomplish",
    translation: "Realizar, Alcançar",
    phonetic: "/əˈkɒmplɪʃ/",
    example: "She accomplished all her goals this year.",
    category: "verbs",
    level: "intermediate"
  },
  {
    id: 2,
    word: "Serendipity",
    translation: "Acaso feliz, Serendipidade",
    phonetic: "/ˌserənˈdɪpəti/",
    example: "Finding that book was pure serendipity.",
    category: "nouns",
    level: "advanced"
  },
  {
    id: 3,
    word: "Resilient",
    translation: "Resiliente",
    phonetic: "/rɪˈzɪliənt/",
    example: "Children are often more resilient than adults.",
    category: "adjectives",
    level: "intermediate"
  },
  {
    id: 4,
    word: "Nevertheless",
    translation: "No entanto, Contudo",
    phonetic: "/ˌnevəðəˈles/",
    example: "It was raining; nevertheless, we went for a walk.",
    category: "adverbs",
    level: "intermediate"
  },
  {
    id: 5,
    word: "Overwhelmed",
    translation: "Sobrecarregado, Avassalado",
    phonetic: "/ˌəʊvəˈwelmd/",
    example: "I felt overwhelmed by all the work.",
    category: "adjectives",
    level: "intermediate"
  },
  {
    id: 6,
    word: "Breathtaking",
    translation: "De tirar o fôlego",
    phonetic: "/ˈbreθˌteɪkɪŋ/",
    example: "The view from the mountain was breathtaking.",
    category: "adjectives",
    level: "beginner"
  },
  {
    id: 7,
    word: "Furthermore",
    translation: "Além disso",
    phonetic: "/ˌfɜːðəˈmɔːr/",
    example: "The hotel was expensive; furthermore, it was far from the beach.",
    category: "adverbs",
    level: "intermediate"
  },
  {
    id: 8,
    word: "Procrastinate",
    translation: "Procrastinar",
    phonetic: "/prəˈkræstɪneɪt/",
    example: "Stop procrastinating and start working!",
    category: "verbs",
    level: "intermediate"
  },
  {
    id: 9,
    word: "Wanderlust",
    translation: "Desejo de viajar",
    phonetic: "/ˈwɒndəlʌst/",
    example: "Her wanderlust led her to visit 50 countries.",
    category: "nouns",
    level: "advanced"
  },
  {
    id: 10,
    word: "Genuine",
    translation: "Genuíno, Autêntico",
    phonetic: "/ˈdʒenjuɪn/",
    example: "His apology seemed genuine.",
    category: "adjectives",
    level: "beginner"
  }
];
