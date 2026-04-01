"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Facebook, Sparkles, MessageCircle } from "lucide-react";
import TrainingPanel, { type TrainingConfig } from "./TrainingPanel";
import {
  CHATBOTS_UPDATED_EVENT,
  getChatbotById,
  updateChatbotPromptConfig,
  updateChatbotStatus,
  type ChatbotItem,
} from "@/lib/chatbots";

type ChatbotWorkspaceProps = {
  botId: string;
};

const EMPTY_CONFIG: TrainingConfig = {
  botName: "",
  welcomeMessage: "",
  roleDescription: "",
  responseRules: "",
  openingStyle: "",
  toneStyle: "",
  closingQuestionStyle: "",
  enableUrgency: false,
  urgencyStyle: "",
  exampleReplies: "",
  forbiddenPhrases: "",
};

function mapBotToConfig(bot: ChatbotItem): TrainingConfig {
  return {
    botName: bot.promptConfig.botName ?? "",
    welcomeMessage: bot.promptConfig.welcomeMessage ?? "",
    roleDescription: bot.promptConfig.roleDescription ?? "",
    responseRules: bot.promptConfig.responseRules ?? "",
    openingStyle: bot.promptConfig.openingStyle ?? "",
    toneStyle: bot.promptConfig.toneStyle ?? "",
    closingQuestionStyle: bot.promptConfig.closingQuestionStyle ?? "",
    enableUrgency: bot.promptConfig.enableUrgency ?? false,
    urgencyStyle: bot.promptConfig.urgencyStyle ?? "",
    exampleReplies: bot.promptConfig.exampleReplies ?? "",
    forbiddenPhrases: bot.promptConfig.forbiddenPhrases ?? "",
  };
}

