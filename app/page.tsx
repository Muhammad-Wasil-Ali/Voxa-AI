import { redirect } from "next/navigation";
import { createInsForgeServerClient } from "@/lib/insforge/server";

export default async function Home() {
  const insforge = await createInsForgeServerClient();
  const { data } = await insforge.auth.getCurrentUser();

  if (!data.user) {
    redirect("/sign-in");
  }

  redirect("/dashboard");
}
