import { NextResponse } from "next/server";
import { createServerClient } from "@insforge/sdk/ssr";
import { getAppUrl } from "@/lib/insforge/server";

export async function POST(request: Request) {
  const body = await request.json();
  const provider = String(body.provider ?? "").trim();

  if (!provider) {
    return Response.json({ message: "OAuth provider is required." }, { status: 400 });
  }

  const client = createServerClient();
  const { data, error } = await client.auth.signInWithOAuth(provider, {
    redirectTo: `${getAppUrl(request)}/api/auth/callback`,
    skipBrowserRedirect: true,
  });

  if (error || !data?.url || !data?.codeVerifier) {
    return Response.json(
      { message: error?.message ?? "OAuth could not be started." },
      { status: error?.statusCode ?? 400 }
    );
  }

  const response = NextResponse.json({ url: data.url });
  response.cookies.set("insforge_code_verifier", data.codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
