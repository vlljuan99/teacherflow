import { signOut } from "@/server/auth/config";
import { LocaleSwitcher } from "./locale-switcher";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function Header({
  userName,
  userRole,
}: {
  userName: string;
  userRole: string;
}) {
  const t = await getTranslations("common");
  return (
    <header className="flex items-center justify-between border-b bg-card px-6 py-3">
      <div className="text-sm text-muted-foreground">
        {userName} · <span className="font-medium text-foreground">{userRole}</span>
      </div>
      <div className="flex items-center gap-3">
        <LocaleSwitcher />
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button size="sm" variant="outline" type="submit">
            <LogOut className="h-4 w-4" />
            {t("logout")}
          </Button>
        </form>
      </div>
    </header>
  );
}
