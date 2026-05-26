import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, Save, Loader2, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { User } from '../../types';

interface TrainingTabProps {
  colors: any;
  theme: 'dark' | 'light';
  user: User | null;
}

const TrainingTab: React.FC<TrainingTabProps> = ({ colors, theme, user }) => {
  const [instructions, setInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!user) return;
      try {
        const res = await fetch(`/api/pilot/config?userId=${user.id}`);
        const data = await res.json();
        setInstructions(data.globalSystemInstructions || '');
      } catch (error) {
        console.error("Failed to fetch global config:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/pilot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          globalSystemInstructions: instructions,
          userId: user.id
        })
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'DNA הליבה עודכן בהצלחה לכל המשתמשים.' });
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'שגיאה בעדכון ה-DNA. נסה שוב.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-bold uppercase tracking-widest text-primary/50">טוען פרוטוקול אימון...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
            <BrainCircuit className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className={`text-xl font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'} uppercase italic`}>
              אימון ליבה גלובלי
            </h3>
            <p className={`text-sm ${colors.textMuted} font-medium`}>
              הגדר הנחיות קבועות שיוזרקו לבינה המלאכותית עבור כל המשתמשים במערכת.
            </p>
          </div>
        </div>

        <div className={`p-6 rounded-[32px] ${colors.card} space-y-6 relative overflow-hidden group`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
          
          <div className="space-y-4 relative z-10">
            <div className={`flex items-start gap-4 p-4 rounded-2xl ${theme === 'light' ? 'bg-blue-50/50' : 'bg-blue-500/5'} border border-blue-500/20`}>
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className={`text-xs ${theme === 'light' ? 'text-blue-900' : 'text-blue-100'} leading-relaxed`}>
                כאן ניתן להגדיר לצאט איך להתנהג במצבים מסוימים, למשל: "אם המשתמש שואל שאלה מורכבת שאתה לא יודע לענות עליה, תנחה אותו לפנות לתמיכה האנושית במייל support@qyzvo.com".
              </p>
            </div>

            <label className={`block text-[11px] font-mono ${colors.textMuted} uppercase tracking-widest font-black`}>
              הנחיות מערכת (System DNA)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className={`w-full h-80 px-6 py-5 rounded-3xl ${colors.input} ${colors.text} text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all resize-none font-medium leading-relaxed border border-white/5 shadow-inner`}
              placeholder="כתוב כאן הנחיות אימון גלובליות... למשל: הנחיה לטיפול בשאלות קשות, טון דיבור ספציפי, או חוקים עסקיים קבועים."
            />
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-2">
              <div className="flex items-center gap-3">
                 <ShieldCheck className="w-4 h-4 text-emerald-500" />
                 <span className={`text-[10px] ${colors.textMuted} font-bold uppercase tracking-widest`}>עדכונים חלים מידית על כל ה-API של ה-Pilot</span>
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full md:w-auto flex items-center justify-center gap-3 px-10 py-5 rounded-full ${colors.accent} font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50`}
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save size={18} />
                    <span>שמור DNA גלובלי</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-6 rounded-[24px] border ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                : 'bg-red-500/10 border-red-500/20 text-red-500'
            } flex items-center gap-4 shadow-xl`}
          >
            {message.type === 'success' ? <ShieldCheck /> : <AlertTriangle />}
            <span className="text-sm font-bold">{message.text}</span>
          </motion.div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className={`p-8 rounded-[32px] ${colors.card} space-y-4`}>
          <h4 className={`text-sm font-black ${colors.text} uppercase tracking-widest flex items-center gap-2`}>
            <BrainCircuit size={16} className="text-primary" />
            מה זה עושה?
          </h4>
          <p className={`text-xs ${colors.textMuted} leading-loose font-medium`}>
            הדי-אן-איי (DNA) הגלובלי הוא שכבת הנחיות שמוזרקת לכל שיחה של כל משתמש עם ה-Pilot. 
            זה הכלי המרכזי שמאפשר לך "לאמן" את המערכת להתמודד עם שאלות מורכבות, 
            לקבוע מדיניות אחידה ולהבטיח שהיא לא חורגת מהסמכות שלה.
          </p>
        </div>
        <div className={`p-8 rounded-[32px] ${colors.card} border-2 border-primary/10 space-y-4 shadow-2xl`}>
          <h4 className={`text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2`}>
            <AlertTriangle size={16} />
            טיפ מ-QYZVO
          </h4>
          <p className={`text-xs ${colors.textMuted} leading-loose font-medium`}>
            אם המערכת נתקעת בשאלה, הוסף כאן הנחיה מפורשת לסיטואציה הזאת. למשל: 
            "במידה ומשתמש שואל על החזר כספי, השב לו שרק מנהל בכיר יכול לאשר זאת והפנה אותו לשיחת טלפון".
          </p>
        </div>
      </section>
    </div>
  );
};

export default TrainingTab;
