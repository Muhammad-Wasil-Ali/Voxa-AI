import { createServerClient } from "@insforge/sdk/ssr";

type AuthUserProfile = {
  name?: unknown;
  avatar_url?: unknown;
};

type AuthUser = {
  id?: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  auth_provider?: string;
  email_verified?: boolean;
  profile?: unknown;
};

function profileObject(profile: unknown): Record<string, unknown> {
  if (profile && typeof profile === "object" && !Array.isArray(profile)) {
    return profile as Record<string, unknown>;
  }

  return {};
}

function textValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function saveAuthenticatedUser(
  user: AuthUser | null | undefined,
  accessToken: string
) {
  if (!user?.id || !user.email) {
    return { error: null };
  }

  const profile = profileObject(user.profile);
  const profileFields = profile as AuthUserProfile;
  const client = createServerClient({ accessToken });
  const profileData = {
    email: user.email,
    name: textValue(user.name) ?? textValue(profileFields.name),
    avatar_url:
      textValue(user.avatar_url) ?? textValue(profileFields.avatar_url),
    auth_provider: textValue(user.auth_provider),
    email_verified: Boolean(user.email_verified),
    profile,
    last_signed_in_at: new Date().toISOString(),
  };

  const { data: existing, error: selectError } = await client.database
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    return { error: selectError };
  }

  const { error } = existing
    ? await client.database.from("users").update(profileData).eq("id", user.id)
    : await client.database.from("users").insert([{ id: user.id, ...profileData }]);

  return { error };
}
