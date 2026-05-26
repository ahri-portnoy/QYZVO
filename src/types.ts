import { Type } from "@google/genai";

export const PILOT_SYSTEM_INSTRUCTION = `אתה QYZVO Agent — השותף העסקי הישיר, החד והפרואקטיבי של העסק. המטרה שלך היא להריץ ולייעל את העסק 24/7.

חובה לפעול לפי חוקי סוכן QYZVO:
1. מקצועי וישיר: אל תתחנף, אל תמרח. לך ישר לנקודה.
2. נאמנות לעסק: אם אתה רואה מוצרים שחסרים, בזבוז במלאי, או ספקים לא יעילים - דווח על כך בחדות.
3. פרואקטיביות: אל תחכה לפקודות. תציע לבנות את המלאי, להוסיף מוצרים שסביר שקיימים בענף הזה, ולנתח את ה-DNA העסקי.
4. תוצאות מעל הכל: אתה כאן כדי שהעסק יצליח, לא כדי להיות נחמד.

יכולות ניהול מלאי:
1. בניית מלאי אקטיבית: אם העסק חדש, תציע רשימת מוצרים בסיסית לענף שלו ותוסיף אותם (אחרי אישור).
2. עדכון מלאי מהיר: הוספה/הפחתה של כמויות, עדכון מחירים וקטגוריות.
3. קשרים עם ספקים: קישור כל מוצר לספק וניהול זמני אספקה.

חוקי אינטראקציה:
- אישור מפורש: תמיד תבקש אישור לפני ביצוע שינויים סופיים במאגר המוצרים או הספקים (שימוש בכלי propose_inventory_update).
- תמציתיות: שמור על תשובות קצרות ולעניין.`;

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface Product {
  id: string;
  ownerId: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minThreshold: number;
  unitPrice: number;
  supplierId: string;
  lastRestocked: string;
  burnRate?: number; // Usage per day
  daysRemaining?: number;
  imageUrl?: string;
}

export interface Supplier {
  id: string;
  ownerId: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  leadTimeDays: number;
  categories: string[];
}

export interface InventoryTransaction {
  id: string;
  ownerId: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  timestamp: string;
  reason: string;
  performedBy: string;
}

export interface InventoryStats {
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  topMovingProducts: string[];
  deadStockCount: number;
}

export interface BusinessProfile {
  name: string;
  industry: string;
  description: string;
  goals: string[];
  values: string[];
  targetAudience: string;
  kpis: KPI[];
  competitors: Competitor[];
  phoneNumber?: string;
  updatedAt?: string;
}

export interface KPI {
  name: string;
  value: string;
  target: string;
  status: 'On Track' | 'At Risk' | 'Off Track';
}

export interface Competitor {
  name: string;
  strength: string;
  weakness: string;
  marketShare?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'Idea' | 'Planned' | 'Active' | 'Completed';
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export interface SecurityEvent {
  id: string;
  type: 'access' | 'change' | 'alert' | 'login' | 'settings_update' | 'permission_change';
  description: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  status?: string;
  location?: string;
  ip?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'stock_low' | 'stock_empty' | 'supplier' | 'security' | 'general' | 'system';
  read: boolean;
  actionUrl?: string;
  itemId?: string;
}

