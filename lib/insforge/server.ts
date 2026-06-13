import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";

export async function createInsForgeServerClient() {
  return createServerClient({
    cookies: await cookies(),
  });
}

export function getAppUrl(request?: Request) {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  if (request) {
    return new URL(request.url).origin;
  }

  return "http://localhost:3000";
}
