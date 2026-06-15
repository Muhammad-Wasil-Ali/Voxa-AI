"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines,
  Check,
  Loader2,
  Mic2,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  WandSparkles,
  Waves,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  TTS_TEXT_LIMIT,
  calculateTtsCredits,
  type VoiceCloneListItem,
  type VoiceSource,
  type VoiceTtsListItem,
} from "@/lib/voices/types";
import { cn } from "@/lib/utils";

type DefaultVoice = {
  id: string;
  name: string;
  image: string;
  previewUrl: string;
  description: string;
};

type RunState = {
  runId: string;
  kind: "clone" | "tts";
  progress: number;
  stage: string;
  message: string;
  status: string;
};

type DeleteTarget =
  | { kind: "voice"; id: string; name: string }
  | { kind: "tts"; id: string; name: string }
  | null;

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? fallback;
  } catch {
    return fallback;
  }
}

function VoiceMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid size-14 place-items-center rounded-xl bg-linear-to-br from-cyan-400 via-fuchsia-500 to-amber-300 text-white shadow-lg shadow-fuchsia-500/20",
        className
      )}
    >
      <AudioLines className="size-6" />
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function RunProgress({ runState }: { runState: RunState | null }) {
  if (!runState) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <Progress value={runState.progress}>
        <ProgressLabel className="capitalize">{runState.stage}</ProgressLabel>
        <span className="ml-auto text-sm text-muted-foreground tabular-nums">
          {runState.progress}%
        </span>
      </Progress>
      <p className="mt-3 text-sm text-muted-foreground">{runState.message}</p>
    </div>
  );
}

