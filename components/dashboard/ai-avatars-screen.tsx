"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ImagePlus,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
  WandSparkles,
} from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  avatarStyles,
  type AvatarListItem,
  type AvatarStyle,
} from "@/lib/avatars/types";
import { cn } from "@/lib/utils";

const defaultAvatars = [
  {
    name: "Adam",
    style: "Podcast",
    image: "/avatars/adam.png",
    description: "Studio-ready host with a confident creator look.",
  },
  {
    name: "Emma",
    style: "Casual",
    image: "/avatars/emma.png",
    description: "Warm everyday presenter for social-first videos.",
  },
  {
    name: "Jack",
    style: "3D Cartoon",
    image: "/avatars/jack.png",
    description: "Friendly animated persona with polished 3D charm.",
  },
  {
    name: "Jen",
    style: "Stylized",
    image: "/avatars/jen.png",
    description: "Editorial identity with a vivid modern finish.",
  },
] satisfies Array<{
  name: string;
  style: AvatarStyle;
  image: string;
  description: string;
}>;

type RunState = {
  runId: string;
  progress: number;
  stage: string;
  message: string;
  status: string;
};

function getDisplayImage(avatar: AvatarListItem) {
  return (
    avatar.landscapeImageUrl ??
    avatar.portraitImageUrl ??
    avatar.sourceImageUrl
  );
}

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? fallback;
  } catch {
    return fallback;
  }
}

function AvatarImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn("size-full object-cover", className)}
    />
  );
}

function CustomAvatarCard({ avatar }: { avatar: AvatarListItem }) {
  const isGenerating =
    avatar.status === "pending" || avatar.status === "generating";
  const isFailed = avatar.status === "failed";

  return (
    <Card className="rounded-xl py-0">
      <div className="relative overflow-hidden">
        <AspectRatio ratio={16 / 10} className="bg-muted">
          <AvatarImage src={getDisplayImage(avatar)} alt={avatar.name} />
        </AspectRatio>
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge variant={isFailed ? "destructive" : "secondary"}>
            {isGenerating ? "Generating" : isFailed ? "Failed" : "Custom"}
          </Badge>
        </div>
      </div>
      <CardHeader className="gap-2 p-4">
        <CardTitle className="flex items-center justify-between gap-3">
          <span className="truncate">{avatar.name}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {avatar.style}
          </span>
        </CardTitle>
        {avatar.errorMessage ? (
          <p className="text-sm text-destructive">{avatar.errorMessage}</p>
        ) : (
          <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
            {avatar.prompt || "Ready to use across your media workflows."}
          </p>
        )}
      </CardHeader>
      <CardFooter className="gap-2 p-4 pt-0">
        <Button className="w-full" variant="outline">
          <Check className="size-4" />
          Use Avatar
        </Button>
      </CardFooter>
    </Card>
  );
}

function DefaultAvatarCard({
  avatar,
  onUse,
}: {
  avatar: (typeof defaultAvatars)[number];
  onUse: (style: AvatarStyle) => void;
}) {
  return (
    <Card className="rounded-xl py-0">
      <div className="relative overflow-hidden">
        <AspectRatio ratio={4 / 5} className="bg-muted">
          <AvatarImage src={avatar.image} alt={avatar.name} />
        </AspectRatio>
        <Badge className="absolute left-3 top-3" variant="secondary">
          {avatar.style}
        </Badge>
      </div>
      <CardHeader className="gap-2 p-4">
        <CardTitle>{avatar.name}</CardTitle>
        <p className="min-h-10 text-sm text-muted-foreground">
          {avatar.description}
        </p>
      </CardHeader>
      <CardFooter className="gap-2 p-4 pt-0">
        <Button className="w-full" onClick={() => onUse(avatar.style)}>
          <Check className="size-4" />
          Choose
        </Button>
      </CardFooter>
    </Card>
  );
}

