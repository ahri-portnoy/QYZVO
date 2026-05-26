import { Type } from "@google/genai";
import { BusinessProfile, KPI, Competitor, Project } from "../types";

export interface AIInsight {
  type: 'opportunity' | 'risk' | 'recommendation';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export const generateDashboardInsights = async (
  profile: BusinessProfile,
  projects: Project[]
): Promise<AIInsight[]> => {
  const prompt = `אתה משמש כטייס-משנה עסקי אסטרטגי (Business Intelligence Pilot). 
נתח את הנתונים העסקיים הבאים והפק תובנות אסטרטגיות חדות, יוזמות והתרעות על סיכונים.

פרופיל עסקי:
שם: ${profile.name}
תעשייה: ${profile.industry}
תיאור: ${profile.description}
יעדים: ${profile.goals?.join(', ')}

מדדי ביצוע (KPIs):
${profile.kpis?.map(k => `- ${k.name}: ${k.value} (סטטוס: ${k.status})`).join('\n')}

נוף תחרותי:
${profile.competitors?.map(c => `- ${c.name}: נתח שוק ${c.marketShare || 'N/A'}%, חוזקה: ${c.strength}, חולשה: ${c.weakness}`).join('\n')}

פרויקטים פעילים:
${projects.map(p => `- ${p.title}: ${p.description} (סטטוס: ${p.status})`).join('\n')}

הפק בדיוק 4 תובנות אסטרטגיות. לכל תובנה ציין סוג (opportunity, risk, recommendation), כותרת, תיאור קצר ורמת עדיפות (high, medium, low).
התשובה חייבת להיות בעברית.`;

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: ['opportunity', 'risk', 'recommendation'] },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] }
      },
      required: ['type', 'title', 'description', 'priority']
    }
  };

  const response = await fetch('/api/gemini/insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, schema })
  });

  return await response.json();
};
