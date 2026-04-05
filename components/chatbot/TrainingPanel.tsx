"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  updateChatbot,
  updateChatbotConnectionConfig,
} from "@/lib/chatbots";

export type TrainingConfig = {
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

type FirstReplyConfig = {
  enabled: boolean;
  triggerOnAnyProductIntent: boolean;
  triggerOnPriceIntent: boolean;
  triggerOnPromoIntent: boolean;
  triggerOnCodIntent: boolean;
  productIntroText: string;
  productIntroImagesText: string;
  promoIntroText: string;
  promoIntroImagesText: string;
  suppressAfterCustomerInfo: boolean;
};

type ConnectionConfig = {
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

type TrainingPanelProps = {
  value: TrainingConfig;
  onChange: (value: TrainingConfig) => void;
  botId?: string;
};

function createDefaultFirstReplyConfig(): FirstReplyConfig {
  return {
    enabled: true,
    triggerOnAnyProductIntent: true,
    triggerOnPriceIntent: true,
    triggerOnPromoIntent: true,
    triggerOnCodIntent: true,
    productIntroText: "",
    productIntroImagesText: "",
    promoIntroText: "",
    promoIntroImagesText: "",
    suppressAfterCustomerInfo: true,
  };
}

function createDefaultOffer(id: number): ProductOffer {
  return {
    id,
    title: "",
    price: "",
    note: "",
    imagesText: "",
    isActive: true,
  };
}

function createDefaultFaq(id: number): ProductFaqBlock {
  return {
    id,
    label: "วิธีใช้",
    keywords: "วิธีใช้, ใช้ยังไง, ใช้อย่างไร",
    answer: "",
    imagesText: "",
    isActive: true,
  };
}

function createDefaultProduct(id: number): ProductItem {
  return {
    id,
    name: "",
    sku: "",
    keywords: "",
    description: "",
    highlights: "",
    usage: "",
    salesNote: "",
    imagesText: "",
    pagesText: "",
    isActive: true,
    offers: [createDefaultOffer(id + 1)],
    faqBlocks: [createDefaultFaq(id + 2)],
  };
}

function normalizeOffer(offer: any, fallbackId: number): ProductOffer {
  return {
    id: typeof offer?.id === "number" ? offer.id : fallbackId,
    title: offer?.title ?? "",
    price: offer?.price ?? "",
    note: offer?.note ?? "",
    imagesText: offer?.imagesText ?? "",
    isActive: typeof offer?.isActive === "boolean" ? offer.isActive : true,
  };
}

function normalizeFaq(faq: any, fallbackId: number): ProductFaqBlock {
  return {
    id: typeof faq?.id === "number" ? faq.id : fallbackId,
    label: faq?.label ?? "",
    keywords: faq?.keywords ?? "",
    answer: faq?.answer ?? "",
    imagesText: faq?.imagesText ?? "",
    isActive: typeof faq?.isActive === "boolean" ? faq.isActive : true,
  };
}

function normalizeProduct(product: any, fallbackId: number): ProductItem {
  const offers = Array.isArray(product?.offers)
    ? product.offers.map((offer: any, index: number) =>
      normalizeOffer(offer, fallbackId + 100 + index)
    )
    : [createDefaultOffer(fallbackId + 1)];

  const faqBlocks = Array.isArray(product?.faqBlocks)
    ? product.faqBlocks.map((faq: any, index: number) =>
      normalizeFaq(faq, fallbackId + 200 + index)
    )
    : [createDefaultFaq(fallbackId + 2)];

  return {
    id: typeof product?.id === "number" ? product.id : fallbackId,
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    keywords: product?.keywords ?? "",
    description: product?.description ?? "",
    highlights: product?.highlights ?? "",
    usage: product?.usage ?? "",
    salesNote: product?.salesNote ?? "",
    imagesText: product?.imagesText ?? "",
    pagesText: product?.pagesText ?? "",
    isActive: typeof product?.isActive === "boolean" ? product.isActive : true,
    offers: offers.length > 0 ? offers : [createDefaultOffer(fallbackId + 1)],
    faqBlocks:
      faqBlocks.length > 0 ? faqBlocks : [createDefaultFaq(fallbackId + 2)],
  };
}

const inputClassName =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white placeholder:text-zinc-500 outline-none transition hover:border-zinc-600 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700 h-12";

const textareaClassName =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition hover:border-zinc-600 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700";

function isBlank(value: string): boolean {
  return !value || !value.trim();
}

function validateTrainingPayload(params: {
  value: TrainingConfig;
  botRole: string;
  botRules: string;
  products: ProductItem[];
  connection: ConnectionConfig;
}) {
  const { value, botRole, botRules, products, connection } = params;

  if (isBlank(value.botName)) {
    return "กรุณากรอกชื่อบอท";
  }

  if (isBlank(value.welcomeMessage)) {
    return "กรุณากรอกข้อความต้อนรับ";
  }

  if (isBlank(botRole)) {
    return "กรุณากรอกบทบาทของบอท";
  }

  if (isBlank(botRules)) {
    return "กรุณากรอกกฎการตอบ";
  }

  const activeProducts = products.filter((product) => product.isActive);

  if (activeProducts.length === 0) {
    return "กรุณาเปิดใช้งานสินค้าอย่างน้อย 1 ตัว";
  }

  for (const product of activeProducts) {
    if (isBlank(product.name)) {
      return "มีสินค้าเปิดใช้งานอยู่ แต่ยังไม่ได้กรอกชื่อสินค้า";
    }

    const activeOffers = (product.offers || []).filter((offer) => offer.isActive);

    if (activeOffers.length === 0) {
      return `สินค้า "${product.name}" ยังไม่มีข้อเสนอที่เปิดใช้งาน`;
    }

    for (const offer of activeOffers) {
      if (isBlank(offer.title)) {
        return `สินค้า "${product.name}" มีข้อเสนอที่ยังไม่ได้กรอกชื่อข้อเสนอ`;
      }

      if (isBlank(offer.price)) {
        return `สินค้า "${product.name}" มีข้อเสนอที่ยังไม่ได้กรอกราคา`;
      }
    }

    const activeFaqs = (product.faqBlocks || []).filter((faq) => faq.isActive);

    for (const faq of activeFaqs) {
      if (isBlank(faq.keywords)) {
        return `สินค้า "${product.name}" มี FAQ block ที่ยังไม่ได้กรอกคีย์เวิร์ด`;
      }

      if (isBlank(faq.answer)) {
        return `สินค้า "${product.name}" มี FAQ block ที่ยังไม่ได้กรอกคำตอบ`;
      }
    }
  }

  if (!isBlank(connection.telegramBotToken) && isBlank(connection.telegramChatId)) {
    return "ถ้ากรอก Telegram Bot Token ต้องกรอก Telegram Chat ID ด้วย";
  }

  return "";
}

export default function TrainingPanel({
  value,
  onChange,
  botId,
}: TrainingPanelProps) {
  const [botRole, setBotRole] = useState("");
  const [botRules, setBotRules] = useState("");
  const [enableAiCustomerParse, setEnableAiCustomerParse] = useState(false);
  const [salesStrategy, setSalesStrategy] = useState<SalesStrategy>({
    openingStyle: "",
    showOffersInFirstReply: true,
    maxOffersInFirstReply: "2",
    closingQuestionStyle: "",
    toneStyle: "",
    enableUrgency: false,
    urgencyStyle: "",
  });
  const [firstReplyConfig, setFirstReplyConfig] = useState<FirstReplyConfig>(
    createDefaultFirstReplyConfig()
  );

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [connection, setConnection] = useState<ConnectionConfig>({
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
  });

  useEffect(() => {
    const safeBotId = botId || "default";

    const savedRole = localStorage.getItem(`chatbotRole_${safeBotId}`);
    const savedRules = localStorage.getItem(`chatbotRules_${safeBotId}`);
    const savedProducts = localStorage.getItem(`chatbotProducts_${safeBotId}`);
    const savedStrategy = localStorage.getItem(`chatbotSalesStrategy_${safeBotId}`);
    const savedConnection = localStorage.getItem(`chatbotConnection_${safeBotId}`);
    const savedFirstReplyConfig = localStorage.getItem(
      `chatbotFirstReplyConfig_${safeBotId}`
    );
    const savedEnableAiCustomerParse = localStorage.getItem(
      `chatbotEnableAiCustomerParse_${safeBotId}`
    );
    if (savedEnableAiCustomerParse) {
      setEnableAiCustomerParse(savedEnableAiCustomerParse === "true");
    }
    if (savedRole) setBotRole(savedRole);
    if (savedRules) setBotRules(savedRules);

    if (savedStrategy) {
      try {
        const parsed = JSON.parse(savedStrategy);
        setSalesStrategy({
          openingStyle: parsed?.openingStyle || value.openingStyle || "",
          showOffersInFirstReply:
            typeof parsed?.showOffersInFirstReply === "boolean"
              ? parsed.showOffersInFirstReply
              : true,
          maxOffersInFirstReply: parsed?.maxOffersInFirstReply || "2",
          closingQuestionStyle:
            parsed?.closingQuestionStyle || value.closingQuestionStyle || "",
          toneStyle: parsed?.toneStyle || value.toneStyle || "",
          enableUrgency:
            typeof parsed?.enableUrgency === "boolean"
              ? parsed.enableUrgency
              : value.enableUrgency || false,
          urgencyStyle: parsed?.urgencyStyle || value.urgencyStyle || "",
        });
      } catch (error) {
        console.error("โหลด sales strategy ไม่สำเร็จ", error);
      }
    } else {
      setSalesStrategy({
        openingStyle: value.openingStyle || "",
        showOffersInFirstReply: true,
        maxOffersInFirstReply: "2",
        closingQuestionStyle: value.closingQuestionStyle || "",
        toneStyle: value.toneStyle || "",
        enableUrgency: value.enableUrgency || false,
        urgencyStyle: value.urgencyStyle || "",
      });
    }

    if (savedProducts) {
      try {
        const parsed = JSON.parse(savedProducts);

        if (Array.isArray(parsed)) {
          const normalizedProducts = parsed.map((product: any, index: number) =>
            normalizeProduct(product, Date.now() + index * 1000)
          );

          setProducts(
            normalizedProducts.length > 0
              ? normalizedProducts
              : [createDefaultProduct(Date.now())]
          );
        } else {
          setProducts([createDefaultProduct(Date.now())]);
        }
      } catch (error) {
        console.error("โหลด products ไม่สำเร็จ", error);
        setProducts([createDefaultProduct(Date.now())]);
      }
    } else {
      setProducts([createDefaultProduct(Date.now())]);
    }

    if (savedConnection) {
      try {
        const parsed = JSON.parse(savedConnection);
        setConnection({
          geminiApiKey: parsed?.geminiApiKey || "",
          facebookPageId: parsed?.facebookPageId || "",
          facebookPageName: parsed?.facebookPageName || "",
          facebookPageAccessToken: parsed?.facebookPageAccessToken || "",
          facebookAppId: parsed?.facebookAppId || "",
          facebookAppSecret: parsed?.facebookAppSecret || "",
          webhookVerifyToken: parsed?.webhookVerifyToken || "",
          telegramBotToken: parsed?.telegramBotToken || "",
          telegramChatId: parsed?.telegramChatId || "",
          telegramThreadId: parsed?.telegramThreadId || "",
        });
      } catch (error) {
        console.error("โหลด connection ไม่สำเร็จ", error);
      }
    }

    if (savedFirstReplyConfig) {
      try {
        const parsed = JSON.parse(savedFirstReplyConfig);
        setFirstReplyConfig({
          enabled:
            typeof parsed?.enabled === "boolean" ? parsed.enabled : true,
          triggerOnAnyProductIntent:
            typeof parsed?.triggerOnAnyProductIntent === "boolean"
              ? parsed.triggerOnAnyProductIntent
              : true,
          triggerOnPriceIntent:
            typeof parsed?.triggerOnPriceIntent === "boolean"
              ? parsed.triggerOnPriceIntent
              : true,
          triggerOnPromoIntent:
            typeof parsed?.triggerOnPromoIntent === "boolean"
              ? parsed.triggerOnPromoIntent
              : true,
          triggerOnCodIntent:
            typeof parsed?.triggerOnCodIntent === "boolean"
              ? parsed.triggerOnCodIntent
              : true,
          productIntroText: parsed?.productIntroText || "",
          productIntroImagesText: parsed?.productIntroImagesText || "",
          promoIntroText: parsed?.promoIntroText || "",
          promoIntroImagesText: parsed?.promoIntroImagesText || "",
          suppressAfterCustomerInfo:
            typeof parsed?.suppressAfterCustomerInfo === "boolean"
              ? parsed.suppressAfterCustomerInfo
              : true,
        });
      } catch (error) {
        console.error("โหลด first reply config ไม่สำเร็จ", error);
        setFirstReplyConfig(createDefaultFirstReplyConfig());
      }
    } else {
      setFirstReplyConfig(createDefaultFirstReplyConfig());
    }

    setIsMounted(true);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [botId]);

  useEffect(() => {
    if (!isMounted) return;

    setSalesStrategy((prev) => ({
      ...prev,
      openingStyle: value.openingStyle || prev.openingStyle,
      toneStyle: value.toneStyle || prev.toneStyle,
      closingQuestionStyle:
        value.closingQuestionStyle || prev.closingQuestionStyle,
      enableUrgency:
        typeof value.enableUrgency === "boolean"
          ? value.enableUrgency
          : prev.enableUrgency,
      urgencyStyle: value.urgencyStyle || prev.urgencyStyle,
    }));
  }, [
    isMounted,
    value.openingStyle,
    value.toneStyle,
    value.closingQuestionStyle,
    value.enableUrgency,
    value.urgencyStyle,
  ]);

  useEffect(() => {
    if (!isMounted) return;

    onChange({
      ...value,
      openingStyle: salesStrategy.openingStyle,
      toneStyle: salesStrategy.toneStyle,
      closingQuestionStyle: salesStrategy.closingQuestionStyle,
      enableUrgency: salesStrategy.enableUrgency,
      urgencyStyle: salesStrategy.urgencyStyle,
    });
  }, [
    isMounted,
    salesStrategy.openingStyle,
    salesStrategy.toneStyle,
    salesStrategy.closingQuestionStyle,
    salesStrategy.enableUrgency,
    salesStrategy.urgencyStyle,
  ]);

  useEffect(() => {
    if (!isMounted) return;
    const safeBotId = botId || "default";
    localStorage.setItem(
      `chatbotEnableAiCustomerParse_${safeBotId}`,
      String(enableAiCustomerParse)
    );
  }, [isMounted, botId, enableAiCustomerParse]);

  function updateSalesStrategy(
    field: keyof SalesStrategy,
    newValue: string | boolean
  ) {
    setSalesStrategy((prev) => ({
      ...prev,
      [field]: newValue,
    }));
  }

  function updateFirstReplyConfig(
    field: keyof FirstReplyConfig,
    newValue: string | boolean
  ) {
    setFirstReplyConfig((prev) => ({
      ...prev,
      [field]: newValue,
    }));
  }

  function addProduct() {
    setProducts((prev) => [...prev, createDefaultProduct(Date.now())]);
  }

  function removeProduct(productId: number) {
    setProducts((prev) => {
      if (prev.length <= 1) {
        setSaveMessage("ต้องมีสินค้าอย่างน้อย 1 ตัว");
        return prev;
      }

      return prev.filter((product) => product.id !== productId);
    });
  }

  function updateProduct(
    productId: number,
    field: keyof Omit<ProductItem, "offers" | "faqBlocks">,
    newValue: string | boolean
  ) {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId ? { ...product, [field]: newValue } : product
      )
    );
  }

  function addOffer(productId: number) {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
            ...product,
            offers: [...(product.offers || []), createDefaultOffer(Date.now())],
          }
          : product
      )
    );
  }

  function removeOffer(productId: number, offerId: number) {
    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) return product;

        if ((product.offers || []).length <= 1) {
          setSaveMessage(`สินค้า "${product.name || "รายการนี้"}" ต้องมีข้อเสนออย่างน้อย 1 รายการ`);
          return product;
        }

        return {
          ...product,
          offers: (product.offers || []).filter((offer) => offer.id !== offerId),
        };
      })
    );
  }

  function updateOffer(
    productId: number,
    offerId: number,
    field: keyof ProductOffer,
    newValue: string | boolean
  ) {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
            ...product,
            offers: (product.offers || []).map((offer) =>
              offer.id === offerId ? { ...offer, [field]: newValue } : offer
            ),
          }
          : product
      )
    );
  }

  function addFaqBlock(productId: number) {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
            ...product,
            faqBlocks: [
              ...(product.faqBlocks || []),
              {
                id: Date.now(),
                label: "",
                keywords: "",
                answer: "",
                imagesText: "",
                isActive: true,
              },
            ],
          }
          : product
      )
    );
  }

  function removeFaqBlock(productId: number, faqId: number) {
    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) return product;

        if ((product.faqBlocks || []).length <= 1) {
          setSaveMessage(`สินค้า "${product.name || "รายการนี้"}" ต้องมี FAQ อย่างน้อย 1 block`);
          return product;
        }

        return {
          ...product,
          faqBlocks: (product.faqBlocks || []).filter((faq) => faq.id !== faqId),
        };
      })
    );
  }

  function updateFaqBlock(
    productId: number,
    faqId: number,
    field: keyof ProductFaqBlock,
    newValue: string | boolean
  ) {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
            ...product,
            faqBlocks: (product.faqBlocks || []).map((faq) =>
              faq.id === faqId ? { ...faq, [field]: newValue } : faq
            ),
          }
          : product
      )
    );
  }

  async function uploadImageToSupabase(file: File, folder: string) {
    const safeFileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const filePath = `${folder}/${safeFileName}`;

    console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("Uploading filePath:", filePath);
    console.log("File info:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    const { data, error } = await supabase.storage
      .from("images")
      .upload(filePath, file, {
        upsert: false,
      });

    console.log("Upload data:", data);
    console.log("Upload error:", error);

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from("images")
      .getPublicUrl(filePath);

    console.log("Public URL:", publicUrlData.publicUrl);

    return publicUrlData.publicUrl;
  }

  function splitImageUrls(text: string): string[] {
    return (text || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function appendImageUrl(oldValue: string, nextUrl: string): string {
    const urls = splitImageUrls(oldValue);

    if (urls.includes(nextUrl)) {
      return oldValue;
    }

    return urls.length > 0 ? `${oldValue}\n${nextUrl}` : nextUrl;
  }

  async function handleOfferImageUpload(
    productId: number,
    offerId: number,
    file: File
  ) {
    try {
      setUploadingKey(`offer-${productId}-${offerId}`);

      const publicUrl = await uploadImageToSupabase(file, "offers");

      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId
            ? {
              ...product,
              offers: (product.offers || []).map((offer) =>
                offer.id === offerId
                  ? {
                    ...offer,
                    imagesText: appendImageUrl(offer.imagesText, publicUrl),
                  }
                  : offer
              ),
            }
            : product
        )
      );
    } catch (error) {
      console.error(error);
      alert("อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploadingKey("");
    }
  }

  async function handleFaqImageUpload(
    productId: number,
    faqId: number,
    file: File
  ) {
    try {
      setUploadingKey(`faq-${productId}-${faqId}`);

      const publicUrl = await uploadImageToSupabase(file, "faqs");

      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId
            ? {
              ...product,
              faqBlocks: (product.faqBlocks || []).map((faq) =>
                faq.id === faqId
                  ? {
                    ...faq,
                    imagesText: appendImageUrl(faq.imagesText, publicUrl),
                  }
                  : faq
              ),
            }
            : product
        )
      );
    } catch (error) {
      console.error(error);
      alert("อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploadingKey("");
    }
  }

  async function handleFirstReplyProductImageUpload(file: File) {
    try {
      setUploadingKey("first-reply-product");

      const publicUrl = await uploadImageToSupabase(file, "first-reply-products");

      setFirstReplyConfig((prev) => ({
        ...prev,
        productIntroImagesText: appendImageUrl(
          prev.productIntroImagesText,
          publicUrl
        ),
      }));
    } catch (error) {
      console.error(error);
      alert("อัปโหลดรูปเปิดสินค้าทักแรกไม่สำเร็จ");
    } finally {
      setUploadingKey("");
    }
  }

  async function handleFirstReplyPromoImageUpload(file: File) {
    try {
      setUploadingKey("first-reply-promo");

      const publicUrl = await uploadImageToSupabase(file, "first-reply-promos");

      setFirstReplyConfig((prev) => ({
        ...prev,
        promoIntroImagesText: appendImageUrl(
          prev.promoIntroImagesText,
          publicUrl
        ),
      }));
    } catch (error) {
      console.error(error);
      alert("อัปโหลดรูปเปิดโปรทักแรกไม่สำเร็จ");
    } finally {
      setUploadingKey("");
    }
  }

  async function handleProductImageUpload(productId: number, file: File) {
    try {
      setUploadingKey(`product-${productId}`);

      const publicUrl = await uploadImageToSupabase(file, "products");

      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId
            ? {
              ...product,
              imagesText: appendImageUrl(product.imagesText, publicUrl),
            }
            : product
        )
      );
    } catch (error) {
      console.error(error);
      alert("อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploadingKey("");
    }
  }

  async function handleSave() {
    const safeBotId = botId || "default";

    const validationMessage = validateTrainingPayload({
      value,
      botRole,
      botRules,
      products,
      connection,
    });

    if (validationMessage) {
      setSaveMessage(validationMessage);
      return;
    }

    try {
      setIsSaving(true);
      setSaveMessage("");

      console.log("TRAINING_SAVE_PRODUCTS_DEBUG", products.map((product) => ({
        name: product.name,
        imagesText: product.imagesText,
        offers: (product.offers || []).map((offer) => ({
          title: offer.title,
          imagesText: offer.imagesText,
        })),
        faqBlocks: (product.faqBlocks || []).map((faq) => ({
          label: faq.label,
          imagesText: faq.imagesText,
        })),
      })));

      const response = await fetch("/api/chatbot/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          botId: safeBotId,
          botRole,
          botRules,
          products,
          salesStrategy,
          firstReplyConfig,
          connection,
          botName: value.botName,
          welcomeMessage: value.welcomeMessage,
          openingStyle: value.openingStyle,
          toneStyle: value.toneStyle,
          closingQuestionStyle: value.closingQuestionStyle,
          enableUrgency: value.enableUrgency,
          urgencyStyle: value.urgencyStyle,
          exampleReplies: value.exampleReplies,
          forbiddenPhrases: value.forbiddenPhrases,
          enableAiCustomerParse,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "save failed");
      }

      const result = await response.json();
      console.log("SAVE RESULT:", result);

      localStorage.setItem(
        `chatbotConnection_${safeBotId}`,
        JSON.stringify(connection)
      );
      localStorage.setItem(`chatbotRole_${safeBotId}`, botRole);
      localStorage.setItem(`chatbotRules_${safeBotId}`, botRules);
      localStorage.setItem(
        `chatbotSalesStrategy_${safeBotId}`,
        JSON.stringify(salesStrategy)
      );
      localStorage.setItem(
        `chatbotFirstReplyConfig_${safeBotId}`,
        JSON.stringify(firstReplyConfig)
      );
      localStorage.setItem(
        `chatbotProducts_${safeBotId}`,
        JSON.stringify(products)
      );

      updateChatbotConnectionConfig(safeBotId, connection);

      updateChatbot(safeBotId, (bot) => ({
        ...bot,
        pageName:
          connection.facebookPageName?.trim() || bot.pageName || "ยังไม่เชื่อมเพจ",
        name: value.botName?.trim() || bot.name,
        description: connection.facebookPageId?.trim()
          ? "เชื่อมเพจแล้ว"
          : "ยังไม่ได้เชื่อมเพจ",
        enableAiCustomerParse,
        promptConfig: {
          ...(bot.promptConfig || {}),
          enableAiCustomerParse,
        },
      }));

      window.dispatchEvent(new CustomEvent("chatbots-updated"));

      setSaveMessage("บันทึกการตั้งค่าบอทแล้ว");
    } catch (error) {
      console.error(error);
      setSaveMessage("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setIsSaving(false);

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        setSaveMessage("");
      }, 2200);
    }
  }

  if (!isMounted) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] space-y-6">

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white">
                เปิดใช้ AI ช่วยแยกชื่อ / ที่อยู่ / เบอร์โทร
              </div>
              <div className="mt-1 text-xs text-zinc-400">
                ถ้าเปิด ระบบจะให้ AI ช่วยอ่านเคสข้อความติดกันหรือพิมพ์มั่วเพิ่มจาก parser ปกติ
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEnableAiCustomerParse((prev) => !prev)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${enableAiCustomerParse ? "bg-emerald-500" : "bg-zinc-700"
                }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${enableAiCustomerParse ? "translate-x-7" : "translate-x-1"
                  }`}
              />
            </button>
          </div>

          <div className="mt-3 text-xs text-zinc-500">
            สถานะตอนนี้: {enableAiCustomerParse ? "เปิดใช้งาน AI parse" : "ใช้ parser ปกติอย่างเดียว"}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white">Bot Identity + Brain</h2>
          <p className="mt-1 text-sm text-zinc-500">
            ตั้งค่าตัวตนของบอท บทบาท วิธีตอบ ตัวอย่างภาษาที่อยากให้ใช้
            และสิ่งที่ห้ามพูด เพื่อให้ตอบเหมือนแอดมินจริงมากขึ้น
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">

          <div>
            <label className="mb-2 block text-sm text-zinc-300">ชื่อบอท</label>
            <input
              type="text"
              value={value.botName}
              onChange={(e) => onChange({ ...value, botName: e.target.value })}
              placeholder="เช่น น้องบ๊ะจ่าง"
              className={inputClassName}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-300">
              ข้อความต้อนรับ
            </label>
            <input
              type="text"
              value={value.welcomeMessage}
              onChange={(e) =>
                onChange({ ...value, welcomeMessage: e.target.value })
              }
              placeholder="สวัสดีค่ะ สนใจสินค้าอะไรสอบถามได้เลยนะคะ 😊"
              className={inputClassName}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-300">บทบาทของบอท</label>
          <textarea
            value={botRole}
            onChange={(e) => setBotRole(e.target.value)}
            placeholder="เช่น คุณคือแอดมินฝ่ายขายของร้านค้าออนไลน์ ตอบสุภาพ เป็นกันเอง ปิดการขายเก่ง และไม่ถามข้อมูลซ้ำ"
            className={`min-h-[120px] ${textareaClassName}`}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-300">กฎการตอบ</label>
          <textarea
            value={botRules}
            onChange={(e) => setBotRules(e.target.value)}
            placeholder="เช่น ถ้าไม่มีข้อมูลห้ามเดา, ถ้าลูกค้าส่งชื่อเบอร์ที่อยู่แล้วห้ามถามซ้ำ, ถ้าจะปิดการขายให้สรุปแบบกระชับ"
            className={`min-h-[160px] ${textareaClassName}`}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-300">
            ตัวอย่างคำตอบที่ต้องการ
          </label>
          <textarea
            value={value.exampleReplies}
            onChange={(e) =>
              onChange({ ...value, exampleReplies: e.target.value })
            }
            placeholder={`เช่น
