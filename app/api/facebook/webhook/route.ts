import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";
import { getChatbots } from "@/lib/chatbot-store";

type ChatbotItem = {
  id: string;
  name?: string;
  pageName?: string;
  status?: "active" | "draft" | "paused";
  botEnabled?: boolean;
  promptConfig?: {
    botName?: string;
    welcomeMessage?: string;
    roleDescription?: string;
    responseRules?: string;
    openingStyle?: string;
    toneStyle?: string;
    closingQuestionStyle?: string;
    enableUrgency?: boolean;
    urgencyStyle?: string;
    exampleReplies?: string;
    forbiddenPhrases?: string;
  };
  products?: any[];
  salesStrategy?: any;
  connectionConfig?: {
    geminiApiKey?: string;
    facebookPageId?: string;
    facebookPageName?: string;
    facebookPageAccessToken?: string;
    facebookAppId?: string;
    facebookAppSecret?: string;
    webhookVerifyToken?: string;
    telegramBotToken?: string;
    telegramChatId?: string;
    telegramThreadId?: string;
  };
};

type ChatHistoryItem = {
  role: "user" | "bot";
  text: string;
};

type ConversationStore = Record<string, ChatHistoryItem[]>;

async function getAllBots(): Promise<ChatbotItem[]> {
  const bots = await getChatbots();
  return Array.isArray(bots) ? bots : [];
}

async function findBotByVerifyToken(verifyToken: string): Promise<ChatbotItem | null> {
  const bots = await getAllBots();

  return (
    bots.find(
      (bot) =>
        (bot.connectionConfig?.webhookVerifyToken || "").trim() ===
        verifyToken.trim()
    ) || null
  );
}

async function findBotByFacebookPageId(pageId: string): Promise<ChatbotItem | null> {
  const bots = await getAllBots();

  return (
    bots.find(
      (bot) =>
        String(bot.connectionConfig?.facebookPageId || "").trim() ===
        String(pageId || "").trim()
    ) || null
  );
}

function getConversationKey(botId: string, pageId: string, senderId: string) {
  return `${botId}__${pageId}__${senderId}`;
}

async function getConversationHistory(params: {
  botId: string;
  pageId: string;
  senderId: string;
}): Promise<ChatHistoryItem[]> {
  const { botId, pageId, senderId } = params;
  const key = getConversationKey(botId, pageId, senderId);

  const { data, error } = await supabaseAdmin
    .from("facebook_conversations")
    .select("history")
    .eq("id", key)
    .maybeSingle();

  if (error) {
    console.error("getConversationHistory error:", error);
    return [];
  }

  const history = data?.history;
  return Array.isArray(history) ? history : [];
}

async function saveConversationHistory(params: {
  botId: string;
  pageId: string;
  senderId: string;
  history: ChatHistoryItem[];
}) {
  const { botId, pageId, senderId, history } = params;
  const key = getConversationKey(botId, pageId, senderId);

  const { error } = await supabaseAdmin.from("facebook_conversations").upsert(
    {
      id: key,
      bot_id: botId,
      page_id: pageId,
      sender_id: senderId,
      history: history.slice(-30),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("saveConversationHistory error:", error);
    throw error;
  }
}

async function appendConversationItems(params: {
  botId: string;
  pageId: string;
  senderId: string;
  items: ChatHistoryItem[];
}) {
  const { botId, pageId, senderId, items } = params;
  const current = await getConversationHistory({ botId, pageId, senderId });
  const next = [...current, ...items].slice(-30);

  await saveConversationHistory({
    botId,
    pageId,
    senderId,
    history: next,
  });
}

async function fetchFacebookUserName(params: {
  senderId: string;
  pageAccessToken: string;
}): Promise<string> {
  const { senderId, pageAccessToken } = params;

  try {
    const url = new URL(`https://graph.facebook.com/${senderId}`);
    url.searchParams.set("fields", "name");
    url.searchParams.set("access_token", pageAccessToken);

    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("fetchFacebookUserName failed:", errorText);
      return "";
    }

    const data = await response.json();
    return typeof data?.name === "string" ? data.name : "";
  } catch (error) {
    console.error("fetchFacebookUserName error:", error);
    return "";
  }
}

async function sendFacebookTextMessage(params: {
  recipientId: string;
  text: string;
  pageAccessToken: string;
}) {
  const { recipientId, text, pageAccessToken } = params;

  const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${pageAccessToken}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      messaging_type: "RESPONSE",
      message: { text },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("FB SEND TEXT ERROR:", data);
    throw new Error("send text message failed");
  }

  console.log("FB SEND TEXT SUCCESS:", data);
  return data;
}

async function sendFacebookImageMessage(params: {
  recipientId: string;
  imageUrl: string;
  pageAccessToken: string;
}) {
  const { recipientId, imageUrl, pageAccessToken } = params;

  const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${pageAccessToken}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      messaging_type: "RESPONSE",
      message: {
        attachment: {
          type: "image",
          payload: {
            url: imageUrl,
            is_reusable: true,
          },
        },
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("FB SEND IMAGE ERROR:", data);
    throw new Error("send image message failed");
  }

  console.log("FB SEND IMAGE SUCCESS:", data);
  return data;
}

