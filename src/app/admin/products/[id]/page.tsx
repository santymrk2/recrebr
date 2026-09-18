import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { ProductForm } from "../ProductForm";
import { updateProduct } from "../actions";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createSupabaseAdminClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!product) notFound();

  const boundUpdate = async (formData: FormData) => {
    "use server";
    await updateProduct(params.id, formData);
  };

  return (
    <>
      <h1>Editar producto</h1>
      <div className="admin-card">
        <ProductForm
          action={boundUpdate}
          product={product as Product}
          error={searchParams.error}
        />
      </div>
    </>
  );
}
