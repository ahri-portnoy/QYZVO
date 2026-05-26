import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, GenerateVideosOperation, Modality } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize Firebase Admin
let firebaseConfig: any;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log("[Firebase] Config loaded. Target project:", firebaseConfig.projectId);
  } else {
    console.warn("[Firebase] Config missing. Falling back to env.");
    firebaseConfig = { projectId: process.env.GOOGLE_CLOUD_PROJECT };
  }
} catch (e) {
  console.error("[Firebase] Config load failed:", e);
  firebaseConfig = { projectId: process.env.GOOGLE_CLOUD_PROJECT };
}

// Global state
let db: any;

function initFirebaseApp() {
  if (getApps().length) return getApps()[0];
  
  const envProjectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  const configProjectId = firebaseConfig.projectId;
  
  // Prefer the project where the app is actually running to ensure ADC matches, 
  // but fallback to config if env is missing.
  const targetProjectId = envProjectId || configProjectId;
  
  console.log(`[Firebase] Initializing with ProjectID: ${targetProjectId} (Config: ${configProjectId})`);
  
  try {
    return initializeApp({
      projectId: targetProjectId,
    });
  } catch (e: any) {
    console.warn("[Firebase] App initialization warning:", e.message);
    return initializeApp();
  }
}

async function initializeFirestore() {
  if (db) return; 

  const appInstance = initFirebaseApp();
  
  const configDbId = firebaseConfig.firestoreDatabaseId || "(default)";
  console.log(`[Firestore] Target Database ID: ${configDbId}`);

  // Test primary candidate, then fallback to (default)
  const candidates = [configDbId, "(default)"];
  const uniqueCandidates = Array.from(new Set(candidates));

  for (const dbId of uniqueCandidates) {
    try {
      console.log(`[Firestore] Verifying candidate: ${dbId}`);
      const instance = (dbId === "(default)") ? getFirestore(appInstance) : getFirestore(appInstance, dbId);
      
      // Verification check - bypasses rules as admin
      await instance.collection('_health').limit(1).get();
      
      db = instance;
      console.log(`[Firestore] Success! Using database instance: ${dbId}`);
      return;
    } catch (e: any) {
      console.warn(`[Firestore] Candidate ${dbId} failed: ${e.message}`);
    }
  }

  console.error("[Firestore] All verification candidates failed. Using default instance as last resort.");
  db = getFirestore(appInstance);
}

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

/**
 * Cost-Saving Memory Layer: 
 * Fetches and manages conversational context from Firestore.
 */
async function getBusinessMemory(userId: string) {
  const path = `businessProfiles/${userId || "anonymous"}`;
  try {
    if (!db) await initializeFirestore(); 
    const memoryDoc = await db.doc(path).get();
    return memoryDoc.exists ? memoryDoc.data() : null;
  } catch (error: any) {
    console.error(`Firestore Memory Fetch error for ${path}:`, error.message);
    return null;
  }
}

