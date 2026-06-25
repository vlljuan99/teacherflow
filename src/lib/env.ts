import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 chars"),
  NEXTAUTH_URL: z.string().url().optional(),
  UPLOAD_DIR: z.string().default("./storage/uploads"),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(20),
  STORAGE_BACKEND: z.enum(["local", "azure"]).default("local"),
  AZURE_ACCOUNT_NAME: z.string().optional(),
  AZURE_ACCOUNT_KEY: z.string().optional(),
  AZURE_CONTAINER: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  AI_EMBED_MODEL: z.string().default("text-embedding-3-small"),
  AI_EXTRACT_MODEL: z.string().default("gemini-2.5-flash"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  APP_URL: z.string().url().optional(),
  CRON_SECRET: z.string().optional(),
  // WhatsApp (Meta Cloud API) — recordatorios por WhatsApp.
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_API_VERSION: z.string().default("v21.0"),
  WHATSAPP_REMINDER_TEMPLATE: z.string().default("class_reminder"),
  WHATSAPP_TEMPLATE_LANG: z.string().default("en"),
  WHATSAPP_DEFAULT_COUNTRY_CODE: z.string().optional(),
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
