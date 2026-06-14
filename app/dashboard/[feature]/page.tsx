import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  AudioLines,
  Clapperboard,
  Images,
  Library,
  UserRound,
  Video,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getDashboardFeature } from "@/lib/dashboard/features";
import { cn } from "@/lib/utils";

const featureIcons = {
  "ai-video-agent": Clapperboard,
  "ai-video-avatar": Video,
  avatar: UserRound,
  "ai-voice-cloning": AudioLines,
  "my-library": Library,
};

export default async function DashboardFeaturePage({
  params,
}: {
  params: Promise<{ feature: string }>;
}) {
  const { feature: slug } = await params;
  const feature = getDashboardFeature(slug);

  if (!feature) {
    notFound();
  }

  const Icon = featureIcons[feature.slug as keyof typeof featureIcons] ?? Images;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Link
        href="/dashboard"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-foreground/5">
        <div className="relative min-h-[24rem]">
          {feature.mediaType === "video" ? (
            <video
              className="absolute inset-0 size-full object-cover"
              src={feature.media}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : (
            <Image
              src={feature.media}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/45 to-black/10" />
          <div className="relative z-10 flex min-h-[24rem] flex-col justify-end p-6 text-white sm:p-8 lg:p-10">
            <span className="mb-5 grid size-12 place-items-center rounded-xl border border-white/20 bg-white/15 backdrop-blur-md">
              <Icon className="size-6" />
            </span>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              {feature.name}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/78">
              {feature.description}
            </p>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_280px] lg:p-10">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Coming soon
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              This workspace is reserved for the full {feature.name} creation
              flow. The dashboard navigation and media preview are ready, so the
              tool interface can be added here without changing the app shell.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted p-4">
            <div className="text-sm font-medium">Workspace status</div>
            <div className="mt-3 rounded-full bg-background px-3 py-2 text-sm text-muted-foreground">
              Feature page scaffolded
            </div>
            <Link
              href="/dashboard"
              className={cn(buttonVariants(), "mt-4 w-full rounded-xl")}
            >
              View all tools
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
