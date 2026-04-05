import { NextResponse } from "next/server";
import { getChatbots, saveChatbots } from "@/lib/chatbot-store";

function normalizeFirstReplyConfig(firstReplyConfig: any = {}) {
  return {
    enabled:
      typeof firstReplyConfig?.enabled === "boolean"
        ? firstReplyConfig.enabled
        : true,
    triggerOnAnyProductIntent:
      typeof firstReplyConfig?.triggerOnAnyProductIntent === "boolean"
        ? firstReplyConfig.triggerOnAnyProductIntent
        : true,
    triggerOnPriceIntent:
      typeof firstReplyConfig?.triggerOnPriceIntent === "boolean"
        ? firstReplyConfig.triggerOnPriceIntent
        : true,
    triggerOnPromoIntent:
      typeof firstReplyConfig?.triggerOnPromoIntent === "boolean"
        ? firstReplyConfig.triggerOnPromoIntent
        : true,
    triggerOnCodIntent:
      typeof firstReplyConfig?.triggerOnCodIntent === "boolean"
        ? firstReplyConfig.triggerOnCodIntent
        : true,
    productIntroText: firstReplyConfig?.productIntroText || "",
    productIntroImagesText: firstReplyConfig?.productIntroImagesText || "",
    promoIntroText: firstReplyConfig?.promoIntroText || "",
    promoIntroImagesText: firstReplyConfig?.promoIntroImagesText || "",
    suppressAfterCustomerInfo:
      typeof firstReplyConfig?.suppressAfterCustomerInfo === "boolean"
        ? firstReplyConfig.suppressAfterCustomerInfo
        : true,
  };
}

