import { BusinessProfile, Project, User } from '../types';

/**
 * Storage provider for local-first persistence.
 * Note: Could be swapped with Firebase in the future.
 */
export class StorageProvider {
  private static PROFILE_KEY = 'qyzvo_business_profile';
  private static PROJECTS_KEY = 'qyzvo_projects';
  private static CHAT_HISTORY_KEY = 'qyzvo_chat_history';
  private static ARCHIVED_CHATS_KEY = 'qyzvo_archived_chats';
  private static USER_KEY = 'qyzvo_auth_user';
  private static THEME_KEY = 'qyzvo_theme';

  private static safeGetItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error(`Storage Read Error [${key}]:`, e);
      return null;
    }
  }

  private static safeSetItem(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch (e: any) {
      console.error(`Storage Write Error [${key}]:`, e);
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        // If quota exceeded, try to clear non-essential data or trim this specific key
        if (key === this.CHAT_HISTORY_KEY || key === this.ARCHIVED_CHATS_KEY) {
          try {
            const data = JSON.parse(value);
            if (Array.isArray(data) && data.length > 5) {
              // Trim to last 5 items and try again once
              this.safeSetItem(key, JSON.stringify(data.slice(-5)));
            }
          } catch (parseErr) {
            localStorage.removeItem(key);
          }
        }
      }
    }
  }

  static getTheme(): 'dark' | 'light' {
    const data = this.safeGetItem(this.THEME_KEY);
    return (data as any) === 'dark' ? 'dark' : 'light';
  }

  static saveTheme(theme: 'dark' | 'light') {
    this.safeSetItem(this.THEME_KEY, theme);
  }

  static getUser(): User | null {
    const data = this.safeGetItem(this.USER_KEY);
    try {
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to parse User JSON:', e);
      return null;
    }
  }

  static saveUser(user: User | null) {
    if (user) {
      this.safeSetItem(this.USER_KEY, JSON.stringify(user));
    } else {
      try {
        localStorage.removeItem(this.USER_KEY);
      } catch (e) {
        console.error('Storage Remove Error [USER]:', e);
      }
    }
  }

  static getProfile(): BusinessProfile | null {
    const data = this.safeGetItem(this.PROFILE_KEY);
    try {
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to parse Profile JSON:', e);
      return null;
    }
  }

  static saveProfile(profile: BusinessProfile) {
    this.safeSetItem(this.PROFILE_KEY, JSON.stringify({
      ...profile,
      updatedAt: new Date().toISOString()
    }));
  }

  static getProjects(): Project[] {
    const data = this.safeGetItem(this.PROJECTS_KEY);
    try {
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse Projects JSON:', e);
      return [];
    }
  }

  static saveProjects(projects: Project[]) {
    this.safeSetItem(this.PROJECTS_KEY, JSON.stringify(projects));
  }

  static getChatHistory(): any[] {
    const data = this.safeGetItem(this.CHAT_HISTORY_KEY);
    try {
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse Chat History JSON:', e);
      return [];
    }
  }

  static saveChatHistory(history: any[]) {
    this.safeSetItem(this.CHAT_HISTORY_KEY, JSON.stringify(history));
  }

  static archiveChat(history: any[]) {
    if (history.length <= 1) return;
    try {
      const archives = this.getArchivedChats();
      const newArchive = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        preview: history.find(m => m.role === 'user')?.content?.substring(0, 50) || 'Strategic Session',
        messages: history
      };
      this.safeSetItem(this.ARCHIVED_CHATS_KEY, JSON.stringify([newArchive, ...archives].slice(0, 10)));
    } catch (e) {
      console.error('Archive Chat Error:', e);
    }
  }

  static getArchivedChats(): any[] {
    const data = this.safeGetItem(this.ARCHIVED_CHATS_KEY);
    try {
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse Archived Chats JSON:', e);
      return [];
    }
  }

  static getSecurityEvents(): import('../types').SecurityEvent[] {
    const data = this.safeGetItem('qyzvo_security_events');
    try {
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse Security Events JSON:', e);
    }
    
    return [
      {
        id: '1',
        type: 'login',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        status: 'success',
        description: 'התחברות מוצלחת ממכשיר מוכר',
        location: 'Tel Aviv, Israel',
        ip: '192.115.1.1',
        severity: 'low'
      },
      {
        id: '2',
        type: 'settings_update',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        status: 'success',
        description: 'עדכון הגדרות אבטחה: הצפנת קצה-לקצה הופעלה',
        severity: 'low'
      },
      {
        id: '3',
        type: 'permission_change',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        status: 'warning',
        description: 'גישת API מורחבת הוענקה ל-Google Drive',
        severity: 'medium'
      }
    ];
  }

  static addSecurityEvent(event: Omit<import('../types').SecurityEvent, 'id'>) {
    try {
      const events = this.getSecurityEvents();
      const newEvent = {
        ...event,
        id: Math.random().toString(36).substr(2, 9),
      };
      this.safeSetItem('qyzvo_security_events', JSON.stringify([newEvent, ...events].slice(0, 50)));
    } catch (e) {
      console.error('Add Security Event Error:', e);
    }
  }

  static reset() {
    try {
      localStorage.clear();
    } catch (e) {
      console.error('Storage Reset Error:', e);
    }
  }
}
