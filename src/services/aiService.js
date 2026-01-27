import Groq from "groq-sdk";

const API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;

let groq = null;

const initGroq = () => {
  if (!API_KEY) {
    console.error("Groq API key is missing. Please set VITE_GROQ_API_KEY in your .env file.");
    return false;
  }
  if (!groq) {
    groq = new Groq({ apiKey: API_KEY, dangerouslyAllowBrowser: true });
  }
  return true;
};

// const MODEL = "llama-3.1-8b-instant";
const MODEL = "groq/compound";

export const chatWithAI = async (message, context = "") => {
  if (!initGroq()) return "API Key eksik. Lütfen ayarlarınızı kontrol edin.";

  try {
    const systemPrompt = `
      Sen YKS (Yükseköğretim Kurumları Sınavı) öğrencilerine rehberlik eden yardımsever ve motive edici bir yapay zeka asistanısın.
      Öğrencinin sınav verileri ve durumu hakkında şu bilgilere sahipsin:
      ${context}

      Lütfen bu bağlamda öğrenciye kısa, öz ve motive edici bir cevap ver.
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      model: MODEL,
      temperature: 0.7,
      max_tokens: 1024,
    });

    return completion.choices[0]?.message?.content || "Cevap alınamadı.";
  } catch (error) {
    console.error("Groq Chat Error:", error);
    return "Üzgünüm, şu an cevap veremiyorum. Lütfen daha sonra tekrar deneyin.";
  }
};

export const generateAnalysis = async (examData) => {
  if (!initGroq()) return "Analiz oluşturulamadı: API Key eksik.";

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

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: MODEL,
      temperature: 0.7,
      max_tokens: 1024,
    });

    return completion.choices[0]?.message?.content || "Analiz oluşturulamadı.";
  } catch (error) {
    console.error("Groq Analysis Error:", error);
    return "Analiz şu an oluşturulamıyor.";
  }
};

export const generateWelcomeMessage = async (examData) => {
  if (!initGroq()) return "Hoşgeldin, hedeflerin seni bekliyor! 🚀";

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

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: MODEL,
      temperature: 0.7,
      max_tokens: 256,
    });

    return completion.choices[0]?.message?.content || "Hoşgeldin, bugün harika işler başaracaksın! 🚀";
  } catch (error) {
    console.error("Groq Welcome Error:", error);
    return "Hoşgeldin, bugün harika işler başaracaksın! 🚀";
  }
};
