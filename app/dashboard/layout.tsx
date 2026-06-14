import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { createInsForgeServerClient } from "@/lib/insforge/server";

type UserProfile = {
  name?: string;
  avatar_url?: string;
};

function getUserName(user: { email?: string; profile?: unknown }) {
  const profile = (user.profile ?? {}) as UserProfile;
  return profile.name || user.email?.split("@")[0] || "Studio user";
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "VS"
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const insforge = await createInsForgeServerClient();
  const { data } = await insforge.auth.getCurrentUser();

  if (!data.user) {
    redirect("/sign-in");
  }

  const userName = getUserName(data.user);

  return (
    <DashboardShell
      userName={userName}
      userEmail={data.user.email}
      initials={getInitials(userName)}
    >
      {children}
    </DashboardShell>
  );
}
