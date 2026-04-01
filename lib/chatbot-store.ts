import { supabaseAdmin } from "@/lib/supabase-admin";

type ChatbotRow = {
  id: string;
  data: any;
  updated_at?: string;
};

export async function getChatbots() {
  try {
    const { data, error } = await supabaseAdmin
      .from("chatbots")
      .select("id, data, updated_at")
      .order("updated_at", { ascending: true });

    if (error) {
      console.error("getChatbots error:", error);
      return [];
    }

    return (data || []).map((row: ChatbotRow) => ({
      id: row.id,
      ...(row.data || {}),
    }));
  } catch (error) {
    console.error("getChatbots exception:", error);
    return [];
  }
}

export async function saveChatbots(chatbots: any[]) {
  try {
    const rows = (Array.isArray(chatbots) ? chatbots : []).map((bot) => ({
      id: bot.id,
      data: bot,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin
      .from("chatbots")
      .upsert(rows, { onConflict: "id" });

    if (error) {
      console.error("saveChatbots error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("saveChatbots exception:", error);
    return false;
  }
}

export async function getChatbotById(id: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("chatbots")
      .select("id, data")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("getChatbotById error:", error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      ...(data.data || {}),
    };
  } catch (error) {
    console.error("getChatbotById exception:", error);
    return null;
  }
}