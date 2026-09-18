"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Trae las fechas bloqueadas (por el producto puntual + bloqueos
// generales con product_id null) para los próximos `monthsAhead` meses.
export async function getBlockedDates(productId: string, monthsAhead = 3) {
  const supabase = createSupabaseAdminClient();

  const today = new Date();
  const from = today.toISOString().slice(0, 10);
  const until = new Date(today);
  until.setMonth(until.getMonth() + monthsAhead);
  const untilStr = until.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("availability_blocks")
    .select("blocked_date, product_id")
    .or(`product_id.eq.${productId},product_id.is.null`)
    .gte("blocked_date", from)
    .lte("blocked_date", untilStr);

  if (error) {
    console.error("getBlockedDates error:", error);
    return [];
  }

  return data.map((row) => row.blocked_date as string);
}

export type CreateBookingInput = {
  productId: string;
  date: string; // YYYY-MM-DD
  customerName: string;
  customerPhone: string;
  eventLocation?: string;
  notes?: string;
};

export async function createBookingRequest(input: CreateBookingInput) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("booking_requests").insert({
    product_id: input.productId,
    requested_date: input.date,
    customer_name: input.customerName,
    customer_phone: input.customerPhone,
    event_location: input.eventLocation || null,
    notes: input.notes || null,
    status: "pendiente",
  });

  if (error) {
    console.error("createBookingRequest error:", error);
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}
