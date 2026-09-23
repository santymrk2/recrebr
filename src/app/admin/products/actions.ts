"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function parseImageUrls(raw: string) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function productPayloadFromForm(formData: FormData) {
  const priceRaw = String(formData.get("price_ars") || "").trim();
  const priceOriginalRaw = String(formData.get("price_original_ars") || "").trim();

  return {
    name: String(formData.get("name") || "").trim(),
    description: String(formData.get("description") || "").trim() || null,
    price_ars: priceRaw ? Number(priceRaw) : null,
    price_original_ars: priceOriginalRaw ? Number(priceOriginalRaw) : null,
    image_urls: parseImageUrls(String(formData.get("image_urls") || "")),
    is_bookable: formData.get("is_bookable") === "on",
    is_active: formData.get("is_active") === "on",
    is_featured: formData.get("is_featured") === "on",
    category: String(formData.get("category") || "").trim() || null,
    sort_order: Number(formData.get("sort_order") || 0),
  };
}

export async function createProduct(formData: FormData) {
  const supabase = createSupabaseAdminClient();
  const payload = productPayloadFromForm(formData);

  const { error } = await supabase.from("products").insert(payload);
  if (error) {
    redirect(`/admin/products/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = createSupabaseAdminClient();
  const payload = productPayloadFromForm(formData);

  const { error } = await supabase.from("products").update(payload).eq("id", id);
  if (error) {
    redirect(`/admin/products/${id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("products").delete().eq("id", id);

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}
