import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, setAuthCookies } from "@insforge/sdk/ssr";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("insforge_code");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError || !code) {
    return NextResponse.redirect(new URL("/sign-in?error=oauth_failed", request.url));
  }

  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get("insforge_code_verifier")?.value;

  if (!codeVerifier) {
    return NextResponse.redirect(new URL("/sign-in?error=missing_verifier", request.url));
  }

  const client = createServerClient();
  const { data, error } = await client.auth.exchangeOAuthCode(code, codeVerifier);

  if (error || !data?.accessToken) {
    return NextResponse.redirect(new URL("/sign-in?error=exchange_failed", request.url));
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  setAuthCookies(response.cookies, {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
  response.cookies.delete("insforge_code_verifier");

  return response;
}
