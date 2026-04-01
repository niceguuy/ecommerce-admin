export type PromptConfig = {
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

export type ConnectionConfig = {
  geminiApiKey: string;
  facebookPageId: string;
  facebookPageName: string;
  facebookPageAccessToken: string;
  facebookAppId: string;
  facebookAppSecret: string;
  webhookVerifyToken: string;
  telegramBotToken: string;
  telegramChatId: string;
  telegramThreadId: string;
};

export type ChatbotItem = {
  id: string;
  name: string;
  pageName: string;
  status: "active" | "draft" | "paused";
  revenue: number;
  description?: string;
  botEnabled: boolean;
  promptConfig: PromptConfig;
  connectionConfig: ConnectionConfig;
};

const STORAGE_KEY = "chatbotItems_v1";
export const CHATBOTS_UPDATED_EVENT = "chatbots-updated";

export const chatbotItems: ChatbotItem[] = [
  {
    id: "a-cleaner-thailand",
    name: "น้องบ๊ะจ่าง",
    pageName: "A - Cleaner Thailand",
    status: "active",
    revenue: 198,
    description: "อัปเดตล่าสุดเมื่อสักครู่",
    botEnabled: true,
    promptConfig: {
      botName: "น้องบ๊ะจ่าง",
      welcomeMessage: "สวัสดีค่ะ สนใจสินค้าอะไรสอบถามมาได้เลยนะคะ 😊",
      roleDescription:
        "คุณคือแอดมินฝ่ายขายของร้านค้าออนไลน์ในไทย หน้าที่คือช่วยตอบแชทลูกค้าแบบสุภาพ เป็นกันเอง อ่านง่าย ไม่แข็ง ไม่ตอบเหมือนหุ่นยนต์ และช่วยปิดการขายให้ได้มากที่สุด",
      responseRules:
        "1. ห้ามเดาราคา ห้ามเดาโปร ห้ามเดาข้อมูลสินค้า ถ้าไม่มีในระบบให้บอกตรงๆ ว่ายังไม่มีข้อมูลส่วนนั้น\n2. ถ้าลูกค้าถามเรื่องราคาแบบกว้างๆ ให้สรุปโปรหลักที่เปิดใช้งานอยู่ก่อน\n3. ถ้าลูกค้าถามเรื่องวิธีใช้ / ใช้ยังไง / อันตรายไหม / ใช้ได้นานไหม / เห็นผลกี่วัน ให้ใช้ response block ที่ตรงก่อน\n4. ถ้าลูกค้าส่งชื่อ เบอร์ ที่อยู่มาแล้ว ห้ามถามซ้ำ\n5. ถ้าลูกค้าส่งข้อมูลมาไม่ครบ ให้ถามเฉพาะข้อมูลที่ขาดจริง\n6. ถ้าลูกค้าถามต่อจากข้อความก่อนหน้า ให้ตอบต่อจากบริบทเดิม ห้ามย้อนกลับไปเปิดขายใหม่ทุกครั้ง\n7. ถ้าพึ่งส่งโปรไปแล้วและลูกค้าถามวิธีใช้ ให้ตอบวิธีใช้ ไม่ต้องยัดโปรซ้ำ",
      openingStyle: "สนใจผงกำจัดต้นไม้ สูตรเข้มข้นใช่ไหมคะ 🌿💀",
      toneStyle: "สุภาพ เป็นกันเอง แบบแอดมินขายของไทย ตอบสั้น อ่านง่าย",
      closingQuestionStyle: "คุณพี่สนใจโปรไหน แจ้งน้องได้เลยนะคะ 😊",
      enableUrgency: false,
      urgencyStyle: "",
      exampleReplies: "",
      forbiddenPhrases: "",
    },
    connectionConfig: {
      geminiApiKey: "",
      facebookPageId: "",
      facebookPageName: "A - Cleaner Thailand",
      facebookPageAccessToken: "",
      facebookAppId: "",
      facebookAppSecret: "",
      webhookVerifyToken: "",
      telegramBotToken: "",
      telegramChatId: "",
      telegramThreadId: "",
    },
  },
  {
    id: "ramruay-main",
    name: "น้องร่ำรวย",
    pageName: "RAMRUAY MAIN",
    status: "draft",
    revenue: 0,
    description: "ยังไม่ได้ตั้งค่าเต็ม",
    botEnabled: false,
    promptConfig: {
      botName: "น้องร่ำรวย",
      welcomeMessage: "สวัสดีค่ะ ทักมาสอบถามได้เลยนะคะ ✨",
      roleDescription: "",
      responseRules: "",
      openingStyle: "",
      toneStyle: "สุภาพ เป็นกันเอง",
      closingQuestionStyle: "สนใจแบบไหน แจ้งได้เลยนะคะ",
      enableUrgency: false,
      urgencyStyle: "",
      exampleReplies: "",
      forbiddenPhrases: "",
    },
    connectionConfig: {
      geminiApiKey: "",
      facebookPageId: "",
      facebookPageName: "A - Cleaner Thailand",
      facebookPageAccessToken: "",
      facebookAppId: "",
      facebookAppSecret: "",
      webhookVerifyToken: "",
      telegramBotToken: "",
      telegramChatId: "",
      telegramThreadId: "",
    },
  },
];

function cloneDefaults(): ChatbotItem[] {
  return chatbotItems.map((bot) => ({
    ...bot,
    promptConfig: { ...bot.promptConfig },
    connectionConfig: { ...bot.connectionConfig },
  }));
}

function canUseStorage() {
  return typeof window !== "undefined";
}

function emitChatbotsUpdated() {
  if (!canUseStorage()) return;
  window.dispatchEvent(new CustomEvent(CHATBOTS_UPDATED_EVENT));
}

function readStorage(): ChatbotItem[] {
  if (!canUseStorage()) {
    return cloneDefaults();
  }

  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    const defaults = cloneDefaults();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as ChatbotItem[];
    if (!Array.isArray(parsed)) {
      const defaults = cloneDefaults();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    return parsed;
  } catch (error) {
    console.error("อ่าน chatbot storage ไม่สำเร็จ", error);
    const defaults = cloneDefaults();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }
}

function writeStorage(bots: ChatbotItem[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bots));
  emitChatbotsUpdated();
}

