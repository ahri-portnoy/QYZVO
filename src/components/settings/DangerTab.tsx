import React, { useState } from 'react';
import { Trash2, ShieldAlert, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DangerTabProps {
  colors: any;
  theme: string;
  onResetAll: () => Promise<void>;
}

const DangerTab: React.FC<DangerTabProps> = ({ colors, theme, onResetAll }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isRTL = document.dir === 'rtl';

  const t = {
    confirmPurge: 'האם אתה בטוח שברצונך למחוק את כל הנתונים? פעולה זו אינה הפיכה.',
    success: 'המערכת נוקתה בהצלחה. כל הנתונים הושמדו.',
    failed: 'ניסיון טיהור המערכת נכשל. תקלת גישה למסד הנתונים הקשיח.',
    purging: 'מבצע טיהור סופי...',
    close: 'סגור',
    title: 'נהלי השמדת נתונים',
    subtitle: 'אזור סיכון גבוה',
    description: 'ניקוי מוחלט של כל הפרויקטים, הזיכרון וההקשר שנצבר. פעולה זו סופית ולא ניתן לשחזר נתונים לאחר ביצועה.',
    action: 'בצע טיהור מערכת סופי'
  };

  const handlePurge = async () => {
    const confirmed = window.confirm(t.confirmPurge);
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      await onResetAll();
      console.warn('System purge executed successfully.');
      alert(t.success);
      window.location.reload();
    } catch (err: any) {
      console.error('System purge failed:', err);
      setError(t.failed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-10 md:p-14 rounded-[48px] ${colors.card} border-2 border-rose-500/10 text-start relative overflow-hidden transition-all duration-500 shadow-2xl`}>
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-rose-950/40 backdrop-blur-xl flex flex-col items-center justify-center space-y-8"
          >
            <Loader2 className="w-16 h-16 animate-spin text-rose-500" />
            <motion.h2 
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="text-2xl font-black text-rose-100 uppercase tracking-[0.4em] animate-pulse"
            >
              {t.purging}
            </motion.h2>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-4 mb-10 overflow-hidden"
        >
          <ShieldAlert size={20} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="opacity-40 hover:opacity-100 uppercase text-[9px] font-black tracking-widest">{t.close}</button>
        </motion.div>
      )}

      <div className="flex items-center gap-8 mb-10">
          <div className="w-18 h-18 rounded-3xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-inner group overflow-hidden relative">
              <div className="absolute inset-0 bg-rose-500/5 blur-xl scale-0 group-hover:scale-150 transition-transform duration-700" />
              <Trash2 size={40} className="relative z-10" />
          </div>
          <div className="text-start">
              <h3 className={`text-3xl font-black ${theme === 'light' ? 'text-black' : 'text-white'} tracking-tight mb-1`}>{t.title}</h3>
              <p className="text-[10px] text-rose-500 font-black uppercase tracking-[0.3em] font-mono">{t.subtitle}</p>
          </div>
      </div>

      <p className={`text-[17px] leading-relaxed ${colors.textMuted} mb-12 max-w-2xl text-start font-medium opacity-80 italic`}>
        {t.description}
      </p>

      <motion.button 
        whileHover={{ scale: 1.02, x: isRTL ? -4 : 4 }}
        whileTap={{ scale: 0.98 }}
        onClick={handlePurge}
        disabled={loading}
        className="px-12 py-6 rounded-2xl bg-rose-600 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-rose-600/30 hover:bg-rose-500 transition-all disabled:opacity-50 flex items-center gap-4 group"
      >
        <ShieldAlert size={18} className="group-hover:animate-bounce" />
        <span>{t.action}</span>
      </motion.button>
    </div>
  );
};

export default DangerTab;
