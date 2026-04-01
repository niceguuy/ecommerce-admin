import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getChatbotById } from "@/lib/chatbot-store";

const ai = new GoogleGenAI({});

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
  enableUrgency: boolean;
  urgencyStyle: string;
};

type ChatHistoryItem = {
  role: "user" | "bot";
  text: string;
};

type ChatImageInput = {
  mimeType: string;
  dataBase64: string;
};

type ExtractedCustomerInfo = {
  name: string;
  phone: string;
  address: string;
  facebookName: string;
};

type TelegramOrderEventType = "NEW_ORDER" | "ORDER_UPDATED";

type ConversationState =
  | "idle"
  | "awaiting_customer_info"
  | "ready_to_summarize"
  | "order_summarized";

const NAME_BLACKLIST = [
  "ถัง",
  "ชิ้น",
  "กระปุก",
  "คู่",
  "กล่อง",
  "แพ็ค",
  "ซอง",
  "ขวด",
  "กระสอบ",
  "โปร",
  "โปร1",
  "โปร2",
  "โปร3",
  "1 ถัง",
  "2 ถัง",
  "3 ถัง",
  "1 ชิ้น",
  "2 ชิ้น",
  "3 ชิ้น",
  "1กระปุก",
  "2กระปุก",
  "3กระปุก",
  "เดี่ยว",
  "ค่าส่ง",
  "ส่งฟรี",
  "ราคา",
  "โปรโมชั่น",
  "โปรโมชัน",
  "เอา",
  "รับ",
  "เปลี่ยน",
  "เปลี่ยนเป็น",
  "สั่ง",
  "จัดส่ง",
  "ใหม่",
  "ชื่อใหม่",
  "เบอร์ใหม่",
  "เบอร์โทรใหม่",
  "ที่อยู่ใหม่",
  "แก้ชื่อ",
  "แก้เบอร์",
  "แก้เบอร์โทร",
  "แก้ที่อยู่",
  "เปลี่ยนชื่อ",
  "เปลี่ยนเบอร์",
  "เปลี่ยนเบอร์โทร",
  "เปลี่ยนที่อยู่",
  "ชื่อผู้รับใหม่",
  "ผู้รับใหม่",
  "ที่อยู่",
  "เบอร์",
  "เบอร์โทร",
  "โทร",
  "ชื่อผู้รับใหม่",
  "ผู้รับใหม่",
  "ที่อยู่",
  "เบอร์",
  "เบอร์โทร",
  "โทร",
  "สนใจ",
  "ขอโปร",
  "สอบถาม",
  "ราคา",
  "โปร",
  "รับโปร",
  "เอาโปร",
  "โอเค",
  "ok",
  "okay",
  "ใช่",
  "ถูกต้อง",
  "ครบถ้วน",
  "ยืนยัน",
  "ตกลง",
  "รับโปร1",
  "รับโปร2",
  "เอา1",
  "เอา2",
  "เอาโปร1",
  "เอาโปร2",
  "โปร1",
  "โปร2",
  "โปร 1",
  "โปร 2",
  "เอา 1",
  "เอา 2",
  "รับ 1",
  "รับ 2",
  "รับโปร 1",
  "รับโปร 2",
  "เอาโปร 1",
  "เอาโปร 2",
  "1",
  "2",
  "3",
  "ครับผม",
  "ได้เลย",
  "จัดเลย",
  "เอาเลย",
  "ตามนี้",
  "ตามนั้น",
  "ส่งรูป",
  "แนบรูป",
  "แนบภาพ",
  "รูป",
  "รูปภาพ",
  "สรุปรูป",
  "📷ส่งรูป",
  "📷 ส่งรูป",
];