ลูกค้าทักว่า สนใจ
ตอบ: สนใจตัวนี้ใช่ไหมคะ 😊 ตัวนี้ขายดีมาก เดี๋ยวน้องสรุปโปรที่คุ้มให้ได้เลยค่ะ

ลูกค้าถามว่า ราคาเท่าไหร่
ตอบ: ได้เลยค่ะ ตอนนี้มีโปรให้เลือกนะคะ เดี๋ยวน้องสรุปตัวที่คุ้มให้ค่ะ`}
            className={`min-h-[180px] ${textareaClassName}`}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-300">
            คำพูดหรือรูปแบบที่ห้ามใช้
          </label>
          <textarea
            value={value.forbiddenPhrases}
            onChange={(e) =>
              onChange({ ...value, forbiddenPhrases: e.target.value })
            }
            placeholder={`เช่น
ห้ามพูดเหมือนระบบ
ห้ามถามชื่อ เบอร์ ที่อยู่ซ้ำ
ห้ามส่งโปรซ้ำ
ห้ามพูด เอาโปร 1 หรือ เอาโปร 2 ถ้าร้านไม่ได้ใช้ชื่อนี้`}
            className={`min-h-[140px] ${textareaClassName}`}
          />
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-white">Sales Strategy Layer</h2>
          <p className="mt-1 text-sm text-zinc-500">
            กำหนดวิธีเปิดบทสนทนา น้ำเสียง วิธีปิดการขาย และการเร่งปิดการขายแบบนุ่ม ๆ
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                แนวเปิดบทสนทนา
              </label>
              <textarea
                value={salesStrategy.openingStyle}
                onChange={(e) =>
                  updateSalesStrategy("openingStyle", e.target.value)
                }
                placeholder="เช่น ถ้าลูกค้าถามราคาแบบกว้าง ๆ ให้เปิดด้วยสไตล์แอดมินขายของจริง แล้วสรุปโปรหลัก 2 ตัวเลือก"
                className={`min-h-[120px] ${textareaClassName}`}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-zinc-300">
                  น้ำเสียงการตอบ
                </label>
                <input
                  type="text"
                  value={salesStrategy.toneStyle}
                  onChange={(e) =>
                    updateSalesStrategy("toneStyle", e.target.value)
                  }
                  placeholder="เช่น สุภาพ เป็นกันเอง แบบแอดมินไทย ปิดการขายนุ่ม ๆ"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-300">
                  ปิดท้ายถามแบบไหน
                </label>
                <input
                  type="text"
                  value={salesStrategy.closingQuestionStyle}
                  onChange={(e) =>
                    updateSalesStrategy("closingQuestionStyle", e.target.value)
                  }
                  placeholder="เช่น คุณพี่สนใจโปรไหน แจ้งน้องได้เลยนะคะ 😊"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-zinc-300">
                  แนวเร่งปิดการขาย
                </label>
                <textarea
                  value={salesStrategy.urgencyStyle}
                  onChange={(e) =>
                    updateSalesStrategy("urgencyStyle", e.target.value)
                  }
                  placeholder="เช่น ถ้าลูกค้าดูพร้อมซื้อหรือรีบ ให้เร่งแบบนุ่ม ๆ สุภาพ ไม่กดดัน เช่น ถ้าสะดวกส่งเบอร์และที่อยู่มาได้เลยนะคะ เดี๋ยวน้องรีบสรุปให้ค่ะ"
                  className={`min-h-[100px] ${textareaClassName}`}
                />
              </div>

              <label className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-600">
                <input
                  type="checkbox"
                  checked={salesStrategy.enableUrgency}
                  onChange={(e) =>
                    updateSalesStrategy("enableUrgency", e.target.checked)
                  }
                  className="h-4 w-4"
                />
                <span>เปิดใช้ข้อความเร่งปิดการขาย</span>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-600">
                  <input
                    type="checkbox"
                    checked={salesStrategy.showOffersInFirstReply}
                    onChange={(e) =>
                      updateSalesStrategy(
                        "showOffersInFirstReply",
                        e.target.checked
                      )
                    }
                    className="h-4 w-4"
                  />
                  <span>ให้โชว์หลายโปรในข้อความแรก</span>
                </label>

                <div>
                  <label className="mb-2 block text-sm text-zinc-300">
                    จำนวนโปรสูงสุดในข้อความแรก
                  </label>
                  <input
                    type="text"
                    value={salesStrategy.maxOffersInFirstReply}
                    onChange={(e) =>
                      updateSalesStrategy("maxOffersInFirstReply", e.target.value)
                    }
                    placeholder="เช่น 2"
                    className={inputClassName}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] space-y-5">
          <div>
            <h3 className="text-2xl font-semibold text-white">
              First Reply Config
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              ตั้งค่าข้อความทักแรกสำหรับลูกค้าที่ทักมาเกี่ยวกับสินค้า ราคา โปร
              หรือเก็บเงินปลายทาง โดยไม่ยึดแค่คำว่า สนใจ
            </p>
          </div>

          <label className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-4">
            <div>
              <p className="text-sm font-medium text-white">
                เปิดใช้ first reply อัตโนมัติ
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                ถ้าเปิด บอทจะใช้ข้อความและรูปจากส่วนนี้ในทักแรกที่มี intent
                เกี่ยวกับสินค้า
              </p>
            </div>
            <input
              type="checkbox"
              className="h-5 w-5 accent-white"
              checked={firstReplyConfig.enabled}
              onChange={(event) =>
                updateFirstReplyConfig("enabled", event.target.checked)
              }
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-white">
              <input
                type="checkbox"
                className="h-4 w-4 accent-white"
                checked={firstReplyConfig.triggerOnAnyProductIntent}
                onChange={(event) =>
                  updateFirstReplyConfig(
                    "triggerOnAnyProductIntent",
                    event.target.checked
                  )
                }
              />
              ทริกเมื่อทักแรกเกี่ยวกับสินค้า
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-white">
              <input
                type="checkbox"
                className="h-4 w-4 accent-white"
                checked={firstReplyConfig.triggerOnPriceIntent}
                onChange={(event) =>
                  updateFirstReplyConfig(
                    "triggerOnPriceIntent",
                    event.target.checked
                  )
                }
              />
              ทริกเมื่อถามราคา
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-white">
              <input
                type="checkbox"
                className="h-4 w-4 accent-white"
                checked={firstReplyConfig.triggerOnPromoIntent}
                onChange={(event) =>
                  updateFirstReplyConfig(
                    "triggerOnPromoIntent",
                    event.target.checked
                  )
                }
              />
              ทริกเมื่อถามโปร / โปรโมชั่น
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-white">
              <input
                type="checkbox"
                className="h-4 w-4 accent-white"
                checked={firstReplyConfig.triggerOnCodIntent}
                onChange={(event) =>
                  updateFirstReplyConfig(
                    "triggerOnCodIntent",
                    event.target.checked
                  )
                }
              />
              ทริกเมื่อถามเก็บเงินปลายทาง
            </label>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-white">
            <input
              type="checkbox"
              className="h-4 w-4 accent-white"
              checked={firstReplyConfig.suppressAfterCustomerInfo}
              onChange={(event) =>
                updateFirstReplyConfig(
                  "suppressAfterCustomerInfo",
                  event.target.checked
                )
              }
            />
            ถ้าลูกค้าส่งชื่อ/เบอร์/ที่อยู่แล้ว ห้ามยิง first reply ซ้ำ
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="text-base font-medium text-white">
                ข้อความ/รูป เปิดสินค้า
              </h4>
              <textarea
                className={textareaClassName}
                rows={5}
                placeholder="เช่น สินค้าตัวนี้ช่วยขจัดคราบมันหนักในครัวได้ดี ใช้งานง่าย เดี๋ยวน้องส่งรายละเอียดให้ดูนะคะ 😊"
                value={firstReplyConfig.productIntroText}
                onChange={(event) =>
                  updateFirstReplyConfig("productIntroText", event.target.value)
                }
              />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-zinc-400">
                    รูปเปิดสินค้า (1 บรรทัดต่อ 1 รูป)
                  </p>

                  <label className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-500 hover:bg-zinc-900">
                    {uploadingKey === "first-reply-product" ? "กำลังอัปโหลด..." : "+ เพิ่มรูป"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const input = e.target;
                        const file = input.files?.[0];
                        if (!file) return;

                        await handleFirstReplyProductImageUpload(file);
                        input.value = "";
                      }}
                    />
                  </label>
                </div>

                <textarea
                  className={textareaClassName}
                  rows={4}
                  placeholder="ใส่ลิงก์รูปสินค้า 1 บรรทัดต่อ 1 รูป"
                  value={firstReplyConfig.productIntroImagesText}
                  onChange={(event) =>
                    updateFirstReplyConfig(
                      "productIntroImagesText",
                      event.target.value
                    )
                  }
                />

                {splitImageUrls(firstReplyConfig.productIntroImagesText).length > 0 && (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {splitImageUrls(firstReplyConfig.productIntroImagesText).map((url, index) => (
                      <img
                        key={`first-reply-product-${index}`}
                        src={url}
                        alt={`first-reply-product-${index}`}
                        className="h-24 w-full rounded-lg border border-zinc-800 object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-base font-medium text-white">
                ข้อความ/รูป เปิดโปร
              </h4>
              <textarea
                className={textareaClassName}
                rows={5}
                placeholder="เช่น ตอนนี้มีโปรให้เลือกหลายแบบนะคะ เดี๋ยวน้องสรุปตัวที่ขายดีให้ดูค่ะ ✨"
                value={firstReplyConfig.promoIntroText}
                onChange={(event) =>
                  updateFirstReplyConfig("promoIntroText", event.target.value)
                }
              />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-zinc-400">
                    รูปเปิดโปร (1 บรรทัดต่อ 1 รูป)
                  </p>

                  <label className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-500 hover:bg-zinc-900">
                    {uploadingKey === "first-reply-promo" ? "กำลังอัปโหลด..." : "+ เพิ่มรูป"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const input = e.target;
                        const file = input.files?.[0];
                        if (!file) return;

                        await handleFirstReplyPromoImageUpload(file);
                        input.value = "";
                      }}
                    />
                  </label>
                </div>

                <textarea
                  className={textareaClassName}
                  rows={4}
                  placeholder="ใส่ลิงก์รูปโปร 1 บรรทัดต่อ 1 รูป"
                  value={firstReplyConfig.promoIntroImagesText}
                  onChange={(event) =>
                    updateFirstReplyConfig("promoIntroImagesText", event.target.value)
                  }
                />

                {splitImageUrls(firstReplyConfig.promoIntroImagesText).length > 0 && (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {splitImageUrls(firstReplyConfig.promoIntroImagesText).map((url, index) => (
                      <img
                        key={`first-reply-promo-${index}`}
                        src={url}
                        alt={`first-reply-promo-${index}`}
                        className="h-24 w-full rounded-lg border border-zinc-800 object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white">
                สินค้า Knowledge + Promo Engine
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
              </p>
            </div>

            <button
              type="button"
              onClick={addProduct}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-500 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            >
              + เพิ่มสินค้า
            </button>
          </div>

          <div className="space-y-5">
            {products.map((product, productIndex) => (
              <div
                key={product.id}
                className="rounded-2xl border border-zinc-800 bg-black/40 p-5 space-y-5 shadow-[0_8px_30px_rgba(0,0,0,0.22)] transition-all duration-200 hover:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      สินค้า #{productIndex + 1}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      สินค้า 1 ตัวมีหลายข้อเสนอและหลายกลุ่มคำตอบเฉพาะทางได้
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-600">
                      <span>เปิดใช้งาน</span>
                      <input
                        type="checkbox"
                        checked={product.isActive}
                        onChange={(e) =>
                          updateProduct(product.id, "isActive", e.target.checked)
                        }
                        className="h-4 w-4"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => removeProduct(product.id)}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-red-900/80 bg-red-950/10 px-3 text-sm font-medium text-red-400 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-950/30"
                    >
                      ลบสินค้า
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm text-zinc-300">
                      ชื่อสินค้า
                    </label>
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) =>
                        updateProduct(product.id, "name", e.target.value)
                      }
                      placeholder="เช่น ผงกำจัดต้นไม้ สูตรเข้มข้น"
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-zinc-300">SKU</label>
                    <input
                      type="text"
                      value={product.sku}
                      onChange={(e) =>
                        updateProduct(product.id, "sku", e.target.value)
                      }
                      placeholder="เช่น TREE-500G"
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-zinc-300">
                      คีย์เวิร์ดสินค้า
                    </label>
                    <input
                      type="text"
                      value={product.keywords}
                      onChange={(e) =>
                        updateProduct(product.id, "keywords", e.target.value)
                      }
                      placeholder="เช่น ตอไม้, รากไม้, กอไผ่, วัชพืช"
                      className={inputClassName}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-zinc-300">
                    รายละเอียดสินค้า
                  </label>
                  <textarea
                    value={product.description}
                    onChange={(e) =>
                      updateProduct(product.id, "description", e.target.value)
                    }
                    placeholder="อธิบายว่าสินค้านี้เหมาะกับงานอะไร"
                    className={`min-h-[100px] ${textareaClassName}`}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm text-zinc-300">
                      จุดเด่น
                    </label>
                    <textarea
                      value={product.highlights}
                      onChange={(e) =>
                        updateProduct(product.id, "highlights", e.target.value)
                      }
                      placeholder="เช่น ใช้ได้ทั้งผสมน้ำฉีดและโรยเพียว ๆ"
                      className={`min-h-[100px] ${textareaClassName}`}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-zinc-300">
                      วิธีใช้พื้นฐาน
                    </label>
                    <textarea
                      value={product.usage}
                      onChange={(e) =>
                        updateProduct(product.id, "usage", e.target.value)
                      }
                      placeholder="เช่น ผสมน้ำฉีดหรือโรยตรงโคน"
                      className={`min-h-[100px] ${textareaClassName}`}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-zinc-300">
                      ข้อความขายสั้น
                    </label>
                    <textarea
                      value={product.salesNote}
                      onChange={(e) =>
                        updateProduct(product.id, "salesNote", e.target.value)
                      }
                      placeholder="เช่น ถ้าหน้างานเป็นตอไม้หรือกอไผ่ ตัวนี้คุ้มมาก"
                      className={`min-h-[100px] ${textareaClassName}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-zinc-300">
                    รูปสินค้าหลัก (1 บรรทัดต่อ 1 รูป)
                  </label>

                  <div className="mb-3 flex items-center gap-3">
                    <label className="cursor-pointer inline-flex h-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-500 hover:bg-zinc-900">
                      {uploadingKey === `product-${product.id}` ? "กำลังอัปโหลด..." : "+ เพิ่มรูป"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const input = e.target;
                          const file = input.files?.[0];
                          if (!file) return;

                          await handleProductImageUpload(product.id, file);
                          input.value = "";
                        }}
                      />
                    </label>
                  </div>

                  <textarea
                    value={product.imagesText}
                    onChange={(e) =>
                      updateProduct(product.id, "imagesText", e.target.value)
                    }
                    placeholder={`https://...
https://...`}
                    className={`min-h-[100px] ${textareaClassName}`}
                  />

                  {splitImageUrls(product.imagesText).length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                      {splitImageUrls(product.imagesText).map((url, index) => (
                        <img
                          key={`${product.id}-${index}`}
                          src={url}
                          alt={`product-${index}`}
                          className="h-24 w-full rounded-lg border border-zinc-800 object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-zinc-800 pt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-white">
                        ข้อเสนอ / ราคา
                      </h4>
                      <p className="mt-1 text-xs text-zinc-500">
                        ใส่หลายราคา หลายโปรได้ในสินค้าตัวเดียว
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => addOffer(product.id)}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-500 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    >
                      + เพิ่มข้อเสนอ
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(product.offers || []).map((offer, offerIndex) => (
                      <div
                        key={offer.id}
                        className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-4 shadow-[0_6px_20px_rgba(0,0,0,0.18)] transition-all duration-200 hover:border-zinc-700"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h5 className="text-sm font-semibold text-white">
                              ข้อเสนอ #{offerIndex + 1}
                            </h5>
                          </div>

                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-600">
                              <span>เปิดใช้งาน</span>
                              <input
                                type="checkbox"
                                checked={offer.isActive}
                                onChange={(e) =>
                                  updateOffer(
                                    product.id,
                                    offer.id,
                                    "isActive",
                                    e.target.checked
                                  )
                                }
                                className="h-4 w-4"
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => removeOffer(product.id, offer.id)}
                              className="inline-flex h-10 items-center justify-center rounded-xl border border-red-900/80 bg-red-950/10 px-3 text-sm font-medium text-red-400 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-950/30"
                            >
                              ลบข้อเสนอ
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <label className="mb-2 block text-sm text-zinc-300">
                              ชื่อข้อเสนอ
                            </label>
                            <input
                              type="text"
                              value={offer.title}
                              onChange={(e) =>
                                updateOffer(
                                  product.id,
                                  offer.id,
                                  "title",
                                  e.target.value
                                )
                              }
                              placeholder="เช่น 1 ถัง / 2 ถัง / 3 ถัง"
                              className={inputClassName.replace(
                                "bg-zinc-950",
                                "bg-black"
                              )}
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm text-zinc-300">
                              ราคา
                            </label>
                            <input
                              type="text"
                              value={offer.price}
                              onChange={(e) =>
                                updateOffer(
                                  product.id,
                                  offer.id,
                                  "price",
                                  e.target.value
                                )
                              }
                              placeholder="เช่น 159 / 290"
                              className={inputClassName.replace(
                                "bg-zinc-950",
                                "bg-black"
                              )}
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm text-zinc-300">
                              หมายเหตุ
                            </label>
                            <input
                              type="text"
                              value={offer.note}
                              onChange={(e) =>
                                updateOffer(
                                  product.id,
                                  offer.id,
                                  "note",
                                  e.target.value
                                )
                              }
                              placeholder="เช่น ค่าส่ง 40 / ส่งฟรี / คุ้มสุด"
                              className={inputClassName.replace(
                                "bg-zinc-950",
                                "bg-black"
                              )}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm text-zinc-300">
                            รูปข้อเสนอนี้ (1 บรรทัดต่อ 1 รูป)
                          </label>

                          <div className="mb-3 flex items-center gap-3">
                            <label className="cursor-pointer inline-flex h-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-500 hover:bg-zinc-900">
                              {uploadingKey === `offer-${product.id}-${offer.id}`
                                ? "กำลังอัปโหลด..."
                                : "+ เพิ่มรูป"}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const input = e.target;
                                  const file = input.files?.[0];
                                  if (!file) return;

                                  await handleOfferImageUpload(
                                    product.id,
                                    offer.id,
                                    file
                                  );
                                  input.value = "";
                                }}
                              />
                            </label>
                          </div>

                          <textarea
                            value={offer.imagesText}
                            onChange={(e) =>
                              updateOffer(
                                product.id,
                                offer.id,
                                "imagesText",
                                e.target.value
                              )
                            }
                            placeholder={`https://...
https://...`}
                            className={`min-h-[100px] ${textareaClassName.replace(
                              "bg-zinc-950",
                              "bg-black"
                            )}`}
                          />

                          {splitImageUrls(offer.imagesText).length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                              {splitImageUrls(offer.imagesText).map((url, index) => (
                                <img
                                  key={`${offer.id}-${index}`}
                                  src={url}
                                  alt={`offer-${index}`}
                                  className="h-24 w-full rounded-lg border border-zinc-800 object-cover"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-white">
                        Keyword Response Blocks
                      </h4>
                      <p className="mt-1 text-xs text-zinc-500">
                        ใช้ตอบคำถามเฉพาะทาง เช่น วิธีใช้ อันตรายไหม ใช้ได้นานไหม
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => addFaqBlock(product.id)}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-500 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    >
                      + เพิ่ม block คำตอบ
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(product.faqBlocks || []).map((faq, faqIndex) => (
                      <div
                        key={faq.id}
                        className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-4 shadow-[0_6px_20px_rgba(0,0,0,0.18)] transition-all duration-200 hover:border-zinc-700"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h5 className="text-sm font-semibold text-white">
                              Block #{faqIndex + 1}
                            </h5>
                          </div>

                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-600">
                              <span>เปิดใช้งาน</span>
                              <input
                                type="checkbox"
                                checked={faq.isActive}
                                onChange={(e) =>
                                  updateFaqBlock(
                                    product.id,
                                    faq.id,
                                    "isActive",
                                    e.target.checked
                                  )
                                }
                                className="h-4 w-4"
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => removeFaqBlock(product.id, faq.id)}
                              className="inline-flex h-10 items-center justify-center rounded-xl border border-red-900/80 bg-red-950/10 px-3 text-sm font-medium text-red-400 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-950/30"
                            >
                              ลบ block
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm text-zinc-300">
                              ชื่อหมวดคำตอบ
                            </label>
                            <input
                              type="text"
                              value={faq.label}
                              onChange={(e) =>
                                updateFaqBlock(
                                  product.id,
                                  faq.id,
                                  "label",
                                  e.target.value
                                )
                              }
                              placeholder="เช่น วิธีใช้ / ความปลอดภัย / ขนาด"
                              className={inputClassName.replace(
                                "bg-zinc-950",
                                "bg-black"
                              )}
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm text-zinc-300">
                              คีย์เวิร์ดจับคำถาม
                            </label>
                            <input
                              type="text"
                              value={faq.keywords}
                              onChange={(e) =>
                                updateFaqBlock(
                                  product.id,
                                  faq.id,
                                  "keywords",
                                  e.target.value
                                )
                              }
                              placeholder="เช่น วิธีใช้, ใช้ยังไง, ใช้อย่างไร"
                              className={inputClassName.replace(
                                "bg-zinc-950",
                                "bg-black"
                              )}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm text-zinc-300">
                            คำตอบหลักของ block นี้
                          </label>
                          <textarea
                            value={faq.answer}
                            onChange={(e) =>
                              updateFaqBlock(
                                product.id,
                                faq.id,
                                "answer",
                                e.target.value
                              )
                            }
                            placeholder="ใส่ fact ที่อยากให้บอทใช้ตอบเวลาเจอคำถามกลุ่มนี้"
                            className={`min-h-[120px] ${textareaClassName.replace(
                              "bg-zinc-950",
                              "bg-black"
                            )}`}
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm text-zinc-300">
                            รูปประกอบของ block นี้ (1 บรรทัดต่อ 1 รูป)
                          </label>

                          <div className="mb-3 flex items-center gap-3">
                            <label className="cursor-pointer inline-flex h-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-500 hover:bg-zinc-900">
                              {uploadingKey === `faq-${product.id}-${faq.id}`
                                ? "กำลังอัปโหลด..."
                                : "+ เพิ่มรูป"}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const input = e.target;
                                  const file = input.files?.[0];
                                  if (!file) return;

                                  await handleFaqImageUpload(
                                    product.id,
                                    faq.id,
                                    file
                                  );
                                  input.value = "";
                                }}
                              />
                            </label>
                          </div>

                          <textarea
                            value={faq.imagesText}
                            onChange={(e) =>
                              updateFaqBlock(
                                product.id,
                                faq.id,
                                "imagesText",
                                e.target.value
                              )
                            }
                            placeholder={`https://...
https://...`}
                            className={`min-h-[100px] ${textareaClassName.replace(
                              "bg-zinc-950",
                              "bg-black"
                            )}`}
                          />

                          {splitImageUrls(faq.imagesText).length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                              {splitImageUrls(faq.imagesText).map((url, index) => (
                                <img
                                  key={`${faq.id}-${index}`}
                                  src={url}
                                  alt={`faq-${index}`}
                                  className="h-24 w-full rounded-xl border border-zinc-800 object-cover shadow-[0_6px_18px_rgba(0,0,0,0.18)] transition-all duration-200 hover:scale-[1.02] hover:border-zinc-700"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>


        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white">
                🔌 การเชื่อมต่อ API
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                กรอกค่าเชื่อมต่อที่จำเป็นสำหรับใช้งานบอทจริงและแจ้งเตือน Telegram
              </p>
            </div>

            <input
              placeholder="Gemini API Key"
              value={connection.geminiApiKey ?? ""}
              onChange={(e) =>
                setConnection({ ...connection, geminiApiKey: e.target.value })
              }
              className={inputClassName}
            />

            <input
              placeholder="Facebook Page ID"
              value={connection.facebookPageId ?? ""}
              onChange={(e) =>
                setConnection({ ...connection, facebookPageId: e.target.value })
              }
              className={inputClassName}
            />

            <input
              placeholder="Facebook Page Name"
              value={connection.facebookPageName ?? ""}
              onChange={(e) =>
                setConnection({ ...connection, facebookPageName: e.target.value })
              }
              className={inputClassName}
            />

            <input
              placeholder="Facebook Page Access Token"
              value={connection.facebookPageAccessToken ?? ""}
              onChange={(e) =>
                setConnection({
                  ...connection,
                  facebookPageAccessToken: e.target.value,
                })
              }
              className={inputClassName}
            />

            <input
              placeholder="Facebook App ID"
              value={connection.facebookAppId ?? ""}
              onChange={(e) =>
                setConnection({
                  ...connection,
                  facebookAppId: e.target.value,
                })
              }
              className={inputClassName}
            />

            <input
              placeholder="Facebook App Secret"
              value={connection.facebookAppSecret ?? ""}
              onChange={(e) =>
                setConnection({
                  ...connection,
                  facebookAppSecret: e.target.value,
                })
              }
              className={inputClassName}
            />

            <input
              placeholder="Webhook Verify Token"
              value={connection.webhookVerifyToken ?? ""}
              onChange={(e) =>
                setConnection({
                  ...connection,
                  webhookVerifyToken: e.target.value,
                })
              }
              className={inputClassName}
            />

            <input
              placeholder="Telegram Bot Token"
              value={connection.telegramBotToken ?? ""}
              onChange={(e) =>
                setConnection({
                  ...connection,
                  telegramBotToken: e.target.value,
                })
              }
              className={inputClassName}
            />

            <input
              placeholder="Telegram Chat ID"
              value={connection.telegramChatId ?? ""}
              onChange={(e) =>
                setConnection({
                  ...connection,
                  telegramChatId: e.target.value,
                })
              }
              className={inputClassName}
            />

            <input
              placeholder="Telegram Thread ID (ถ้ามี)"
              value={connection.telegramThreadId ?? ""}
              onChange={(e) =>
                setConnection({
                  ...connection,
                  telegramThreadId: e.target.value,
                })
              }
              className={inputClassName}
            />
          </div>

          <div className="mt-6">
            <div className="flex flex-col gap-3 rounded-2xl border border-zinc-700 bg-zinc-950/95 px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.42)] backdrop-blur-xl transition-all duration-300 md:flex-row md:items-center md:justify-between">

              <div className="min-h-[24px]">
                {isSaving ? (
                  <p className="text-sm font-medium text-zinc-300 transition-all duration-300">
                    กำลังบันทึกการตั้งค่า...
                  </p>
                ) : saveMessage ? (
                  <p
                    className={`text-sm font-medium transition-all duration-300 ${saveMessage.includes("ไม่สำเร็จ")
                      ? "text-red-400"
                      : "text-emerald-400"
                      }`}
                  >
                    {saveMessage}
                  </p>
                ) : (
                  <p className="text-sm text-zinc-500">
                    แก้ไขข้อมูลแล้วกดบันทึกเพื่ออัปเดตการตั้งค่า
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={`inline-flex h-11 min-w-[170px] items-center justify-center rounded-xl px-5 text-sm font-semibold transition-all duration-200 md:self-auto self-end ${isSaving
                  ? "cursor-not-allowed bg-zinc-700 text-zinc-300"
                  : "bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.08)] hover:-translate-y-0.5 hover:bg-zinc-200 active:translate-y-0"
                  }`}
              >
                {isSaving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}