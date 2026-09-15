import { createServiceClient } from "@/lib/supabase/server";

export async function syncUserFromGoogle(
  email: string,
  googleName?: string
): Promise<{ id: string; displayName: string } | null> {
  try {
    const supabase = createServiceClient();
    const { data: existing } = await supabase
      .from("users")
      .select("id, display_name")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      if (!existing.display_name?.trim() && googleName?.trim()) {
        await supabase
          .from("users")
          .update({ display_name: googleName.trim() })
          .eq("id", existing.id);
        return { id: existing.id, displayName: googleName.trim() };
      }
      return {
        id: existing.id,
        displayName: existing.display_name ?? googleName ?? "",
      };
    }

    const { data: created, error } = await supabase
      .from("users")
      .insert({
        email,
        display_name: googleName?.trim() || "",
      })
      .select("id, display_name")
      .single();

    if (error || !created) return null;
    return {
      id: created.id,
      displayName: created.display_name ?? googleName ?? "",
    };
  } catch (err) {
    console.warn("[user-sync] Supabase unavailable:", err);
    return null;
  }
}
