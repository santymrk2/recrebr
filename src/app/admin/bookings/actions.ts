"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { BookingStatus } from "@/lib/types";

export async function setBookingStatus(id: string, status: BookingStatus) {
  const supabase = createSupabaseAdminClient();

  const { data: booking, error: fetchError } = await supabase
    .from("booking_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !booking) {
    console.error("setBookingStatus fetch error:", fetchError);
    return;
  }

  const { error: updateError } = await supabase
    .from("booking_requests")
    .update({ status })
    .eq("id", id);

  if (updateError) {
    console.error("setBookingStatus update error:", updateError);
    return;
  }

  // Al confirmar, recién ahí se bloquea la fecha para ese producto —
  // así una solicitud "pendiente" sin seña no tapa la fecha para otros.
  if (status === "confirmada") {
    const { error: blockError } = await supabase.from("availability_blocks").insert({
      product_id: booking.product_id,
      blocked_date: booking.requested_date,
      reason: `Reserva confirmada #${id.slice(0, 8)}`,
    });
    // Si ya existía el bloqueo (unique index), lo ignoramos.
    if (blockError && blockError.code !== "23505") {
      console.error("setBookingStatus block error:", blockError);
    }
  }

  revalidatePath("/admin/bookings");
  revalidatePath("/admin/availability");
}
