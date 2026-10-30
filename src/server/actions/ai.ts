"use server";

import "server-only";
import Groq from "groq-sdk";

const GROQ_API_KEY = process.env.GROQ_API_KEY ?? process.env.NEXT_PUBLIC_GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

let groq: Groq | null = null;

const GROQ_MODEL = "llama-3.1-8b-instant";
const OPENROUTER_MODEL = "openrouter/elephant-alpha";

interface AIChatOptions {
  mode?: "AI Koç" | "Soru Çözücü" | "Konu Anlatıcı" | string;
  examTarget?: "TYT" | "AYT" | string;
  deepThink?: boolean;
}

const callAI = async (
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  max_tokens = 1024
): Promise<string | undefined> => {
  const provider: string = "groq";

  if (provider === "openrouter") {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            typeof window !== "undefined"
              ? window.location.origin
              : "https://puaniz.app",
          "X-Title": "PuanIz YKS Asistan",
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: messages,
          temperature: 0.7,
          max_tokens: max_tokens,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenRouter API Error:", errText);
      throw new Error(`OpenRouter API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content;
  }

  if (provider === "groq") {
    if (!groq) {
      groq = new Groq({ apiKey: GROQ_API_KEY || "" });
    }
    const completion = await groq.chat.completions.create({
      messages,
      model: GROQ_MODEL,
      temperature: 0.7,
      max_tokens,
    });
    return completion.choices[0]?.message?.content || undefined;
  }
};

export const chatWithAI = async (
  message: string,
  context = "",
  options: AIChatOptions = {}
): Promise<string> => {
  try {
    const { mode = "AI Koç", examTarget = "TYT", deepThink = false } = options;

    let modeInstruction =
      "Sen YKS (Yükseköğretim Kurumları Sınavı) öğrencilerine rehberlik eden yardımsever ve motive edici bir yapay zeka asistanısın.";
    if (mode === "Soru Çözücü") {
      modeInstruction =
        "Sen YKS soru çözüm uzmanısın. Soruları adım adım, anlaşılır, formülleri ve pratik yöntemleri belirterek çözersin.";
    } else if (mode === "Konu Anlatıcı") {
      modeInstruction =
        "Sen YKS konu anlatım koçusun. Konuları sade, akılda kalıcı, şematik ve sınavda en çok çıkan noktalara odaklanarak anlatırsın.";
    }

    const deepThinkInstruction = deepThink
      ? "Öğrencinin talebini DERİNLEMESİNE, aşama aşama, hiçbir detayı atlamadan kapsamlı bir şekilde analiz et ve çok yönlü çözüm sun."
      : "Lütfen bu bağlamda öğrenciye kısa, öz ve net cevaplar ver.";

    const systemPrompt = `
      ${modeInstruction}
      Hedef Sınav Türü: ${examTarget}
      
      Öğrencinin sınav verileri ve durumu hakkında şu bilgilere sahipsin:
      ${context}

      ${deepThinkInstruction}
    `;

    const content = await callAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      deepThink ? 2048 : 1024
    );

    return content || "Cevap alınamadı.";
  } catch (error) {
    console.error("AI Chat Error:", error);
    return "Üzgünüm, şu an cevap veremiyorum. Lütfen daha sonra tekrar deneyin.";
  }
};

export const generateAnalysis = async (examData: unknown): Promise<string> => {
  try {
    const systemPrompt = `
      Aşağıdaki YKS deneme sınavı verilerini analiz et ve öğrenciye kısa, motive edici bir "Koçun Notu" yaz.
      Güçlü ve zayıf yönlerine değin ama çok uzun olmasın (maksimum 2-3 cümle).
      Samimi ve destekleyici bir dil kullan.
    `;

    const userPrompt = `
      Sınav Verileri:
      ${JSON.stringify(examData, null, 2)}
    `;

    const content = await callAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      1024
    );

    return content || "Analiz oluşturulamadı.";
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "Analiz şu an oluşturulamıyor.";
  }
};

export const generateWelcomeMessage = async (examData: unknown): Promise<string> => {
  try {
    const systemPrompt = `
      Kullanıcı sisteme giriş yaptı. Son deneme sınavı verilerine bakarak ona TEK CÜMLELİK, kısa, enerjik ve motive edici bir karşılama mesajı yaz.
      Eğer netleri artıyorsa bunu kutla, düşüyorsa moral ver.
      Asla sıkıcı olma, emoji kullan.
    `;

    const userPrompt = `
      Son 3 Sınav Verisi:
      ${JSON.stringify(examData, null, 2)}
    `;

    const content = await callAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      256
    );

    return content || "Hoşgeldin, bugün harika işler başaracaksın! 🚀";
  } catch (error) {
    console.error("AI Welcome Error:", error);
    return "Hoşgeldin, bugün harika işler başaracaksın! 🚀";
  }
};
