"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Bot, ChevronRight, Facebook, Trash2 } from "lucide-react";
import {
  CHATBOTS_UPDATED_EVENT,
  createChatbot,
  deleteChatbot,
  getMergedChatbotsFromStorage,
  type ChatbotItem,
} from "@/lib/chatbots";

export default function BotListPage() {
  const router = useRouter();
  const [bots, setBots] = useState<ChatbotItem[]>([]);

  const loadBots = () => {
    setBots(getMergedChatbotsFromStorage());
  };

  useEffect(() => {
    loadBots();

    const onFocus = () => loadBots();
    const onStorage = () => loadBots();
    const onChatbotsUpdated = () => loadBots();

    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    window.addEventListener(CHATBOTS_UPDATED_EVENT, onChatbotsUpdated);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHATBOTS_UPDATED_EVENT, onChatbotsUpdated);
    };
  }, []);

  const handleCreateBot = () => {
    const newBot = createChatbot();
    loadBots();
    router.push(`/chatbot/${newBot.id}`);
  };

  const handleDeleteBot = (botId: string, botName: string) => {
    const confirmed = window.confirm(`ต้องการลบบอท "${botName}" ใช่ไหม`);
    if (!confirmed) return;

    deleteChatbot(botId);
    loadBots();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-zinc-400">AI Workspace</div>
            <h1 className="mt-1 text-4xl font-bold tracking-tight">Chat Bots</h1>
            <p className="mt-2 text-sm text-zinc-500">
              จัดการบอทแยกตามเพจ แต่ละเพจมี training, prompt, config และตัวลองแชทของตัวเอง
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateBot}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            <Plus size={16} />
            สร้างบอทใหม่
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {bots.map((bot) => (
            <div
              key={bot.id}
              className="group rounded-3xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-700 hover:bg-zinc-900/70"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                  <Bot size={22} />
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      bot.status === "active"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : bot.status === "paused"
                        ? "bg-zinc-700 text-zinc-300"
                        : "bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    {bot.status === "active"
                      ? "เปิดใช้งาน"
                      : bot.status === "paused"
                      ? "พักใช้งาน"
                      : "ฉบับร่าง"}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteBot(bot.id, bot.name || bot.promptConfig.botName)
                    }
                    className="rounded-xl border border-zinc-800 p-2 text-zinc-400 transition hover:border-red-500 hover:text-red-400"
                    aria-label={`delete ${bot.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xl font-semibold">
                  {bot.name || bot.promptConfig.botName}
                </div>

                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Facebook size={14} />
                  <span>{bot.pageName}</span>
                </div>

                <div className="pt-3 text-sm text-zinc-500">
                  {bot.description ?? "-"}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-zinc-800 pt-4">
                <div>
                  <div className="text-xs text-zinc-500">ยอดปิดการขาย</div>
                  <div className="mt-1 text-lg font-semibold">
                    {bot.revenue.toFixed(2)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/chatbot/${bot.id}`)}
                  className="inline-flex items-center gap-2 text-sm text-zinc-300 transition hover:text-white"
                >
                  เปิด workspace
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}