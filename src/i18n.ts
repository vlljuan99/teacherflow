import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { auth } from "@/server/auth/config";
import { Role } from "@/lib/enums";

export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export default getRequestConfig(async () => {
  // Students always experience the app in English — the locale switcher is
  // hidden for them and their cookie is ignored here. Staff keep ES/EN.
  const session = await auth();
  if (session?.user.role === Role.STUDENT) {
    return {
      locale: "en",
      messages: (await import(`./messages/en.json`)).default,
    };
  }

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const locale: Locale = (locales as readonly string[]).includes(cookieLocale ?? "")
    ? (cookieLocale as Locale)
    : defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
