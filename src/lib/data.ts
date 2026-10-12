import { supabaseServer, supabaseService } from "@/lib/supabase/server";

export async function getUser() {
  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user;
}

export async function getSettings() {
  try {
    const sb = supabaseService();
    const { data, error } = await sb.from("settings").select("*").eq("id", 1).maybeSingle();

    if (error || !data) {
      return {
        id: 1,
        whatsapp_number: "201016267377",
        shipping_fee: 60,
        free_shipping_threshold: 2000,
        contact_email: "aurafragrances111@gmail.com",
        enable_cod: true,
        enable_instapay: true,
        enable_deposit: true,
      };
    }

    return {
      ...data,
      enable_cod: data.enable_cod !== false,
      enable_instapay: data.enable_instapay !== false,
      enable_deposit: data.enable_deposit !== false,
    };
  } catch (err) {
    return {
      id: 1,
      shipping_fee: 60,
      free_shipping_threshold: 2000,
      enable_cod: true,
      enable_instapay: true,
      enable_deposit: true,
    };
  }
}
