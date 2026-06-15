"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AudioLines,
  Clapperboard,
  Coins,
  CreditCard,
  Home,
  Library,
  Sparkles,
  UserRound,
  Video,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  children: React.ReactNode;
  userName: string;
  userEmail?: string;
  initials: string;
};

const navItems = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "AI Video Agent", href: "/dashboard/ai-video-agent", icon: Clapperboard },
  { name: "AI Video Avatar", href: "/dashboard/ai-video-avatar", icon: Video },
  { name: "AI Avatars", href: "/dashboard/avatar", icon: UserRound },
  { name: "AI Voice Cloning", href: "/dashboard/ai-voice-cloning", icon: AudioLines },
  { name: "My Library", href: "/dashboard/my-library", icon: Library },
];

export function DashboardShell({
  children,
  userName,
  userEmail,
  initials,
}: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar
        collapsible="offcanvas"
        className="border-sidebar-border/80 bg-sidebar"
      >
        <SidebarHeader className="px-4 py-5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Sparkles className="size-5" />
            </span>
            <span className="min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="block truncate text-sm font-semibold tracking-tight">
                VoxaAI Studio
              </span>
              <span className="block truncate text-xs text-sidebar-foreground/60">
                AI media workspace
              </span>
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {navItems.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === item.href
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        tooltip={item.name}
                        isActive={isActive}
                        className={cn(
                          "h-10 rounded-xl px-3",
                          isActive &&
                            "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
                        )}
                        render={
                          <Link href={item.href}>
                            <Icon className="size-4" />
                            <span>{item.name}</span>
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="gap-3 px-4 py-4">
          <SidebarSeparator className="mx-0" />
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/55 p-3 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2 text-xs font-medium text-sidebar-foreground/70">
              <CreditCard className="size-4" />
              User billing settings
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-background/70 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Coins className="size-4 text-primary" />
                Available credits
              </span>
              <span className="font-semibold">1,250</span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-background/70 p-2">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <div className="truncate text-sm font-medium">{userName}</div>
              <div className="truncate text-xs text-muted-foreground">
                {userEmail}
              </div>
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <SignOutButton compact />
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-h-svh bg-background">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-background/85 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="rounded-full" />
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Dashboard
              </div>
              <div className="hidden text-xs text-muted-foreground/75 sm:block">
                Create, manage, and organize AI media assets.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3 shadow-sm sm:flex">
              <div className="grid size-8 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                {initials}
              </div>
              <span className="max-w-36 truncate text-sm font-medium">
                {userName}
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
