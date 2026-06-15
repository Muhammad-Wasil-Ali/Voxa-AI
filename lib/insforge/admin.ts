import { createAdminClient } from "@insforge/sdk";

export function createInsForgeAdminClient() {
  const baseUrl =
    process.env.INSFORGE_URL ?? process.env.NEXT_PUBLIC_INSFORGE_URL;
  const apiKey =
    process.env.INSFORGE_API_KEY ??
    process.env.INSFORGE_API ??
    process.env.API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Missing InsForge admin configuration. Set INSFORGE_URL and INSFORGE_API_KEY."
    );
  }

  return createAdminClient({
    baseUrl,
    apiKey,
  });
}
