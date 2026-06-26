import { signOut } from "@/server/auth/config";
import { LocaleSwitcher } from "./locale-switcher";
import { Button } from "@/components/ui/button";
import { HeaderAvatar } from "./header-avatar";
import { LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function Header({
  userName,
  userRole,
  avatarUrl,
}: {
  userName: string;
  userRole: string;
  avatarUrl?: string | null;
}) {
  const t = await getTranslations("common");
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-card/70 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <HeaderAvatar src={avatarUrl} alt={userName} />
        <div className="text-sm leading-tight">
          <div className="font-medium text-foreground">{userName}</div>
          <div className="text-xs text-muted-foreground">{userRole}</div>
        </div>
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
