"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function addBlock(formData: FormData) {
  const supabase = createSupabaseAdminClient();
  const productId = String(formData.get("product_id") || "");
  const date = String(formData.get("blocked_date") || "");
  const reason = String(formData.get("reason") || "").trim() || null;

  if (!date) return;

  const { error } = await supabase.from("availability_blocks").insert({
    product_id: productId === "general" ? null : productId,
    blocked_date: date,
    reason,
  });

  if (error) console.error("addBlock error:", error);

  revalidatePath("/admin/availability");
}

export async function removeBlock(id: string) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("availability_blocks").delete().eq("id", id);
  revalidatePath("/admin/availability");
}
