import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Monitor, Zap, BrainCircuit, Sparkles, Smartphone, Bell, Chrome } from 'lucide-react';
import { VisualFixer } from '../VisualFixer';

interface InterfaceTabProps {
  colors: any;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

const InterfaceTab: React.FC<InterfaceTabProps> = ({ colors, theme, setTheme }) => {
  const isRTL = document.dir === 'rtl';

  const [mobileOnly, setMobileOnly] = useState(() => {
    const saved = localStorage.getItem('mobile_notifications_only');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleMobileOnly = () => {
    const newValue = !mobileOnly;
    setMobileOnly(newValue);
    localStorage.setItem('mobile_notifications_only', String(newValue));
    window.dispatchEvent(new Event('storage'));
  };

  const t = {
    light: 'בהיר',
    lightDesc: 'נקי, מודרני וקריא',
    dark: 'כהה',
    darkDesc: 'אלגנטי, עמוק וממוקד',
    aiTitle: 'יכולות AI',
    aiSubtitle: 'בחר פרוטוקולים אינטליגנטיים פעילים',
    systemNote: 'הערת מערכת',
    systemDesc: 'שינוי שכבת ערכת הנושא משפיע על כל מודולי QYZVO בזמן אמת. הלוגיקה החזותית, כולל צבעי הצ\'אט ויחסי הניגודיות, מכויילת מחדש באופן אוטומטי כדי לשמור על בהירות טקטית אופטימלית ודומיננטיות משתמש.',
    capabilities: [
      { label: 'סינתזת תמונה', desc: 'צור נכסים חזותיים ממושגים מופשטים', icon: '🖼️', active: true, accent: 'bg-rose-500' },
      { label: 'תנועה קולנועית', desc: 'צור רצפי וידאו מנתונים סטטיים', icon: '📹', active: true, accent: 'bg-blue-500' },
      { label: 'חיפוש יודע-כל', desc: 'אפשר אינדוקס מידע גלובלי בזמן אמת', icon: '🔍', active: true, accent: 'bg-teal-500' }
    ]
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { id: 'light', label: t.light, desc: t.lightDesc, icon: Monitor },
          { id: 'dark', label: t.dark, desc: t.darkDesc, icon: Zap }
        ].map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setTheme(item.id as any)}
            className={`p-8 rounded-[32px] border-2 text-start transition-all flex flex-col gap-4 relative overflow-hidden ${
              theme === item.id 
                ? 'border-primary bg-primary/10 shadow-2xl shadow-primary/20'
                : `${colors.card} border-transparent opacity-60 hover:opacity-100`
            }`}
          >
            {theme === item.id && (
              <div className="absolute top-4 end-4">
                <div className={`w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_12px_rgba(212,175,55,0.8)] animate-pulse`} />
              </div>
            )}
            <div className={`p-4 rounded-2xl w-fit ${theme === item.id ? 'bg-primary text-black' : `${colors.bgMain} ${colors.text}`} shadow-sm`}>
              <item.icon size={24} />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${theme === item.id ? 'text-primary' : colors.text} mb-1 uppercase tracking-tight`}>{item.label}</h3>
              <p className={`text-xs ${colors.textMuted} font-medium leading-relaxed`}>{item.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-primary/10 text-primary shadow-inner">
              <Zap size={24} className="fill-current" />
            </div>
            <div className="text-start">
              <h2 className={`text-2xl font-bold ${colors.text} tracking-tight`}>{t.aiTitle}</h2>
              <p className={`text-sm ${colors.textMuted}`}>{t.aiSubtitle}</p>
            </div>
          </div>
        </div>

        <div className={`p-2 rounded-[40px] ${colors.card} border flex flex-col divide-y ${theme === 'light' ? 'divide-slate-100' : 'divide-white/5'} overflow-hidden`}>
          {t.capabilities.map((cap, i) => (
            <div key={i} className="p-7 flex items-center justify-between group hover:bg-white/[0.02] transition-colors first:rounded-t-[38px] last:rounded-b-[38px]">
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl ${theme === 'light' ? 'bg-slate-100' : 'bg-white/5'} flex items-center justify-center text-2xl relative group-hover:scale-110 transition-transform shadow-inner`}>
                  <span>{cap.icon}</span>
                  <div className={`absolute -top-1 -end-1 w-4 h-4 rounded-full border-2 ${theme === 'light' ? 'border-white' : 'border-black'} ${cap.accent} opacity-40 shadow-sm`} />
                </div>
                <div className="text-start">
                  <h4 className={`text-lg font-bold ${colors.text} tracking-tight`}>{cap.label}</h4>
                  <p className={`text-sm ${colors.textMuted}`}>{cap.desc}</p>
                </div>
              </div>
              <div className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-all duration-300 ${cap.active ? 'bg-primary' : 'bg-white/10'}`}>
                <div className={`w-6 h-6 rounded-full bg-white shadow-xl transition-all duration-300 ${cap.active ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-primary/10 text-primary shadow-inner">
            <Smartphone size={24} />
          </div>
          <div className="text-start">
            <h2 className={`text-2xl font-bold ${colors.text} tracking-tight`}>התקנה בנייד וסנכרון התראות</h2>
            <p className={`text-sm ${colors.textMuted}`}>נהל שידור התראות והתקנת אפליקציית QYZVO במכשירי טלפון</p>
          </div>
        </div>

        <div className={`p-8 rounded-[40px] ${colors.card} border space-y-8`}>
          <div className="flex items-center justify-between gap-6 pb-6 border-b border-white/5">
            <div className="text-start flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Bell size={16} className="text-primary animate-pulse" />
                <h4 className={`text-lg font-bold ${colors.text} tracking-tight`}>שלח התראות דחיפה לנייד בלבד</h4>
              </div>
              <p className={`text-sm ${colors.textMuted}`}>כשהפעיל, שידור התראות דוחף של מלאי נמוך ואזל-מהמלאי יישלח אך ורק למכשירי הטלפון שלך (PWA), וימנע הצפת חלונות מעצבנים בזמן עבודה מהמחשב הנייח.</p>
            </div>
            <div 
              onClick={toggleMobileOnly}
              className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-all duration-300 flex-shrink-0 ${mobileOnly ? 'bg-primary' : 'bg-white/10'}`}
              dir="ltr"
            >
              <div className={`w-6 h-6 rounded-full bg-white shadow-xl transition-all duration-300 ${mobileOnly ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
            {/* iOS installation */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm font-bold"></div>
                <h5 className={`font-bold ${colors.text}`}>הוראות התקנה ב-iPhone ו-iPad</h5>
              </div>
              <ol className={`list-decimal list-inside text-xs ${colors.textMuted} space-y-3 text-start font-medium leading-relaxed`}>
                <li>פתח את הדפדפן <strong className="text-primary">Safari</strong> והכנס לקישור של האפליקציה במכשיר הנייד.</li>
                <li>לחץ על כפתור <strong className="text-primary">שיתוף (Share)</strong> בתחתית המסך (אייקון של ריבוע עם חץ מופנה מעלה).</li>
                <li>גלול מטה ובחר באפשרות <strong className="text-primary">"הוסף למסך הבית" (Add to Home Screen)</strong>.</li>
                <li>אשר את הוספת השם והמשך. האייקון של QYZVO יתווסף למסך הבית שלך כאפליקציה מלאה ללא כותרות דפדפן!</li>
                <li>פתחו את האפליקציה ממסך הבית ואשרו קבלת התראות (בועת Push) כדי להפעיל סנכרון התרעה אוטומטי.</li>
              </ol>
            </div>

            {/* Android installation */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm">
                  <Chrome size={14} className="text-emerald-400" />
                </div>
                <h5 className={`font-bold ${colors.text}`}>הוראות התקנה במכשירי Android</h5>
              </div>
              <ol className={`list-decimal list-inside text-xs ${colors.textMuted} space-y-3 text-start font-medium leading-relaxed`}>
                <li>פתח את דפדפן <strong className="text-primary">Chrome</strong> במכשיר הנייד שלך.</li>
                <li>לחץ על כפתור התפריט של <strong className="text-primary">שלוש הנקודות</strong> בפינה העליונה.</li>
                <li>בחר באפשרות <strong className="text-primary">"התקן אפליקציה" (Install App / Add to Home Screen)</strong>.</li>
                <li>בחלון הקופץ שבו מופיע אישור זריז - לחץ על <strong className="text-primary">התקן / הוסף</strong>.</li>
                <li>אפליקציית המלאי תושלם وتפתח כמערכת קצה טקטי עצמאית ונקייה עם תמיכה מלאה בהתראות דחיפה בנייד!</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className={`p-8 rounded-[40px] ${colors.card} border-dashed border relative overflow-hidden`}>
        <div className="absolute top-0 start-0 w-1 h-full bg-primary/20" />
        <div className="flex items-center gap-4 opacity-50 mb-4">
          <Sparkles size={18} className="text-primary" />
          <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${colors.text}`}>{t.systemNote}</p>
        </div>
        <p className={`text-sm ${colors.textMuted} leading-relaxed text-start max-w-3xl`}>
          {t.systemDesc}
        </p>
      </div>

      <div className="pt-8 border-t border-white/5">
        <VisualFixer theme={theme} />
      </div>
    </motion.div>
  );
};

export default InterfaceTab;