export function getAllChatbots(): ChatbotItem[] {
  return readStorage();
}

export function getMergedChatbotsFromStorage(): ChatbotItem[] {
  return readStorage();
}

export function getChatbotById(botId: string): ChatbotItem | null {
  return readStorage().find((item) => item.id === botId) ?? null;
}

export function saveAllChatbots(bots: ChatbotItem[]) {
  writeStorage(bots);
}

export function updateChatbot(
  botId: string,
  updater: (bot: ChatbotItem) => ChatbotItem
) {
  const bots = readStorage();
  const nextBots = bots.map((bot) => (bot.id === botId ? updater(bot) : bot));
  writeStorage(nextBots);
  return nextBots.find((bot) => bot.id === botId) ?? null;
}

export function updateChatbotPromptConfig(
  botId: string,
  promptConfig: PromptConfig
) {
  return updateChatbot(botId, (bot) => ({
    ...bot,
    name: promptConfig.botName?.trim() || bot.name,
    promptConfig,
    description: "อัปเดตล่าสุดเมื่อสักครู่",
  }));
}

export function updateChatbotStatus(botId: string, enabled: boolean) {
  return updateChatbot(botId, (bot) => ({
    ...bot,
    botEnabled: enabled,
    status: enabled ? "active" : "paused",
    description: enabled ? "บอทกำลังเปิดใช้งาน" : "บอทถูกปิดการใช้งานอยู่",
  }));
}

export function updateChatbotConnectionConfig(
  botId: string,
  connectionConfig: ConnectionConfig
) {
  return updateChatbot(botId, (bot) => ({
    ...bot,
    connectionConfig,
    description: "อัปเดตการเชื่อมต่อแล้ว",
  }));
}

export function deleteChatbot(botId: string) {
  const bots = readStorage().filter((bot) => bot.id !== botId);
  writeStorage(bots);
  return bots;
}

export function createChatbot() {
  const bots = readStorage();

  const id = `bot-${Date.now()}`;

  const newBot: ChatbotItem = {
    id,
    name: "บอทใหม่",
    pageName: "ยังไม่เชื่อมเพจ",
    status: "draft",
    revenue: 0,
    description: "ยังไม่ได้ตั้งค่าเต็ม",
    botEnabled: false,
    promptConfig: {
      botName: "บอทใหม่",
      welcomeMessage: "สวัสดีค่ะ ทักมาสอบถามได้เลยนะคะ 😊",
      roleDescription: "",
      responseRules: "",
      openingStyle: "",
      toneStyle: "สุภาพ เป็นกันเอง",
      closingQuestionStyle: "สนใจแบบไหน แจ้งได้เลยนะคะ",
      enableUrgency: false,
      urgencyStyle: "",
      exampleReplies: "",
      forbiddenPhrases: "",
    },
    connectionConfig: {
      geminiApiKey: "",
      facebookPageId: "",
      facebookPageName: "",
      facebookPageAccessToken: "",
      facebookAppId: "",
      facebookAppSecret: "",
      webhookVerifyToken: "",
      telegramBotToken: "",
      telegramChatId: "",
      telegramThreadId: "",
    },
  };

  const nextBots = [newBot, ...bots];
  writeStorage(nextBots);

  return newBot;
}