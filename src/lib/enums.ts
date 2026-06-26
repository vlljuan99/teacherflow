// Enum constants – replaces Prisma-generated enums for SQLite compatibility

export const Role = {
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  GUARDIAN: "GUARDIAN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const EnglishLevel = {
  A1: "A1",
  A2: "A2",
  B1: "B1",
  B2: "B2",
  C1: "C1",
  C2: "C2",
} as const;
export type EnglishLevel = (typeof EnglishLevel)[keyof typeof EnglishLevel];

export const StudentStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  PENDING: "PENDING",
} as const;
export type StudentStatus = (typeof StudentStatus)[keyof typeof StudentStatus];

export const ClassModality = {
  IN_PERSON: "IN_PERSON",
  ONLINE: "ONLINE",
} as const;
export type ClassModality = (typeof ClassModality)[keyof typeof ClassModality];

export const WorksheetStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;
export type WorksheetStatus = (typeof WorksheetStatus)[keyof typeof WorksheetStatus];

export const WorksheetLanguage = {
  EN: "EN",
  ES: "ES",
} as const;
export type WorksheetLanguage = (typeof WorksheetLanguage)[keyof typeof WorksheetLanguage];

export const ExerciseType = {
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  TRUE_FALSE: "TRUE_FALSE",
  FILL_BLANKS: "FILL_BLANKS",
  SHORT_ANSWER: "SHORT_ANSWER",
  MATCH_COLUMNS: "MATCH_COLUMNS",
  ORDER_WORDS: "ORDER_WORDS",
  READING: "READING",
  LISTENING: "LISTENING",
  WRITING: "WRITING",
} as const;
export type ExerciseType = (typeof ExerciseType)[keyof typeof ExerciseType];

export const AssignmentStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  SUBMITTED: "SUBMITTED",
  CORRECTED: "CORRECTED",
} as const;
export type AssignmentStatus = (typeof AssignmentStatus)[keyof typeof AssignmentStatus];

export const CorrectionStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  SUBMITTED: "SUBMITTED",
  CORRECTED: "CORRECTED",
} as const;
export type CorrectionStatus = (typeof CorrectionStatus)[keyof typeof CorrectionStatus];

export const PaymentMethod = {
  CASH: "CASH",
  TRANSFER: "TRANSFER",
  CARD: "CARD",
  BIZUM: "BIZUM",
  OTHER: "OTHER",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  CANCELED: "CANCELED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const MaterialType = {
  PDF: "PDF",
  IMAGE: "IMAGE",
  AUDIO: "AUDIO",
  DOCUMENT: "DOCUMENT",
} as const;
export type MaterialType = (typeof MaterialType)[keyof typeof MaterialType];

export const ExamType = {
  APTIS: "APTIS",
  CAMBRIDGE_KET: "CAMBRIDGE_KET",
  CAMBRIDGE_PET: "CAMBRIDGE_PET",
  CAMBRIDGE_FCE: "CAMBRIDGE_FCE",
  CAMBRIDGE_CAE: "CAMBRIDGE_CAE",
  CAMBRIDGE_CPE: "CAMBRIDGE_CPE",
  TRINITY: "TRINITY",
  EOI: "EOI",
} as const;
export type ExamType = (typeof ExamType)[keyof typeof ExamType];

export const MaterialCategory = {
  GRAMMAR: "GRAMMAR",
  VOCABULARY: "VOCABULARY",
  READING: "READING",
  WRITING: "WRITING",
  LISTENING: "LISTENING",
  SPEAKING: "SPEAKING",
  WORKBOOK: "WORKBOOK",
  VERB_LIST: "VERB_LIST",
  REWRITING: "REWRITING",
  EXAM_PRACTICE: "EXAM_PRACTICE",
  ELEMENTARY: "ELEMENTARY",
  PRESCHOOL: "PRESCHOOL",
  CHALLENGES: "CHALLENGES",
  OTHER: "OTHER",
} as const;
export type MaterialCategory = (typeof MaterialCategory)[keyof typeof MaterialCategory];

export const StorageBackend = {
  LOCAL: "local",
  AZURE: "azure",
} as const;
export type StorageBackend = (typeof StorageBackend)[keyof typeof StorageBackend];

export const ConsentType = {
  DATA_PROCESSING: "DATA_PROCESSING",
  IMAGE_RIGHTS: "IMAGE_RIGHTS",
  COMMUNICATIONS: "COMMUNICATIONS",
  MINOR_PROCESSING: "MINOR_PROCESSING",
  OTHER: "OTHER",
} as const;
export type ConsentType = (typeof ConsentType)[keyof typeof ConsentType];

