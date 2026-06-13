import { NextResponse } from "next/server";
import { createServerClient, setAuthCookies } from "@insforge/sdk/ssr";
import { getAppUrl } from "@/lib/insforge/server";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");
  const name = String(body.name ?? "").trim();

  if (!email || !password || !name) {
    return Response.json(
      { message: "Name, email, and password are required." },
      { status: 400 }
    );
  }

  const client = createServerClient();
  const { data: authConfig } = await client.auth.getPublicAuthConfig();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    name,
    redirectTo: `${getAppUrl(request)}/sign-in`,
  });

  if (error) {
    return Response.json(
      { message: error.message ?? "Sign up failed." },
      { status: error.statusCode ?? 400 }
    );
  }

  const payload = {
    requireEmailVerification: Boolean(data?.requireEmailVerification),
    verifyEmailMethod: authConfig?.verifyEmailMethod ?? "code",
    user: data?.user ?? null,
  };

  if (!data?.accessToken) {
    return Response.json(payload);
  }

  const response = NextResponse.json(payload);
  setAuthCookies(response.cookies, {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });

  return response;
}
