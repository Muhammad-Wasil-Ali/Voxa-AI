import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  AudioLines,
  Clapperboard,
  Images,
  Library,
  Sparkles,
  UserRound,
  Video,
} from "lucide-react";
import { dashboardFeatures, type DashboardFeature } from "@/lib/dashboard/features";
import { cn } from "@/lib/utils";

const featureIcons = {
  "ai-video-agent": Clapperboard,
  "ai-video-avatar": Video,
  avatar: UserRound,
  "ai-voice-cloning": AudioLines,
  "my-library": Library,
};

function FeatureCard({ feature }: { feature: DashboardFeature }) {
  const Icon = featureIcons[feature.slug as keyof typeof featureIcons] ?? Images;

  return (
    <Link
      href={feature.href}
      className={cn(
        "group relative flex min-h-72 overflow-hidden rounded-2xl border border-white/10 bg-foreground text-white shadow-xl shadow-foreground/5 outline-none transition duration-300 hover:-translate-y-1 hover:shadow-2xl focus-visible:ring-2 focus-visible:ring-ring",
        feature.size === "hero" && "md:col-span-2 md:min-h-[28rem]",
        feature.size === "wide" && "md:col-span-2"
      )}
    >
      {feature.mediaType === "video" ? (
        <video
          className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105"
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
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/45 to-black/15" />
      <div className="absolute inset-0 bg-linear-to-br from-primary/35 via-transparent to-accent/20 opacity-80" />
      <div className="relative z-10 flex min-h-full w-full flex-col justify-between p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <span className="grid size-11 place-items-center rounded-xl border border-white/20 bg-white/15 backdrop-blur-md">
            <Icon className="size-5" />
          </span>
          <span className="grid size-9 place-items-center rounded-full border border-white/15 bg-white/10 opacity-80 transition group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:opacity-100">
            <ArrowUpRight className="size-4" />
          </span>
        </div>
        <div className="max-w-xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {feature.name}
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-white/78 sm:text-base">
            {feature.description}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function DashboardHomePage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6 lg:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
              <Sparkles className="size-4" />
              AI media command center
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Build videos, avatars, voices, and reusable media from one studio.
            </h1>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Choose a creation tool below to start a workflow, manage saved assets,
            or continue building your AI-powered content library.
          </p>
        </div>
      </section>

      <section className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dashboardFeatures.map((feature) => (
          <FeatureCard key={feature.slug} feature={feature} />
        ))}
      </section>
    </div>
  );
}