async function saveBusinessMemory(userId: string, updates: any) {
  const path = `businessProfiles/${userId || "anonymous"}`;
  try {
    if (!db) await initializeFirestore();
    if (!userId || userId === 'anonymous') return;
    const memoryRef = db.doc(path);
    const existing = await memoryRef.get();
    if (existing.exists) {
      await memoryRef.update({ ...updates, updatedAt: new Date().toISOString() });
    } else {
      await memoryRef.set({ ...updates, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
  } catch (error: any) {
    console.error(`Firestore Memory Save error for ${path}:`, error.message);
  }
}

/**
 * Global Configuration Layer:
 * Fetches instructions that apply to all users (global training).
 */
async function getGlobalPilotConfig() {
  const path = "appConfig/pilot";
  try {
    if (!db) await initializeFirestore();
    const configDoc = await db.doc(path).get();
    return configDoc.exists ? configDoc.data() : null;
  } catch (error: any) {
    if (error.code === 5 || error.message?.includes("NOT_FOUND")) {
      console.warn(`[Firestore] Global config not found at ${path}. This is expected for new apps.`);
      return null;
    }
    console.error(`Firestore Global Config Fetch error for ${path}:`, error.message);
    return null;
  }
}

async function saveGlobalPilotConfig(updates: any) {
  const path = "appConfig/pilot";
  try {
    if (!db) await initializeFirestore();
    const configRef = db.doc(path);
    const existing = await configRef.get();
    if (existing.exists) {
      await configRef.update({ ...updates, updatedAt: new Date().toISOString() });
    } else {
      await configRef.set({ ...updates, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
  } catch (error: any) {
    console.error(`Firestore Global Config Save error for ${path}:`, error.message);
  }
}

// API Routes
app.get("/api/health", async (req, res) => {
  try {
    if (!db) await initializeFirestore();
    const snap = await db.collection('_health').limit(1).get();
    res.json({ 
      status: "ok", 
      firestore: "connected",
      databaseId: firebaseConfig.firestoreDatabaseId || "(default)",
      project: process.env.GOOGLE_CLOUD_PROJECT || "unknown"
    });
  } catch (error: any) {
    res.status(500).json({ 
      status: "error", 
      firestore: "not connected", 
      error: error.message 
    });
  }
});

/**
 * Admin check: Verification against Firestore 'admins' collection.
 */
async function isUserAdmin(userId: string) {
  if (!userId) return false;
  try {
    if (!db) await initializeFirestore();
    
    // check existence in admins collection
    const adminDoc = await db.doc(`admins/${userId}`).get();
    if (adminDoc.exists) return true;

    // Failsafe for the primary account owner
    const userDoc = await db.doc(`users/${userId}`).get();
    if (userDoc.exists && userDoc.data().email === 'kodkode10@gmail.com') {
      // Automatically provision admin status if found
      await db.doc(`admins/${userId}`).set({ 
        email: userDoc.data().email, 
        role: 'super_admin',
        createdAt: new Date().toISOString()
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Admin check failure for ${userId}:`, error);
    return false;
  }
}

app.get("/api/pilot/config", async (req, res) => {
  const userId = req.query.userId as string;
  if (!await isUserAdmin(userId)) {
    return res.status(403).json({ error: "Access denied: Admin only." });
  }
  const config = await getGlobalPilotConfig();
  res.json(config || { globalSystemInstructions: "" });
});

app.post("/api/pilot/config", async (req, res) => {
  const { globalSystemInstructions, userId } = req.body;
  if (!await isUserAdmin(userId)) {
    return res.status(403).json({ error: "Access denied: Admin only." });
  }
  await saveGlobalPilotConfig({ globalSystemInstructions });
  res.json({ status: "ok" });
});

app.post("/api/pilot/generate", async (req, res) => {
  const maxRetries = 3;
  const { messages, systemInstruction, tools, toolConfig, userId } = req.body;

  // Global Training Layer: Fetch instructions for all users
  const globalConfig = await getGlobalPilotConfig();
  const globalInstructions = globalConfig?.globalSystemInstructions 
    ? `\n\n--- global pilot training (DNA) ---\n${globalConfig.globalSystemInstructions}\n-----------------------------------\n`
    : "";

  // Cost Optimization: Inject persistent memory from Firebase
  const persistentMemory = await getBusinessMemory(userId);
  const memoryContext = persistentMemory 
    ? `\n\n--- persistent organizational memory ---\n${JSON.stringify(persistentMemory)}\n----------------------------------------\n`
    : "";

  const finalSystemInstruction = `${systemInstruction}${globalInstructions}${memoryContext}`;

  // Set headers for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: messages,
        config: {
          systemInstruction: finalSystemInstruction,
          tools,
          toolConfig,
          thinkingConfig: { thinkingLevel: "LOW" as any }
        }
      });

      let fullText = "";
      let functionCalls: any[] = [];
      let groundingMetadata: any = undefined;

      for await (const chunk of result) {
        if (chunk.text) {
          fullText += chunk.text;
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
        if (chunk.functionCalls) {
          functionCalls = [...functionCalls, ...chunk.functionCalls];
        }
        if (chunk.candidates?.[0]?.groundingMetadata) {
          groundingMetadata = chunk.candidates[0].groundingMetadata;
        }
      }

      // Final metadata
      res.write(`data: ${JSON.stringify({ 
        done: true, 
        fullText,
        functionCalls, 
        groundingMetadata
      })}\n\n`);
      return res.end();

    } catch (error: any) {
      console.error(`Pilot generation attempt ${attempt} failed:`, error);
      
      const isQuotaError = error.message?.includes("429") || error.status === 429;
      
      if (isQuotaError && attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      const errorMsg = isQuotaError 
        ? "המערכת בעומס רגעי. אנא נסה שוב בעוד מספר שניות." 
        : error.message;
      
      res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
      return res.end();
    }
  }
});

app.post("/api/gemini/insights", async (req, res) => {
  try {
    const { prompt, schema, cacheKey } = req.body;
    
    // Cost Optimization: Check cache first
    if (cacheKey) {
      const cacheRef = db.doc(`insights_cache/${cacheKey}`);
      const cached = await cacheRef.get();
      if (cached.exists) {
        const data = cached.data();
        if (data) {
          const age = Date.now() - new Date(data.createdAt).getTime();
          if (age < 24 * 60 * 60 * 1000) {
            console.log("Returning cached insights for:", cacheKey);
            return res.json(data.insights);
          }
        }
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    
    const insights = JSON.parse(response.text || '[]');
    
    // Save to cache
    if (cacheKey) {
      console.log("Caching insights for:", cacheKey);
      await db.doc(`insights_cache/${cacheKey}`).set({
        insights,
        createdAt: new Date().toISOString()
      });
    }

    res.json(insights);
  } catch (error: any) {
    console.error("Insights generation error:", error);
    if (error.message?.includes("429") || error.status === 429) {
      return res.status(429).json({ error: "מכסת התובנות נוצלה במלואה. נסה שנית בעוד זמן קצר." });
    }
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/gemini/update-memory", async (req, res) => {
  try {
    const { prompt, schema, userId } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const updates = JSON.parse(response.text || '{}');
    
    // Cost Optimization: Persist to Firestore
    if (Object.keys(updates).length > 0) {
      console.log("Updating Firestore memory for user:", userId);
      await saveBusinessMemory(userId, updates);
    }

    res.json(updates);
  } catch (error: any) {
    console.error("Memory update error:", error);
    if (error.message?.includes("429") || error.status === 429) {
       return res.status(429).json({ error: "מכסת הזיכרון הארגוני נוצלה. העדכון יישמר מקומית בלבד כרגע." });
    }
    res.status(500).json({ error: error.message });
  }
});

// Video Generation (Veo)
app.post("/api/generate-video", async (req, res) => {
  try {
    const { prompt, resolution = '1080p', aspectRatio = '16:9' } = req.body;
    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-lite-generate-preview',
      prompt,
      config: {
        numberOfVideos: 1,
        resolution,
        aspectRatio
      }
    });
    res.json({ operationName: operation.name });
  } catch (error: any) {
    console.error("Video generation start error:", error);
    if (error.message?.includes("429") || error.status === 429) {
      return res.status(429).json({ error: "מכסת ייצור הוידאו נוצלה. אנא המתן מספר דקות." });
    }
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/video-status", async (req, res) => {
  try {
    const { operationName } = req.body;
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    res.json({ done: updated.done, response: updated.response, error: updated.error });
  } catch (error: any) {
    console.error("Video status check error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/video-download", async (req, res) => {
  try {
    const { operationName } = req.body;
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    
    if (!updated.done) {
      return res.status(400).json({ error: "Operation not complete" });
    }

    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) {
      return res.status(404).json({ error: "Video URI not found" });
    }

    const videoRes = await fetch(uri, {
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY as string },
    });

    if (!videoRes.ok) {
      throw new Error(`Failed to fetch video from Google: ${videoRes.statusText}`);
    }

    res.setHeader('Content-Type', 'video/mp4');
    const reader = videoRes.body?.getReader();
    if (!reader) throw new Error("No body reader");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (error: any) {
    console.error("Video download error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Image Generation
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt, aspectRatio = '1:1' } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio,
        },
      },
    });

    let base64Image = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        base64Image = part.inlineData.data;
        break;
      }
    }

    if (!base64Image) {
      throw new Error("No image data returned from Gemini");
    }

    res.json({ imageUrl: `data:image/png;base64,${base64Image}` });
  } catch (error: any) {
    console.error("Image generation error:", error);
    if (error.message?.includes("429") || error.status === 429) {
      return res.status(429).json({ error: "מכסת ייצור התמונות נוצלה. אנא נסה שוב בעוד זמן קצר." });
    }
    res.status(500).json({ error: error.message });
  }
});

// Speech Generation (TTS)
app.post("/api/generate-speech", async (req, res) => {
  try {
    const { text, voice = 'Zephyr' } = req.body;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice as any },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data returned from Gemini");
    }

    res.json({ audio: base64Audio });
  } catch (error: any) {
    console.error("Speech generation error:", error);
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  // Ensure Firestore is initialized before answering requests
  await initializeFirestore();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler - Must be last middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Global Error Caught:", err);
    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error",
      path: req.path
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