function extractImageUrlsFromChatbotResult(chatbotResult: any): string[] {
  const rawImages: any[] = Array.isArray(chatbotResult?.images)
    ? chatbotResult.images
    : [];

  const urls: string[] = rawImages
    .map((item: any): string => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item.url === "string") return item.url.trim();
      if (item && typeof item.imageUrl === "string") return item.imageUrl.trim();
      return "";
    })
    .filter((url: string) => Boolean(url))
    .filter((url: string) => /^https?:\/\//i.test(url));

  return [...new Set<string>(urls)].slice(0, 5);
}

async function callInternalChatbot(params: {
  req: NextRequest;
  bot: ChatbotItem;
  messageText: string;
  senderName: string;
  history: ChatHistoryItem[];
}) {
  const { req, bot, messageText, senderName, history } = params;

  const requestOrigin = req.nextUrl.origin;
  const internalBaseUrl =
    process.env.INTERNAL_APP_BASE_URL?.trim() || requestOrigin;

  const response = await fetch(`${internalBaseUrl}/api/chatbot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      botId: bot.id,
      message: messageText,
      messages: [...history, { role: "user", text: messageText }],
      history,
      images: [],
      botRole: bot.promptConfig?.roleDescription || "",
      botRules: bot.promptConfig?.responseRules || "",
      products: Array.isArray(bot.products) ? bot.products : [],
      salesStrategy: bot.salesStrategy || {
        openingStyle: bot.promptConfig?.openingStyle || "",
        showOffersInFirstReply: true,
        maxOffersInFirstReply: "2",
        closingQuestionStyle: bot.promptConfig?.closingQuestionStyle || "",
        toneStyle: bot.promptConfig?.toneStyle || "",
        enableUrgency: bot.promptConfig?.enableUrgency || false,
        urgencyStyle: bot.promptConfig?.urgencyStyle || "",
      },
      senderName,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`internal chatbot route failed: ${errorText}`);
  }

  return response.json();
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const verifyToken = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !verifyToken || !challenge) {
    return NextResponse.json(
      { error: "missing webhook verification params" },
      { status: 400 }
    );
  }

  const bot = await findBotByVerifyToken(verifyToken);

  if (!bot) {
    return NextResponse.json(
      { error: "invalid verify token" },
      { status: 403 }
    );
  }

  return new NextResponse(challenge, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.object !== "page") {
      return NextResponse.json(
        { error: "unsupported webhook object" },
        { status: 404 }
      );
    }

    const entries = Array.isArray(body.entry) ? body.entry : [];

    for (const entry of entries) {
      const pageId = String(entry?.id || "").trim();
      const bot = await findBotByFacebookPageId(pageId);

      if (!bot) {
        console.warn("No bot found for pageId:", pageId);
        continue;
      }

      if (!bot.botEnabled) {
        console.log("Bot is disabled, skip reply:", bot.id);
        continue;
      }


      const pageAccessToken =
        bot.connectionConfig?.facebookPageAccessToken || "";

      if (!pageAccessToken) {
        console.warn("Missing page access token for bot:", bot.id);
        continue;
      }

      const messagingEvents = Array.isArray(entry?.messaging)
        ? entry.messaging
        : [];

        for (const event of messagingEvents) {
          try {
            const senderId = String(event?.sender?.id || "").trim();
            const isEcho = Boolean(event?.message?.is_echo);
            const messageText = String(event?.message?.text || "").trim();

            if (!senderId || isEcho) {
              continue;
            }

            if (!messageText) {
              continue;
            }

            const senderName = await fetchFacebookUserName({
              senderId,
              pageAccessToken,
            });

            const history = await getConversationHistory({
              botId: bot.id,
              pageId,
              senderId,
            });

            const chatbotResult = await callInternalChatbot({
              req,
              bot,
              messageText,
              senderName,
              history,
            });

            const replyText =
              typeof chatbotResult?.reply === "string" && chatbotResult.reply.trim()
                ? chatbotResult.reply.trim()
                : "สวัสดีค่ะ ตอนนี้ระบบยังไม่มีคำตอบที่เหมาะสม รบกวนทักใหม่อีกครั้งนะคะ";

            const replyImages = extractImageUrlsFromChatbotResult(chatbotResult);

            for (const imageUrl of replyImages) {
              await sendFacebookImageMessage({
                recipientId: senderId,
                imageUrl,
                pageAccessToken,
              });
            }

            await sendFacebookTextMessage({
              recipientId: senderId,
              text: replyText,
              pageAccessToken,
            });

            const botHistoryText =
              replyImages.length > 0
                ? `${replyText}\n[images]\n${replyImages.join("\n")}`
                : replyText;

            await appendConversationItems({
              botId: bot.id,
              pageId,
              senderId,
              items: [
                { role: "user", text: messageText },
                { role: "bot", text: botHistoryText },
              ],
            });
          } catch (eventError) {
            console.error("facebook messaging event error:", eventError);
          }
        }
      }

    return new NextResponse("EVENT_RECEIVED", { status: 200 });
  } catch (error) {
    console.error("facebook webhook error:", error);
    return NextResponse.json(
      { error: "facebook webhook failed" },
      { status: 500 }
    );
  }
}