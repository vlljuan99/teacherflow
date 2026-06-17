// Enum constants – replaces Prisma-generated enums for SQLite compatibility

export const Role = {
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
