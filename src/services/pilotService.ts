import { Type } from "@google/genai";
import { PILOT_SYSTEM_INSTRUCTION, BusinessProfile, Product, Supplier } from "../types";
import { StorageProvider } from "./storage";

export interface Attachment {
  mimeType: string;
  data: string; // base64
  name: string;
}

export async function getPilotResponse(
  messages: { role: 'user' | 'model'; content: string; attachments?: Attachment[] }[],
  businessContext: BusinessProfile | null,
  products: Product[],
  suppliers: Supplier[],
  onChunk: (chunk: { text?: string; done?: boolean; toolCalls?: any[]; groundingMetadata?: any }) => void,
  location?: { latitude: number; longitude: number; address?: string }
) {
  const archives = StorageProvider.getArchivedChats();
  const archivesSummary = archives.length > 0
    ? `\n\nPast Inventory Sessions (Archives):
${archives.map((a: any) => `- [${new Date(a.date).toLocaleDateString()}]: ${a.preview}`).join('\n')}`
    : "";

  const locationContext = location 
    ? `\n\nUser Current Location:
Latitude: ${location.latitude}
Longitude: ${location.longitude}
${location.address ? `Address: ${location.address}` : ''}`
    : "";

  const safeProducts = products || [];
  const safeSuppliers = suppliers || [];

  const contextString = businessContext 
    ? `Current Inventory Context (DNA):
Company: ${businessContext.name}
Industry: ${businessContext.industry || 'Unknown'}

Inventory Status:
Total Products: ${safeProducts.length}
Low Stock Items: ${safeProducts.filter(p => p.currentStock <= p.minThreshold).length}
Out of Stock: ${safeProducts.filter(p => p.currentStock === 0).length}

Sample Products:
${safeProducts.slice(0, 5).map(p => `- ${p.name} (SKU: ${p.sku}): Stock ${p.currentStock}, Threshold ${p.minThreshold}`).join('\n')}

Suppliers:
${safeSuppliers.map(s => `- ${s.name} (Lead Time: ${s.leadTimeDays}d)`).join('\n') || 'None'}${archivesSummary}${locationContext}`
    : `No company memory yet. Establish the enterprise core first.${locationContext}`;

  const fullPrompt = `${PILOT_SYSTEM_INSTRUCTION}\n\n${contextString}`;

  const mappedMessages = messages.map(m => {
    const parts: any[] = [{ text: m.content }];
    if (m.attachments) {
      m.attachments.forEach(att => {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data
          }
        });
      });
    }
    return { 
      role: m.role === 'model' ? 'model' : 'user', 
      parts 
    };
  });

  const user = StorageProvider.getUser();
  const userId = user?.id || 'anonymous';

  const response = await fetch('/api/pilot/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: mappedMessages,
      systemInstruction: fullPrompt,
      userId,
      tools: [
        { googleSearch: {} },
        {
          functionDeclarations: [
            {
              name: "propose_inventory_update",
              description: "Propose an update to products or suppliers. Requires user confirmation.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["product_add", "product_update", "stock_adjustment", "supplier_add"] },
                  data: {
                    type: Type.OBJECT,
                    description: "The object to add or update"
                  }
                },
                required: ["type", "data"]
              }
            },
            {
              name: "propose_theme_change",
              description: "Propose changing the UI theme. Requires user confirmation.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  theme: { type: Type.STRING, enum: ["light", "dark"] }
                },
                required: ["theme"]
              }
            },
            {
              name: "generate_image",
              description: "MANDATORY: Generate a professional product or warehouse visual using Imagen. The 'prompt' MUST be a highly detailed English visual description covering style, lighting, and composition. Always propose the prompt to the user first unless commanded directly.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  prompt: { type: Type.STRING, description: "Highly detailed English visual description" },
                  aspectRatio: { type: Type.STRING, enum: ["1:1", "16:9", "9:16", "3:2", "2:3"], description: "Optional aspect ratio" }
                },
                required: ["prompt"]
              }
            },
            {
              name: "generate_inventory_report",
              description: "Propose generating a comprehensive inventory health and burn rate report. Requires user confirmation.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  focus: { type: Type.STRING, enum: ["Stock Level", "Profitability", "Forecast"] }
                },
                required: ["title", "focus"]
              }
            },
            {
              name: "get_market_prices",
              description: "Perform a search for current market prices for a specific SKU or category to optimize procurement.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  sku: { type: Type.STRING, description: "Product SKU or Name" },
                  category: { type: Type.STRING }
                },
                required: ["sku"]
              }
            }
          ]
        }
      ],
      toolConfig: { includeServerSideToolInvocations: true }
    })
  });
  
  if (!response.ok) {
     if (response.status === 429) {
       throw new Error("מכסת השימוש ב-AI הסתיימה. נסה שוב בעוד דקה.");
     }
     throw new Error(`Server error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No readable stream available");

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.substring(6);
        try {
          const data = JSON.parse(jsonStr);
          if (data.error) throw new Error(data.error);
          onChunk({ 
            text: data.text, 
            done: data.done, 
            toolCalls: data.functionCalls, 
            groundingMetadata: data.groundingMetadata 
          });
        } catch (e) {
          console.warn("Error parsing stream chunk:", e);
        }
      }
    }
  }
}

/**
 * Use this to extract potential business facts from a user message.
 */
export async function updateBusinessMemory(
  message: string,
  currentProfile: BusinessProfile | null
) {
  const prompt = `Based on this message, update the business profile memory. 
Return the NEW profile as JSON. Only include fields that changed or are new. 
If nothing relevant is in the message, return {}.
Message: "${message}"
Current Memory: ${JSON.stringify(currentProfile)}`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      industry: { type: Type.STRING },
      description: { type: Type.STRING },
      goals: { type: Type.ARRAY, items: { type: Type.STRING } },
      values: { type: Type.ARRAY, items: { type: Type.STRING } },
      targetAudience: { type: Type.STRING },
      kpis: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            value: { type: Type.STRING },
            target: { type: Type.STRING },
            status: { type: Type.STRING, enum: ['On Track', 'At Risk', 'Off Track'] }
          }
        }
      },
      competitors: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            strength: { type: Type.STRING },
            weakness: { type: Type.STRING }
          }
        }
      }
    }
  };

  const user = StorageProvider.getUser();
  const userId = user?.id || 'anonymous';

  const response = await fetch('/api/gemini/update-memory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, schema, userId })
  });

  const updates = await response.json();
  return { ...currentProfile, ...updates };
}

export async function startVideoGeneration(prompt: string, aspectRatio: string = '16:9') {
  const response = await fetch('/api/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, aspectRatio })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.operationName;
}

export async function pollVideoStatus(operationName: string) {
  const response = await fetch('/api/video-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operationName })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export async function downloadVideo(operationName: string) {
  const response = await fetch('/api/video-download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operationName })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Download failed');
  }
  return await response.blob();
}

export async function generateImage(prompt: string, aspectRatio: string = '1:1') {
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, aspectRatio })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.imageUrl;
}

export async function generateSpeech(text: string, voice: 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir' = 'Zephyr') {
  const response = await fetch('/api/generate-speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.audio; // base64
}

