// Placement test content. Each question has 4 options labelled "a"/"b"/"c"/"d"
// (or "true"/"false" for T/F). The `correct` field is the expected answer.

export interface Choice {
  key: string; // "a", "b", "c", "d", "true", "false"
  text: string;
}

export interface Question {
  id: string;
  prompt: string;
  choices: Choice[];
  correct: string;
  hint?: string;
}

export interface Section<T> {
  id: string;
  title: string;
  description?: string;
  questions: T[];
}

// --------- Part 1: Grammar & Vocabulary ---------

const ABCD = (a: string, b: string, c: string, d: string): Choice[] => [
  { key: "a", text: a },
  { key: "b", text: b },
  { key: "c", text: c },
  { key: "d", text: d },
];

export const GRAMMAR_QUESTIONS: Question[] = [
  {
    id: "g1",
    prompt: "If I ______ enough money, I would travel more often.",
    choices: ABCD("have", "had", "would have", "will have"),
    correct: "b",
    hint: "Second conditional",
  },
  {
    id: "g2",
    prompt: "She ______ English since she was ten.",
    choices: ABCD("studies", "is studying", "has studied", "studied"),
    correct: "c",
    hint: "Present perfect (since + past)",
  },
  {
    id: "g3",
    prompt: "This book ______ by thousands of students every year.",
    choices: ABCD("reads", "is read", "read", "has reading"),
    correct: "b",
    hint: "Passive voice",
  },
  {
    id: "g4",
    prompt: "I’m tired because I ______ all morning.",
    choices: ABCD("have worked", "have been working", "worked", "am working"),
    correct: "b",
    hint: "Present perfect continuous",
  },
  {
    id: "g5",
    prompt: "You ______ use your phone during the exam. It’s forbidden.",
    choices: ABCD("don’t have to", "mustn’t", "shouldn’t have", "might not"),
    correct: "b",
    hint: "Prohibition modal",
  },
  {
    id: "g6",
    prompt: "He told me that he ______ the film before.",
    choices: ABCD("saw", "has seen", "had seen", "would see"),
    correct: "c",
    hint: "Past perfect (una acción ocurre antes que la otra)",
  },
  {
    id: "g7",
    prompt: "I’m looking forward to ______ you again.",
    choices: ABCD("see", "seeing", "saw", "seen"),
    correct: "b",
    hint: "Preposition + gerund",
  },
  {
    id: "g8",
    prompt: "We had to ______ the meeting because the teacher was ill.",
    choices: ABCD("call off", "put up", "take after", "look into"),
    correct: "a",
  },
  {
    id: "g9",
    prompt: "The film was ______ boring that I fell asleep.",
    choices: ABCD("such", "so", "too", "enough"),
    correct: "b",
  },
  {
    id: "g10",
    prompt: "I don’t know what this word means. I’ll ______ it up.",
    choices: ABCD("look", "put", "get", "take"),
    correct: "a",
    hint: "Phrasal verb: look up",
  },
];

// --------- Part 2: Reading ---------

export const READING_TEXT = `**Remote Work**

A few years ago, most people worked in an office every day. Today, however, remote work has become much more common. Thanks to technology, many employees can work from home, from a café or even while travelling.

One of the biggest advantages of remote work is flexibility. Workers can organise their time more freely and avoid long journeys to the office. This can reduce stress and give people more time for their family, hobbies or rest.

However, remote work also has disadvantages. Some people find it difficult to separate their job from their personal life. When your home is also your workplace, you may check emails late at night or continue working after your official working hours.

Another problem is loneliness. Offices are not only places to work; they are also places where people talk, share ideas and feel part of a team. For this reason, some workers prefer a mixed system: working from home some days and going to the office on others.`;

export const READING_MULTIPLE: Question[] = [
  {
    id: "r1",
    prompt: "Remote work has become more common because…",
    choices: ABCD(
      "people hate offices.",
      "technology makes it possible.",
      "cafés are cheaper than offices.",
      "people travel more than before.",
    ),
    correct: "b",
  },
  {
    id: "r2",
    prompt: "One advantage of remote work is that workers…",
    choices: ABCD(
      "can organise their time more freely.",
      "never feel stressed.",
      "do not have to work hard.",
      "always earn more money.",
    ),
    correct: "a",
  },
  {
    id: "r3",
    prompt: "Some people work too much from home because…",
    choices: ABCD(
      "they have too many hobbies.",
      "they cannot separate work from personal life.",
      "their homes are very noisy.",
      "they dislike their jobs.",
    ),
    correct: "b",
  },
  {
    id: "r4",
    prompt: "Why can offices be important?",
    choices: ABCD(
      "They are always more comfortable.",
      "They help people feel part of a team.",
      "They make people work less.",
      "They are better than homes.",
    ),
    correct: "b",
  },
  {
    id: "r5",
    prompt: "What solution do some workers prefer?",
    choices: ABCD(
      "Working only at night.",
      "Never going to the office.",
      "A mixed system.",
      "Travelling while working.",
    ),
    correct: "c",
  },
];

const TF = (): Choice[] => [
  { key: "true", text: "TRUE" },
  { key: "false", text: "FALSE" },
];

export const READING_TF: Question[] = [
  {
    id: "r6",
    prompt: "Remote work can help people avoid long journeys to work.",
    choices: TF(),
    correct: "true",
  },
  {
    id: "r7",
    prompt: "The text says remote work has no disadvantages.",
    choices: TF(),
    correct: "false",
  },
  {
    id: "r8",
    prompt: "Some people may check work emails late at night.",
    choices: TF(),
    correct: "true",
  },
  {
    id: "r9",
    prompt: "Offices can be social places.",
    choices: TF(),
    correct: "true",
  },
  {
    id: "r10",
    prompt: "The text says everyone should work from home every day.",
    choices: TF(),
    correct: "false",
  },
];

export const READING_QUESTIONS = [...READING_MULTIPLE, ...READING_TF];

// --------- Part 3: Writing ---------

export const WRITING_PROMPT = {
  title: "Informal Email — 100 words",
  intro: "Your English friend wants to visit your town for a weekend. Write an email to your friend.",
  include: [
    "what places they should visit",
    "what food they should try",
    "what you can do together",
  ],
  structure: ["Greetings (Hi, Hello,)", "Introduction", "Body: Paragraph 1, Paragraph 2", "Conclusion", "Goodbyes"],
};

// --------- Part 4: Speaking ---------

export const SPEAKING_PROMPTS = {
  longTurn: [
    "Describe a place you would like to visit",
    "Talk about a person you admire",
    "Describe a series you enjoyed (watch)",
  ],
  pronunciationFocus: ["bear", "bird", "beer", "beard"],
  vocabularyFocus: [
    "interpret",
    "at work",
    "easier (not 'more easy')",
    "dialects",
    "cuisine",
    "fast food / junk food",
    "inherit",
    "well shot / visuals",
  ],
};
