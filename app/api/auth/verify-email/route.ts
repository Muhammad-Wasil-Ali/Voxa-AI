import { NextResponse } from "next/server";
import { createServerClient, setAuthCookies } from "@insforge/sdk/ssr";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? "").trim();
  const otp = String(body.otp ?? "").trim();

  if (!email || otp.length !== 6) {
    return Response.json(
      { message: "Enter the 6-digit verification code." },
      { status: 400 }
    );
  }

  const client = createServerClient();
  const { data, error } = await client.auth.verifyEmail({ email, otp });

  if (error || !data?.accessToken) {
    return Response.json(
      { message: error?.message ?? "Verification failed." },
      { status: error?.statusCode ?? 400 }
    );
  }

  const response = NextResponse.json({ user: data.user });
  setAuthCookies(response.cookies, {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });

  return response;
}
