"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { done, str } from "@/lib/admin";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";

export async function updateOrder(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(fd, "id");
  const status = str(fd, "status") as OrderStatus;
  if (!ORDER_STATUSES.includes(status)) done(`/admin/orders/${id}`, "Unknown status.", true);

  const { error: noteError } = await supabase.from("orders").update({ admin_note: str(fd, "admin_note", 2000) }).eq("id", id);
  if (noteError) done(`/admin/orders/${id}`, noteError.message, true);

  if (status === "cancelled") {
    // Atomic: marks cancelled and returns items to stock (only the first time).
    const { error } = await supabase.rpc("admin_cancel_order", { p_order_id: id });
    if (error) done(`/admin/orders/${id}`, error.message, true);
    revalidatePath("/", "layout");
  } else {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) done(`/admin/orders/${id}`, error.message, true);
  }
  revalidatePath("/admin/orders");
  done(`/admin/orders/${id}`, "Order updated.");
}
