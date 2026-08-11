import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy Google GenAI Client
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "Sistem APBS SD Lazuardi GCS" });
});

// Gemini Assistant API for matching item descriptions with Kode APBS and checking budget logic
app.post("/api/ai-assistant", async (req, res) => {
  try {
    const { prompt, apbsItemsContext } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getAiClient();
    const systemInstruction = `Anda adalah Asisten Keuangan APBS untuk SD Lazuardi GCS Cinere.
Tugas Anda adalah membantu staf admin dan guru sekolah menganalisis pengajuan dana, mencocokkan deskripsi barang/kegiatan dengan Kode APBS yang tepat dari daftar kode APBS sekolah, mengecek sisa budget, dan memberikan saran penyesuaian/reokasi jika anggaran menipis atau melebihi alokasi.

Gunakan data konteks APBS yang diberikan jika relevan:
${JSON.stringify(apbsItemsContext || []).slice(0, 15000)}

Jawab dengan Bahasa Indonesia yang santun, jelas, terstruktur, dan profesional, lengkap dengan rekomendasi Kode APBS dan status ketersediaan anggaran.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const text = response.text || "Tidak ada respon dari AI.";
    res.json({ result: text });
  } catch (error: any) {
    console.error("AI Assistant API Error:", error);
    res.status(500).json({
      error: error.message || "Gagal memproses permintaan AI.",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server APBS Lazuardi running on http://localhost:${PORT}`);
  });
}

startServer();
