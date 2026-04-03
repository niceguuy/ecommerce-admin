"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Message = {
  id: string;
  role: "bot" | "user";
  text: string;
  image?: string;
  images?: string[];
  createdAt: string;
};

type ProductOffer = {
  id: number;
  title: string;
  price: string;
  note: string;
  imagesText: string;
  isActive: boolean;
};

type ProductFaqBlock = {
  id: number;
  label: string;
  keywords: string;
  answer: string;
  imagesText: string;
  isActive: boolean;
};

type ProductItem = {
  id: number;
  name: string;
  sku: string;
  keywords: string;
  description: string;
  highlights: string;
  usage: string;
  salesNote: string;
  imagesText: string;
  pagesText: string;
  isActive: boolean;
  offers: ProductOffer[];
  faqBlocks: ProductFaqBlock[];
};

type SalesStrategy = {
  openingStyle: string;
  showOffersInFirstReply: boolean;
  maxOffersInFirstReply: string;
  closingQuestionStyle: string;
  toneStyle: string;
};

type ChatImageInput = {
  mimeType: string;
  dataBase64: string;
};

type ChatEmulatorProps = {
  botId: string;
  config?: {
    botName?: string;
    welcomeMessage?: string;
    toneStyle?: string;
    closingQuestionStyle?: string;
    roleDescription?: string;
    responseRules?: string;
    openingStyle?: string;
  };
  botEnabled?: boolean;
};

type ChatPayloadHistoryItem = {
  role: "bot" | "user";
  text: string;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("ไม่สามารถอ่านไฟล์ได้"));
        return;
      }
      resolve(result.split(",")[1]);
    };

    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

function createMessage(params: {
  role: "bot" | "user";
  text: string;
  image?: string;
  images?: string[];
}): Message {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: params.role,
    text: params.text,
    image: params.image,
    images: params.images,
    createdAt: new Date().toISOString(),
  };
}

function formatMessageTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatMessageDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function isMessageArray(value: unknown): value is Message[] {
  return Array.isArray(value);
}