function splitLines(text: string): string[] {
  return (text || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitKeywords(text: string): string[] {
  return (text || "")
    .replaceAll(",", "\n")
    .split("\n")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function isValidImageUrl(text: string): boolean {
  const value = text.trim();
  if (!value) return false;
  if (value.startsWith("REPLACE_")) return false;
  return /^https?:\/\/.+/i.test(value);
}

function parseImageUrls(text: string): string[] {
  return splitLines(text).filter(isValidImageUrl);
}

function matchProductScore(message: string, product: ProductItem): number {
  const lowerMessage = message.toLowerCase();
  let score = 0;

  if (product.name && lowerMessage.includes(product.name.toLowerCase())) score += 12;
  if (product.sku && lowerMessage.includes(product.sku.toLowerCase())) score += 8;

  splitKeywords(product.keywords).forEach((keyword) => {
    if (lowerMessage.includes(keyword)) score += 6;
  });

  if (product.description && lowerMessage.includes(product.description.toLowerCase())) score += 2;
  if (product.highlights && lowerMessage.includes(product.highlights.toLowerCase())) score += 2;
  if (product.usage && lowerMessage.includes(product.usage.toLowerCase())) score += 2;

  return score;
}

function matchFaqBlock(
  message: string,
  faqBlocks: ProductFaqBlock[]
): ProductFaqBlock | null {
  const lowerMessage = message.toLowerCase();
  let bestFaq: ProductFaqBlock | null = null;
  let bestScore = 0;

  faqBlocks
    .filter((faq) => faq.isActive)
    .forEach((faq) => {
      let score = 0;

      splitKeywords(faq.keywords).forEach((keyword) => {
        if (lowerMessage.includes(keyword)) score += 10;
      });

      if (faq.label && lowerMessage.includes(faq.label.toLowerCase())) {
        score += 4;
      }

      if (score > bestScore) {
        bestScore = score;
        bestFaq = faq;
      }
    });

  return bestScore > 0 ? bestFaq : null;
}

function detectRequestedQuantity(message: string): number | null {
  const normalized = normalizeCustomerRawText(message.toLowerCase());

  const match = normalized.match(/(\d+)\s*(ถัง|ชิ้น|กระปุก|คู่|กล่อง|แพ็ค|ซอง|ขวด|กระสอบ)/);
  if (match) {
    const qty = Number(match[1]);
    return Number.isFinite(qty) ? qty : null;
  }

  if (normalized.includes("คู่")) return 2;
  if (normalized.includes("เดี่ยว")) return 1;

  return null;
}

function offerMatchesQuantity(offer: ProductOffer, qty: number): boolean {
  const text = `${offer.title} ${offer.note}`.toLowerCase();
  const normalized = normalizeCustomerRawText(text);

  return (
    normalized.includes(`${qty} ถัง`) ||
    normalized.includes(`${qty}ชิ้น`) ||
    normalized.includes(`${qty} ชิ้น`) ||
    normalized.includes(`${qty}กระปุก`) ||
    normalized.includes(`${qty} กระปุก`) ||
    normalized.includes(`${qty}คู่`) ||
    normalized.includes(`${qty} คู่`) ||
    normalized.includes(`${qty}กล่อง`) ||
    normalized.includes(`${qty} กล่อง`) ||
    normalized.includes(`${qty}แพ็ค`) ||
    normalized.includes(`${qty} แพ็ค`) ||
    normalized.includes(`${qty}ซอง`) ||
    normalized.includes(`${qty} ซอง`) ||
    normalized.includes(`${qty}ขวด`) ||
    normalized.includes(`${qty} ขวด`) ||
    normalized.includes(`${qty}กระสอบ`) ||
    normalized.includes(`${qty} กระสอบ`)
  );
}

function findOffersByRequestedQuantity(
  message: string,
  offers: ProductOffer[]
): ProductOffer[] {
  const qty = detectRequestedQuantity(message);
  if (!qty) return [];

  return offers.filter((offer) => offerMatchesQuantity(offer, qty));
}

function detectRequestedOffer(
  message: string,
  offers: ProductOffer[]
): ProductOffer | null {
  const lower = normalizeCustomerRawText(message.toLowerCase());

  if (!lower || offers.length === 0) return null;

  // 1) จับ "โปร 1", "โปร1", "เอาโปร 2"
  const promoMatch = lower.match(/(?:เอา|รับ|เลือก|ขอ)?\s*โปร\s*(\d+)/);
  if (promoMatch) {
    const promoIndex = Number(promoMatch[1]) - 1;
    if (offers[promoIndex]) return offers[promoIndex];
  }

  // 2) จับ "เอา 1", "เอา1", "รับ 2", "เลือก 3"
  const plainNumberMatch = lower.match(/^(?:เอา|รับ|เลือก|ขอ)?\s*(\d+)\b/);
  if (plainNumberMatch) {
    const promoIndex = Number(plainNumberMatch[1]) - 1;
    if (offers[promoIndex]) return offers[promoIndex];
  }

  // 3) จับ "อันแรก", "ตัวแรก", "อันที่ 2"
  if (/อันแรก|ตัวแรก|แบบแรก/.test(lower)) {
    return offers[0] || null;
  }
  if (/อันที่\s*2|ตัวที่\s*2|แบบที่\s*2/.test(lower)) {
    return offers[1] || null;
  }
  if (/อันที่\s*3|ตัวที่\s*3|แบบที่\s*3/.test(lower)) {
    return offers[2] || null;
  }

  // 4) จับจาก quantity เช่น "1 ถัง", "2 ถัง", "3 ชิ้น"
  const qtyMatches = findOffersByRequestedQuantity(lower, offers);
  if (qtyMatches.length === 1) return qtyMatches[0];

  // 5) จับจากข้อความของ offer title / note
  for (const offer of offers) {
    const titleText = normalizeCustomerRawText((offer.title || "").toLowerCase());
    const noteText = normalizeCustomerRawText((offer.note || "").toLowerCase());
    const fullText = normalizeCustomerRawText(`${titleText} ${noteText}`);

    if (titleText && lower.includes(titleText)) return offer;
    if (noteText && lower.includes(noteText)) return offer;
    if (fullText && lower.includes(fullText)) return offer;
  }

  // 6) จับจาก keyword สำคัญใน note เช่น ส่งฟรี / ค่าส่ง 40 / เก็บปลายทาง
  for (const offer of offers) {
    const note = normalizeCustomerRawText((offer.note || "").toLowerCase());

    if (!note) continue;

    if (lower.includes("ส่งฟรี") && note.includes("ส่งฟรี")) return offer;
    if (lower.includes("ค่าส่ง 40") && note.includes("ค่าส่ง 40")) return offer;
    if (lower.includes("เก็บปลายทาง") && note.includes("เก็บปลายทาง")) return offer;
  }

  return null;
}

function historyToText(history: ChatHistoryItem[]): string {
  return history
    .map((item) => `${item.role === "user" ? "ลูกค้า" : "บอท"}: ${item.text}`)
    .join("\n");
}

function recentBotText(history: ChatHistoryItem[]): string {
  return history
    .filter((item) => item.role === "bot")
    .slice(-4)
    .map((item) => item.text.toLowerCase())
    .join("\n");
}

function isFirstCustomerMessage(history: ChatHistoryItem[]): boolean {
  const userMessages = history.filter((item) => item.role === "user");
  return userMessages.length === 0;
}

function mergeUniqueImageUrls(...groups: string[][]): string[] {
  const merged = groups.flat().filter(Boolean);
  return [...new Set(merged)].slice(0, 5);
}

function hasRecentlySentPromoBlock(history: ChatHistoryItem[]): boolean {
  const text = recentBotText(history);

  return (
    text.includes("ตอนนี้มีโปรให้เลือกดังนี้ค่ะ") ||
    text.includes("ตอนนี้มีหลายโปรให้เลือกนะคะ") ||
    text.includes("รับข้อมูลลูกค้าแล้วค่ะ")
  );
}

function isFaqIntent(message: string): boolean {
  const lower = message.toLowerCase();

  return [
    "วิธีใช้",
    "ใช้ยังไง",
    "ใช้อย่างไร",
    "อันตรายไหม",
    "ปลอดภัยไหม",
    "มีพิษไหม",
    "ต้องระวัง",
    "ใช้ได้นาน",
    "เห็นผล",
    "กี่วัน",
    "ขนาด",
    "กี่กรัม",
    "ผสมยังไง",
    "โรยยังไง",
    "ฉีดยังไง",
    "ใช้กับอะไรได้บ้าง",
  ].some((keyword) => lower.includes(keyword));
}

function isBroadPriceIntent(message: string): boolean {
  const lower = message.toLowerCase();

  return [
    "ราคา",
    "เท่าไหร่",
    "กี่บาท",
    "ขอโปร",
    "โปรโมชั่น",
    "มีโปรไหม",
    "มีโปรโมชั่นไหม",
    "มีแบบไหน",
    "มีอะไรแนะนำ",
  ].some((keyword) => lower.includes(keyword));
}

function isInterestIntent(message: string): boolean {
  const lower = normalizeCustomerRawText(message.toLowerCase());

  return [
    "สนใจ",
    "ขอราคา",
    "ราคา",
    "มีโปรไหม",
    "มีโปรอะไรบ้าง",
    "มีโปรโมชั่นไหม",
    "โปร",
    "ขอโปร",
    "รายละเอียด",
    "ขอรายละเอียด",
    "มีแบบไหน",
    "มีอะไรบ้าง",
    "สั่งยังไง",
    "สั่งซื้อ",
    "อยากได้",
  ].some((keyword) => lower.includes(keyword));
}

function isBareInterestMessage(message: string): boolean {
  const lower = normalizeCustomerRawText(message.toLowerCase());

  return ["สนใจ", "สอบถาม", "ขอรายละเอียด"].includes(lower);
}

function isExplicitOfferSelection(message: string): boolean {
  const lower = normalizeCustomerRawText(message.toLowerCase());

  if (!lower) return false;

  // โปรแบบตรง ๆ
  if (/(เอา|รับ|เลือก|ขอ)?\s*โปร\s*\d+/.test(lower)) return true;

  // ตัวเลขล้วน เช่น "1", "2", "3"
  if (/^(เอา|รับ|เลือก|ขอ)?\s*\d+\s*$/.test(lower)) return true;

  // จำนวน + หน่วย
  if (/\d+\s*(ถัง|ชิ้น|กระปุก|คู่|กล่อง|แพ็ค|ซอง|ขวด|กระสอบ)/.test(lower)) return true;

  // เลือกเป็นลำดับ
  if (/อันแรก|ตัวแรก|แบบแรก|อันที่\s*\d+|ตัวที่\s*\d+|แบบที่\s*\d+/.test(lower)) return true;

  // keyword จาก note โปร
  if (/ส่งฟรี|ค่าส่ง|เก็บปลายทาง/.test(lower)) return true;

  return false;
}

function hasUrgencyIntent(message: string): boolean {
  const lower = normalizeCustomerRawText(message.toLowerCase());

  return [
    "ด่วน",
    "รีบ",
    "วันนี้",
    "ตอนนี้",
    "พร้อมสั่ง",
    "ส่งไว",
    "รีบส่ง",
    "เอาด่วน",
    "สั่งเลย",
  ].some((keyword) => lower.includes(keyword));
}

function looksLikePhone(text: string): boolean {
  const digits = text.replace(/\D/g, "");
  return /^0\d{9}$/.test(digits) || /^66\d{9}$/.test(digits);
}

function normalizePhone(text: string): string {
  const digits = text.replace(/\D/g, "");

  if (/^0\d{9}$/.test(digits)) return digits;
  if (/^66\d{9}$/.test(digits)) return `0${digits.slice(2)}`;

  return "";
}

function extractPhone(text: string): string {
  const normalized = normalizeCustomerRawText(text);

  const matches = normalized.match(/(?:\+66|66|0)\d{8,9}/g) || [];
  for (const raw of matches) {
    const normalizedPhone = normalizePhone(raw);
    if (normalizedPhone) return normalizedPhone;
  }

  const compact = normalized.replace(/[^\d+]/g, " ");
  const compactMatches = compact.match(/(?:\+66|66|0)\d{8,9}/g) || [];
  for (const raw of compactMatches) {
    const normalizedPhone = normalizePhone(raw);
    if (normalizedPhone) return normalizedPhone;
  }

  return "";
}

function looksLikeAddress(text: string): boolean {
  const lower = (text || "").toLowerCase();
  const normalized = normalizeWhitespace(text || "");

  const hasAddressKeyword =
    /หมู่|ม\.|ม\s*\d+|ซอย|ถนน|ต\.|ตำบล|อ\.|อำเภอ|จ\.|จังหวัด|แขวง|เขต|อาคาร|บ้านเลขที่|เลขที่/.test(
      normalized
    );

  const hasZipCode = /\b\d{5}\b/.test(normalized);

  const hasProvinceLikeWord =
    /(กรุงเทพ|กทม|กระบี่|กาญจนบุรี|กาฬสินธุ์|กำแพงเพชร|ขอนแก่น|จันทบุรี|ฉะเชิงเทรา|ชลบุรี|ชัยนาท|ชัยภูมิ|ชุมพร|เชียงราย|เชียงใหม่|ตรัง|ตราด|ตาก|นครนายก|นครปฐม|นครพนม|นครราชสีมา|นครศรีธรรมราช|นครสวรรค์|นนทบุรี|นราธิวาส|น่าน|บึงกาฬ|บุรีรัมย์|ปทุมธานี|ประจวบคีรีขันธ์|ปราจีนบุรี|ปัตตานี|พระนครศรีอยุธยา|พะเยา|พังงา|พัทลุง|พิจิตร|พิษณุโลก|เพชรบุรี|เพชรบูรณ์|แพร่|ภูเก็ต|มหาสารคาม|มุกดาหาร|แม่ฮ่องสอน|ยโสธร|ยะลา|ร้อยเอ็ด|ระนอง|ระยอง|ราชบุรี|ลพบุรี|ลำปาง|ลำพูน|เลย|ศรีสะเกษ|สกลนคร|สงขลา|สตูล|สมุทรปราการ|สมุทรสงคราม|สมุทรสาคร|สระแก้ว|สระบุรี|สิงห์บุรี|สุโขทัย|สุพรรณบุรี|สุราษฎร์ธานี|สุรินทร์|หนองคาย|หนองบัวลำภู|อ่างทอง|อุดรธานี|อุทัยธานี|อุตรดิตถ์|อุบลราชธานี|อำนาจเจริญ)/.test(
      normalized
    );

  const hasDistrictLikeWord =
    /(เมือง|วัฒนานคร|อรัญประเทศ|กบินทร์บุรี|บางนา|ลาดกระบัง|บางบัวทอง|ธัญบุรี)/.test(
      normalized
    );

  return Boolean(
    hasAddressKeyword ||
    hasZipCode ||
    lower.includes("กรุงเทพ") ||
    lower.includes("กทม") ||
    hasProvinceLikeWord ||
    hasDistrictLikeWord
  );
}

function isStrongThaiAddress(text: string): boolean {
  const value = normalizeWhitespace(text || "");
  if (!value) return false;

  const hasHouseNumber = /\b\d{1,4}(\/\d{1,4})?\b/.test(value);
  const hasZipCode = /\b\d{5}\b/.test(value);

  const hasAreaKeyword =
    /(หมู่|ม\.|ม\s*\d+|ซอย|ถนน|ตำบล|ต\.|อำเภอ|อ\.|จังหวัด|จ\.|แขวง|เขต)/.test(value);

  const hasProvinceLikeWord =
    /(กรุงเทพ|กทม|กระบี่|กาญจนบุรี|กาฬสินธุ์|กำแพงเพชร|ขอนแก่น|จันทบุรี|ฉะเชิงเทรา|ชลบุรี|ชัยนาท|ชัยภูมิ|ชุมพร|เชียงราย|เชียงใหม่|ตรัง|ตราด|ตาก|นครนายก|นครปฐม|นครพนม|นครราชสีมา|นครศรีธรรมราช|นครสวรรค์|นนทบุรี|นราธิวาส|น่าน|บึงกาฬ|บุรีรัมย์|ปทุมธานี|ประจวบคีรีขันธ์|ปราจีนบุรี|ปัตตานี|พระนครศรีอยุธยา|พะเยา|พังงา|พัทลุง|พิจิตร|พิษณุโลก|เพชรบุรี|เพชรบูรณ์|แพร่|ภูเก็ต|มหาสารคาม|มุกดาหาร|แม่ฮ่องสอน|ยโสธร|ยะลา|ร้อยเอ็ด|ระนอง|ระยอง|ราชบุรี|ลพบุรี|ลำปาง|ลำพูน|เลย|ศรีสะเกษ|สกลนคร|สงขลา|สตูล|สมุทรปราการ|สมุทรสงคราม|สมุทรสาคร|สระแก้ว|สระบุรี|สิงห์บุรี|สุโขทัย|สุพรรณบุรี|สุราษฎร์ธานี|สุรินทร์|หนองคาย|หนองบัวลำภู|อ่างทอง|อุดรธานี|อุทัยธานี|อุตรดิตถ์|อุบลราชธานี|อำนาจเจริญ)/.test(
      value
    );

  const hasDistrictLikeWord =
    /(เมือง|วัฒนานคร|อรัญประเทศ|กบินทร์บุรี|บางนา|ลาดกระบัง|บางบัวทอง|ธัญบุรี)/.test(
      value
    );

  const hasBangkokStyle =
    hasHouseNumber &&
    /(กรุงเทพ|กทม)/.test(value) &&
    /(เขต|แขวง)/.test(value);

  const hasRegionalStyleA =
    hasHouseNumber &&
    hasAreaKeyword &&
    (hasProvinceLikeWord || hasDistrictLikeWord || hasZipCode);

  const hasRegionalStyleB =
    hasHouseNumber &&
    (hasProvinceLikeWord || hasDistrictLikeWord) &&
    hasZipCode;

  // 🔥 เพิ่มเคสสำคัญ: ไม่มีเลข ปณ แต่มีเลขบ้าน + พื้นที่ส่วนลึก + จังหวัด
  const hasRegionalStyleC =
    hasHouseNumber &&
    (hasProvinceLikeWord || hasDistrictLikeWord) &&
    value.split(" ").filter(Boolean).length >= 3;

  return Boolean(
    hasBangkokStyle ||
    hasRegionalStyleA ||
    hasRegionalStyleB ||
    hasRegionalStyleC
  );
}

function removePhoneFromText(text: string): string {
  return normalizeWhitespace(text.replace(/(?:\+66|66|0)\d{8,9}/g, " "));
}

function removeDetectedNameFromAddress(text: string, name: string): string {
  if (!name) return text;

  let value = normalizeWhitespace(text);
  const cleanName = normalizeWhitespace(name);

  if (cleanName) {
    const escaped = cleanName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    value = value.replace(new RegExp(`^${escaped}\\s*`, "i"), "");
    value = value.replace(new RegExp(`\\b${escaped}\\b`, "i"), " ");
  }

  return normalizeWhitespace(value);
}

function isLowConfidenceName(name: string): boolean {
  const value = normalizeWhitespace(name).toLowerCase();
  if (!value) return true;
  if (value.length < 2) return true;
  if (NAME_BLACKLIST.includes(value)) return true;
  if (/^(ถัง|ชิ้น|คู่|โปร)$/i.test(value)) return true;
  return false;
}

function scoreNameCandidate(name: string): number {
  const value = normalizeWhitespace(name);
  if (!value) return 0;
  if (isLowConfidenceName(value)) return 0;

  let score = 0;

  if (value.length >= 4) score += 2;
  if (value.includes(" ")) score += 3;
  if (/^[ก-๙a-zA-Z\s]+$/.test(value)) score += 2;
  if (!/\d/.test(value)) score += 2;

  return score;
}

function shouldUseImageNameFirst(name: string): boolean {
  const value = normalizeWhitespace(name).toLowerCase();

  if (!value) return true;
  if (isLowConfidenceName(value)) return true;

  const weakWords = [
    "สนใจ",
    "ขอโปร",
    "สอบถาม",
    "ราคา",
    "โปร",
    "รับโปร",
    "เอาโปร",
    "ครับ",
    "ค่ะ",
    "โอเค",
    "ok",
    "okay",
    "ใช่",
    "ถูกต้อง",
    "ครบถ้วน",
    "ยืนยัน",
  ];

  return weakWords.includes(value);
}

function isReliableImageName(name: string): boolean {
  const value = normalizeWhitespace(name);

  if (!value) return false;
  if (isLowConfidenceName(value)) return false;
  if (looksLikeAddress(value)) return false;
  if (looksLikePhone(value)) return false;
  if (/\d/.test(value)) return false;

  const lower = value.toLowerCase();

  const weakWords = [
    "สนใจ",
    "ขอโปร",
    "สอบถาม",
    "ราคา",
    "โปร",
    "รับโปร",
    "เอาโปร",
    "ครับ",
    "ค่ะ",
    "โอเค",
    "ok",
    "okay",
    "ใช่",
    "ถูกต้อง",
    "ครบถ้วน",
    "ยืนยัน",
  ];

  if (weakWords.includes(lower)) return false;

  // ชื่อจาก OCR ถ้าเป็นคำไทยคำเดียวสั้น ๆ ให้ถือว่ายังไม่น่าไว้ใจ
  const thaiSingleWord = /^[ก-๙]+$/.test(value) && !value.includes(" ");
  if (thaiSingleWord && value.length < 6) return false;

  return true;
}

function removeNamePrefixFromText(text: string, name: string): string {
  if (!name) return text;

  const normalizedText = normalizeWhitespace(text);
  const normalizedName = normalizeWhitespace(name);

  if (normalizedText.startsWith(normalizedName)) {
    return normalizeWhitespace(normalizedText.slice(normalizedName.length));
  }

  return normalizedText;
}

function extractAddress(text: string): string {
  const normalizedInput = cleanupThaiAddressNoise(normalizeCustomerRawText(text));
  const detectedName = extractName(normalizedInput);

  let cleaned = normalizedInput;

  cleaned = removeCommonOrderWords(cleaned);
  cleaned = stripOfferNoise(cleaned);
  cleaned = removeDetectedNameFromAddress(cleaned, detectedName);
  cleaned = removePhoneFromText(cleaned);

  const firstAddressIndex = cleaned.search(
    /(บ้านเลขที่|เลขที่|\b\d{1,4}\b\s*(หมู่|ม\s*\d+|ม\.|ซอย|ถนน|ต\.|ตำบล|อ\.|อำเภอ|จ\.|จังหวัด|แขวง|เขต|อาคาร)|หมู่|ม\s*\d+|ม\.|ซอย|ถนน|ต\.|ตำบล|อ\.|อำเภอ|จ\.|จังหวัด|แขวง|เขต|อาคาร|\b\d{5}\b|กรุงเทพ|กทม|วัฒนานคร|สระแก้ว)/i
  );

  if (firstAddressIndex > 0) {
    cleaned = cleaned.slice(firstAddressIndex);
  }

  cleaned = cleanupThaiAddressNoise(cleaned);
  cleaned = normalizeWhitespace(cleaned);

  // 🔥 FIX FINAL FORMAT ADDRESS
  cleaned = cleaned
    .replace(/_/g, " ")
    .replace(/(\d)(หมู่|ม)/g, "$1 $2")
    .replace(/(หมู่|ม)(\d)/g, "$1 $2")
    .replace(/(\d)([ก-๙])/g, "$1 $2")
    .replace(/([ก-๙])(\d)/g, "$1 $2")
    .replace(/วัฒนานคร(?=วัฒนานคร)/g, "วัฒนานคร ")
    .replace(/วัฒนานคร(?=สระแก้ว)/g, "วัฒนานคร ")
    .replace(/(\d{5})/g, " $1")
    .replace(/\s+/g, " ")
    .trim();

  if (looksLikeAddress(cleaned)) {
    return cleaned;
  }

  const lines = splitLines(normalizedInput);

  for (const line of lines) {
    let candidate = line;

    candidate = removeCommonOrderWords(candidate);
    candidate = stripOfferNoise(candidate);
    candidate = removeDetectedNameFromAddress(candidate, detectedName);
    candidate = removePhoneFromText(candidate);
    candidate = cleanupThaiAddressNoise(candidate);
    candidate = normalizeWhitespace(candidate);


    const index = candidate.search(
      /(บ้านเลขที่|เลขที่|\b\d{1,4}\b\s*(หมู่|ม\s*\d+|ม\.|ซอย|ถนน|ต\.|ตำบล|อ\.|อำเภอ|จ\.|จังหวัด|แขวง|เขต|อาคาร)|หมู่|ม\s*\d+|ม\.|ซอย|ถนน|ต\.|ตำบล|อ\.|อำเภอ|จ\.|จังหวัด|แขวง|เขต|อาคาร|\b\d{5}\b|กรุงเทพ|กทม|วัฒนานคร|สระแก้ว)/i
    );

    if (index > 0) {
      candidate = candidate.slice(index);
      candidate = normalizeWhitespace(candidate);

      candidate = candidate
        .replace(/_/g, " ")
        .replace(/(\d)(หมู่|ม)/g, "$1 $2")
        .replace(/(หมู่|ม)(\d)/g, "$1 $2")
        .replace(/(\d)([ก-๙])/g, "$1 $2")
        .replace(/([ก-๙])(\d)/g, "$1 $2")
        .replace(/(\d{5})/g, " $1")
        .replace(/วัฒนานคร(?=วัฒนานคร)/g, "วัฒนานคร ")
        .replace(/วัฒนานคร(?=สระแก้ว)/g, "วัฒนานคร ")
        .replace(/\s+/g, " ")
        .trim();
    }

    if (looksLikeAddress(candidate)) {
      return candidate;
    }
  }

  return "";
}

function normalizeCustomerRawText(text: string): string {
  return text
    .replace(/[_|]+/g, " ")
    .replace(/[-]+/g, " ")
    .replace(/[,:;]+/g, " ")
    .replace(/([ก-๙])(\d)/g, "$1 $2")
    .replace(/(\d)([ก-๙])/g, "$1 $2")
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")
    .replace(/(\d)([a-zA-Z])/g, "$1 $2")
    .replace(/หมู่(\d+)/g, "หมู่ $1")
    .replace(/ม(\d+)/g, "ม $1")
    .replace(/ต(\d+)/g, "ต $1")
    .replace(/อ(\d+)/g, "อ $1")
    .replace(/จ(\d+)/g, "จ $1")
    .replace(/(\d{5})([ก-๙])/g, "$1 $2")
    .replace(/([ก-๙])(\d{5})/g, "$1 $2")
    .replace(/([ก-๙])([A-Za-z])/g, "$1 $2")
    .replace(/([A-Za-z])([ก-๙])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .replace(/กรงเทพ/g, "กรุงเทพ")
    .replace(/กุงเทพ/g, "กรุงเทพ")
    .replace(/กทม\./g, "กทม")
    .replace(/ตำวัฒนานคร/g, "ต วัฒนานคร")
    .replace(/ตําวัฒนานคร/g, "ต วัฒนานคร")
    .replace(/อวัฒนานคร/g, "อ วัฒนานคร")
    .replace(/จสระแก้ว/g, "จ สระแก้ว")
    .replace(/จ\.สระแก้ว/g, "จ สระแก้ว")
    .replace(/([ก-๙])(\d{1,4}\/\d{1,4})/g, "$1 $2")
    .replace(/(\d{1,4}\/\d{1,4})([ก-๙])/g, "$1 $2")
    .replace(/([ก-๙])(กรุงเทพ|กทม|วัฒนานคร|สระแก้ว)/g, "$1 $2")
    .replace(/(กรุงเทพ|กทม|วัฒนานคร|สระแก้ว)(\d{5})/g, "$1 $2")
    .replace(/(\d{5})(กรุงเทพ|กทม|วัฒนานคร|สระแก้ว)/g, "$1 $2")
    .replace(/([ก-๙])((?:\+66|66|0)\d{8,9})/g, "$1 $2")
    .replace(/((?:\+66|66|0)\d{8,9})([ก-๙])/g, "$1 $2")
    .trim();
}

function stripOfferNoise(text: string): string {
  let value = normalizeCustomerRawText(text || "");

  value = value.replace(/^(เอา|รับ|สั่ง|ขอ|เลือก|เปลี่ยนเป็น|เปลี่ยน)\s*/i, "");
  value = value.replace(/^โปร\s*/i, "");
  value = value.replace(/^\d+\s*(ถัง|ชิ้น|กระปุก|คู่|กล่อง|แพ็ค|ซอง|ขวด|กระสอบ)\s*/i, "");
  value = value.replace(/^(หนึ่ง|สอง|สาม)\s*(ถัง|ชิ้น|กระปุก|คู่|กล่อง|แพ็ค|ซอง|ขวด|กระสอบ)\s*/i, "");
  value = value.replace(/^(เอา|รับ|สั่ง|ขอ|เลือก)\s*\d+\s*(ถัง|ชิ้น|กระปุก|คู่|กล่อง|แพ็ค|ซอง|ขวด|กระสอบ)\s*/i, "");
  value = value.replace(/\bโปร\s*\d+\b/gi, "");

  return normalizeWhitespace(value);
}

function cleanupThaiAddressNoise(text: string): string {
  return normalizeCustomerRawText(text)
    .replace(/\b(ชื่อผู้รับ|ชื่อ|เบอร์โทร|เบอร์|โทร|ที่อยู่)\b\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function removeCommonOrderWords(text: string): string {
  let value = text || "";

  value = value.replace(/_/g, " ");
  value = value.replace(/\s+/g, " ").trim();

  // ตัดคำสั่งซื้อทั่วไป
  value = value.replace(/^(เอา|รับ|สั่ง|ขอ|เลือก|เปลี่ยนเป็น|เปลี่ยน)\s*/i, "");

  // ตัดรูปแบบจำนวน + หน่วย
  value = value.replace(/^\d+\s*(ถัง|ชิ้น|กระปุก|คู่|กล่อง|แพ็ค|ซอง|ขวด|กระสอบ)\s*/i, "");
  value = value.replace(/^(หนึ่ง|สอง|สาม)\s*(ถัง|ชิ้น|กระปุก|คู่|กล่อง|แพ็ค|ซอง|ขวด|กระสอบ)\s*/i, "");

  // ตัดคำว่าโปรด้านหน้า
  value = value.replace(/^โปร\s*/i, "");

  // กันซ้ำอีกรอบถ้ามาเป็น "เอา 2 ถัง ..."
  value = value.replace(/^(เอา|รับ|สั่ง|ขอ|เลือก)\s*\d+\s*(ถัง|ชิ้น|กระปุก|คู่|กล่อง|แพ็ค|ซอง|ขวด|กระสอบ)\s*/i, "");

  return normalizeWhitespace(value);
}

function cleanPossibleNameLine(line: string): string {
  let value = normalizeCustomerRawText(line);

  value = value.replace(/^ชื่อผู้รับ[:\s]*/i, "");
  value = value.replace(/^ชื่อ[:\s]*/i, "");
  value = value.replace(/(?:\+66|66|0)\d{8,9}/g, " ");

  value = removeCommonOrderWords(value);
  value = stripOfferNoise(value);

  const addressIndex = value.search(
    /(บ้านเลขที่|เลขที่|\b\d{1,4}\/\d{1,4}\b|\b\d{1,4}\b\s*(หมู่|ม\s*\d+|ม\.|ซอย|ถนน|ต\.|ตำบล|อ\.|อำเภอ|จ\.|จังหวัด|แขวง|เขต|อาคาร)|หมู่|ม\s*\d+|ม\.|ซอย|ถนน|ต\.|ตำบล|อ\.|อำเภอ|จ\.|จังหวัด|แขวง|เขต|อาคาร|\b\d{5}\b|กรุงเทพ|กทม|วัฒนานคร|สระแก้ว)/i
  );

  if (addressIndex > 0) {
    value = value.slice(0, addressIndex);
  }

  value = value.replace(/[,:;|/\\]+/g, " ");
  value = value.replace(/\b\d+\b/g, " ");
  value = normalizeWhitespace(value);

  return value;
}

function looksLikeNameValue(text: string): boolean {
  const value = normalizeWhitespace(text);
  if (!value) return false;
  if (value.length < 2) return false;
  if (looksLikeAddress(value)) return false;
  if (looksLikePhone(value)) return false;
  if (isLowConfidenceName(value)) return false;

  const blacklist = [
    "เอาโปร",
    "วิธีใช้",
    "ราคา",
    "สนใจ",
    "ส่งฟรี",
    "ค่าส่ง",
    "สรุปยอด",
    "เก็บปลายทาง",
    "โปรโมชั่น",
    "โปรโมชัน",
    "เปลี่ยนเป็น",
    "เอา 1 ถัง",
    "เอา 2 ถัง",
    "เอา 3 ถัง",
    "รับ 1 ถัง",
    "รับ 2 ถัง",
    "รับ 3 ถัง",
    "1 ถัง",
    "2 ถัง",
    "3 ถัง",
  ];

  const lower = value.toLowerCase();
  if (blacklist.some((word) => lower.includes(word))) return false;

  return true;
}

function extractName(text: string): string {
  const normalized = normalizeCustomerRawText(text);
  const lines = splitLines(normalized);

  const allCandidates = [
    ...lines,
    normalized,
  ]
    .map((line) => {
      let value = normalizeWhitespace(line);

      // ตัดเบอร์ออกก่อน
      value = value.replace(/(?:\+66|66|0)\d{8,9}/g, " ");

      // เอาแค่ส่วนก่อน address token
      const addressIndex = value.search(
        /(บ้านเลขที่|เลขที่|\b\d{1,4}\b\s*(หมู่|ม\s*\d+|ม\.|ซอย|ถนน|ต\.|ตำบล|อ\.|อำเภอ|จ\.|จังหวัด|แขวง|เขต|อาคาร)|หมู่|ม\s*\d+|ม\.|ซอย|ถนน|ต\.|ตำบล|อ\.|อำเภอ|จ\.|จังหวัด|แขวง|เขต|อาคาร|\b\d{5}\b|กรุงเทพ|กทม|วัฒนานคร|สระแก้ว)/i
      );

      if (addressIndex > 0) {
        value = value.slice(0, addressIndex);
      }

      value = removeCommonOrderWords(value);
      value = stripOfferNoise(value);

      value = value.replace(
        /^(ชื่อใหม่|แก้ชื่อ|เปลี่ยนชื่อ|ชื่อผู้รับใหม่|ผู้รับใหม่|ชื่อผู้รับ|ชื่อ)\s*/i,
        ""
      );
      value = value.replace(
        /^(เบอร์ใหม่|เบอร์โทรใหม่|โทรใหม่|แก้เบอร์|เปลี่ยนเบอร์|เปลี่ยนเบอร์โทร|แก้เบอร์โทร|เบอร์|เบอร์โทร|โทร)\s*/i,
        ""
      );
      value = value.replace(
        /^(ที่อยู่ใหม่|แก้ที่อยู่|เปลี่ยนที่อยู่|ส่งที่นี่|ที่อยู่)\s*/i,
        ""
      );

      value = value.replace(/[,:;|/\\]+/g, " ");
      value = value.replace(/\b\d+\b/g, " ");
      value = normalizeWhitespace(value);

      return value;
    })
    .filter(Boolean);

  let bestName = "";
  let bestScore = 0;

  for (const candidate of allCandidates) {
    const score = scoreNameCandidate(candidate);
    if (score > bestScore) {
      bestScore = score;
      bestName = candidate;
    }
  }

  return bestScore > 0 ? bestName : "";
}

function extractCustomerInfoFromText(text: string): ExtractedCustomerInfo {
  const normalized = cleanupThaiAddressNoise(normalizeCustomerRawText(text));
  let name = extractName(normalized);
  const phone = extractPhone(normalized);
  const address = extractAddress(normalized);

  // กันชื่อมั่วจาก address / phone / คำขยะ
  if (
    looksLikeAddress(name) ||
    looksLikePhone(name) ||
    isLowConfidenceName(name)
  ) {
    name = "";
  }

  return {
    name,
    phone,
    address,
    facebookName: "",
  };
}

function detectConversationState(messages: Array<{ role: string; text: string }>): ConversationState {
  const joined = messages
    .map((item) => `${item.role}:${item.text}`)
    .join("\n")
    .toLowerCase();

  if (
    joined.includes("สรุปคำสั่งซื้อค่ะ") ||
    joined.includes("สรุปคำสั่งซื้อคะ") ||
    joined.includes("น้องสรุปออเดอร์ให้เรียบร้อยแล้วค่ะ") ||
    joined.includes("น้องสรุปออเดอร์ให้เรียบร้อยแล้วคะ")
  ) {
    return "order_summarized";
  }

  if (
    joined.includes("ส่งชื่อ") ||
    joined.includes("ส่งที่อยู่") ||
    joined.includes("ส่งเบอร์") ||
    joined.includes("ขอชื่อผู้รับ") ||
    joined.includes("ขอเบอร์โทร") ||
    joined.includes("ขอที่อยู่")
  ) {
    return "awaiting_customer_info";
  }

  return "idle";
}

function isShortFollowupAfterSummary(message: string): boolean {
  const text = normalizeWhitespace((message || "").toLowerCase());

  if (!text) return true;

  const shortReplies = [
    "ครับ",
    "ค่ะ",
    "คะ",
    "โอเค",
    "ok",
    "ได้",
    "ได้ครับ",
    "ได้ค่ะ",
    "ขอบคุณ",
    "ขอบคุณครับ",
    "ขอบคุณค่ะ",
    "รับทราบ",
    "รับทราบครับ",
    "รับทราบค่ะ",
    "จ้า",
    "จ้าา",
    "โอเคครับ",
    "โอเคค่ะ",
  ];

  if (shortReplies.includes(text)) return true;

  const onlyPhone = normalizePhone(text);
  if (onlyPhone) return true;

  if (looksLikeAddress(text) && text.length < 80) return true;

  return false;
}

function isConfirmationIntent(message: string): boolean {
  const text = normalizeWhitespace((message || "").toLowerCase());

  if (!text) return false;

  const exactMatches = [
    "ยืนยัน",
    "โอเค",
    "ok",
    "okay",
    "ตกลง",
    "ได้",
    "ได้เลย",
    "ได้ค่ะ",
    "ได้ครับ",
    "ใช่",
    "ใช่ค่ะ",
    "ใช่ครับ",
    "ถูก",
    "ถูกต้อง",
    "ถูกต้องค่ะ",
    "ถูกต้องครับ",
    "ถูกหมด",
    "ครบถ้วน",
    "ครบแล้ว",
    "โอเคค่ะ",
    "โอเคครับ",
    "ok ค่ะ",
    "ok ครับ",
    "เยี่ยม",
    "เรียบร้อย",
    "ตามนี้",
    "ตามนั้น",
    "เอาตามนี้",
    "ถูกแล้ว",
    "ชัวร์",
    "แน่นอน",
  ];

  if (exactMatches.includes(text)) return true;

  const partialMatches = [
    "ถูกต้อง",
    "โอเค",
    "ยืนยัน",
    "ใช่",
    "ตามนี้",
    "ตามนั้น",
    "ครบถ้วน",
    "ถูกแล้ว",
  ];

  return partialMatches.some((word) => text.includes(word));
}

function mergeAddressParts(baseAddress: string, incomingAddress: string): string {
  const base = normalizeWhitespace(baseAddress || "");
  const incoming = normalizeWhitespace(incomingAddress || "");

  if (!base) return incoming;
  if (!incoming) return base;
  if (base === incoming) return base;

  const merged = normalizeWhitespace(`${base} ${incoming}`);
  const parts = merged.split(" ").filter(Boolean);

  const uniqueParts: string[] = [];
  for (const part of parts) {
    if (!uniqueParts.includes(part)) {
      uniqueParts.push(part);
    }
  }

  return uniqueParts.join(" ");
}

function mergeCustomerInfo(
  base: ExtractedCustomerInfo,
  incoming: ExtractedCustomerInfo
): ExtractedCustomerInfo {
  const baseNameScore = scoreNameCandidate(base.name);
  const incomingNameScore = scoreNameCandidate(incoming.name);

  return {
    name:
      incomingNameScore > baseNameScore
        ? incoming.name
        : incoming.name || base.name,
    phone: incoming.phone || base.phone,
    address: mergeAddressParts(base.address, incoming.address),
    facebookName: incoming.facebookName || base.facebookName,
  };
}

function extractCustomerInfoFromHistory(
  messages: Array<{ role: string; text: string }>,
  latestMessage: string
): ExtractedCustomerInfo {
  let customerInfo: ExtractedCustomerInfo = {
    name: "",
    phone: "",
    address: "",
    facebookName: "",
  }

  for (const msg of messages) {
    if (msg.role !== "user") continue;

    const extracted = extractCustomerInfoFromText(msg.text);
    customerInfo = mergeCustomerInfo(customerInfo, extracted);
  }

  const latestExtracted = extractCustomerInfoFromText(latestMessage);
  customerInfo = mergeCustomerInfo(customerInfo, latestExtracted);

  return customerInfo;
}

function extractCustomerInfoFromBotImageConfirmation(
  history: ChatHistoryItem[]
): ExtractedCustomerInfo {
  const recentBotText = history
    .filter((item) => item.role === "bot")
    .slice(-6)
    .map((item) => item.text)
    .reverse()
    .find(
      (text) =>
        text.includes("น้องสรุปข้อมูลจากรูปให้ก่อนนะคะ") ||
        text.includes("น้องรับข้อมูลจากรูปไว้แล้วนะคะ")
    );

  if (!recentBotText) {
    return {
      name: "",
      phone: "",
      address: "",
      facebookName: "",
    };
  }

  const lines = recentBotText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let name = "";
  let phone = "";
  let address = "";

  for (const line of lines) {
    if (line.startsWith("ชื่อ:")) {
      name = line.replace("ชื่อ:", "").trim();
      continue;
    }

    if (line.startsWith("เบอร์โทร:")) {
      phone = line.replace("เบอร์โทร:", "").trim();
      continue;
    }

    if (line.startsWith("ที่อยู่:")) {
      address = line.replace("ที่อยู่:", "").trim();
      continue;
    }
  }

  return {
    name,
    phone,
    address,
    facebookName: "",
  };
}

function containsCustomerInfo(message: string): boolean {
  const extracted = extractCustomerInfoFromText(message);

  const hasReliableName = isReliableImageName(extracted.name || "");
  const hasPhone = Boolean(extracted.phone);
  const hasAddress = Boolean(extracted.address);

  return Boolean(hasReliableName || hasPhone || hasAddress);
}

function detectEditIntent(message: string): {
  isEdit: boolean;
  type: "offer" | "phone" | "address" | "name" | null;
} {
  const lower = message.toLowerCase().trim();

  // เคสเปลี่ยนโปร เช่น "เปลี่ยนเป็น 2 ถัง", "เอา 2 ถัง", "ขอ 3 ชิ้น"
  if (
    /(เปลี่ยน|แก้|เอาใหม่|เอา|ขอรับ|รับ)\s*(เป็น)?\s*\d+\s*(ถัง|ชิ้น|กระปุก|คู่)/.test(lower) ||
    /\d+\s*(ถัง|ชิ้น|กระปุก|คู่)/.test(lower)
  ) {
    return { isEdit: true, type: "offer" };
  }

  // เคสแก้เบอร์ เช่น "เบอร์ใหม่ 099...", "แก้เบอร์ 099...", "โทรใหม่ ..."
  if (
    /(เบอร์ใหม่|เบอร์โทรใหม่|โทรใหม่|แก้เบอร์|เปลี่ยนเบอร์|เปลี่ยนเบอร์โทร|แก้เบอร์โทร|เบอร์|เบอร์โทร|โทร)\s*[:：]?\s*(\+66|66|0)\d{8,9}/.test(lower)
  ) {
    return { isEdit: true, type: "phone" };
  }

  // เคสแก้ที่อยู่ เช่น "ที่อยู่ใหม่ ...", "แก้ที่อยู่ ...", "ส่งที่นี่ ..."
  if (
    /(ที่อยู่ใหม่|แก้ที่อยู่|เปลี่ยนที่อยู่|ส่งที่นี่|ที่อยู่)\s*[:：]?/.test(lower) &&
    /(หมู่|ม\.|ซอย|ถนน|ต\.|ตำบล|อ\.|อำเภอ|จ\.|จังหวัด|แขวง|เขต|\d{5}|กรุงเทพ|กทม)/.test(lower)
  ) {
    return { isEdit: true, type: "address" };
  }

  // เคสแก้ชื่อ เช่น "ชื่อใหม่ สมชาย", "แก้ชื่อเป็น ..."
  if (
    /(ชื่อใหม่|แก้ชื่อ|เปลี่ยนชื่อ|ชื่อผู้รับใหม่|ผู้รับใหม่|ชื่อผู้รับ)\s*[:：]?/.test(lower)
  ) {
    return { isEdit: true, type: "name" };
  }

  // fallback กว้าง ๆ
  if (/(เปลี่ยน|แก้|เอาใหม่)/.test(lower)) {
    if (/(เบอร์|โทร)/.test(lower)) {
      return { isEdit: true, type: "phone" };
    }
    if (/(ที่อยู่|หมู่|ต\.|อ\.|จ\.|\d{5})/.test(lower)) {
      return { isEdit: true, type: "address" };
    }
    if (/(ชื่อ)/.test(lower)) {
      return { isEdit: true, type: "name" };
    }
    if (/(ถัง|ชิ้น|กระปุก|คู่|\d+)/.test(lower)) {
      return { isEdit: true, type: "offer" };
    }
    return { isEdit: true, type: null };
  }

  return { isEdit: false, type: null };
}

function hasCompleteCustomerInfo(
  info: ExtractedCustomerInfo,
  options?: { allowFacebookName?: boolean }
): boolean {
  const realName = normalizeWhitespace(info.name || "");
  const facebookName = normalizeWhitespace(info.facebookName || "");
  const phone = normalizePhone(info.phone || "");
  const address = normalizeWhitespace(info.address || "");

  const hasRealName = Boolean(realName && !isLowConfidenceName(realName));
  const hasFallbackFacebookName = Boolean(
    options?.allowFacebookName &&
    facebookName &&
    !isLowConfidenceName(facebookName)
  );

  const hasAnyUsableName = hasRealName || hasFallbackFacebookName;
  const hasValidPhone = Boolean(phone);
  const hasStrongAddress = isStrongThaiAddress(address);

  return Boolean(hasAnyUsableName && hasValidPhone && hasStrongAddress);
}

function getMissingCustomerFields(info: ExtractedCustomerInfo): string[] {
  const missing: string[] = [];

  const realName = normalizeWhitespace(info.name || "");
  const facebookName = normalizeWhitespace(info.facebookName || "");
  const phone = normalizePhone(info.phone || "");
  const address = normalizeWhitespace(info.address || "");

  const hasUsableName =
    Boolean(realName && !isLowConfidenceName(realName)) ||
    Boolean(facebookName && !isLowConfidenceName(facebookName));

  if (!hasUsableName) missing.push("name");
  if (!phone) missing.push("phone");
  if (!isStrongThaiAddress(address)) missing.push("address");

  return missing;
}

function stripEditPrefixByType(
  message: string,
  type: "offer" | "phone" | "address" | "name" | null
): string {
  let value = normalizeCustomerRawText(message || "");

  if (type === "phone") {
    value = value.replace(
      /^(เบอร์ใหม่|เบอร์โทรใหม่|โทรใหม่|แก้เบอร์|เปลี่ยนเบอร์|เปลี่ยนเบอร์โทร|แก้เบอร์โทร|เบอร์|เบอร์โทร|โทร)\s*[:：]?\s*/i,
      ""
    );
  }

  if (type === "address") {
    value = value.replace(
      /^(ที่อยู่ใหม่|แก้ที่อยู่|เปลี่ยนที่อยู่|ส่งที่นี่|ที่อยู่)\s*[:：]?\s*/i,
      ""
    );
  }

  if (type === "name") {
    value = value.replace(
      /^(ชื่อใหม่|แก้ชื่อ|เปลี่ยนชื่อ|ชื่อผู้รับใหม่|ผู้รับใหม่|ชื่อผู้รับ|ชื่อ)\s*[:：]?\s*/i,
      ""
    );
  }

  return normalizeWhitespace(value);
}

function applyEditToCustomerInfo(
  base: ExtractedCustomerInfo,
  message: string,
  editIntent: { isEdit: boolean; type: "offer" | "phone" | "address" | "name" | null }
): ExtractedCustomerInfo {
  if (!editIntent.isEdit) return base;

  const cleanedMessage = stripEditPrefixByType(message, editIntent.type);

  if (editIntent.type === "phone") {
    const nextPhone = extractPhone(cleanedMessage);
    if (nextPhone) {
      return { ...base, phone: nextPhone };
    }
    return base;
  }

  if (editIntent.type === "address") {
    const nextAddress = extractAddress(cleanedMessage);
    if (nextAddress) {
      return { ...base, address: nextAddress };
    }
    return base;
  }

  if (editIntent.type === "name") {
    const nextName = extractName(cleanedMessage);
    if (nextName) {
      return { ...base, name: nextName };
    }
    return base;
  }

  return base;
}

function findSelectedOfferFromConversation(
  history: ChatHistoryItem[],
  currentMessage: string,
  offers: ProductOffer[]
): ProductOffer | null {
  const userTexts = [
    ...history.filter((item) => item.role === "user").map((item) => item.text),
    currentMessage,
  ];

  for (let i = userTexts.length - 1; i >= 0; i -= 1) {
    const matched = detectRequestedOffer(userTexts[i], offers);
    if (matched) return matched;
  }

  return null;
}


function hasBotAskedForCustomerInfo(history: ChatHistoryItem[]): boolean {
  const botTexts = history
    .filter((item) => item.role === "bot")
    .slice(-6)
    .map((item) => item.text.toLowerCase())
    .join("\n");

  return (
    botTexts.includes("ส่งชื่อ") ||
    botTexts.includes("ส่งชื่อ ที่อยู่ เบอร์") ||
    botTexts.includes("ขอชื่อ") ||
    botTexts.includes("ขอเบอร์") ||
    botTexts.includes("ขอที่อยู่") ||
    botTexts.includes("เบอร์โทร") ||
    botTexts.includes("ที่อยู่จัดส่ง") ||
    botTexts.includes("ชื่อผู้รับ")
  );
}

function hasBotRecentlyAskedForSameMissingFields(
  history: ChatHistoryItem[],
  missingFields: string[]
): boolean {
  const botTexts = history
    .filter((item) => item.role === "bot")
    .slice(-3)
    .map((item) => item.text.toLowerCase())
    .join("\n");

  const askPhone = missingFields.includes("phone");
  const askAddress = missingFields.includes("address");

  const phoneAlreadyAsked =
    !askPhone || botTexts.includes("เบอร์โทร");

  const addressAlreadyAsked =
    !askAddress || botTexts.includes("ที่อยู่");

  return phoneAlreadyAsked && addressAlreadyAsked;
}

function hasBotAskedToConfirmImageInfo(history: ChatHistoryItem[]): boolean {
  const botTexts = history
    .filter((item) => item.role === "bot")
    .slice(-4)
    .map((item) => item.text.toLowerCase())
    .join("\n");

  return (
    botTexts.includes("น้องสรุปข้อมูลจากรูปให้ก่อนนะคะ") ||
    botTexts.includes("ถ้าถูกต้อง") ||
    botTexts.includes("ถ้ามีจุดไหนไม่ถูก") ||
    botTexts.includes("แก้ชื่อ เบอร์ หรือที่อยู่ส่งมาได้เลย")
  );
}

function hasSummarizedOrderInHistory(history: ChatHistoryItem[]): boolean {
  const botTexts = history
    .filter((item) => item.role === "bot")
    .map((item) => item.text.toLowerCase())
    .join("\n");

  return (
    botTexts.includes("สรุปคำสั่งซื้อค่ะ") ||
    botTexts.includes("น้องสรุปออเดอร์ให้เรียบร้อยแล้วค่ะ")
  );
}

function hasSavedImageInfoInHistory(history: ChatHistoryItem[]): boolean {
  const botTexts = history
    .filter((item) => item.role === "bot")
    .map((item) => item.text.toLowerCase())
    .join("\n");

  return (
    botTexts.includes("น้องรับข้อมูลจากรูปไว้แล้วนะคะ") ||
    botTexts.includes("น้องสรุปข้อมูลจากรูปให้ก่อนนะคะ")
  );
}

function buildMissingFieldsText(info: ExtractedCustomerInfo): string[] {
  const missing: string[] = [];

  const realName = normalizeWhitespace(info.name || "");
  const facebookName = normalizeWhitespace(info.facebookName || "");
  const phone = normalizePhone(info.phone || "");
  const address = normalizeWhitespace(info.address || "");

  const hasUsableName =
    Boolean(realName && !isLowConfidenceName(realName)) ||
    Boolean(facebookName && !isLowConfidenceName(facebookName));

  if (!hasUsableName) {
    missing.push("ชื่อ");
  }

  if (!phone) {
    missing.push("เบอร์โทร");
  }

  if (!isStrongThaiAddress(address)) {
    missing.push("ที่อยู่");
  }

  return missing;
}

function buildAlreadySummarizedReply(): string {
  return "รับทราบค่ะ ออเดอร์นี้น้องสรุปไว้แล้วนะคะ 🎉 ถ้าต้องการแก้ชื่อ เบอร์ ที่อยู่ หรือเปลี่ยนโปร แจ้งน้องได้เลยค่ะ";
}

function buildNeedMoreInfoReply(params: {
  product: ProductItem;
  offer: ProductOffer;
  missingFields: string[];
}): string {
  const { product, offer, missingFields } = params;

  const labels = missingFields.map((field) => {
    if (field === "phone") return "เบอร์โทร";
    if (field === "address") return "ที่อยู่";
    if (field === "name") return "ชื่อผู้รับ";
    return field;
  });

  const askText =
    labels.length === 1
      ? `รบกวนส่ง${labels[0]}เพิ่มให้น้องหน่อยนะคะ`
      : `รบกวนส่ง${labels.join(" และ ")}เพิ่มให้น้องหน่อยนะคะ`;

  return [
    `${product.name}`,
    `รับเป็น ${offer.title} เรียบร้อยค่ะ`,
    offer.price ? `ยอดเก็บปลายทาง ${offer.price} บาท` : "",
    offer.note || "",
    `${askText} 😊`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildPromoReply(params: {
  product: ProductItem;
  offers: ProductOffer[];
  salesStrategy: SalesStrategy;
}): string {
  const { product, offers, salesStrategy } = params;

  const openingLine =
    salesStrategy.openingStyle?.trim() ||
    `สนใจ ${product.name} ใช่ไหมคะ`;

  const offerLines = offers
    .map((offer, index) => {
      const pricePart = offer.price ? `${offer.price} บาท` : "-";
      const notePart = offer.note ? ` (${offer.note})` : "";
      return `โปร ${index + 1}: ${offer.title} ${pricePart}${notePart}`;
    })
    .join("\n");

  return [
    openingLine,
    product.salesNote || product.description || "",
    "ตอนนี้มีโปรให้เลือกดังนี้ค่ะ",
    offerLines,
    salesStrategy.closingQuestionStyle ||
    "โปรกำลังหมดเร็วมากนะคะ 🔥 แจ้งได้เลยว่าเอาโปรไหนเดี๋ยวน้องล็อกของให้ทันทีค่ะ 😊"
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildFirstTouchReply(params: {
  product: ProductItem;
  offers: ProductOffer[];
  salesStrategy: SalesStrategy;
}): string {
  const { product, offers, salesStrategy } = params;

  const openingLine =
    salesStrategy.openingStyle?.trim() ||
    `สวัสดีค่ะ น้องส่งรายละเอียด ${product.name} ให้ดูก่อนนะคะ 😊`;

  const highlightText = splitLines(product.highlights || "").join("\n");
  const usageText = splitLines(product.usage || "").join("\n");

  const offerLines = offers
    .map((offer, index) => {
      const pricePart = offer.price ? `${offer.price} บาท` : "-";
      const notePart = offer.note ? ` (${offer.note})` : "";
      return `โปร ${index + 1}: ${offer.title} ${pricePart}${notePart}`;
    })
    .join("\n");

  return [
    openingLine,
    product.description ? `รายละเอียดสินค้า:\n${product.description}` : "",
    highlightText ? `จุดเด่น:\n${highlightText}` : "",
    usageText ? `วิธีใช้:\n${usageText}` : "",
    product.salesNote ? `คำอธิบายเพิ่มเติม:\n${product.salesNote}` : "",
    offers.length > 0 ? `โปรโมชั่นตอนนี้:\n${offerLines}` : "",
    salesStrategy.closingQuestionStyle ||
    "สนใจโปรไหน หรืออยากให้แนะโปรที่เหมาะกับการใช้งาน แจ้งน้องได้เลยนะคะ 💬",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildOfferSelectionAfterCustomerInfoReply(params: {
  product: ProductItem;
  offers: ProductOffer[];
  customerInfo: ExtractedCustomerInfo;
}): string {
  const { product, offers, customerInfo } = params;

  const infoLines = [
    customerInfo.name ? `ชื่อ: ${customerInfo.name}` : "",
    customerInfo.phone ? `เบอร์: ${customerInfo.phone}` : "",
    customerInfo.address ? `ที่อยู่: ${customerInfo.address}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const offerLines = offers
    .map((offer, index) => {
      const priceText = offer.price ? `${offer.price} บาท` : "-";
      const noteText = offer.note ? ` (${offer.note})` : "";
      return `โปร ${index + 1}: ${offer.title} ${priceText}${noteText}`;
    })
    .join("\n");

  return [
    "รับข้อมูลลูกค้าแล้วค่ะ",
    infoLines,
    `สำหรับสินค้า ${product.name} ตอนนี้มีโปรให้เลือกดังนี้ค่ะ`,
    offerLines,
    "แจ้งชื่อโปร หรือจำนวนที่ต้องการได้เลยนะคะ เดี๋ยวน้องสรุปให้ต่อทันทีค่ะ 😊",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildOfferSelectionReply(params: {
  product: ProductItem;
  offers: ProductOffer[];
  requestedQuantityText?: string;
}): string {
  const { product, offers, requestedQuantityText } = params;

  const offerLines = offers
    .map((offer, index) => {
      const priceText = offer.price ? `${offer.price} บาท` : "-";
      const noteText = offer.note ? ` (${offer.note})` : "";
      return `โปร ${index + 1}: ${offer.title} ${priceText}${noteText}`;
    })
    .join("\n");

  return [
    `ได้รับข้อมูลสำหรับ${product.name}${requestedQuantityText ? ` ${requestedQuantityText}` : ""}แล้วค่ะ`,
    `ตอนนี้มีหลายโปรให้เลือกนะคะ เลือกได้เลยค่ะ:`,
    offerLines,
    "แจ้งชื่อโปร หรือจำนวนที่ต้องการได้เลยนะคะ เดี๋ยวน้องจัดให้ต่อทันทีค่ะ 😊",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildImageInfoConfirmationReply(customerInfo: ExtractedCustomerInfo): string {
  const displayName = getDisplayCustomerName(customerInfo);
  const showFacebookName =
    customerInfo.facebookName &&
    customerInfo.facebookName.trim() &&
    customerInfo.facebookName.trim() !== displayName.trim();

  return [
    "น้องสรุปข้อมูลจากรูปให้ก่อนนะคะ",
    displayName ? `ชื่อ: ${displayName}` : "",
    showFacebookName ? `ชื่อ Facebook: ${customerInfo.facebookName}` : "",
    customerInfo.phone ? `เบอร์โทร: ${customerInfo.phone}` : "",
    customerInfo.address ? `ที่อยู่: ${customerInfo.address}` : "",
    "",
    "ถ้าถูกต้อง ตอบกลับได้เลยนะคะ เช่น ถูกต้อง / โอเค / ใช่ / ครบถ้วน ค่ะ",
    "ถ้ามีจุดไหนไม่ถูก แก้ชื่อ เบอร์ หรือที่อยู่ส่งมาได้เลยนะคะ 😊",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildImageInfoSavedReply(customerInfo: ExtractedCustomerInfo): string {
  const imageName = normalizeWhitespace(customerInfo.name || "");
  const facebookName = normalizeWhitespace(customerInfo.facebookName || "");

  const safeImageName = isReliableImageName(imageName)
    ? imageName
    : "";

  const displayName = safeImageName || facebookName || imageName;
  const showFacebookName =
    facebookName &&
    safeImageName &&
    facebookName !== safeImageName;

  return [
    "น้องรับข้อมูลจากรูปไว้แล้วนะคะ",
    displayName ? `ชื่อ: ${displayName}` : "",
    showFacebookName ? `ชื่อ Facebook: ${facebookName}` : "",
    customerInfo.phone ? `เบอร์โทร: ${customerInfo.phone}` : "",
    customerInfo.address ? `ที่อยู่: ${customerInfo.address}` : "",
    "",
    "แจ้งชื่อโปร หรือจำนวนที่ต้องการได้เลยนะคะ เดี๋ยวน้องสรุปให้ต่อทันทีค่ะ 😊",
  ]
    .filter(Boolean)
    .join("\n");
}

function getDisplayCustomerName(customerInfo: ExtractedCustomerInfo): string {
  const realName = normalizeWhitespace(customerInfo.name || "");
  const facebookName = normalizeWhitespace(customerInfo.facebookName || "");

  // 🔥 ถ้าชื่อมั่ว → ใช้ Facebook
  if (!realName || isLowConfidenceName(realName)) {
    if (facebookName) return facebookName;
  }

  return realName || facebookName || "";
}

function buildOrderSummaryText(params: {
  product: ProductItem;
  offer: ProductOffer;
  customerInfo: ExtractedCustomerInfo;
}): string {
  const { product, offer, customerInfo } = params;

  const displayName =
    getDisplayCustomerName(customerInfo) ||
    normalizeWhitespace(customerInfo.name || "") ||
    normalizeWhitespace(customerInfo.facebookName || "");

  const showFacebookName =
    customerInfo.facebookName &&
    customerInfo.facebookName.trim() &&
    customerInfo.facebookName.trim() !== displayName.trim();

  return [
    "สรุปคำสั่งซื้อค่ะ",
    displayName ? `ชื่อ: ${displayName}` : "",
    showFacebookName ? `ชื่อ Facebook: ${customerInfo.facebookName}` : "",
    customerInfo.phone ? `เบอร์โทร: ${customerInfo.phone}` : "",
    customerInfo.address ? `ที่อยู่: ${customerInfo.address}` : "",
    `สินค้า: ${product.name}`,
    `โปรที่เลือก: ${offer.title}`,
    offer.price ? `ยอดเก็บปลายทาง: ${offer.price} บาท` : "",
    offer.note ? `หมายเหตุ: ${offer.note}` : "",
    "น้องสรุปออเดอร์ให้เรียบร้อยแล้วค่ะ 🎉",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildOrderId(params: {
  product: ProductItem;
  customerInfo: ExtractedCustomerInfo;
}): string {
  const { product, customerInfo } = params;

  const skuPart = (product.sku || `P${product.id || 0}`)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);

  const phonePart = (customerInfo.phone || "NOPHONE").replace(/\D/g, "").slice(-4) || "0000";

  const addressPart = (customerInfo.address || "NOADDR")
    .replace(/\s+/g, "")
    .slice(0, 6)
    .toUpperCase();

  return `ORD-${skuPart}-${phonePart}-${addressPart}`;
}

function buildTelegramOrderMessage(params: {
  eventType: TelegramOrderEventType;
  orderId: string;
  product: ProductItem;
  offer: ProductOffer;
  customerInfo: ExtractedCustomerInfo;
  botName?: string;
  pageName?: string;
}): string {
  const { eventType, orderId, product, offer, customerInfo, botName, pageName } = params;

  const header =
    eventType === "NEW_ORDER" ? "🆕 NEW_ORDER" : "✏️ ORDER_UPDATED";

  const subtitle =
    eventType === "NEW_ORDER"
      ? "มีออเดอร์ใหม่เข้า"
      : "มีการแก้ไขออเดอร์เดิม";

  const displayName =
    getDisplayCustomerName(customerInfo) ||
    normalizeWhitespace(customerInfo.name || "") ||
    normalizeWhitespace(customerInfo.facebookName || "");
  const showFacebookName =
    customerInfo.facebookName &&
    customerInfo.facebookName.trim() &&
    customerInfo.facebookName.trim() !== displayName.trim();

  return [
    header,
    subtitle,
    `Order ID: ${orderId}`,
    botName ? `บอท: ${botName}` : "",
    pageName ? `เพจ: ${pageName}` : "",
    "--------------------",
    displayName ? `ชื่อผู้รับ: ${displayName}` : "",
    customerInfo.facebookName ? `ชื่อ Facebook: ${customerInfo.facebookName}` : "",
    customerInfo.phone ? `เบอร์โทร: ${customerInfo.phone}` : "",
    customerInfo.address ? `ที่อยู่: ${customerInfo.address}` : "",
    showFacebookName ? "หมายเหตุชื่อ: ใช้ชื่อผู้รับกับชื่อ Facebook คนละค่า" : "",
    "--------------------",
    `สินค้า: ${product.name}`,
    `โปร: ${offer.title}`,
    offer.price ? `ยอด: ${offer.price} บาท` : "",
    offer.note ? `หมายเหตุ: ${offer.note}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendTelegramMessage(params: {
  text: string;
  chatId?: string;
  botToken?: string;
  threadId?: string;
}): Promise<void> {
  const botToken = params.botToken || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = params.chatId || process.env.TELEGRAM_CHAT_ID;
  const threadId = params.threadId || process.env.TELEGRAM_THREAD_ID;

  if (!botToken || !chatId) {
    console.warn("Telegram config is missing", {
      hasBotToken: Boolean(botToken),
      hasChatId: Boolean(chatId),
      hasThreadId: Boolean(threadId),
    });
    return;
  }

  console.log("Sending Telegram message...", {
    chatId,
    threadId,
    preview: params.text.slice(0, 120),
  });

  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text: params.text,
  };

  if (threadId) {
    payload.message_thread_id = Number(threadId);
  }

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Telegram send failed: ${errorText}`);
  }
}

function buildImageReadInstruction(): string {
  return [
    "ลูกค้าแนบรูปชื่อที่อยู่หรือข้อมูลจัดส่งมาในแชท",
    "ให้ช่วยอ่านข้อความจากรูปอย่างระมัดระวัง",
    "ดึงเฉพาะข้อมูลที่มั่นใจเท่านั้น",
    "ให้เน้นหาเฉพาะ 3 อย่าง: ชื่อผู้รับ, เบอร์โทร, ที่อยู่",
    "ห้ามเดาโปรสินค้า ห้ามเดาจำนวนสินค้า ห้ามเดาโปรโมชั่นจากรูป",
    "ถ้ารูปไม่ชัด ลายมืออ่านยาก หรือข้อมูลไม่ครบ ให้ระบุว่าอ่านไม่ครบ",
    "ตอบสั้น กระชับ เป็นข้อความสำหรับระบบภายใน ไม่ต้องเขียนเหมือนคุยกับลูกค้า",
    "รูปแบบที่ต้องการ:",
    "ชื่อ: ...",
    "เบอร์โทร: ...",
    "ที่อยู่: ...",
    "สถานะ: ครบ / ไม่ครบ / อ่านไม่ชัด",
    "หมายเหตุ: ...",
  ].join('\n');
}

function buildImageParts(images: ChatImageInput[]) {
  return images.map((image) => ({
    inlineData: {
      mimeType: image.mimeType,
      data: image.dataBase64,
    },
  }));
}

function parseImageReadingResult(text: string): {
  name?: string;
  phone?: string;
  address?: string;
  unreadable: boolean;
  incomplete: boolean;
} {
  const normalized = text.trim();

  const unreadablePatterns = [
    "อ่านไม่ชัด",
    "อ่านไม่ครบ",
    "รูปไม่ชัด",
    "ข้อมูลไม่ครบ",
    "ไม่สามารถอ่าน",
    "มองไม่เห็น",
    "ไม่มั่นใจ",
    "สถานะ: ไม่ครบ",
    "สถานะ: อ่านไม่ชัด",
  ];

  const unreadable = unreadablePatterns.some((pattern) =>
    normalized.includes(pattern)
  );

  const phoneMatch = normalized.match(/0\d{8,9}/);
  const phone = phoneMatch ? phoneMatch[0] : "";

  let name = "";
  const nameMatch = normalized.match(/ชื่อ(?:ผู้รับ)?[:\s]+(.+)/);
  if (nameMatch?.[1]) {
    name = nameMatch[1].split("\n")[0].trim();
  }

  let address = "";
  const addressMatch = normalized.match(/ที่อยู่[:\s]+([\s\S]+)/);
  if (addressMatch?.[1]) {
    address = addressMatch[1]
      .split("\nสถานะ")[0]
      .split("\nหมายเหตุ")[0]
      .trim();
  }

  const incomplete = !phone || !address;

  return {
    name,
    phone,
    address,
    unreadable,
    incomplete,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const botId: string = body.botId || "";
    const message: string = body.message;
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const images: ChatImageInput[] = Array.isArray(body.images) ? body.images : [];
    const botRole: string = body.botRole || "";
    const botRules: string = body.botRules || "";
    const products: ProductItem[] = Array.isArray(body.products) ? body.products : [];
    const salesStrategy: SalesStrategy = body.salesStrategy || {
      openingStyle: "",
      showOffersInFirstReply: true,
      maxOffersInFirstReply: "2",
      closingQuestionStyle: "",
      toneStyle: "",
      enableUrgency: false,
      urgencyStyle: "",
    };
    const history: ChatHistoryItem[] = Array.isArray(body.history) ? body.history : [];
    const senderName: string = body.senderName || "";
    const chatbot = botId ? await getChatbotById(botId) : null;
    const effectiveTelegramBotToken =
      (chatbot as any)?.connectionConfig?.telegramBotToken ||
      process.env.TELEGRAM_BOT_TOKEN ||
      "";

    const effectiveTelegramChatId =
      (chatbot as any)?.connectionConfig?.telegramChatId ||
      process.env.TELEGRAM_CHAT_ID ||
      "";

    const effectiveTelegramThreadId =
      (chatbot as any)?.connectionConfig?.telegramThreadId ||
      process.env.TELEGRAM_THREAD_ID ||
      "";

    const effectiveBotRole =
      chatbot?.promptConfig?.roleDescription || botRole || "";

    const effectiveBotRules =
      chatbot?.promptConfig?.responseRules || botRules || "";

    const effectiveSalesStrategy: SalesStrategy =
      chatbot?.promptConfig
        ? {
          openingStyle: chatbot.promptConfig.openingStyle || "",
          showOffersInFirstReply: salesStrategy?.showOffersInFirstReply ?? true,
          maxOffersInFirstReply: salesStrategy?.maxOffersInFirstReply || "2",
          closingQuestionStyle: chatbot.promptConfig.closingQuestionStyle || "",
          toneStyle: chatbot.promptConfig.toneStyle || "",
          enableUrgency: salesStrategy?.enableUrgency ?? false,
          urgencyStyle: salesStrategy?.urgencyStyle || "",
        }
        : salesStrategy;

    const effectiveProducts: ProductItem[] = Array.isArray((chatbot as any)?.products)
      ? (chatbot as any).products
      : products;
    const hasImageInput = images.length > 0;

    const safeMessage = typeof message === "string" ? message.trim() : "";

    // 🔥 BLOCK: COD ONLY
    if (
      safeMessage.toLowerCase().includes("โอน") ||
      safeMessage.toLowerCase().includes("เลขบัญชี") ||
      safeMessage.toLowerCase().includes("พร้อมเพย์") ||
      safeMessage.toLowerCase().includes("บัญชี")
    ) {
      return NextResponse.json({
        reply: "ทางร้านมีบริการเก็บเงินปลายทาง (COD) เท่านั้นนะคะ 😊 ไม่มีรับโอนก่อนค่ะ",
        images: [],
      });
    }

    // 🔥 BLOCK: HUMAN HANDOFF (แจ้งแอดมิน)
    if (
      safeMessage.toLowerCase().includes("ด่า") ||
      safeMessage.toLowerCase().includes("โกง") ||
      safeMessage.toLowerCase().includes("ยังไม่ได้ของ") ||
      safeMessage.toLowerCase().includes("คืนเงิน") ||
      safeMessage.toLowerCase().includes("เคลม")
    ) {
      try {
        await sendTelegramMessage({
          text: [
            "🚨 HUMAN HANDOFF",
            `Bot ID: ${botId || "-"}`,
            `บอท: ${chatbot?.name || "-"}`,
            `เพจ: ${(chatbot as any)?.connectionConfig?.facebookPageName || chatbot?.pageName || "-"}`,
            `ลูกค้า: ${senderName || "-"}`,
            `ข้อความ: ${safeMessage}`,
          ].join("\n"),
          chatId: effectiveTelegramChatId,
          botToken: effectiveTelegramBotToken,
          threadId: effectiveTelegramThreadId,
        });

      } catch (e) {
        console.error("Telegram handoff error:", e);
      }

      return NextResponse.json({
        reply: "ขออนุญาตให้แอดมินเข้ามาดูแลต่อนะคะ 🙏",
        images: [],
      });
    }

    if (!safeMessage && !hasImageInput) {
      return NextResponse.json(
        { reply: "กรุณาส่งข้อความหรือรูปอย่างน้อย 1 อย่าง", images: [] },
        { status: 400 }
      );
    }

    if (safeMessage.toLowerCase() === "test telegram") {
      try {
        await sendTelegramMessage({
          text: "✅ Telegram test สำเร็จ",
          chatId: effectiveTelegramChatId,
          botToken: effectiveTelegramBotToken,
          threadId: effectiveTelegramThreadId,
        });
        return NextResponse.json({
          reply: "ส่ง Telegram test แล้ว",
          images: [],
        });
      } catch (error) {
        console.error("Telegram error:", error);
        return NextResponse.json({
          reply: "ส่ง Telegram test ไม่สำเร็จ ดู terminal เพิ่มนะ",
          images: [],
        });
      }
    }

    const lowerMessage = safeMessage.toLowerCase();
    const activeProducts = effectiveProducts.filter((product) => product.isActive);

    const rankedProducts = activeProducts
      .map((product) => ({
        product,
        score: matchProductScore(lowerMessage, product),
      }))
      .sort((a, b) => b.score - a.score);

    const topRankedProduct =
      rankedProducts.find((item) => item.score > 0)?.product || null;

    const selectedProduct =
      topRankedProduct ||
      (activeProducts.length === 1 ? activeProducts[0] : null);

    const activeOffers = selectedProduct
      ? (selectedProduct.offers || []).filter((offer) => offer.isActive)
      : [];

    const selectedFaq = selectedProduct
      ? matchFaqBlock(lowerMessage, selectedProduct.faqBlocks || [])
      : null;

    const selectedOfferFromConversation =
      activeOffers.length > 0
        ? findSelectedOfferFromConversation(history, safeMessage, activeOffers)
        : null;

    const quantityMatchedOffers =
      activeOffers.length > 0
        ? findOffersByRequestedQuantity(safeMessage, activeOffers)
        : [];

    const directRequestedOffer =
      activeOffers.length > 0
        ? detectRequestedOffer(safeMessage, activeOffers)
        : null;

    const editIntent = detectEditIntent(safeMessage);

    let finalOffer =
      directRequestedOffer ||
      selectedOfferFromConversation;

    if (!finalOffer && quantityMatchedOffers.length === 1) {
      finalOffer = quantityMatchedOffers[0];
    }

    if (!finalOffer && activeOffers.length === 1) {
      finalOffer = activeOffers[0];
    }

    const maxOffers = Math.max(
      1,
      Number.parseInt(effectiveSalesStrategy.maxOffersInFirstReply || "2", 10) || 2
    );

    const productImages = parseImageUrls(selectedProduct?.imagesText || "");
    const faqImages = parseImageUrls(selectedFaq?.imagesText || "");

    const botTextRecent = recentBotText(history);

    const unsentOffers = activeOffers.filter(
      (offer) => !botTextRecent.includes(offer.title.toLowerCase())
    );

    const offersForFirstReply =
      (unsentOffers.length > 0 ? unsentOffers : activeOffers).slice(0, maxOffers);

    const firstReplyImages = offersForFirstReply.flatMap((offer) =>
      parseImageUrls(offer.imagesText || "")

    );

    const firstImages = [
      ...productImages,
      ...firstReplyImages,
    ].slice(0, 5);
    const faqIntent = isFaqIntent(safeMessage) || selectedFaq !== null;
    const broadPriceIntent = isBroadPriceIntent(safeMessage);
    const explicitOfferSelection = isExplicitOfferSelection(safeMessage);

    if (
      !finalOffer &&
      activeOffers.length === 1 &&
      explicitOfferSelection
    ) {
      finalOffer = activeOffers[0];
    }

    const bareInterestMessage = isBareInterestMessage(safeMessage);

    const urgencyIntent = hasUrgencyIntent(safeMessage);
    const confirmationIntent = isConfirmationIntent(safeMessage);
    const conversationState = detectConversationState(messages);

    if (
      conversationState === "order_summarized" &&
      isShortFollowupAfterSummary(safeMessage) &&
      !editIntent.isEdit
    ) {
      return NextResponse.json({
        reply: "ขอบคุณมากค่ะ 🙏 เดี๋ยวน้องดำเนินการจัดส่งให้เรียบร้อยนะคะ",
        images: [],
      });
    }
    const customerInfoFromHistory = editIntent.isEdit
      ? extractCustomerInfoFromHistory(messages, "")
      : extractCustomerInfoFromHistory(messages, safeMessage);

    const customerInfoFromBotImageConfirmation =
      extractCustomerInfoFromBotImageConfirmation(history);

    const mergedCustomerBase = mergeCustomerInfo(
      customerInfoFromBotImageConfirmation,
      customerInfoFromHistory
    );

    const editedCustomerInfo = applyEditToCustomerInfo(
      mergedCustomerBase,
      message,
      editIntent
    );

    const finalCustomerInfo: ExtractedCustomerInfo = {
      ...editedCustomerInfo,
      name: editedCustomerInfo.name || "",
      phone: editedCustomerInfo.phone || "",
      address: editedCustomerInfo.address || "",
      facebookName: senderName || editedCustomerInfo.facebookName || "",
    };

    const hasCustomerData =
      finalCustomerInfo.name || finalCustomerInfo.phone || finalCustomerInfo.address;

    const hasAnyCustomerInfo = Boolean(
      finalCustomerInfo.name ||
      finalCustomerInfo.phone ||
      finalCustomerInfo.address
    );

    const hasCompleteInfo = hasCompleteCustomerInfo(finalCustomerInfo, {
      allowFacebookName: true,

    });
    const missingFields = getMissingCustomerFields(finalCustomerInfo);
    const botAskedForInfo = hasBotAskedForCustomerInfo(history);
    const hasSavedImageInfoBefore = hasSavedImageInfoInHistory(history);
    const botAskedToConfirmImageInfo = hasBotAskedToConfirmImageInfo(history);
    const hasSummarizedBefore = hasSummarizedOrderInHistory(history);
    const telegramEventType: TelegramOrderEventType = hasSummarizedBefore ? "ORDER_UPDATED" : "NEW_ORDER";

    if (
      hasSummarizedBefore &&
      isShortFollowupAfterSummary(message)
    ) {
      return NextResponse.json({
        reply: buildAlreadySummarizedReply(),
        images: [],
      });
    }

    if (
      hasSavedImageInfoBefore &&
      selectedProduct &&
      finalOffer &&
      !confirmationIntent &&
      !hasSummarizedBefore
    ) {
      const imageCustomerInfo = mergeCustomerInfo(
        extractCustomerInfoFromBotImageConfirmation(history),
        finalCustomerInfo
      );

      if (
        hasCompleteCustomerInfo(imageCustomerInfo, {
          allowFacebookName: true,
        })
      ) {
        const reply = buildOrderSummaryText({
          product: selectedProduct,
          offer: finalOffer,
          customerInfo: imageCustomerInfo,
        });

        const orderId = buildOrderId({
          product: selectedProduct,
          customerInfo: imageCustomerInfo,
        });

        const telegramMessage = buildTelegramOrderMessage({
          eventType: telegramEventType,
          orderId,
          product: selectedProduct,
          offer: finalOffer,
          customerInfo: imageCustomerInfo,
          botName: chatbot?.name || "",
          pageName:
            (chatbot as any)?.connectionConfig?.facebookPageName ||
            chatbot?.pageName ||
            "",
        });

        try {
          await sendTelegramMessage({
            text: telegramMessage,
            chatId: effectiveTelegramChatId,
            botToken: effectiveTelegramBotToken,
            threadId: effectiveTelegramThreadId,
          });
        } catch (error) {
          console.error("Telegram error:", error);
        }

        return NextResponse.json({
          reply,
          images: [],
        });
      }

      const missingLabels = getMissingCustomerFields(imageCustomerInfo)
        .map((field) => {
          if (field === "phone") return "เบอร์โทร";
          if (field === "address") return "ที่อยู่";
          if (field === "name") return "ชื่อ";
          return field;
        })
        .join(" และ ");

      return NextResponse.json({
        reply: `ยังขาด${missingLabels}อยู่ค่ะ รบกวนส่งเพิ่มให้น้องอีกนิดนะคะ 😊`,
        images: [],
      });
    }

    if (
      confirmationIntent &&
      botAskedToConfirmImageInfo &&
      selectedProduct &&
      finalOffer
    ) {
      const confirmedCustomerInfo = mergeCustomerInfo(
        extractCustomerInfoFromBotImageConfirmation(history),
        finalCustomerInfo
      );

      if (
        hasCompleteCustomerInfo(confirmedCustomerInfo, {
          allowFacebookName: true,
        })
      ) {
        const reply = buildOrderSummaryText({
          product: selectedProduct,
          offer: finalOffer,
          customerInfo: confirmedCustomerInfo,
        });

        const orderId = buildOrderId({
          product: selectedProduct,
          customerInfo: confirmedCustomerInfo,
        });

        const telegramMessage = buildTelegramOrderMessage({
          eventType: telegramEventType,
          orderId,
          product: selectedProduct,
          offer: finalOffer,
          customerInfo: confirmedCustomerInfo,
          botName: chatbot?.name || "",
          pageName:
            (chatbot as any)?.connectionConfig?.facebookPageName ||
            chatbot?.pageName ||
            "",
        });

        try {
          await sendTelegramMessage({
            text: telegramMessage,
            chatId: effectiveTelegramChatId,
            botToken: effectiveTelegramBotToken,
            threadId: effectiveTelegramThreadId,
          });
        } catch (error) {
          console.error("Telegram error:", error);
        }

        return NextResponse.json({
          reply,
          images: [],
        });
      }

      const missingLabels = getMissingCustomerFields(confirmedCustomerInfo)
        .map((field) => {
          if (field === "phone") return "เบอร์โทร";
          if (field === "address") return "ที่อยู่";
          return field;
        })
        .join(" และ ");

      return NextResponse.json({
        reply: `ยังขาด${missingLabels}อยู่ค่ะ รบกวนส่งเพิ่มให้น้องอีกนิดนะคะ 😊`,
        images: [],
      });
    }

    if (
      effectiveSalesStrategy.enableUrgency &&
      selectedProduct &&
      finalOffer &&
      urgencyIntent &&
      !hasCompleteInfo
    ) {
      const missingLabels = missingFields.map((field) => {
        if (field === "phone") return "เบอร์โทร";
        if (field === "address") return "ที่อยู่";
        if (field === "name") return "ชื่อ";
        return field;
      });

      const missingText =
        missingLabels.length === 1
          ? missingLabels[0]
          : missingLabels.join(" และ ");

      return NextResponse.json({
        reply: [
          `${selectedProduct.name}`,
          `รับเป็น ${finalOffer.title} ได้เลยค่ะ 🔥`,
          finalOffer.price ? `ยอดเก็บปลายทาง ${finalOffer.price} บาท` : "",
          finalOffer.note || "",
          effectiveSalesStrategy.urgencyStyle?.trim() ||
          `ถ้าสะดวก รบกวนส่ง${missingText}มาได้เลยนะคะ เดี๋ยวน้องรีบสรุปออเดอร์ให้ทันทีค่ะ 😊`,
        ]
          .filter(Boolean)
          .join("\n"),
        images: [],
      });
    }

    if (
      selectedProduct &&
      finalOffer &&
      hasCompleteInfo &&
      !hasSummarizedBefore
    ) {
      const reply = buildOrderSummaryText({
        product: selectedProduct,
        offer: finalOffer,
        customerInfo: finalCustomerInfo,
      });

      const orderId = buildOrderId({
        product: selectedProduct,
        customerInfo: finalCustomerInfo,
      });

      const telegramMessage = buildTelegramOrderMessage({
        eventType: telegramEventType,
        orderId,
        product: selectedProduct,
        offer: finalOffer,
        customerInfo: finalCustomerInfo,
      });

      try {
        await sendTelegramMessage({
          text: telegramMessage,
          chatId: effectiveTelegramChatId,
          botToken: effectiveTelegramBotToken,
          threadId: effectiveTelegramThreadId,
        });
      } catch (error) {
        console.error("Telegram error:", error);
      }

      return NextResponse.json({
        reply,
        images: [],
      });
    }

    if (
      selectedProduct &&
      finalOffer &&
      missingFields.length > 0 &&
      hasBotRecentlyAskedForSameMissingFields(history, missingFields)
    ) {
      return NextResponse.json({
        reply: "น้องรอข้อมูลที่ยังขาดอยู่นะคะ 😊 ส่งเพิ่มได้เลย เดี๋ยวน้องสรุปให้ต่อทันทีค่ะ",
        images: [],
      });
    }

    if (
      selectedProduct &&
      finalOffer &&
      missingFields.length > 0 &&
      !hasBotRecentlyAskedForSameMissingFields(history, missingFields)
    ) {
      return NextResponse.json({
        reply: buildNeedMoreInfoReply({
          product: selectedProduct,
          offer: finalOffer,
          missingFields,
        }),
        images: [],
      });
    }

    if (hasImageInput) {
      const imageInstruction = buildImageReadInstruction();
      const imageParts = buildImageParts(images);

      const imageReadResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: imageInstruction }, ...imageParts],
          },
        ],
      });

      const imageReadText =
        imageReadResponse?.text?.trim() || "อ่านข้อมูลจากรูปไม่สำเร็จ";

      const parsedImageData = parseImageReadingResult(imageReadText);

      const reliableImageName = isReliableImageName(parsedImageData.name || "");

      const mergedCustomerInfo: ExtractedCustomerInfo = {
        ...finalCustomerInfo,
        name: shouldUseImageNameFirst(finalCustomerInfo.name)
          ? (reliableImageName
            ? parsedImageData.name || ""
            : finalCustomerInfo.name || "")
          : finalCustomerInfo.name || (reliableImageName ? parsedImageData.name || "" : ""),
        phone: finalCustomerInfo.phone || parsedImageData.phone || "",
        address: finalCustomerInfo.address || parsedImageData.address || "",
        facebookName: finalCustomerInfo.facebookName || senderName || "",
      };

      const missingFromImage = getMissingCustomerFields(mergedCustomerInfo);

      if (parsedImageData.unreadable) {
        return NextResponse.json({
          reply:
            "รูปที่ส่งมายังอ่านไม่ค่อยชัดค่ะ รบกวนพิมพ์เบอร์โทรหรือที่อยู่ที่ไม่ชัดเพิ่มให้น้องอีกนิดนะคะ 😊",
          images: [],
        });
      }

      if (!finalOffer) {
        if (missingFromImage.length === 0) {
          return NextResponse.json({
            reply: buildImageInfoSavedReply(mergedCustomerInfo),
            images: [],
          });
        }

        return NextResponse.json({
          reply:
            "ได้รับข้อมูลจากรูปแล้วบางส่วนค่ะ ถ้ายังไม่ได้แจ้งโปร พิมพ์โปรที่ต้องการมาได้เลยนะคะ",
          images: [],
        });
      }

      if (missingFromImage.length > 0) {
        const missingLabels = missingFromImage
          .map((field) => {
            if (field === "phone") return "เบอร์โทร";
            if (field === "address") return "ที่อยู่";
            return field;
          })
          .join(" และ ");

        return NextResponse.json({
          reply: `รูปที่ส่งมายังขาด${missingLabels}หรืออ่านไม่ชัด รบกวนพิมพ์เพิ่มให้น้องอีกนิดนะคะ 😊`,
          images: [],
        });
      }

      return NextResponse.json({
        reply: buildImageInfoConfirmationReply(mergedCustomerInfo),
        images: [],
      });
    }

    if (
      conversationState === "order_summarized" &&
      isShortFollowupAfterSummary(message) &&
      !editIntent.isEdit
    ) {
      return NextResponse.json({
        reply: buildAlreadySummarizedReply(),
        images: [],
      });
    }

    // 1) ถ้าถาม FAQ ให้ตอบ block ก่อนเลย
    if (faqIntent && selectedFaq && selectedProduct) {
      const reply = [
        selectedProduct.name || "",
        selectedFaq.answer || "",
        salesStrategy.closingQuestionStyle ||
        "ถ้าต้องการ เดี๋ยวแนะนำต่อให้เหมาะกับหน้างานได้ค่ะ",
      ]
        .filter(Boolean)
        .join("\n\n");

      return NextResponse.json({
        reply,
        images: faqImages.length > 0 ? faqImages : productImages,
      });
    }

    // 2) ถ้ายังไม่ได้เลือกโปร แต่ลูกค้าทักแนวสนใจ/ราคา/ขอโปร -> ส่งโปรก่อนทันที
    if (
      selectedProduct &&
      salesStrategy.showOffersInFirstReply &&
      offersForFirstReply.length > 0 &&
      (broadPriceIntent || isInterestIntent(message)) &&
      !explicitOfferSelection
    ) {
      const safeSelectedProduct = selectedProduct;
    
      const reply = buildFirstTouchReply({
        product: safeSelectedProduct,
        offers: offersForFirstReply,
        salesStrategy,
      });
    
      const firstTouchImages = mergeUniqueImageUrls(
        productImages,
        firstReplyImages
      );
    
      return NextResponse.json({
        reply,
        images: firstTouchImages,
      });
    }

    // 3) ถ้าลูกค้าส่งชื่อ/เบอร์/ที่อยู่มาก่อน แต่ยังไม่ได้เลือกโปร -> ส่งโปรให้เลือก
    if (
      selectedProduct &&
      !finalOffer &&
      hasAnyCustomerInfo &&
      activeOffers.length > 1 &&
      !explicitOfferSelection
    ) {
      const reply = buildOfferSelectionAfterCustomerInfoReply({
        product: selectedProduct,
        offers: activeOffers,
        customerInfo: editedCustomerInfo,
      });

      return NextResponse.json({
        reply,
        images: [],
      });
    }

    if (
      selectedProduct &&
      finalOffer &&
      hasSavedImageInfoBefore &&
      botAskedToConfirmImageInfo &&
      !confirmationIntent
    ) {
      return NextResponse.json({
        reply: buildImageInfoConfirmationReply(finalCustomerInfo),
        images: [],
      });
    }

    if (
      selectedProduct &&
      finalOffer &&
      urgencyIntent &&
      !hasCompleteInfo
    ) {
      const missingLabels = missingFields.map((field) => {
        if (field === "phone") return "เบอร์โทร";
        if (field === "address") return "ที่อยู่";
        if (field === "name") return "ชื่อ";
        return field;
      });

      const missingText =
        missingLabels.length === 1
          ? missingLabels[0]
          : missingLabels.join(" และ ");

      return NextResponse.json({
        reply: [
          `${selectedProduct.name}`,
          `รับเป็น ${finalOffer.title} ได้เลยค่ะ 🔥`,
          finalOffer.price ? `ยอดเก็บปลายทาง ${finalOffer.price} บาท` : "",
          finalOffer.note || "",
          `ถ้าสะดวก รบกวนส่ง${missingText}มาได้เลยนะคะ เดี๋ยวน้องรีบสรุปออเดอร์ให้ทันทีค่ะ 😊`,
        ]
          .filter(Boolean)
          .join("\n"),
        images: [],
      });
    }

    // 4) ถ้าลูกค้าเลือกโปรแล้ว และข้อมูลครบ -> สรุปออเดอร์จบทันที
    if (selectedProduct && finalOffer && hasCompleteInfo) {
      const reply = buildOrderSummaryText({
        product: selectedProduct,
        offer: finalOffer,
        customerInfo: finalCustomerInfo,
      });

      const orderId = buildOrderId({
        product: selectedProduct,
        customerInfo: finalCustomerInfo,
      });

      const telegramMessage = buildTelegramOrderMessage({
        eventType: telegramEventType,
        orderId,
        product: selectedProduct,
        offer: finalOffer,
        customerInfo: finalCustomerInfo,
      });

      try {
        await sendTelegramMessage({
          text: telegramMessage,
          chatId: effectiveTelegramChatId,
          botToken: effectiveTelegramBotToken,
          threadId: effectiveTelegramThreadId,
        });
      } catch (error) {
        console.error("Telegram error:", error);
      }

      return NextResponse.json({
        reply,
        images: [],
      });
    }

    // 5) ถ้าลูกค้าเลือกโปรแล้ว แต่ข้อมูลยังไม่ครบ -> ถามเฉพาะที่ขาด
    if (selectedProduct && finalOffer && !hasCompleteInfo) {
      if (
        hasBotRecentlyAskedForSameMissingFields(history, missingFields) &&
        !containsCustomerInfo(message) &&
        !editIntent.isEdit
      ) {
        return NextResponse.json({
          reply: "น้องรอข้อมูลที่ขาดอยู่นะคะ 😊",
          images: [],
        });
      }

      if (
        hasBotRecentlyAskedForSameMissingFields(history, missingFields) &&
        !containsCustomerInfo(message) &&
        !editIntent.isEdit
      ) {
        return NextResponse.json({
          reply: "น้องรอข้อมูลที่ขาดอยู่นะคะ 😊",
          images: [],
        });
      }

      const reply = buildNeedMoreInfoReply({
        product: selectedProduct,
        offer: finalOffer,
        missingFields,
      });

      return NextResponse.json({
        reply,
        images: [],
      });
    }

    // 6) ถ้าพิมพ์คลุมเครือแต่เหมือนกำลังเลือกโปรหลายตัว -> ให้เลือกโปรก่อน
    if (
      selectedProduct &&
      !finalOffer &&
      activeOffers.length > 1 &&
      explicitOfferSelection
    ) {
      const requestedQuantity = detectRequestedQuantity(message);
      const requestedQuantityText =
        requestedQuantity ? `${requestedQuantity}` : "";

      const reply = buildOfferSelectionReply({
        product: selectedProduct,
        offers:
          quantityMatchedOffers.length > 0 ? quantityMatchedOffers : activeOffers,
        requestedQuantityText,
      });

      return NextResponse.json({
        reply,
        images: [],
      });
    }

    if (
      selectedProduct &&
      !finalOffer &&
      hasCustomerData &&
      quantityMatchedOffers.length > 1 &&
      explicitOfferSelection
    ) {
      const requestedQuantity = detectRequestedQuantity(message);
      const requestedQuantityText =
        requestedQuantity ? `${requestedQuantity}` : "";

      const reply = buildOfferSelectionReply({
        product: selectedProduct,
        offers: quantityMatchedOffers,
        requestedQuantityText,
      });

      return NextResponse.json({
        reply,
        images: [],
      });
    }

    if (
      selectedProduct &&
      !finalOffer &&
      hasCustomerData &&
      quantityMatchedOffers.length === 0 &&
      activeOffers.length > 1 &&
      explicitOfferSelection
    ) {
      const reply = buildOfferSelectionReply({
        product: selectedProduct,
        offers: activeOffers,
      });

      return NextResponse.json({
        reply,
        images: [],
      });
    }

    const hasPendingOrderContext =
      Boolean(selectedProduct || selectedOfferFromConversation || finalOffer);

    const firstCustomerMessage = isFirstCustomerMessage(history);

    const shouldNotShowOffersAgain =
      hasAnyCustomerInfo ||
      conversationState === "awaiting_customer_info" ||
      conversationState === "order_summarized" ||
      explicitOfferSelection;

    if (
      selectedProduct &&
      firstCustomerMessage &&
      salesStrategy.showOffersInFirstReply &&
      offersForFirstReply.length > 0 &&
      !hasRecentlySentPromoBlock(history) &&
      !finalOffer &&
      !shouldNotShowOffersAgain &&
      !hasCustomerData &&
      !hasBotAskedForCustomerInfo(history) &&
      !containsCustomerInfo(message) &&
      (
        broadPriceIntent ||
        (isInterestIntent(message) && !bareInterestMessage)
      )
    ) {

      const promoContext = [
        `บทบาทบอท: ${effectiveBotRole || "คุณคือแอดมินขายของออนไลน์"}`,
        `กฎการตอบ: ${effectiveBotRules || "ตอบเหมือนแอดมินขายจริง สุภาพ เป็นกันเอง ปิดการขายแบบธรรมชาติ"}`,
        `น้ำเสียง: ${effectiveSalesStrategy.toneStyle || "สุภาพ เป็นกันเอง แบบคนขายจริง"}`,
        `สไตล์เปิดบทสนทนา: ใช้เป็นแนวทางภายในเท่านั้น อย่าพูดข้อความคำสั่งนี้ตรง ๆ กับลูกค้า`,
        effectiveSalesStrategy.openingStyle
          ? `แนวทางเปิดบทสนทนา (สรุปความแล้วเอาไปใช้ ไม่ต้องคัดลอก): ${effectiveSalesStrategy.openingStyle}`
          : "",

        `สไตล์ปิดท้าย: ใช้เป็นแนวทางภายในเท่านั้น อย่าพูดข้อความคำสั่งนี้ตรง ๆ กับลูกค้า`,
        effectiveSalesStrategy.closingQuestionStyle
          ? `แนวทางปิดท้าย (สรุปความแล้วเอาไปใช้ ไม่ต้องคัดลอก): ${effectiveSalesStrategy.closingQuestionStyle}`
          : "",
        `ลูกค้าพิมพ์ว่า: ${safeMessage}`,
        "",
        `สินค้า: ${selectedProduct.name}`,
        selectedProduct.salesNote ? `ข้อความขายสั้น: ${selectedProduct.salesNote}` : "",
        selectedProduct.description ? `รายละเอียด: ${selectedProduct.description}` : "",
        selectedProduct.highlights ? `จุดเด่น: ${selectedProduct.highlights}` : "",
        "",
        "โปรโมชั่นที่มี:",
        ...offersForFirstReply.map((offer, index) => {
          return [
            `โปร ${index + 1}`,
            `ชื่อโปร: ${offer.title}`,
            offer.price ? `ราคา: ${offer.price} บาท` : "",
            offer.note ? `หมายเหตุ: ${offer.note}` : "",
          ]
            .filter(Boolean)
            .join(" | ");
        }),
        "",
        "คำสั่งสำคัญ:",
        "- เขียนคำตอบให้เหมือนแอดมินขายของจริงในแชท",
        "- ภาษาต้องลื่น อ่านแล้วเป็นคนตอบ ไม่ใช่ระบบ",
        "- ใช้อีโมจิได้พอดี ๆ ให้ดูขายเก่ง แต่ไม่เยอะเกิน",
        "- ชูจุดเด่นสินค้าแบบกระชับ",
        `- สรุปจำนวนโปรตามข้อมูลที่มีจริง แต่ไม่เกิน ${maxOffers} โปร`,
        "- ปิดท้ายด้วยคำถามชวนเลือกซื้อสั้น ๆ",
        "- ห้ามตอบแข็ง ห้ามตอบเป็นภาษาระบบ",
        "- ห้ามคัดลอกข้อความจากแนวเปิดบทสนทนา แนวปิดท้าย หรือกฎการตอบออกมาตรง ๆ",
      ]
        .filter(Boolean)
        .join("\n");

      const promoAiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promoContext,
      });

      const reply =
        promoAiResponse?.text?.trim() ||
        buildPromoReply({
          product: selectedProduct,
          offers: offersForFirstReply,
          salesStrategy: effectiveSalesStrategy,
        });

      return NextResponse.json({
        reply,
        images: firstReplyImages.length > 0 ? firstReplyImages : productImages,
      });
    }

    if (selectedProduct) {
      const prompt = `
    บทบาทของบอท:
    ${effectiveBotRole || "คุณคือแอดมินฝ่ายขายของร้านค้าออนไลน์ ตอบสุภาพ เป็นกันเอง และช่วยปิดการขาย"}
    
    กฎการตอบ:
    ${effectiveBotRules || "ห้ามเดา ถ้าไม่มีข้อมูลให้ตอบสุภาพและขอข้อมูลเฉพาะที่ขาด"}
    
    กลยุทธ์การขาย:
    แนวเปิดบทสนทนา: ${effectiveSalesStrategy.openingStyle || "-"}
    น้ำเสียง: ${effectiveSalesStrategy.toneStyle || "-"}
    ให้โชว์หลายโปรในข้อความแรก: ${effectiveSalesStrategy.showOffersInFirstReply ? "ใช่" : "ไม่ใช่"}
    จำนวนโปรสูงสุดในข้อความแรก: ${effectiveSalesStrategy.maxOffersInFirstReply || "2"}
    แนวปิดท้าย: ${effectiveSalesStrategy.closingQuestionStyle || "-"}

บริบทแชทก่อนหน้า:
${historyToText(history) || "-"}

สินค้าที่เกี่ยวข้อง:
ชื่อสินค้า: ${selectedProduct.name || "-"}
SKU: ${selectedProduct.sku || "-"}
คีย์เวิร์ด: ${selectedProduct.keywords || "-"}
รายละเอียด: ${selectedProduct.description || "-"}
จุดเด่น: ${selectedProduct.highlights || "-"}
วิธีใช้พื้นฐาน: ${selectedProduct.usage || "-"}
ข้อความขาย: ${selectedProduct.salesNote || "-"}
เพจที่ใช้: ${selectedProduct.pagesText || "-"}

ข้อความล่าสุดของลูกค้า:
${message}

แนวทาง:
- ตอบแบบแอดมินขายของจริง
- ห้ามเดาโปรที่ลูกค้ายังไม่ได้เลือก
- ถ้าลูกค้าถามกว้าง ให้ชวนคุยต่อหรือชวนเลือกโปร
- ถ้าลูกค้าถามเฉพาะทาง ให้ตอบจาก facts ที่มี
- ห้ามส่งข้อความเป็นคำสั่งภายในระบบ
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return NextResponse.json({
        reply: response.text || "ไม่มีคำตอบ",
        images: productImages,
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
บทบาทของบอท:
${botRole || "คุณคือแอดมินฝ่ายขายของร้านค้าออนไลน์"}

กฎการตอบ:
${botRules || "ตอบสุภาพและไม่เดาข้อมูล"}

ข้อความล่าสุดของลูกค้า:
${message}
`,
    });

    return NextResponse.json({
      reply: response.text || "ไม่มีคำตอบ",
      images: [],
    });
  } catch (error) {
    console.error("CHATBOT_ERROR:", error);
    return NextResponse.json(
      { reply: "ระบบ AI มีปัญหา", images: [] },
      { status: 500 }
    );
  }
}