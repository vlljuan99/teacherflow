import { EnglishLevel, ExamType, MaterialCategory } from "@/lib/enums";

// Map a Classroom topic title (e.g. "Aptis Advanced - C1", "Grammar Explanation + Exercises")
// to our structured taxonomy. Pure / sync — usable from server actions, tests and seed.
export function inferTaxonomy(topicTitle: string | undefined | null): {
  level: EnglishLevel | null;
  examType: ExamType | null;
  category: MaterialCategory;
} {
  const t = (topicTitle ?? "").toLowerCase();

  let level: EnglishLevel | null = null;
  for (const lv of Object.values(EnglishLevel)) {
    if (t.includes(lv.toLowerCase())) {
      level = lv;
      break;
    }
  }

  let examType: ExamType | null = null;
  if (t.includes("aptis")) examType = ExamType.APTIS;
  else if (t.includes("cae") || t.includes("advanced")) examType = ExamType.CAMBRIDGE_CAE;
  else if (t.includes("cpe") || t.includes("proficiency")) examType = ExamType.CAMBRIDGE_CPE;
  else if (t.includes("fce") || t.includes("first")) examType = ExamType.CAMBRIDGE_FCE;
  else if (t.includes("pet") || t.includes("preliminary")) examType = ExamType.CAMBRIDGE_PET;
  else if (t.includes("ket") || t.includes("key english")) examType = ExamType.CAMBRIDGE_KET;
  else if (t.includes("trinity") || t.includes("ise") || t.includes("gese")) examType = ExamType.TRINITY;
  else if (t.includes("eoi")) examType = ExamType.EOI;

  let category: MaterialCategory = MaterialCategory.OTHER;
  if (t.includes("grammar") || t.includes("tense")) category = MaterialCategory.GRAMMAR;
  else if (t.includes("vocab")) category = MaterialCategory.VOCABULARY;
  else if (t.includes("reading")) category = MaterialCategory.READING;
  else if (t.includes("writing")) category = MaterialCategory.WRITING;
  else if (t.includes("listening")) category = MaterialCategory.LISTENING;
  else if (t.includes("speaking")) category = MaterialCategory.SPEAKING;
  else if (t.includes("workbook")) category = MaterialCategory.WORKBOOK;
  else if (t.includes("verb")) category = MaterialCategory.VERB_LIST;
  else if (t.includes("rewriting")) category = MaterialCategory.REWRITING;
  else if (t.includes("preschool") || t.includes("infantil")) category = MaterialCategory.PRESCHOOL;
  else if (t.includes("elementary") || t.includes("primaria")) category = MaterialCategory.ELEMENTARY;
  else if (t.includes("challenge") || t.includes("activit")) category = MaterialCategory.CHALLENGES;
  else if (examType) category = MaterialCategory.EXAM_PRACTICE;

  return { level, examType, category };
}