function normalizeTestSenderName(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function buildHistoryPayload(items: Message[]): ChatPayloadHistoryItem[] {
  return items.map((item) => ({
    role: item.role,
    text: item.text,
  }));
}

export default function ChatEmulator({
  botId,
  config,
  botEnabled = true,
}: ChatEmulatorProps) {
  const storageKey = `chat_emulator_v3_history_${botId}`;
  const legacyStorageKey = `chat_emulator_v2_history_${botId}`;
  const senderNameKey = `chat_emulator_v3_sender_name_${botId}`;

  const safeConfig = {
    botName: config?.botName || "AI AGENT",
    welcomeMessage:
      config?.welcomeMessage || "สวัสดีค่ะ สนใจสินค้าอะไรสอบถามได้เลยนะคะ 😊",
    toneStyle: config?.toneStyle || "",
    closingQuestionStyle: config?.closingQuestionStyle || "",
    roleDescription: config?.roleDescription || "",
    responseRules: config?.responseRules || "",
    openingStyle: config?.openingStyle || "",
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePayloads, setImagePayloads] = useState<ChatImageInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [testSenderName, setTestSenderName] = useState("");

  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isComposingRef = useRef(false);

  const welcomeText = useMemo(() => {
    return safeConfig.welcomeMessage.trim();
  }, [safeConfig.welcomeMessage]);

  const botName = useMemo(() => {
    return safeConfig.botName.trim();
  }, [safeConfig.botName]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const rawSenderName = localStorage.getItem(senderNameKey) || "";
    setTestSenderName(rawSenderName);
  }, [senderNameKey]);

  useEffect(() => {
    localStorage.setItem(senderNameKey, testSenderName);
  }, [senderNameKey, testSenderName]);

  useEffect(() => {
    if (!botEnabled) {
      setMessages([createMessage({ role: "bot", text: "❌ บอทยังปิดอยู่" })]);
      return;
    }

    const currentRaw = localStorage.getItem(storageKey);
    const legacyRaw = localStorage.getItem(legacyStorageKey);
    const sourceRaw = currentRaw || legacyRaw;

    if (sourceRaw) {
      try {
        const parsed = JSON.parse(sourceRaw);
        if (isMessageArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          if (!currentRaw) {
            localStorage.setItem(storageKey, JSON.stringify(parsed));
          }
          return;
        }
      } catch (error) {
        console.error("load chat history failed", error);
      }
    }

    setMessages([createMessage({ role: "bot", text: welcomeText })]);
  }, [botEnabled, storageKey, legacyStorageKey, welcomeText]);

  useEffect(() => {
    if (messages.length === 0) return;
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const handleImage = async (file: File) => {
    const previewReader = new FileReader();

    previewReader.onload = async () => {
      const preview = previewReader.result;
      if (typeof preview === "string") {
        setImagePreview(preview);
      }

      try {
        const dataBase64 = await fileToBase64(file);
        setImagePayloads([
          {
            mimeType: file.type || "image/jpeg",
            dataBase64,
          },
        ]);
      } catch (error) {
        console.error(error);
        setImagePreview(null);
        setImagePayloads([]);
      }
    };

    previewReader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImagePayloads([]);
  };

  const clearChat = () => {
    const resetMessages = [
      createMessage({
        role: "bot",
        text: botEnabled ? welcomeText : "❌ บอทยังปิดอยู่",
      }),
    ];

    setMessages(resetMessages);
    localStorage.removeItem(legacyStorageKey);
    localStorage.setItem(storageKey, JSON.stringify(resetMessages));
    setInput("");
    setImagePreview(null);
    setImagePayloads([]);
    setLoading(false);
    inputRef.current?.focus();
  };

  const removeMessageById = (messageId: string) => {
    setMessages((prev) => {
      const next = prev.filter((item) => item.id !== messageId);

      if (next.length === 0) {
        const fallback = [
          createMessage({
            role: "bot",
            text: botEnabled ? welcomeText : "❌ บอทยังปิดอยู่",
          }),
        ];
        localStorage.setItem(storageKey, JSON.stringify(fallback));
        return fallback;
      }

      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const sendMessage = async () => {
    if (!botEnabled || loading) return;

    const userText = input.trim();
    const hasImage = imagePayloads.length > 0;

    if (!userText && !hasImage) return;

    const nextUserMessage = createMessage({
      role: "user",
      text: userText || "📷 ส่งรูป",
      image: imagePreview || undefined,
    });

    const nextHistory = [...messages, nextUserMessage];

    setMessages(nextHistory);
    setInput("");
    setImagePreview(null);
    setLoading(true);

    try {
      const rawRole = localStorage.getItem(`chatbotRole_${botId}`) || "";
      const rawRules = localStorage.getItem(`chatbotRules_${botId}`) || "";
      const rawProducts = localStorage.getItem(`chatbotProducts_${botId}`) || "[]";
      const rawSalesStrategy =
        localStorage.getItem(`chatbotSalesStrategy_${botId}`) || "{}";

      let products: ProductItem[] = [];
      let salesStrategy: SalesStrategy = {
        openingStyle: safeConfig.openingStyle || "",
        showOffersInFirstReply: true,
        maxOffersInFirstReply: "2",
        closingQuestionStyle: safeConfig.closingQuestionStyle || "",
        toneStyle: safeConfig.toneStyle || "",
      };
      const senderName = normalizeTestSenderName(testSenderName);
      const botRole = rawRole || safeConfig.roleDescription || "";
      const botRules = rawRules || safeConfig.responseRules || "";

      try {
        const parsedProducts = JSON.parse(rawProducts);
        if (Array.isArray(parsedProducts)) {
          products = parsedProducts;
        }
      } catch (error) {
        console.error("parse products failed", error);
      }

      try {
        const parsedSales = JSON.parse(rawSalesStrategy);
        salesStrategy = {
          openingStyle: parsedSales?.openingStyle || safeConfig.openingStyle || "",
          showOffersInFirstReply:
            typeof parsedSales?.showOffersInFirstReply === "boolean"
              ? parsedSales.showOffersInFirstReply
              : true,
          maxOffersInFirstReply: parsedSales?.maxOffersInFirstReply || "2",
          closingQuestionStyle:
            parsedSales?.closingQuestionStyle ||
            safeConfig.closingQuestionStyle ||
            "",
          toneStyle: parsedSales?.toneStyle || safeConfig.toneStyle || "",
        };
      } catch (error) {
        console.error("parse sales strategy failed", error);
      }

      const historyPayload = buildHistoryPayload(nextHistory);

      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          botId,
          message: userText,
          messages: historyPayload,
          history: historyPayload,
          images: imagePayloads,
          botRole,
          botRules,
          products,
          salesStrategy,
          senderName,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
      }

      setMessages((prev) => [
        ...prev,
        createMessage({
          role: "bot",
          text: data.reply || "🤖 ไม่มีคำตอบ",
          images: Array.isArray(data.images) ? data.images : [],
        }),
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        createMessage({
          role: "bot",
          text:
            error instanceof Error
              ? `❌ เกิดข้อผิดพลาด: ${error.message}`
              : "❌ เกิดข้อผิดพลาด",
        }),
      ]);
    } finally {
      setImagePayloads([]);
      setLoading(false);
      window.setTimeout(() => inputRef.current?.focus(), 60);
    }
  };

  const firstDateLabel =
    messages.length > 0 ? formatMessageDate(messages[0].createdAt) : "";

  return (
    <div className="flex h-full min-h-0 flex-col bg-white text-zinc-900">
      <div className="border-b border-zinc-200 bg-white px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-zinc-900">
              🤖 ทดสอบแชทบอท
            </div>
            <div className="mt-1 text-sm text-zinc-500">
              ลองพิมพ์ข้อความเพื่อทดสอบ flow การตอบของบอท
            </div>
          </div>

          <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
            {botEnabled ? "พร้อมใช้งาน" : "ปิดอยู่"}
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-blue-600 px-4 py-4 text-white">
          <div className="text-lg font-semibold text-white">{botName}</div>
          <div className="mt-1 text-sm text-blue-100">
            ใช้สำหรับทดสอบข้อความจาก training config ปัจจุบัน
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="text-xs font-medium text-zinc-500">ชื่อผู้ทดสอบ (แทนชื่อ Facebook ลูกค้า)</div>
          <input
            value={testSenderName}
            onChange={(e) => setTestSenderName(e.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
            placeholder="เช่น ธิติ หลำไฮสง"
          />
          <div className="mt-2 text-xs text-zinc-500">
            ช่องนี้ใช้จำลองชื่อ Facebook ลูกค้าจริง เพื่อให้ fallback name ใน route ทำงานถูกต้อง
          </div>
        </div>
      </div>

      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto bg-zinc-50 px-5 py-5 text-zinc-900"
      >
        {firstDateLabel && (
          <div className="mb-5 flex justify-center">
            <div className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-500">
              {firstDateLabel}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`group flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex max-w-[80%] flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                    m.role === "user"
                      ? "rounded-br-md bg-blue-600 text-white"
                      : "rounded-bl-md border border-zinc-200 bg-white text-zinc-900"
                  }`}
                >
                  <div className="whitespace-pre-line break-words">{m.text}</div>

                  {m.image && (
                    <img
                      src={m.image}
                      alt="upload"
                      className="mt-3 max-h-[260px] w-auto rounded-xl object-cover"
                    />
                  )}

                  {Array.isArray(m.images) &&
                    m.images.length > 0 &&
                    m.images.map((img, index) => (
                      <img
                        key={`${m.id}-${index}`}
                        src={img}
                        alt={`bot-image-${index}`}
                        className="mt-3 max-h-[320px] w-auto rounded-xl object-cover"
                      />
                    ))}
                </div>

                <div
                  className={`mt-1 flex items-center gap-2 px-1 text-[11px] text-zinc-500 ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <span>{formatMessageTime(m.createdAt)}</span>
                  <button
                    type="button"
                    onClick={() => removeMessageById(m.id)}
                    className="rounded-full px-2 py-0.5 opacity-0 transition hover:bg-zinc-200 hover:text-zinc-700 group-hover:opacity-100"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-zinc-400" />
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-zinc-400 [animation-delay:120ms]" />
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-zinc-400 [animation-delay:240ms]" />
                  <span className="ml-1">กำลังพิมพ์...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {imagePreview && (
        <div className="border-t border-zinc-200 bg-white px-5 py-3">
          <div className="relative w-fit rounded-2xl border border-zinc-200 bg-zinc-50 p-2">
            <img
              src={imagePreview}
              alt="preview"
              className="h-24 rounded-xl object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -right-2 -top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs text-black shadow-md transition hover:bg-zinc-200"
              aria-label="ลบรูป"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-zinc-200 bg-white px-5 py-4">
        <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-2 shadow-sm">
          <label className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-[20px] text-blue-600 transition hover:bg-blue-50">
            🖼️
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImage(file);
                e.currentTarget.value = "";
              }}
            />
          </label>

          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isComposingRef.current) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="h-11 flex-1 bg-transparent px-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
            placeholder="พิมพ์ข้อความ..."
          />

          <button
            type="button"
            onClick={clearChat}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            ล้าง
          </button>

          <button
            type="button"
            disabled={loading || (!input.trim() && imagePayloads.length === 0)}
            onClick={sendMessage}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-300 text-[18px] text-white transition enabled:bg-blue-600 enabled:hover:bg-blue-700 disabled:cursor-not-allowed"
            aria-label="ส่งข้อความ"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
