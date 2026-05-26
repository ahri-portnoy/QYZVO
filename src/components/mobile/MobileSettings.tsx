import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  Sparkles, 
  Settings as SettingsIcon,
  Activity, 
  Trash2, 
  Check, 
  X, 
  Moon, 
  Sun,
  Shield,
  Bell,
  Brain,
  Chrome,
  Smartphone,
  Info,
  Lock,
  Cpu
} from 'lucide-react';
import { User, BusinessProfile } from '../../types';
import { MobileHeader } from './MobileHeader';

interface MobileSettingsProps {
  user: User | null;
  profile: BusinessProfile | null;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  onUserUpdate: (updatedUser: User) => void | Promise<void>;
  onProfileUpdate: (newProfile: BusinessProfile) => void;
  onResetAll: () => Promise<void>;
  isRTL: boolean;
  onNavigate: (tab: string) => void;
}

export const MobileSettings: React.FC<MobileSettingsProps> = ({
  user,
  profile,
  theme,
  setTheme,
  onUserUpdate,
  onProfileUpdate,
  onResetAll,
  isRTL,
  onNavigate
}) => {
  // Input fields state
  const [formName, setFormName] = useState(user?.fullName || '');
  const [formBio, setFormBio] = useState(user?.bio || '');
  const [formPhone, setFormPhone] = useState(user?.phoneNumber || '');
  const [formBusinessName, setFormBusinessName] = useState(profile?.name || '');
  
  // Status & Confirmation overlays
  const [isSavedMsgOpen, setIsSavedMsgOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Push Notifications state
  const [mobileOnly, setMobileOnly] = useState(() => {
    const saved = localStorage.getItem('mobile_notifications_only');
    return saved !== null ? saved === 'true' : true;
  });

  // Pilot preference states
  const [activeAnalysis, setActiveAnalysis] = useState('Balanced');
  const [activeTone, setActiveTone] = useState('Professional');

  // AI capabilities switches
  const [imageSynthesis, setImageSynthesis] = useState(true);
  const [cinematicMotion, setCinematicMotion] = useState(true);
  const [omniscientSearch, setOmniscientSearch] = useState(true);

  // Install Tab state ('ios' | 'android')
  const [installTab, setInstallTab] = useState<'ios' | 'android'>('ios');

  const toggleMobileOnly = () => {
    const newValue = !mobileOnly;
    setMobileOnly(newValue);
    localStorage.setItem('mobile_notifications_only', String(newValue));
    window.dispatchEvent(new Event('storage'));
  };

  const handleSave = async () => {
    if (user) {
      await onUserUpdate({
        ...user,
        fullName: formName,
        bio: formBio,
        phoneNumber: formPhone
      });
    }

    if (profile) {
      onProfileUpdate({
        ...profile,
        name: formBusinessName
      });
    } else {
      onProfileUpdate({
        name: formBusinessName,
        industry: 'אדריכלות ושירותים',
        description: 'ניהול זריזות מלאי וספקים לבית עסק',
        goals: [],
        values: [],
        targetAudience: 'לקוחות קצה',
        kpis: [],
        competitors: [],
        updatedAt: new Date().toISOString()
      });
    }

    setIsSavedMsgOpen(true);
    setTimeout(() => setIsSavedMsgOpen(false), 3000);
  };

  const handleEmergencyReset = async () => {
    await onResetAll();
    setIsResetConfirmOpen(false);
    window.location.reload();
  };

  return (
    <div className="absolute inset-0 bg-[#fbf9f8] text-[#2D2924] pb-24 font-sans px-5 pt-4 overflow-y-auto" dir="rtl">
      {/* Header */}
      <MobileHeader user={user} onNavigate={onNavigate} />

      <div className="space-y-6 mb-8 text-right">
        <div>
          <h2 className="text-xl font-bold text-[#2D2924] tracking-tight">הגדרות מערכת</h2>
          <p className="text-xs text-[#7e766b] mt-0.5">סנכרון והתאמה של פרופיל ה-DNA ופעילות טייס ה-AI</p>
        </div>

        {/* 1. Profile Details Edit Card */}
        <div className="bg-white rounded-[24px] p-5 border border-[#6a5a3d]/5 shadow-[0_4px_20px_rgba(106,90,61,0.02)] space-y-4">
          <h3 className="font-bold text-sm text-[#6a5a3d] flex items-center gap-1.5 border-b pb-2 border-[#6a5a3d]/5">
            <UserIcon size={15} />
            פרופיל אישי וארגון
          </h3>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-[#7e766b] uppercase">שם מלא</label>
              <input 
                type="text" 
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="ישראל ישראלי..."
                className="w-full h-11 bg-[#fbf9f8] border border-[#6a5a3d]/10 rounded-xl px-4 text-xs font-semibold text-[#2D2924] outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-[#7e766b] uppercase">פרסונה / תפקיד</label>
              <input 
                type="text" 
                value={formBio}
                onChange={(e) => setFormBio(e.target.value)}
                placeholder="אדריכל ראשי ומייסד שותף..."
                className="w-full h-11 bg-[#fbf9f8] border border-[#6a5a3d]/10 rounded-xl px-4 text-xs font-semibold text-[#2D2924] outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#7e766b] uppercase">מספר טלפון</label>
                <input 
                  type="text" 
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="052-1234567..."
                  className="w-full h-11 bg-[#fbf9f8] border border-[#6a5a3d]/10 rounded-xl px-4 text-xs font-semibold text-[#2D2924] outline-none text-left"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#7e766b] uppercase">שם הארגון (Business DNA)</label>
                <input 
                  type="text" 
                  value={formBusinessName}
                  onChange={(e) => setFormBusinessName(e.target.value)}
                  placeholder="שם החברה..."
                  className="w-full h-11 bg-[#fbf9f8] border border-[#6a5a3d]/10 rounded-xl px-4 text-xs font-semibold text-[#2D2924] outline-none"
                />
              </div>
            </div>

            <button 
              onClick={handleSave}
              className="w-full py-3 bg-[#6a5a3d] hover:bg-[#8c7a5b] text-white font-bold text-xs rounded-full shadow-md active:scale-95 transition-all mt-2 cursor-pointer"
            >
              שמור שינויים ל-DNA
            </button>
          </div>
        </div>

        {/* 2. Global UI Theme & Push Notification Settings */}
        <div className="bg-white rounded-[24px] p-5 border border-[#6a5a3d]/5 shadow-[0_4px_20px_rgba(106,90,61,0.02)] space-y-5">
          <h3 className="font-bold text-sm text-[#6a5a3d] flex items-center gap-1.5 border-b pb-2 border-[#6a5a3d]/5">
            <Activity size={15} />
            קביעת ממשק והתראות
          </h3>

          <div className="flex items-center justify-between pb-2 border-b border-[#6a5a3d]/5">
            <div className="text-right">
              <h4 className="font-bold text-xs text-[#2D2924]">מראה המערכת (מחוץ לנייד)</h4>
              <p className="text-[10px] text-[#7e766b] mt-0.5">בחרו את ערכת הנושא של QYZVO.</p>
            </div>
            
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="px-4 py-2 rounded-full border border-[#6a5a3d]/20 text-[#6a5a3d] hover:bg-[#6a5a3d]/5 font-bold text-xs flex items-center gap-1.5 outline-none shadow-sm transition-all cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={13} />
                  מצב בהיר
                </>
              ) : (
                <>
                  <Moon size={13} />
                  מצב כהה
                </>
              )}
            </button>
          </div>

          {/* New Push Notification Setting Parity */}
          <div className="flex items-start justify-between gap-4">
            <div className="text-right flex-1">
              <div className="flex items-center gap-1.5 mb-1 text-amber-600">
                <Bell size={13} className="animate-pulse" />
                <h4 className="font-bold text-xs text-[#2D2924]">התראות דחיפה לנייד בלבד</h4>
              </div>
              <p className="text-[10px] text-[#7e766b] leading-relaxed">
                שידור וחיווי של מלאי קריטי והתרעות ספק ייעשו אך ורק במכשיר זה (PWA) כדי למנוע ספאם בחלונות עבודה בנייח.
              </p>
            </div>
            <div 
              onClick={toggleMobileOnly}
              className={`w-11 h-6 rounded-full p-0.5 cursor-pointer transition-all duration-300 flex-shrink-0 relative ${mobileOnly ? 'bg-[#6a5a3d]' : 'bg-black/10'}`}
              dir="ltr"
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 absolute ${mobileOnly ? 'right-0.5' : 'left-0.5'}`} />
            </div>
          </div>
        </div>

        {/* 3. Pilot Auto-Pilot Preferences (Parity from PilotPreferencesTab) */}
        <div className="bg-white rounded-[24px] p-5 border border-[#6a5a3d]/5 shadow-[0_4px_20px_rgba(106,90,61,0.02)] space-y-5">
          <h3 className="font-bold text-sm text-[#6a5a3d] flex items-center gap-1.5 border-b pb-2 border-[#6a5a3d]/5">
            <Cpu size={15} />
            העדפות טייס ה-AI
          </h3>

          {/* Analysis Depth */}
          <div className="space-y-2.5">
            <div className="text-right">
              <h4 className="font-bold text-xs text-[#2D2924]">עומק ניתוח אסטרטגי</h4>
              <p className="text-[10px] text-[#7e766b]">רמת הלוגיקה והמתווה שיילקחו בחשבון.</p>
            </div>
            <div className="grid grid-cols-3 gap-1.5 bg-[#fbf9f8] p-1 rounded-xl border border-[#6a5a3d]/5">
              {[
                { id: 'Conservative', label: 'שמרני' },
                { id: 'Balanced', label: 'מאוזן' },
                { id: 'Aggressive', label: 'אקטיבי' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setActiveAnalysis(opt.id)}
                  className={`py-2 rounded-lg text-[10px] font-black transition-all ${
                    activeAnalysis === opt.id 
                      ? 'bg-[#6a5a3d] text-white shadow-sm' 
                      : 'text-[#7e766b] hover:text-[#2D2924]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Tone */}
          <div className="space-y-2.5">
            <div className="text-right">
              <h4 className="font-bold text-xs text-[#2D2924]">טון הדיאלוג והתקשורת</h4>
              <p className="text-[10px] text-[#7e766b]">סגנון הפנייה המקצועי של הסוכן.</p>
            </div>
            <div className="grid grid-cols-3 gap-1.5 bg-[#fbf9f8] p-1 rounded-xl border border-[#6a5a3d]/5">
              {[
                { id: 'Concise', label: 'תמציתי' },
                { id: 'Professional', label: 'מקצועי' },
                { id: 'Friendly', label: 'ידידותי' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setActiveTone(opt.id)}
                  className={`py-2 rounded-lg text-[10px] font-black transition-all ${
                    activeTone === opt.id 
                      ? 'bg-[#6a5a3d] text-white shadow-sm' 
                      : 'text-[#7e766b] hover:text-[#2D2924]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Active AI Capabilities Settings Toggle Group (Parity from InterfaceTab) */}
        <div className="bg-white rounded-[24px] p-5 border border-[#6a5a3d]/5 shadow-[0_4px_20px_rgba(106,90,61,0.02)] space-y-4">
          <h3 className="font-bold text-sm text-[#6a5a3d] flex items-center gap-1.5 border-b pb-2 border-[#6a5a3d]/5">
            <Brain size={15} />
            יכולות AI אקטיביות
          </h3>

          <div className="space-y-3.5">
            {[
              { id: 'synthesis', label: 'סינתזת תמונה (Imagen)', desc: 'יצירת נכסים חזותיים למוצרים', state: imageSynthesis, setter: setImageSynthesis },
              { id: 'motion', label: 'תנועה קולנועית (Veo)', desc: 'רצף אופטימיזציה מתוך נתונים סטטיים', state: cinematicMotion, setter: setCinematicMotion },
              { id: 'search', label: 'חיפוש יודע-כל', desc: 'אינדוקס נתונים וGrounding חיצוני', state: omniscientSearch, setter: setOmniscientSearch },
            ].map((cap, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4 py-1">
                <div className="text-right flex-1">
                  <h4 className="font-bold text-xs text-[#2D2924]">{cap.label}</h4>
                  <p className="text-[10px] text-[#7e766b]">{cap.desc}</p>
                </div>
                <div 
                  onClick={() => cap.setter(!cap.state)}
                  className={`w-11 h-6 rounded-full p-0.5 cursor-pointer transition-all duration-300 flex-shrink-0 relative ${cap.state ? 'bg-[#6a5a3d]' : 'bg-black/10'}`}
                  dir="ltr"
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 absolute ${cap.state ? 'right-0.5' : 'left-0.5'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Progressive PWA Installation Instructions (Parity from InterfaceTab) */}
        <div className="bg-white rounded-[24px] p-5 border border-[#6a5a3d]/5 shadow-[0_4px_20px_rgba(106,90,61,0.02)] space-y-4">
          <h3 className="font-bold text-sm text-[#6a5a3d] flex items-center gap-1.5 border-b pb-2 border-[#6a5a3d]/5">
            <Smartphone size={15} />
            התקנה כאפליקציית PWA
          </h3>

          <div className="flex bg-[#fbf9f8] p-1 rounded-xl border border-[#6a5a3d]/5">
            <button 
              onClick={() => setInstallTab('ios')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${installTab === 'ios' ? 'bg-[#6a5a3d] text-white shadow-sm' : 'text-[#7e766b]'}`}
            >
               iOS (Apple)
            </button>
            <button 
              onClick={() => setInstallTab('android')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${installTab === 'android' ? 'bg-[#6a5a3d] text-white shadow-sm' : 'text-[#7e766b]'}`}
            >
              Android / Chrome
            </button>
          </div>

          <div className="pt-1 text-right">
            {installTab === 'ios' ? (
              <ol className="list-decimal list-inside text-[11px] text-[#7e766b] space-y-2.5 leading-relaxed">
                <li>פתחו את האפליקציה בדפדפן <strong className="text-secondary font-black">Safari</strong> בלבד.</li>
                <li>לחצו על כפתור <strong className="text-[#6a5a3d]">שיתוף (Share)</strong> בתחתית או ראש הדפדפן.</li>
                <li>גללו מטה ובחרו באפשרות <strong className="text-[#6a5a3d]">"הוסף למסך הבית" (Add to Home Screen)</strong>.</li>
                <li>אשרו את הוספת השם והמשך. מערכת QYZVO תותקן עצמאית ונקייה.</li>
                <li>פתחו את האפליקציה ממסך הבית ואפשרו קבלת התראות לניהול מלאי יזום.</li>
              </ol>
            ) : (
              <ol className="list-decimal list-inside text-[11px] text-[#7e766b] space-y-2.5 leading-relaxed">
                <li>פתחו את האפליקציה בדפדפן <strong className="text-[#6a5a3d] font-black">Google Chrome</strong>.</li>
                <li>לחצו על כפתור <strong className="text-[#6a5a3d]">שלוש הנקודות</strong> בפינה העליונה.</li>
                <li>בחרו באפשרות <strong className="text-[#6a5a3d]">"התקן אפליקציה" (Install App / Add to Home Screen)</strong>.</li>
                <li>אשרו את סימולציית ההתקנה בחיווי הקופץ.</li>
                <li>האפליקציה תתווסף למסך הבית ויאושרו התראות דחיפה בנייד ישירות.</li>
              </ol>
            )}
          </div>
        </div>

        {/* 6. Emergency resetting rules card */}
        <div className="bg-white rounded-[24px] p-5 border border-red-500/10 shadow-[0_4px_20px_rgba(106,90,61,0.01)] space-y-4">
          <h3 className="font-bold text-sm text-[#c5221f] flex items-center gap-1.5 border-b pb-2 border-red-500/5">
            <Shield size={15} />
            חרום ואיפוס מאובטח
          </h3>

          <div className="space-y-4">
            <p className="text-xs text-[#7e766b] leading-relaxed">
              לחיצה על כפתור זה תמחק לחלוטין את כל נתוני המלאי (מוצרים וספקים) מהדלי המאובטח ותאפס את DNA העסק לברירת מחדל של QYZVO ללא יכולת החזרה.
            </p>

            {isResetConfirmOpen ? (
              <div className="space-y-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                <p className="text-xs font-black text-[#c5221f] text-center mb-2">האם אתה בטוח לחלוטין?</p>
                <div className="flex gap-2">
                  <button 
                    onClick={handleEmergencyReset}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                  >
                    כן, מחק הכל
                  </button>
                  <button 
                    onClick={() => setIsResetConfirmOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs cursor-pointer"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsResetConfirmOpen(true)}
                className="w-full py-3 bg-red-50 hover:bg-red-100 text-[#c5221f] border border-red-200/50 rounded-full font-bold text-xs transition-all active:scale-95 cursor-pointer"
              >
                איפוס נהלי מערכת (חרום)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Save Toast overlay notification */}
      <AnimatePresence>
        {isSavedMsgOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-6 right-6 p-4 rounded-xl bg-[#6a5a3d] text-white flex items-center gap-2.5 shadow-xl z-[9999]"
          >
            <Check size={16} />
            <p className="text-xs font-bold font-sans">השינויים בוצעו ונשמרו בהצלחה ב-Business DNA!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