function DefaultVoiceCard({
  voice,
  onUse,
}: {
  voice: DefaultVoice;
  onUse: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  return (
    <Card className="rounded-xl py-0">
      <div className="relative min-h-36 overflow-hidden bg-linear-to-br from-sky-100 via-white to-rose-100 dark:from-sky-950 dark:via-background dark:to-rose-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={voice.image}
          alt=""
          className="absolute bottom-0 right-2 h-36 object-contain"
        />
        <div className="absolute left-4 top-4">
          <Badge variant="secondary">Default</Badge>
        </div>
        <div className="absolute bottom-4 left-4">
          <VoiceMark />
        </div>
      </div>
      <CardHeader className="gap-2 p-4">
        <CardTitle className="flex items-center justify-between gap-3">
          <span>{voice.name}</span>
          <span className="text-xs font-normal text-muted-foreground">
            Deepgram
          </span>
        </CardTitle>
        <p className="min-h-10 text-sm text-muted-foreground">
          {voice.description}
        </p>
      </CardHeader>
      <CardFooter className="gap-2 p-4 pt-0">
        <audio
          ref={audioRef}
          src={voice.previewUrl}
          preload="none"
          onError={() =>
            toast.error("Could not play Deepgram preview. Check DEEPGRAM_API_KEY.")
          }
        />
        <Button
          className="flex-1"
          variant="outline"
          onClick={() => void audioRef.current?.play()}
        >
          <Play className="size-4" />
          Preview
        </Button>
        <Button className="flex-1" onClick={onUse}>
          <Check className="size-4" />
          Use
        </Button>
      </CardFooter>
    </Card>
  );
}

function CustomVoiceCard({
  voice,
  onUse,
  onDelete,
}: {
  voice: VoiceCloneListItem;
  onUse: () => void;
  onDelete: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isGenerating = voice.status === "pending" || voice.status === "generating";

  return (
    <Card className="rounded-xl py-0">
      <div className="relative min-h-36 overflow-hidden bg-linear-to-br from-violet-500 via-cyan-500 to-emerald-300 p-4 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative flex items-start justify-between gap-3">
          <Badge variant={voice.status === "failed" ? "destructive" : "secondary"}>
            {isGenerating ? "Generating" : voice.status === "failed" ? "Failed" : "Custom"}
          </Badge>
          <Button
            size="icon-sm"
            variant="secondary"
            className="bg-white/20 text-white hover:bg-white/30"
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
        <div className="relative mt-10 flex items-end justify-between gap-4">
          <VoiceMark className="bg-white/20 shadow-none backdrop-blur" />
          <Waves className="size-20 opacity-70" />
        </div>
      </div>
      <CardHeader className="gap-2 p-4">
        <CardTitle className="flex items-center justify-between gap-3">
          <span className="truncate">{voice.name}</span>
          <span className="text-xs font-normal text-muted-foreground">
            Custom
          </span>
        </CardTitle>
        {voice.errorMessage ? (
          <p className="text-sm text-destructive">{voice.errorMessage}</p>
        ) : (
          <p className="min-h-10 text-sm text-muted-foreground">
            {isGenerating
              ? "Voice cloning is running in the background."
              : "Ready for cloned voice TTS generation."}
          </p>
        )}
      </CardHeader>
      <CardFooter className="gap-2 p-4 pt-0">
        <audio ref={audioRef} src={voice.sampleAudioUrl} preload="metadata" />
        <Button
          className="flex-1"
          variant="outline"
          onClick={() => void audioRef.current?.play()}
        >
          <Play className="size-4" />
          Preview
        </Button>
        <Button className="flex-1" disabled={voice.status !== "completed"} onClick={onUse}>
          <Check className="size-4" />
          Use
        </Button>
      </CardFooter>
    </Card>
  );
}

function TtsResultCard({
  result,
  onDelete,
}: {
  result: VoiceTtsListItem;
  onDelete: () => void;
}) {
  const isGenerating =
    result.status === "pending" || result.status === "generating";

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span className="truncate">{result.voiceName}</span>
          <Badge variant={result.status === "failed" ? "destructive" : "secondary"}>
            {isGenerating ? "Generating" : result.status}
          </Badge>
        </CardTitle>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {result.inputText}
        </p>
      </CardHeader>
      <CardContent className="grid gap-3">
        {result.audioUrl ? (
          <audio className="w-full" src={result.audioUrl} controls />
        ) : (
          <div className="flex h-12 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
            {result.errorMessage ?? "Audio will appear here when ready."}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">{result.characterCount} chars</Badge>
          <Badge variant="outline">{result.creditsCharged} credits</Badge>
          <Badge variant="outline">
            {result.voiceSource === "custom" ? "Custom" : "Deepgram"}
          </Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="ml-auto" variant="destructive" onClick={onDelete}>
          <Trash2 className="size-4" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}

export function AiVoiceCloningScreen() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const completedRunIdsRef = useRef(new Set<string>());
  const [customVoices, setCustomVoices] = useState<VoiceCloneListItem[]>([]);
  const [defaultVoices, setDefaultVoices] = useState<DefaultVoice[]>([]);
  const [ttsResults, setTtsResults] = useState<VoiceTtsListItem[]>([]);
  const [creditBalance, setCreditBalance] = useState(1250);
  const [loading, setLoading] = useState(true);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [ttsDialogOpen, setTtsDialogOpen] = useState(false);
  const [voiceName, setVoiceName] = useState("");
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [ttsText, setTtsText] = useState("");
  const [busy, setBusy] = useState<"clone" | "tts" | "delete" | null>(null);
  const [runState, setRunState] = useState<RunState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const combinedVoices = useMemo(
    () => [
      ...customVoices
        .filter((voice) => voice.status === "completed")
        .map((voice) => ({
          id: `custom:${voice.id}`,
          label: `${voice.name} (Custom)`,
          source: "custom" as VoiceSource,
          voiceId: voice.id,
        })),
      ...defaultVoices.map((voice) => ({
        id: `deepgram-default:${voice.id}`,
        label: `${voice.name} (Deepgram)`,
        source: "deepgram-default" as VoiceSource,
        voiceId: voice.id,
      })),
    ],
    [customVoices, defaultVoices]
  );

  const estimatedCredits = calculateTtsCredits(Math.max(ttsText.trim().length, 1));

  const loadVoices = useCallback(async () => {
    const response = await fetch("/api/voices", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(await readError(response, "Could not load voices."));
    }
    const body = (await response.json()) as {
      customVoices: VoiceCloneListItem[];
      defaultVoices: DefaultVoice[];
      creditBalance: number;
    };
    setCustomVoices(body.customVoices);
    setDefaultVoices(body.defaultVoices);
    setCreditBalance(body.creditBalance);
    if (!selectedVoice && body.defaultVoices[0]) {
      setSelectedVoice(`deepgram-default:${body.defaultVoices[0].id}`);
    }
  }, [selectedVoice]);

  const loadTtsResults = useCallback(async () => {
    const response = await fetch("/api/voice-tts", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(await readError(response, "Could not load generated audio."));
    }
    const body = (await response.json()) as { results: VoiceTtsListItem[] };
    setTtsResults(body.results);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadVoices(), loadTtsResults()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load page.");
    } finally {
      setLoading(false);
    }
  }, [loadTtsResults, loadVoices]);

  useEffect(() => {
    // Initial data load for this client-side workspace.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!runState?.runId) {
      return;
    }

    const interval = window.setInterval(async () => {
      const url =
        runState.kind === "clone"
          ? `/api/voices/run/${runState.runId}`
          : `/api/voice-tts/run/${runState.runId}`;

      try {
        const response = await fetch(url, { cache: "no-store" });
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
        };

        const next = {
          ...runState,
          progress: Number(body.run.metadata?.progress ?? runState.progress),
          stage: String(body.run.metadata?.stage ?? body.run.status),
          message: String(
            body.run.metadata?.message ?? "Background task is running"
          ),
          status: body.run.status,
        };
        setRunState(next);

        if (body.run.isCompleted || body.run.isFailed) {
          if (completedRunIdsRef.current.has(runState.runId)) {
            window.clearInterval(interval);
            return;
          }

          completedRunIdsRef.current.add(runState.runId);
          window.clearInterval(interval);
          setBusy(null);
          setRunState(null);
          await loadAll();
          if (body.run.isCompleted) {
            toast.success(
              runState.kind === "clone"
                ? "Voice clone is ready."
                : "Generated audio is ready.",
              { id: runState.runId }
            );
          } else {
            toast.error(next.message, { id: runState.runId });
          }
        }
      } catch {
        return;
      }
    }, 2500);

    return () => window.clearInterval(interval);
  }, [loadAll, runState]);

  function resetCloneDialog() {
    setVoiceName("");
    setSampleFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function submitClone() {
    if (!sampleFile) {
      toast.error("Upload a 10-second voice sample first.");
      return;
    }

    if (voiceName.trim().length < 2) {
      toast.error("Enter a voice name.");
      return;
    }

    const formData = new FormData();
    formData.set("name", voiceName.trim());
    formData.set("sample", sampleFile);

    setBusy("clone");
    try {
      const response = await fetch("/api/voices/clone", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readError(response, "Could not start voice cloning."));
      }

      const body = (await response.json()) as {
        voice: VoiceCloneListItem;
        runId: string;
      };

      setCustomVoices((voices) => [body.voice, ...voices]);
      setRunState({
        runId: body.runId,
        kind: "clone",
        progress: 5,
        stage: "queued",
        message: "Voice cloning queued",
        status: "QUEUED",
      });
      completedRunIdsRef.current.delete(body.runId);
      setCloneDialogOpen(false);
      resetCloneDialog();
      toast.loading("Voice cloning is running in the background.", {
        id: body.runId,
      });
    } catch (error) {
      setBusy(null);
      toast.error(error instanceof Error ? error.message : "Could not clone voice.");
    }
  }

  async function submitTts() {
    const selected = combinedVoices.find((voice) => voice.id === selectedVoice);
    const text = ttsText.trim();

    if (!selected) {
      toast.error("Choose a voice.");
      return;
    }

    if (!text || text.length > TTS_TEXT_LIMIT) {
      toast.error(`Enter between 1 and ${TTS_TEXT_LIMIT} characters.`);
      return;
    }

    setBusy("tts");
    try {
      const response = await fetch("/api/voice-tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceSource: selected.source,
          voiceId: selected.voiceId,
          text,
        }),
      });

      if (!response.ok) {
        throw new Error(await readError(response, "Could not generate speech."));
      }

      const body = (await response.json()) as {
        result: VoiceTtsListItem;
        runId: string;
        creditBalance: number;
      };

      setTtsResults((results) => [body.result, ...results]);
      setCreditBalance(body.creditBalance);
      setRunState({
        runId: body.runId,
        kind: "tts",
        progress: 5,
        stage: "queued",
        message: "Text to speech generation queued",
        status: "QUEUED",
      });
      completedRunIdsRef.current.delete(body.runId);
      setTtsDialogOpen(false);
      setTtsText("");
      toast.loading("Text to speech is running in the background.", {
        id: body.runId,
      });
    } catch (error) {
      setBusy(null);
      toast.error(error instanceof Error ? error.message : "Could not generate speech.");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    setBusy("delete");
    try {
      const endpoint =
        deleteTarget.kind === "voice"
          ? `/api/voices/${deleteTarget.id}`
          : `/api/voice-tts/${deleteTarget.id}`;
      const response = await fetch(endpoint, { method: "DELETE" });

      if (!response.ok) {
        throw new Error(await readError(response, "Delete failed."));
      }

      if (deleteTarget.kind === "voice") {
        setCustomVoices((voices) =>
          voices.filter((voice) => voice.id !== deleteTarget.id)
        );
      } else {
        setTtsResults((results) =>
          results.filter((result) => result.id !== deleteTarget.id)
        );
      }

      toast.success("Deleted.");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setBusy(null);
    }
  }

  function handleUseVoice(source: VoiceSource, voiceId: string) {
    setSelectedVoice(`${source}:${voiceId}`);
    setTtsDialogOpen(true);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_320px] lg:p-7">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
              <Sparkles className="size-4" />
              AI voice studio
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Clone voices and generate polished speech.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Create reusable custom voices, preview Deepgram defaults, and run
              long-form TTS jobs with clear background progress.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/60 p-4">
            <div className="text-sm font-medium">Available credits</div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">
              {creditBalance.toLocaleString()}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              TTS costs 10 credits per 500 characters.
            </p>
          </div>
        </div>
      </section>

      <RunProgress runState={runState} />

      <Tabs defaultValue="cloning" className="gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="w-full sm:w-fit">
            <TabsTrigger value="cloning" className="flex-1 sm:flex-none">
              AI Voice Cloning
            </TabsTrigger>
            <TabsTrigger value="tts" className="flex-1 sm:flex-none">
              Voice Cloning TTS
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void loadAll()}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button onClick={() => setCloneDialogOpen(true)}>
              <Plus className="size-4" />
              Add New Voice Clone
            </Button>
          </div>
        </div>

        <TabsContent value="cloning" className="grid gap-6">
          <section className="grid gap-4">
            <SectionHeading
              title="Custom voices"
              description="Your cloned voices appear here after background processing completes."
            />
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-72 animate-pulse rounded-xl border border-border bg-muted"
                  />
                ))}
              </div>
            ) : customVoices.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {customVoices.map((voice) => (
                  <CustomVoiceCard
                    key={voice.id}
                    voice={voice}
                    onUse={() => handleUseVoice("custom", voice.id)}
                    onDelete={() =>
                      setDeleteTarget({
                        kind: "voice",
                        id: voice.id,
                        name: voice.name,
                      })
                    }
                  />
                ))}
              </div>
            ) : (
              <Empty className="border border-border bg-card">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Mic2 className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>No custom voices yet</EmptyTitle>
                  <EmptyDescription>
                    Upload a short sample to create a reusable cloned voice.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={() => setCloneDialogOpen(true)}>
                    <Plus className="size-4" />
                    Add New Voice Clone
                  </Button>
                </EmptyContent>
              </Empty>
            )}
          </section>

          <section className="grid gap-4">
            <SectionHeading
              title="Deepgram default voices"
              description="Preview and use ready-made voices for fast TTS generation."
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {defaultVoices.map((voice) => (
                <DefaultVoiceCard
                  key={voice.id}
                  voice={voice}
                  onUse={() => handleUseVoice("deepgram-default", voice.id)}
                />
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="tts" className="grid gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SectionHeading
              title="Generated audio"
              description="Completed and in-progress TTS generations are saved here."
            />
            <Button onClick={() => setTtsDialogOpen(true)}>
              <WandSparkles className="size-4" />
              Generate Text to Speech
            </Button>
          </div>

          {ttsResults.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {ttsResults.map((result) => (
                <TtsResultCard
                  key={result.id}
                  result={result}
                  onDelete={() =>
                    setDeleteTarget({
                      kind: "tts",
                      id: result.id,
                      name: result.voiceName,
                    })
                  }
                />
              ))}
            </div>
          ) : (
            <Empty className="border border-border bg-card">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <AudioLines className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No generated audio yet</EmptyTitle>
                <EmptyDescription>
                  Generate speech from a cloned or default voice.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => setTtsDialogOpen(true)}>
                  <WandSparkles className="size-4" />
                  Generate Text to Speech
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Voice Clone</DialogTitle>
            <DialogDescription>
              Upload a clear 10-second voice sample and name the cloned voice.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="voice-name">
                Voice name
              </label>
              <Input
                id="voice-name"
                value={voiceName}
                onChange={(event) => setVoiceName(event.target.value)}
                placeholder="Example: Product narrator"
              />
            </div>
            <button
              type="button"
              className="rounded-xl border border-dashed border-border bg-muted p-5 text-left outline-none transition hover:border-primary focus-visible:ring-3 focus-visible:ring-ring/50"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-background text-muted-foreground">
                  <Upload className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-medium">
                    {sampleFile?.name ?? "Upload voice sample"}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    Audio file under 20 MB. Aim for a clean 10-second sample.
                  </span>
                </span>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(event) => setSampleFile(event.target.files?.[0] ?? null)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloneDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={busy === "clone"} onClick={() => void submitClone()}>
              {busy === "clone" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mic2 className="size-4" />
              )}
              Start Voice Cloning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={ttsDialogOpen} onOpenChange={setTtsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Text to Speech</DialogTitle>
            <DialogDescription>
              Choose a voice, enter text, and generate audio in the background.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="tts-voice">
                Voice
              </label>
              <select
                id="tts-voice"
                value={selectedVoice}
                onChange={(event) => setSelectedVoice(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {combinedVoices.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium" htmlFor="tts-text">
                  Text
                </label>
                <span className="text-xs text-muted-foreground">
                  {ttsText.length}/{TTS_TEXT_LIMIT}
                </span>
              </div>
              <Textarea
                id="tts-text"
                value={ttsText}
                maxLength={TTS_TEXT_LIMIT}
                onChange={(event) => setTtsText(event.target.value)}
                placeholder="Enter text for speech generation..."
                className="min-h-40 resize-none"
              />
            </div>
            <div className="rounded-xl border border-border bg-muted/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">Credit pricing</span>
                <Badge variant="secondary">10 credits per 500 characters</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                This request will use{" "}
                <span className="font-medium text-foreground">
                  {estimatedCredits} credits
                </span>
                .
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTtsDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={busy === "tts"} onClick={() => void submitTts()}>
              {busy === "tts" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <WandSparkles className="size-4" />
              )}
              Generate Text to Speech
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteTarget?.name}. The stored audio
              file will also be removed when available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy === "delete"}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive/10 text-destructive hover:bg-destructive/20"
              disabled={busy === "delete"}
              onClick={() => void confirmDelete()}
            >
              {busy === "delete" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