export default function ChatbotWorkspace({
  botId,
}: ChatbotWorkspaceProps) {
  const [bot, setBot] = useState<ChatbotItem | null>(null);
  const [botEnabled, setBotEnabled] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [config, setConfig] = useState<TrainingConfig>(EMPTY_CONFIG);

  const didInitRef = useRef(false);
  const prevConfigRef = useRef<string>("");
  const prevStatusRef = useRef<boolean | null>(null);

  function reloadBotFromStorage() {
    const foundBot = getChatbotById(botId);

    if (!foundBot) {
      setBot(null);
      setIsReady(true);
      return;
    }

    const nextConfig = mapBotToConfig(foundBot);

    setBot(foundBot);
    setBotEnabled(!!foundBot.botEnabled);
    setConfig(nextConfig);

    prevConfigRef.current = JSON.stringify(nextConfig);
    prevStatusRef.current = !!foundBot.botEnabled;
    didInitRef.current = true;
    setIsReady(true);
  }

  useEffect(() => {
    reloadBotFromStorage();
  }, [botId]);

  useEffect(() => {
    function handleUpdated() {
      reloadBotFromStorage();
    }

    window.addEventListener(CHATBOTS_UPDATED_EVENT, handleUpdated);
    window.addEventListener("storage", handleUpdated);

    return () => {
      window.removeEventListener(CHATBOTS_UPDATED_EVENT, handleUpdated);
      window.removeEventListener("storage", handleUpdated);
    };
  }, [botId]);

  useEffect(() => {
    async function syncBotEnabled() {
      if (!didInitRef.current || !bot) return;
      if (prevStatusRef.current === botEnabled) return;

      prevStatusRef.current = botEnabled;

      const updatedBot = updateChatbotStatus(botId, botEnabled);
      if (updatedBot) {
        setBot(updatedBot);
      }

      try {
        await fetch("/api/chatbot/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            botId,
            botEnabled,
            botName: config.botName,
            welcomeMessage: config.welcomeMessage,
            botRole: config.roleDescription,
            botRules: config.responseRules,
            openingStyle: config.openingStyle,
            toneStyle: config.toneStyle,
            closingQuestionStyle: config.closingQuestionStyle,
            enableUrgency: config.enableUrgency,
            urgencyStyle: config.urgencyStyle,
          }),
        });

        window.dispatchEvent(new CustomEvent(CHATBOTS_UPDATED_EVENT));
      } catch (error) {
        console.error("sync botEnabled failed", error);
      }
    }

    syncBotEnabled();
  }, [botId, botEnabled, bot, config]);

  const displayName = useMemo(() => {
    return config.botName?.trim() || bot?.name || "AI AGENT";
  }, [config.botName, bot?.name]);

  const displayPageName = useMemo(() => {
    return bot?.pageName || "ยังไม่เชื่อมเพจ";
  }, [bot?.pageName]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-2xl bg-zinc-800" />
              <div className="space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-zinc-800" />
                <div className="h-3 w-64 animate-pulse rounded bg-zinc-900" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/chatbot"
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
          >
            ← กลับไปหน้าลิสต์บอท
          </Link>

          <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950/90 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
                <Bot className="h-6 w-6 text-zinc-300" />
              </div>

              <div>
                <div className="text-xl font-semibold">ไม่พบบอทนี้</div>
                <div className="mt-2 text-zinc-400">
                  botId ที่เปิดอยู่ไม่มีในระบบแล้ว หรืออาจถูกลบไปก่อนหน้านี้
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-6">
          <Link
            href="/chatbot"
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
          >
            ← กลับไปหน้าลิสต์บอท
          </Link>
        </div>

        <div className="mb-8 overflow-hidden rounded-[28px] border border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900/80 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.6fr_0.9fr] lg:p-7">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-300">
                <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
                AI Workspace
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-white shadow-inner">
                  <Bot className="h-6 w-6" />
                </div>

                <div>
                  <h1 className="text-4xl font-semibold tracking-[-0.03em] text-white">
                    Chat Bot Training
                  </h1>
                  <p className="mt-3 max-w-3xl text-zinc-400">
                    ตั้งค่าบทบาท กฎการตอบ กลยุทธ์การขาย และทดสอบการตอบแบบเรียลไทม์
                    ให้เหมือนแอดมินขายจริงมากขึ้น
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-zinc-300">
                      <Facebook className="h-4 w-4 text-zinc-400" />
                      {displayPageName}
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-zinc-300">
                      <Bot className="h-4 w-4 text-zinc-400" />
                      {displayName}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                <div className="text-xs text-zinc-500">สถานะบอท</div>

                <div className="mt-2 flex items-center gap-3">
                  <span
                    className={`text-sm font-medium ${botEnabled ? "text-emerald-400" : "text-zinc-500"
                      }`}
                  >
                    {botEnabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  </span>

                  <button
                    type="button"
                    onClick={() => setBotEnabled((prev) => !prev)}
                    aria-pressed={botEnabled}
                    className={`relative h-7 w-12 rounded-full transition ${botEnabled ? "bg-emerald-500" : "bg-zinc-700"
                      }`}
                    title={
                      botEnabled ? "ปิดการใช้งานบอท" : "เปิดการใช้งานบอท"
                    }
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${botEnabled ? "left-6" : "left-1"
                        }`}
                    />
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                <div className="text-xs text-zinc-500">Bot ID</div>
                <div className="mt-1 truncate text-sm text-zinc-300">
                  {bot.id}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                <div className="text-xs text-zinc-500">โหมดทดสอบ</div>
                <div className="mt-1 inline-flex items-center gap-2 text-sm text-zinc-300">
                  <MessageCircle className="h-4 w-4" />
                  พร้อมใช้งาน
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl">
          <TrainingPanel value={config} onChange={setConfig} botId={bot.id} />
        </div>
      </div>

      <Link
        href={`/chatbot/${bot.id}/test`}
        className="fixed bottom-6 right-6 z-[9997] inline-flex items-center gap-3 rounded-full border border-zinc-700 bg-white px-5 py-3 text-sm font-medium text-black shadow-[0_16px_40px_rgba(255,255,255,0.08)] transition hover:scale-[1.02] hover:bg-zinc-100"
      >
        <MessageCircle className="h-4 w-4" />
        เปิดแชทบอท
      </Link>
    </div>
  );
}