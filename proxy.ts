import { NextResponse, type NextRequest } from "next/server";
import { updateSession, type CookieStore } from "@insforge/sdk/ssr";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  await updateSession({
    requestCookies: request.cookies as unknown as CookieStore,
    responseCookies: response.cookies as unknown as CookieStore,
  });

  return response;
}

export const config = {
  matcher: ["/((?!api/auth/refresh|_next/static|_next/image|favicon.ico).*)"],
};