export const ConsentStatus = {
  ACCEPTED: "ACCEPTED",
  REVOKED: "REVOKED",
} as const;
export type ConsentStatus = (typeof ConsentStatus)[keyof typeof ConsentStatus];

export const PdfImportStatus = {
  UPLOADED: "UPLOADED",
  PROCESSED: "PROCESSED",
} as const;
export type PdfImportStatus = (typeof PdfImportStatus)[keyof typeof PdfImportStatus];

export const WorksheetKind = {
  STANDARD: "STANDARD",
  PLACEMENT_TEST: "PLACEMENT_TEST",
} as const;
export type WorksheetKind = (typeof WorksheetKind)[keyof typeof WorksheetKind];

export const PlacementStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  SKIPPED: "SKIPPED",
} as const;
export type PlacementStatus = (typeof PlacementStatus)[keyof typeof PlacementStatus];

export const MaterialTrack = {
  ESO: "ESO",
  BACHILLERATO: "BACHILLERATO",
  CAMBRIDGE_B1: "CAMBRIDGE_B1",
  CAMBRIDGE_B2: "CAMBRIDGE_B2",
  CAMBRIDGE_C1: "CAMBRIDGE_C1",
  APTIS: "APTIS",
  ADULTS: "ADULTS",
} as const;
export type MaterialTrack = (typeof MaterialTrack)[keyof typeof MaterialTrack];

export const TRACK_ORDER: MaterialTrack[] = [
  MaterialTrack.ESO,
  MaterialTrack.BACHILLERATO,
  MaterialTrack.CAMBRIDGE_B1,
  MaterialTrack.CAMBRIDGE_B2,
  MaterialTrack.CAMBRIDGE_C1,
  MaterialTrack.APTIS,
  MaterialTrack.ADULTS,
];

export const AttendanceStatus = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  LATE: "LATE",
  EXCUSED: "EXCUSED",
} as const;
export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const ATTENDANCE_ORDER: AttendanceStatus[] = [
  AttendanceStatus.PRESENT,
  AttendanceStatus.LATE,
  AttendanceStatus.ABSENT,
  AttendanceStatus.EXCUSED,
];

export const Skill = {
  SPEAKING: "SPEAKING",
  WRITING: "WRITING",
} as const;
export type Skill = (typeof Skill)[keyof typeof Skill];

export const SkillSubmissionStatus = {
  SUBMITTED: "SUBMITTED",
  REVIEWED: "REVIEWED",
} as const;
export type SkillSubmissionStatus =
  (typeof SkillSubmissionStatus)[keyof typeof SkillSubmissionStatus];

export const SpeakingTwist = {
  DOUBLE: "DOUBLE",
  STEAL: "STEAL",
  SWAP: "SWAP",
  LOSE: "LOSE",
} as const;
export type SpeakingTwist = (typeof SpeakingTwist)[keyof typeof SpeakingTwist];

export const TRACK_SUBSECTIONS: Record<MaterialTrack, string[]> = {
  ESO: [
    "1.º ESO",
    "2.º ESO",
    "3.º ESO",
    "4.º ESO",
    "Grammar basics",
    "Vocabulary",
    "Reading",
    "Writing",
    "Listening",
    "Speaking",
  ],
  BACHILLERATO: [
    "1.º Bachillerato",
    "2.º Bachillerato",
    "Selectividad / PEvAU",
    "Writing practice",
    "Rephrasing",
  ],
  CAMBRIDGE_B1: [
    "Reading",
    "Writing",
    "Listening",
    "Speaking",
    "Use of English",
    "Grammar bank",
    "Vocabulary bank",
    "Mock exams",
    "Useful phrases",
  ],
  CAMBRIDGE_B2: [
    "Reading & Use of English",
    "Writing",
    "Listening",
    "Speaking",
    "Transformations",
    "Essay / Article / Review / Email",
    "Mock exams",
    "Common mistakes",
  ],
  CAMBRIDGE_C1: [
    "Key word transformations",
    "Advanced grammar",
    "Essay writing",
    "Speaking practice",
    "Formal language",
    "Collocations",
    "Phrasal verbs",
    "Mock exams",
  ],
  APTIS: [
    "Grammar & Vocabulary",
    "Speaking",
    "Writing",
    "Listening",
    "Reading",
    "Model answers",
    "Exam strategies",
  ],
  ADULTS: [
    "Grammar",
    "Vocabulary",
    "Conversation",
    "Reading",
    "Writing",
    "Listening",
  ],
};
