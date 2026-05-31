import { createServerSupabaseClient } from "@/lib/supabase/server";
import AuthorsClient from "./AuthorsClient";

export default async function AuthorsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: authors, error } = await supabase
    .from("authors")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch authors:", error);
  }

  return <AuthorsClient authors={authors ?? []} />;
}
