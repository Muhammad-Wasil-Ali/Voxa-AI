import { createServerClient } from "@insforge/sdk/ssr";

const fallbackAuthConfig = {
  requireEmailVerification: true,
  passwordMinLength: 6,
  requireNumber: false,
  requireLowercase: false,
  requireUppercase: false,
  requireSpecialChar: false,
  verifyEmailMethod: "code",
  resetPasswordMethod: "code",
  disableSignup: false,
  oAuthProviders: ["google", "github"],
  customOAuthProviders: [],
};

export async function GET() {
  const client = createServerClient();
  const { data, error } = await client.auth.getPublicAuthConfig();

  return Response.json(error || !data ? fallbackAuthConfig : data);
}
