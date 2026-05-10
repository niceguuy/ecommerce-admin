import { GoogleGenAI } from "@google/genai";

type AiProvider = "gemini" | "openai";

type AiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
type AiContents = string | Array<{ role: string; parts: AiPart[] }>;

type GenerateTextArgs = {
  provider?: AiProvider;
  geminiKey?: string;
  openaiKey?: string;
  geminiModel?: string;
  openaiModel?: string;
  contents: AiContents;
};

function pickProvider(args: GenerateTextArgs): AiProvider {
  if (args.provider === "openai" || args.provider === "gemini") return args.provider;
  if ((args.openaiKey || process.env.OPENAI_API_KEY || "").trim()) {
    if (!(args.geminiKey || process.env.GEMINI_API_KEY || "").trim()) return "openai";
  }
  return "gemini";
}

function flattenContentsToText(contents: AiContents): string {
  if (typeof contents === "string") return contents;
  return contents
    .flatMap((c) =>
      (c.parts || []).map((p: any) => (typeof p?.text === "string" ? p.text : ""))
    )
    .filter(Boolean)
    .join("\n");
}

function contentsToOpenAiMessages(contents: AiContents): Array<{
  role: "user" | "system" | "assistant";
  content: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
}> {
  if (typeof contents === "string") {
    return [{ role: "user", content: [{ type: "text", text: contents }] }];
  }
  return contents.map((c) => {
    const role = (c.role === "model" ? "assistant" : (c.role as any)) || "user";
    const content = (c.parts || []).map((p: any) => {
      if (typeof p?.text === "string") {
        return { type: "text" as const, text: p.text };
      }
      if (p?.inlineData?.data) {
        const mime = p.inlineData.mimeType || "image/jpeg";
        return {
          type: "image_url" as const,
          image_url: { url: `data:${mime};base64,${p.inlineData.data}` },
        };
      }
      return { type: "text" as const, text: "" };
    });
    return { role, content };
  });
}

async function callOpenAi(args: {
  apiKey: string;
  model: string;
  contents: AiContents;
}): Promise<string> {
  const messages = contentsToOpenAiMessages(args.contents);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({
      model: args.model,
      messages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.toString?.() || "";
}

async function callGemini(args: {
  apiKey: string;
  model: string;
  contents: AiContents;
}): Promise<string> {
  const ai = new GoogleGenAI(
    args.apiKey ? ({ apiKey: args.apiKey } as any) : ({} as any)
  );

  const response = await ai.models.generateContent({
    model: args.model,
    contents: args.contents as any,
  });

  return (response as any)?.text?.toString?.() || "";
}

export async function aiGenerateText(args: GenerateTextArgs): Promise<string> {
  const provider = pickProvider(args);

  const geminiKey = (args.geminiKey || process.env.GEMINI_API_KEY || "").trim();
  const openaiKey = (args.openaiKey || process.env.OPENAI_API_KEY || "").trim();

  const geminiModel = args.geminiModel || "gemini-2.5-flash";
  const openaiModel = args.openaiModel || "gpt-4o-mini";

  if (provider === "openai") {
    if (!openaiKey) {
      console.warn("aiGenerateText: openai requested but no key — fallback to gemini");
      return callGemini({ apiKey: geminiKey, model: geminiModel, contents: args.contents });
    }
    try {
      return await callOpenAi({ apiKey: openaiKey, model: openaiModel, contents: args.contents });
    } catch (error) {
      console.error("aiGenerateText openai failed, falling back to gemini:", error);
      if (geminiKey) {
        return callGemini({ apiKey: geminiKey, model: geminiModel, contents: args.contents });
      }
      throw error;
    }
  }

  return callGemini({ apiKey: geminiKey, model: geminiModel, contents: args.contents });
}

export function pickProviderFromBot(bot: any): {
  provider: AiProvider;
  geminiKey: string;
  openaiKey: string;
} {
  const conn = bot?.connectionConfig || {};
  return {
    provider: conn.aiProvider === "openai" ? "openai" : "gemini",
    geminiKey: conn.geminiApiKey || "",
    openaiKey: conn.openaiApiKey || "",
  };
}

export type { AiProvider };
