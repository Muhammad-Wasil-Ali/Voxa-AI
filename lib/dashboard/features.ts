export type DashboardFeature = {
  slug: string;
  name: string;
  description: string;
  href: string;
  media: string;
  mediaType: "video" | "image";
  size: "hero" | "wide" | "standard";
};

export const dashboardFeatures: DashboardFeature[] = [
  {
    slug: "ai-video-agent",
    name: "AI Video Agent",
    description:
      "Create guided video workflows with automated scripts, scenes, and publishing-ready outputs.",
    href: "/dashboard/ai-video-agent",
    media: "/ai-video-agent.mp4",
    mediaType: "video",
    size: "hero",
  },
  {
    slug: "ai-video-avatar",
    name: "AI Video Avatar",
    description:
      "Turn prompts into expressive avatar-led videos for product explainers and social campaigns.",
    href: "/dashboard/ai-video-avatar",
    media: "/ai-avatar.mp4",
    mediaType: "video",
    size: "standard",
  },
  {
    slug: "avatar",
    name: "AI Avatars",
    description:
      "Design presenter identities and visual styles that match each brand, campaign, or audience.",
    href: "/dashboard/avatar",
    media: "/avatar.mp4",
    mediaType: "video",
    size: "standard",
  },
  {
    slug: "ai-voice-cloning",
    name: "AI Voice Cloning",
    description:
      "Generate consistent voice profiles for narrations, explainers, and multilingual content.",
    href: "/dashboard/ai-voice-cloning",
    media: "/voice-cloning.png",
    mediaType: "image",
    size: "wide",
  },
  {
    slug: "my-library",
    name: "My Library",
    description:
      "Organize generated videos, avatars, voices, scripts, and reusable campaign assets.",
    href: "/dashboard/my-library",
    media: "/my-library.mp4",
    mediaType: "video",
    size: "standard",
  },
];

export function getDashboardFeature(slug: string) {
  return dashboardFeatures.find((feature) => feature.slug === slug);
}
