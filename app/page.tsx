import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Command,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  PanelLeft,
  Search,
  Sparkles,
  Wand2,
} from "lucide-react";
import { createInsForgeServerClient } from "@/lib/insforge/server";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

type UserProfile = {
  name?: string;
  avatar_url?: string;
};

function getUserName(user: { email?: string; profile?: unknown }) {
  const profile = (user.profile ?? {}) as UserProfile;
  return profile.name || user.email?.split("@")[0] || "Studio user";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "VS";
}

export default async function Home() {
  const insforge = await createInsForgeServerClient();
  const { data } = await insforge.auth.getCurrentUser();

  if (!data.user) {
    redirect("/sign-in");
  }

  const userName = getUserName(data.user);
  const userEmail = data.user.email;
  const initials = getInitials(userName);

  const campaigns = [
    { name: "Launch newsletter", status: "Ready", tone: "Editorial", score: "96%" },
    { name: "Founder LinkedIn series", status: "Drafting", tone: "Bold", score: "88%" },
    { name: "Product education", status: "Review", tone: "Clear", score: "91%" },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_8%_8%,color-mix(in_oklch,var(--primary),transparent_75%),transparent_28rem),radial-gradient(circle_at_90%_12%,color-mix(in_oklch,var(--accent),transparent_72%),transparent_26rem)]" />
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px]">
        <aside className="hidden w-72 shrink-0 border-r border-border/70 bg-card/55 p-5 backdrop-blur-xl lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="font-semibold tracking-tight">VoxaAI Studio</div>
              <div className="text-xs text-muted-foreground">AI content companion</div>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              ["Dashboard", LayoutDashboard],
              ["Campaigns", CalendarDays],
              ["AI Writer", Wand2],
              ["Content Library", FileText],
              ["Feedback", MessageSquareText],
            ].map(([label, Icon]) => (
              <a
                key={label as string}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground first:bg-primary first:text-primary-foreground first:shadow-lg first:shadow-primary/20"
                href="#"
              >
                <Icon className="size-4" />
                {label as string}
              </a>
            ))}
          </nav>

          <div className="mt-8 rounded-3xl border border-border bg-background/70 p-4 shadow-sm">
            <div className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <Command className="size-5" />
            </div>
            <h3 className="font-medium">Prompt vault</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Save high-performing prompt systems and reuse them across campaigns.
            </p>
          </div>

          <div className="mt-6 rounded-3xl border border-border bg-background/70 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{userName}</div>
                <div className="truncate text-xs text-muted-foreground">{userEmail}</div>
              </div>
            </div>
            <div className="mt-4">
              <SignOutButton />
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-border/70 bg-background/80 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="rounded-full lg:hidden">
                <PanelLeft className="size-4" />
              </Button>
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-11 w-full rounded-full border border-border bg-card/75 pl-11 pr-4 text-sm shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
                  placeholder="Search campaigns, briefs, prompts..."
                />
              </div>
              <ThemeToggle />
              <Button variant="outline" size="icon" className="rounded-full">
                <Bell className="size-4" />
              </Button>
              <div className="hidden items-center gap-3 rounded-full border border-border bg-card py-1 pl-1 pr-3 shadow-sm sm:flex">
                <div className="grid size-9 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {initials}
                </div>
                <div className="max-w-36 truncate text-sm font-medium">{userName}</div>
              </div>
              <SignOutButton compact />
            </div>
          </header>

          <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_360px] lg:p-8">
            <section className="min-w-0 space-y-6">
              <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl shadow-foreground/5">
                <div className="grid gap-8 p-6 lg:grid-cols-[1fr_300px] lg:p-8">
                  <div>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                      <Sparkles className="size-4" />
                      Production dashboard
                    </div>
                    <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                      Your AI content studio is ready for the next campaign.
                    </h1>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                      Manage ideation, drafts, approval status, and publishing signals
                      from a single premium workspace powered by InsForge auth.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <Link href="#">
                        <Button className="h-11 rounded-full px-5 shadow-lg shadow-primary/20">
                          New campaign
                          <ChevronRight className="size-4" />
                        </Button>
                      </Link>
                      <Link href="#">
                        <Button variant="outline" className="h-11 rounded-full px-5">
                          Open content brief
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-foreground p-5 text-background shadow-2xl shadow-foreground/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm opacity-70">Content quality</div>
                        <div className="mt-1 text-4xl font-semibold">94%</div>
                      </div>
                      <CheckCircle2 className="size-8 text-accent" />
                    </div>
                    <div className="mt-8 space-y-3">
                      {["Brand voice matched", "SEO brief enriched", "Approval queue clean"].map((item) => (
                        <div key={item} className="flex items-center justify-between rounded-2xl bg-background/10 px-3 py-2 text-sm">
                          {item}
                          <span className="size-2 rounded-full bg-accent" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ["Generated words", "148k", "+18%"],
                  ["Active campaigns", "24", "+6"],
                  ["Publishing slots", "36", "12 due"],
                ].map(([label, value, delta]) => (
                  <div key={label} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                    <div className="text-sm text-muted-foreground">{label}</div>
                    <div className="mt-3 flex items-end justify-between">
                      <span className="text-3xl font-semibold tracking-tight">{value}</span>
                      <span className="rounded-full bg-accent/20 px-2.5 py-1 text-xs font-medium text-accent-foreground">
                        {delta}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">Campaign pipeline</h2>
                    <p className="text-sm text-muted-foreground">Current content tracks and quality signals.</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full">
                    View all
                  </Button>
                </div>
                <div className="space-y-3">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.name}
                      className="grid gap-3 rounded-2xl border border-border bg-background/60 p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
                    >
                      <div>
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-sm text-muted-foreground">{campaign.tone} tone system</div>
                      </div>
                      <span className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                        {campaign.status}
                      </span>
                      <span className="text-sm text-muted-foreground">Quality</span>
                      <span className="text-lg font-semibold">{campaign.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <h2 className="text-lg font-semibold tracking-tight">Today</h2>
                <div className="mt-5 space-y-4">
                  {[
                    ["10:00", "Review SaaS launch email"],
                    ["13:30", "Approve X thread variants"],
                    ["16:00", "Refresh homepage messaging"],
                  ].map(([time, task]) => (
                    <div key={task} className="flex gap-3">
                      <div className="w-14 shrink-0 text-sm font-medium text-primary">{time}</div>
                      <div className="min-w-0 flex-1 rounded-2xl bg-muted p-3 text-sm">{task}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight">Account</h2>
                  <ArrowUpRight className="size-4 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Signed in as {userName}. Your dashboard session is protected by
                  InsForge SSR auth and refreshed through the Next.js proxy.
                </p>
                <div className="mt-5">
                  <SignOutButton />
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