export function AiAvatarsScreen() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatars, setAvatars] = useState<AvatarListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [style, setStyle] = useState<AvatarStyle>("Podcast");
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<"generate" | "upload" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AvatarListItem | null>(null);
  const [runState, setRunState] = useState<RunState | null>(null);

  const hasCustomAvatars = avatars.length > 0;

  const canSubmit = useMemo(() => Boolean(file) && !busy, [file, busy]);

  const fetchAvatars = useCallback(async () => {
    const response = await fetch("/api/avatars", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(await readError(response, "Could not load avatars."));
    }

    const body = (await response.json()) as { avatars: AvatarListItem[] };
    return body.avatars;
  }, []);

  const loadAvatars = useCallback(async () => {
    try {
      setAvatars(await fetchAvatars());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load avatars."
      );
    } finally {
      setLoading(false);
    }
  }, [fetchAvatars]);

  useEffect(() => {
    let ignore = false;

    fetchAvatars()
      .then((nextAvatars) => {
        if (!ignore) {
          setAvatars(nextAvatars);
        }
      })
      .catch((loadError) => {
        if (!ignore) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load avatars."
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [fetchAvatars]);

  useEffect(() => {
    if (
      !runState?.runId ||
      runState.status === "COMPLETED" ||
      runState.status === "FAILED" ||
      result?.status === "completed" ||
      result?.status === "failed"
    ) {
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/avatars/run/${runState.runId}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const body = (await response.json()) as {
          run: {
            status: string;
            metadata?: {
              progress?: number;
              stage?: string;
              message?: string;
            };
            isCompleted: boolean;
            isFailed: boolean;
          };
          avatar: AvatarListItem;
        };

        setRunState({
          runId: runState.runId,
          progress: Number(body.run.metadata?.progress ?? 8),
          stage: String(body.run.metadata?.stage ?? body.run.status),
          message: String(
            body.run.metadata?.message ?? "Generation is in progress"
          ),
          status: body.run.status,
        });
        setResult(body.avatar);

        if (body.run.isCompleted || body.run.isFailed) {
          window.clearInterval(interval);
          setBusy(null);
          await loadAvatars();
        }
      } catch {
        return;
      }
    }, 2500);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadAvatars, runState?.runId, runState?.status, result?.status]);

  function resetDialog(nextStyle = style) {
    setStyle(nextStyle);
    setPrompt("");
    setFile(null);
    setFilePreview(null);
    setError(null);
    setResult(null);
    setRunState(null);
    setBusy(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileChange(nextFile: File | null) {
    setFile(nextFile);
    setResult(null);
    setRunState(null);
    setError(null);

    if (!nextFile) {
      setFilePreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFilePreview(reader.result);
      }
    };
    reader.onerror = () => {
      setFilePreview(null);
      setError("Could not show the selected image preview.");
    };
    reader.readAsDataURL(nextFile);
  }

  function openCreateDialog(nextStyle?: AvatarStyle) {
    resetDialog(nextStyle ?? style);
    setDialogOpen(true);
  }

  async function submit(endpoint: "/api/avatars/generate" | "/api/avatars/upload") {
    if (!file) {
      setError("Upload an avatar image first.");
      return;
    }

    const mode = endpoint.endsWith("generate") ? "generate" : "upload";
    setBusy(mode);
    setError(null);

    const formData = new FormData();
    formData.set("image", file);
    formData.set("style", style);
    formData.set("prompt", prompt);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readError(response, "Avatar request failed."));
      }

      const body = (await response.json()) as {
        avatar: AvatarListItem;
        runId?: string;
      };

      setResult(body.avatar);

      if (body.runId) {
        setRunState({
          runId: body.runId,
          progress: 5,
          stage: "queued",
          message: "Avatar generation queued",
          status: "QUEUED",
        });
      } else {
        setBusy(null);
        await loadAvatars();
      }
    } catch (submitError) {
      setBusy(null);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Avatar request failed."
      );
    }
  }

  const resultLandscape = result?.landscapeImageUrl ?? result?.sourceImageUrl;
  const resultPortrait = result?.portraitImageUrl ?? result?.sourceImageUrl;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
              <Sparkles className="size-4" />
              AI avatar studio
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Create presenter avatars for every content format.
            </h1>
          </div>
          <Button
            size="lg"
            className="w-full rounded-xl sm:w-fit"
            onClick={() => openCreateDialog()}
          >
            <ImagePlus className="size-4" />
            Create New Avatar
          </Button>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Custom avatars
            </h2>
            <p className="text-sm text-muted-foreground">
              Your generated and uploaded avatars appear here.
            </p>
          </div>
          <Button variant="outline" onClick={() => void loadAvatars()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-xl border border-border bg-muted"
              />
            ))}
          </div>
        ) : hasCustomAvatars ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {avatars.map((avatar) => (
              <CustomAvatarCard key={avatar.id} avatar={avatar} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-xl bg-secondary text-secondary-foreground">
              <WandSparkles className="size-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold">No custom avatars yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Upload a reference image and generate an avatar pair for widescreen
              and vertical content.
            </p>
            <Button className="mt-5" onClick={() => openCreateDialog()}>
              <ImagePlus className="size-4" />
              Create New Avatar
            </Button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Default avatars
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose a ready-made presenter identity.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {defaultAvatars.map((avatar) => (
            <DefaultAvatarCard
              key={avatar.name}
              avatar={avatar}
              onUse={openCreateDialog}
            />
          ))}
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Create New Avatar</DialogTitle>
            <DialogDescription>
              Upload a reference image, pick a style, then generate AI previews
              or save the image as-is.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col gap-4">
              <button
                type="button"
                className="group relative overflow-hidden rounded-xl border border-dashed border-border bg-muted text-left outline-none transition hover:border-primary focus-visible:ring-3 focus-visible:ring-ring/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <AspectRatio ratio={4 / 3}>
                  {filePreview ? (
                    <AvatarImage
                      src={filePreview}
                      alt="Uploaded avatar reference"
                    />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center">
                      <span className="grid size-12 place-items-center rounded-xl bg-background text-muted-foreground shadow-sm">
                        <Upload className="size-5" />
                      </span>
                      <span className="text-sm font-medium">
                        Upload user avatar image
                      </span>
                      <span className="text-xs text-muted-foreground">
                        PNG, JPG, or WebP under 8 MB
                      </span>
                    </div>
                  )}
                </AspectRatio>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => {
                  handleFileChange(event.target.files?.[0] ?? null);
                }}
              />

              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="avatar-style">
                  Avatar style
                </label>
                <select
                  id="avatar-style"
                  value={style}
                  onChange={(event) => setStyle(event.target.value as AvatarStyle)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {avatarStyles.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="avatar-prompt">
                  Optional customization prompt
                </label>
                <Textarea
                  id="avatar-prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Example: warm lighting, confident smile, clean creator studio background"
                  className="min-h-28 resize-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {runState ? (
                <div className="rounded-xl border border-border bg-muted/55 p-4">
                  <Progress value={runState.progress}>
                    <ProgressLabel>{runState.stage}</ProgressLabel>
                    <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                      {runState.progress}%
                    </span>
                  </Progress>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {runState.message}
                  </p>
                </div>
              ) : null}

              {result ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-border bg-card p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">16:9 preview</span>
                      <Badge variant="outline">Landscape</Badge>
                    </div>
                    <AspectRatio
                      ratio={16 / 9}
                      className="overflow-hidden rounded-lg bg-muted"
                    >
                      <AvatarImage
                        src={resultLandscape ?? result.sourceImageUrl}
                        alt="16:9 avatar"
                      />
                    </AspectRatio>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">9:16 preview</span>
                      <Badge variant="outline">Portrait</Badge>
                    </div>
                    <AspectRatio
                      ratio={9 / 16}
                      className="mx-auto max-h-[24rem] overflow-hidden rounded-lg bg-muted"
                    >
                      <AvatarImage
                        src={resultPortrait ?? result.sourceImageUrl}
                        alt="9:16 avatar"
                      />
                    </AspectRatio>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-80 items-center justify-center rounded-xl border border-border bg-muted/45 p-6 text-center">
                  <div>
                    <div className="mx-auto grid size-12 place-items-center rounded-xl bg-background text-muted-foreground shadow-sm">
                      <Sparkles className="size-5" />
                    </div>
                    <p className="mt-4 text-sm font-medium">
                      Avatar previews will appear here
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Generate with AI to create both landscape and portrait
                      versions.
                    </p>
                  </div>
                </div>
              )}

              {error ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              {result ? (
                <Button
                  variant="secondary"
                  disabled={!canSubmit}
                  onClick={() => void submit("/api/avatars/generate")}
                >
                  {busy === "generate" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  Generate a new one
                </Button>
              ) : null}
              <Button
                variant="outline"
                disabled={!canSubmit}
                onClick={() => void submit("/api/avatars/upload")}
              >
                {busy === "upload" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                Upload as It Is
              </Button>
              <Button
                disabled={!canSubmit}
                onClick={() => void submit("/api/avatars/generate")}
              >
                {busy === "generate" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <WandSparkles className="size-4" />
                )}
                Generate with AI
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
