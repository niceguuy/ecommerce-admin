import { NextResponse } from "next/server";
import { getChatbotById, saveChatbots, getChatbots } from "@/lib/chatbot-store";

function blankConnectionTokens(connection: any = {}) {
  return {
    ...connection,
    facebookPageId: "",
    facebookPageName: "",
    facebookPageAccessToken: "",
    facebookAppId: "",
    facebookAppSecret: "",
    webhookVerifyToken: "",
    telegramBotToken: "",
    telegramChatId: "",
    telegramThreadId: "",
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sourceId: string = body?.sourceId || "";
    const newId: string = body?.newId || "";

    if (!sourceId || !newId) {
      return NextResponse.json(
        { error: "sourceId and newId are required" },
        { status: 400 }
      );
    }

    const source = await getChatbotById(sourceId);
    if (!source) {
      return NextResponse.json({ error: "source bot not found" }, { status: 404 });
    }

    const baseName = (source.name || "บอท").trim();

    const cloned = {
      ...source,
      id: newId,
      name: `${baseName} (สำเนา)`,
      pageName: "ยังไม่เชื่อมเพจ",
      status: "draft",
      botEnabled: false,
      description: `คัดลอกจาก ${baseName} — กรุณาตั้ง Token ใหม่`,
      promptConfig: {
        ...(source.promptConfig || {}),
        botName: `${source.promptConfig?.botName || baseName} (สำเนา)`,
      },
      connectionConfig: blankConnectionTokens(source.connectionConfig || {}),
    };

    const bots = await getChatbots();
    const filtered = bots.filter((b: any) => b.id !== newId);
    const ok = await saveChatbots([cloned, ...filtered]);

    if (!ok) {
      return NextResponse.json({ error: "save failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, bot: cloned });
  } catch (error) {
    console.error("duplicate chatbot error", error);
    return NextResponse.json({ error: "duplicate failed" }, { status: 500 });
  }
}
