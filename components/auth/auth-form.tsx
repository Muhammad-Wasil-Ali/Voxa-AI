"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

type AuthMode = "sign-in" | "sign-up";

type OAuthProvider = "google" | "github" | "x" | string;

type AuthConfig = {
  requireEmailVerification: boolean;
  passwordMinLength: number;
  verifyEmailMethod: "code" | "link";
  disableSignup: boolean;
  oAuthProviders: OAuthProvider[];
};

const defaultConfig: AuthConfig = {
  requireEmailVerification: true,
  passwordMinLength: 6,
  verifyEmailMethod: "code",
  disableSignup: false,
  oAuthProviders: ["google", "github"],
};

const providerMeta: Record<string, { label: string; icon: React.ReactNode }> = {
  google: {
    label: "Google",
    icon: <span className="text-base font-semibold text-[#4285f4]">G</span>,
  },
  github: {
    label: "GitHub",
    icon: <span className="text-sm font-bold">GH</span>,
  },
  x: {
    label: "X",
    icon: <span className="text-sm font-bold">X</span>,
  },
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [config, setConfig] = React.useState<AuthConfig>(defaultConfig);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [oauthLoading, setOauthLoading] = React.useState("");
  const [verificationEmail, setVerificationEmail] = React.useState("");

  const isSignUp = mode === "sign-up";
  const status = searchParams.get("insforge_status");
  const type = searchParams.get("insforge_type");
  const authError = searchParams.get("error");
  const routeNotice =
    status === "success" && type === "verify_email"
      ? "Email verified. You can sign in now."
      : "";
  const routeError = authError
    ? "OAuth sign in could not be completed. Please try again."
    : "";
  const title = isSignUp ? "Create your studio" : "Welcome back";
  const subtitle = isSignUp
    ? "Start producing polished AI content with one secure workspace."
    : "Sign in to manage campaigns, prompts, and publishing workflows.";

  React.useEffect(() => {
    let active = true;

    async function loadConfig() {
      try {
        const response = await fetch("/api/auth/config");
        if (!response.ok) return;
        const data = (await response.json()) as AuthConfig;
        if (active) setConfig({ ...defaultConfig, ...data });
      } catch {
        if (active) setConfig(defaultConfig);
      }
    }

    void loadConfig();
    return () => {
      active = false;
    };
  }, []);

  const passwordError =
    password && password.length < config.passwordMinLength
      ? `Use at least ${config.passwordMinLength} characters.`
      : "";

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < config.passwordMinLength) {
      setError(`Password must be at least ${config.passwordMinLength} characters.`);
      return;
    }

    if (isSignUp && !name.trim()) {
      setError("Enter your name.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(isSignUp ? "/api/auth/sign-up" : "/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Authentication failed.");
      }

      if (isSignUp && data.requireEmailVerification) {
        setVerificationEmail(email);
        setNotice(
          data.verifyEmailMethod === "link"
            ? "Check your email for the verification link."
            : "Enter the 6-digit verification code we sent to your email."
        );
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail, otp }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Verification failed.");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  async function startOAuth(provider: string) {
    setError("");
    setOauthLoading(provider);

    try {
      const response = await fetch("/api/auth/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.message ?? "OAuth could not be started.");
      }

      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OAuth could not be started.");
      setOauthLoading("");
    }
  }

  const providers = config.oAuthProviders.filter((provider) =>
    ["google", "github", "x"].includes(provider)
  );

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--primary),transparent_76%),transparent_34rem),radial-gradient(circle_at_bottom_right,color-mix(in_oklch,var(--accent),transparent_70%),transparent_30rem)]" />
      <div className="mx-auto grid min-h-screen w-full max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden flex-col justify-between border-r border-border/70 bg-card/35 px-10 py-8 backdrop-blur lg:flex">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Sparkles className="size-5" />
              </span>
              <span className="text-lg font-semibold tracking-tight">VoxaAI Studio</span>
            </Link>
            <ThemeToggle />
          </div>

          <div className="max-w-xl">
            <div className="mb-6 inline-flex rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground shadow-sm">
              AI content operations for growing teams
            </div>
            <h1 className="text-5xl font-semibold leading-tight tracking-tight">
              Plan, generate, and ship content from one premium workspace.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
              Secure authentication, campaign intelligence, and a polished dashboard
              foundation ready for production workflows.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {["24 campaigns", "98.4% quality", "12 channels"].map((item) => (
              <div key={item} className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
                <div className="text-xl font-semibold">{item.split(" ")[0]}</div>
                <div className="mt-1 text-sm text-muted-foreground">{item.split(" ").slice(1).join(" ")}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Link href="/" className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
                  <Sparkles className="size-5" />
                </span>
                <span className="font-semibold">VoxaAI Studio</span>
              </Link>
              <ThemeToggle />
            </div>

            <div className="rounded-3xl border border-border bg-card/90 p-6 shadow-2xl shadow-foreground/5 backdrop-blur sm:p-8">
              <div className="mb-7">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                  <ShieldCheck className="size-4" />
                  InsForge secure auth
                </div>
                <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>
              </div>

              {verificationEmail && config.verifyEmailMethod === "code" ? (
                <form className="space-y-5" onSubmit={verifyEmail}>
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification code</Label>
                    <Input
                      id="otp"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      aria-invalid={Boolean(error)}
                      className="h-12 text-center text-lg tracking-[0.5em]"
                    />
                  </div>
                  <StatusMessage error={error || routeError} notice={notice || routeNotice} />
                  <Button type="submit" className="h-12 w-full rounded-xl" disabled={loading}>
                    {loading && <Loader2 className="size-4 animate-spin" />}
                    Verify and continue
                  </Button>
                </form>
              ) : (
                <>
                  <div className="grid gap-3">
                    {providers.map((provider) => {
                      const meta = providerMeta[provider] ?? { label: provider, icon: <Mail className="size-4" /> };
                      return (
                        <Button
                          key={provider}
                          type="button"
                          variant="outline"
                          className="h-12 rounded-xl bg-background/70"
                          disabled={Boolean(oauthLoading)}
                          onClick={() => startOAuth(provider)}
                        >
                          {oauthLoading === provider ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            meta.icon
                          )}
                          Continue with {meta.label}
                        </Button>
                      );
                    })}
                  </div>

                  <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />
                    or
                    <span className="h-px flex-1 bg-border" />
                  </div>

                  <form className="space-y-4" onSubmit={submitForm}>
                    {isSignUp && (
                      <Field label="Full name" id="name">
                        <Input
                          id="name"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          placeholder="Maya Chen"
                          aria-invalid={isSignUp && Boolean(error) && !name.trim()}
                          className="h-11 rounded-xl bg-background/70"
                        />
                      </Field>
                    )}
                    <Field label="Email" id="email">
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@company.com"
                        aria-invalid={Boolean(error) && !email.includes("@")}
                        className="h-11 rounded-xl bg-background/70"
                      />
                    </Field>
                    <Field label="Password" id="password" help={passwordError}>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Minimum 6 characters"
                        aria-invalid={Boolean(passwordError)}
                        className="h-11 rounded-xl bg-background/70"
                      />
                    </Field>

                    <StatusMessage error={error || routeError} notice={notice || routeNotice} />

                    <Button
                      type="submit"
                      className="h-12 w-full rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      disabled={loading || (isSignUp && config.disableSignup)}
                    >
                      {loading && <Loader2 className="size-4 animate-spin" />}
                      {isSignUp ? "Create account" : "Sign in"}
                    </Button>
                  </form>
                </>
              )}

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {isSignUp ? "Already have an account?" : "New to VoxaAI?"}{" "}
                <Link
                  href={isSignUp ? "/sign-in" : "/sign-up"}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {isSignUp ? "Sign in" : "Create an account"}
                </Link>
              </p>

              {!config.oAuthProviders.includes("x") && (
                <p className="mt-4 rounded-2xl bg-muted px-4 py-3 text-xs leading-5 text-muted-foreground">
                  X/Twitter OAuth is supported by the UI when InsForge exposes provider
                  &quot;x&quot;; it is not enabled in this project metadata right now.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  id,
  help,
  children,
}: {
  label: string;
  id: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {help && <p className="text-xs text-destructive">{help}</p>}
    </div>
  );
}

function StatusMessage({ error, notice }: { error: string; notice: string }) {
  if (!error && !notice) return null;

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        error
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-primary/20 bg-primary/10 text-primary"
      )}
    >
      {error || notice}
    </div>
  );
}