function normalizeConnectionConfig(connection: any = {}) {
  return {
    geminiApiKey: connection?.geminiApiKey || "",
    facebookPageId: connection?.facebookPageId || "",
    facebookPageName: connection?.facebookPageName || "",
    facebookPageAccessToken: connection?.facebookPageAccessToken || "",
    facebookAppId: connection?.facebookAppId || "",
    facebookAppSecret: connection?.facebookAppSecret || "",
    webhookVerifyToken: connection?.webhookVerifyToken || "",
    telegramBotToken: connection?.telegramBotToken || "",
    telegramChatId: connection?.telegramChatId || "",
    telegramThreadId: connection?.telegramThreadId || "",
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const botId: string = body.botId || "";
    const botRole: string = body.botRole || "";
    const botRules: string = body.botRules || "";
    const botEnabled =
      typeof body.botEnabled === "boolean" ? body.botEnabled : undefined;
    const products = Array.isArray(body.products) ? body.products : [];
    const enableAiCustomerParse =
      typeof body.enableAiCustomerParse === "boolean"
        ? body.enableAiCustomerParse
        : undefined;

    console.log(
      "SAVE_ROUTE_PRODUCTS_DEBUG",
      products.map((product: any) => ({
        name: product?.name,
        imagesText: product?.imagesText,
        offers: Array.isArray(product?.offers)
          ? product.offers.map((offer: any) => ({
              title: offer?.title,
              imagesText: offer?.imagesText,
            }))
          : [],
      }))
    );

    const salesStrategy = body.salesStrategy || null;
    const firstReplyConfig = normalizeFirstReplyConfig(body.firstReplyConfig);
    const connection = normalizeConnectionConfig(body.connection);

    if (!botId) {
      return NextResponse.json(
        { error: "botId is required" },
        { status: 400 }
      );
    }

    const bots = await getChatbots();
    const existingBot = bots.find((b: any) => b.id === botId);

    let updatedBots: any[];

    if (!existingBot) {
      const newBot = {
        id: botId,
        name: body.botName?.trim() || "บอทใหม่",
        pageName:
          connection.facebookPageName?.trim() || body.pageName?.trim() || "",
        status: "draft",
        revenue: 0,
        description: "",
        botEnabled: typeof botEnabled === "boolean" ? botEnabled : false,
        enableAiCustomerParse:
          typeof enableAiCustomerParse === "boolean"
            ? enableAiCustomerParse
            : false,
        promptConfig: {
          botName: body.botName?.trim() || "บอทใหม่",
          welcomeMessage:
            body.welcomeMessage?.trim() ||
            "สวัสดีค่ะ ทักมาสอบถามได้เลยนะคะ 😊",
          roleDescription: botRole,
          responseRules: botRules,
          openingStyle: salesStrategy?.openingStyle || body.openingStyle || "",
          toneStyle: salesStrategy?.toneStyle || body.toneStyle || "",
          closingQuestionStyle:
            salesStrategy?.closingQuestionStyle ||
            body.closingQuestionStyle ||
            "",
          enableAiCustomerParse:
            typeof enableAiCustomerParse === "boolean"
              ? enableAiCustomerParse
              : false,
        },
        connectionConfig: connection,
        products,
        firstReplyConfig,
        salesStrategy: {
          ...(salesStrategy || {}),
          enableUrgency:
            typeof body.enableUrgency === "boolean"
              ? body.enableUrgency
              : salesStrategy?.enableUrgency ?? false,
          urgencyStyle:
            body.urgencyStyle ?? salesStrategy?.urgencyStyle ?? "",
        },
      };

      updatedBots = [...bots, newBot];
    } else {
      updatedBots = bots.map((bot: any) => {
        if (bot.id !== botId) return bot;

        return {
          ...bot,
          name: body.botName?.trim() || bot.name,
          pageName:
            connection.facebookPageName?.trim() ||
            body.pageName?.trim() ||
            bot.pageName,
          botEnabled:
            typeof botEnabled === "boolean" ? botEnabled : bot.botEnabled,
          enableAiCustomerParse:
            typeof enableAiCustomerParse === "boolean"
              ? enableAiCustomerParse
              : bot.enableAiCustomerParse ??
                bot.promptConfig?.enableAiCustomerParse ??
                false,
          promptConfig: {
            ...bot.promptConfig,
            botName: body.botName ?? bot.promptConfig?.botName ?? bot.name,
            welcomeMessage:
              body.welcomeMessage ??
              bot.promptConfig?.welcomeMessage ??
              "สวัสดีค่ะ ทักมาสอบถามได้เลยนะคะ 😊",
            roleDescription: botRole,
            responseRules: botRules,
            openingStyle:
              salesStrategy?.openingStyle ||
              body.openingStyle ||
              bot.promptConfig?.openingStyle ||
              "",
            toneStyle:
              salesStrategy?.toneStyle ||
              body.toneStyle ||
              bot.promptConfig?.toneStyle ||
              "",
            closingQuestionStyle:
              salesStrategy?.closingQuestionStyle ||
              body.closingQuestionStyle ||
              bot.promptConfig?.closingQuestionStyle ||
              "",
            enableAiCustomerParse:
              typeof enableAiCustomerParse === "boolean"
                ? enableAiCustomerParse
                : bot.promptConfig?.enableAiCustomerParse ??
                  bot.enableAiCustomerParse ??
                  false,
          },
          connectionConfig: {
            ...normalizeConnectionConfig(bot.connectionConfig),
            ...connection,
          },
          firstReplyConfig: {
            ...(bot.firstReplyConfig || {}),
            ...firstReplyConfig,
          },
          products,
          salesStrategy: {
            ...(bot.salesStrategy || {}),
            ...(salesStrategy || {}),
            enableUrgency:
              typeof body.enableUrgency === "boolean"
                ? body.enableUrgency
                : salesStrategy?.enableUrgency ??
                  bot.salesStrategy?.enableUrgency ??
                  false,
            urgencyStyle:
              body.urgencyStyle ??
              salesStrategy?.urgencyStyle ??
              bot.salesStrategy?.urgencyStyle ??
              "",
          },
        };
      });
    }

    const saveOk = await saveChatbots(updatedBots);

    if (!saveOk) {
      return NextResponse.json(
        { error: "saveChatbots failed" },
        { status: 500 }
      );
    }

    const savedBot = updatedBots.find((b: any) => b.id === botId) || null;

    return NextResponse.json({
      success: true,
      message: "saved",
      bot: savedBot,
    });
  } catch (error) {
    console.error("save chatbot error", error);

    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }
}