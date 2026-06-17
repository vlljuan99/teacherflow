import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 chars"),
  NEXTAUTH_URL: z.string().url().optional(),
  UPLOAD_DIR: z.string().default("./storage/uploads"),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(20),
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  AI_EMBED_MODEL: z.string().default("text-embedding-3-small"),
  AI_EXTRACT_MODEL: z.string().default("gemini-2.5-flash"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

export function env(): Env {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
      throw new Error("Invalid environment variables");
    }
    cached = parsed.data;
  }
  return cached;
}
