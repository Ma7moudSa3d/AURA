import { cache } from "react";
import { supabaseServer } from "@/lib/supabase/server";
import type { Settings } from "@/lib/types";

const fallback: Settings = {
  whatsapp_number: "201016267377", shipping_fee: 60, free_shipping_threshold: 3000,
  instagram: null, facebook: null, tiktok: null, contact_email: "ofoftot@gmail.com", contact_phone: "01016267377",
  announcement_en: null, announcement_ar: null,
};

export const getSettings = cache(async (): Promise<Settings> => {
  const { data } = await supabaseServer().from("settings").select("*").eq("id", 1).single();
  return (data as Settings) ?? fallback;
});

export const getUser = cache(async () => {
  const { data: { user } } = await supabaseServer().auth.getUser();
  return user;
});
