"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Bot } from "lucide-react";
import ChatEmulator from "@/components/chatbot/ChatEmulator";
import { getChatbotById, type ChatbotItem } from "@/lib/chatbots";

type BotTestPageProps = {
  params: Promise<{
    botId: string;
  }>;
};

type TrainingConfig = {
  botName: string;
  welcomeMessage: string;
  roleDescription: string;
  responseRules: string;
  openingStyle: string;
  toneStyle: string;
  closingQuestionStyle: string;
  enableUrgency: boolean;
  urgencyStyle: string;
  exampleReplies: string;
  forbiddenPhrases: string;
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

export default function BotTestPage({ params }: BotTestPageProps) {
  const [botId, setBotId] = useState("");
  const [bot, setBot] = useState<ChatbotItem | null>(null);
  const [config, setConfig] = useState<TrainingConfig>(EMPTY_CONFIG);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let alive = true;

    params.then(({ botId }) => {
      if (!alive) return;

      setBotId(botId);

      const foundBot = getChatbotById(botId);
      setBot(foundBot ?? null);

      if (foundBot) {
        setConfig(mapBotToConfig(foundBot));
      }

      setIsReady(true);
    });

    return () => {
      alive = false;
    };
  }, [params]);

  const displayName = useMemo(() => {
    return config.botName?.trim() || bot?.name || "AI AGENT";
  }, [config.botName, bot?.name]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-black px-6 py-8 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="h-24 animate-pulse rounded-3xl border border-zinc-800 bg-zinc-950" />
        </div>
      </div>
    );
  }

  if (!bot || !botId) {
    return (
      <div className="min-h-screen bg-black px-6 py-8 text-white">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/chatbot"
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
          >
            ← กลับไปหน้าลิสต์บอท
          </Link>

          <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950/90 p-8">
            <div className="text-xl font-semibold">ไม่พบบอทนี้</div>
            <div className="mt-2 text-zinc-400">
              bot ที่ต้องการทดสอบอาจถูกลบหรือยังโหลดไม่สำเร็จ
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/chatbot/${botId}`}
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
            >
              ← กลับหน้าฝึกบอท
            </Link>

            <Link
              href="/chatbot"
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
            >
              ← กลับหน้าลิสต์บอท
            </Link>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-300">
            <MessageCircle className="h-4 w-4" />
            หน้าเทสแชทบอท
          </div>
        </div>

        <div className="mb-6 rounded-[28px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
              <Bot className="h-6 w-6 text-white" />
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
                ทดสอบแชท: {displayName}
              </h1>
              <p className="mt-2 text-zinc-400">
                หน้านี้ใช้เทสการตอบของบอทแบบเต็มหน้า ใช้งานง่ายและไม่ชนหน้าเทรน
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-zinc-800 bg-white shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
          <div className="h-[calc(100dvh-220px)] min-h-[720px]">
            <ChatEmulator
              botId={bot.id}
              config={config}
              botEnabled={!!bot.botEnabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}