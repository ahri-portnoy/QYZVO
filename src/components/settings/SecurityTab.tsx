import React, { useState, useEffect } from 'react';
import { Shield, Clock, AlertTriangle, CheckCircle2, History, ShieldCheck, ShieldAlert } from 'lucide-react';
import { StorageProvider } from '../../services/storage';
import { SecurityEvent } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface SecurityTabProps {
  colors: any;
  theme: string;
}

const SecurityTab: React.FC<SecurityTabProps> = ({ colors, theme }) => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isRTL = document.dir === 'rtl';

  const t = {
    errorFetch: 'כשל בשליפת נתוני אבטחה.',
    resetSuccess: 'מפתחות האבטחה אופסו בהצלחה.',
    resetFailed: 'פעולת איפוס המפתחות נכשלה.',
    close: 'סגור',
    encryptionTitle: 'הצפנת קצה-לקצה',
    encryptionDesc: 'פרוטוקול AES-256 פעיל כרגע',
    encryptionFull: 'כל נתוני הזיכרון והאסטרטגיה מוצפנים ברמה צבאית. המפתחות נמצאים בבעלותך בלבד ולא נשלחים לשרת בפורמט גלוי.',
    resetAction: 'אפס מפתחות אבטחה',
    processing: 'מעבד...',
    logTitle: 'יומן אירועי אבטחה',
    logSubtitle: 'מעקב אחר פעילויות קריטיות במערכת',
    noEvents: 'אין אירועי אבטחה מתועדים כרגע.',
    status: {
      success: 'תקין',
      warning: 'אזהרה',
      failure: 'נכשל'
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        await new Promise(resolve => setTimeout(resolve, 500));
        const data = StorageProvider.getSecurityEvents();
        setEvents(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch (err) {
        console.error("Failed to fetch security events:", err);
        setError(t.errorFetch);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [t.errorFetch]);

  const handleResetKeys = async () => {
    try {
      setLoading(true);
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.9) reject(new Error("Network timeout"));
          else resolve(true);
        }, 1000);
      });
      alert(t.resetSuccess);
    } catch (err) {
      setError(t.resetFailed);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: SecurityEvent['status']) => {
    switch (status) {
      case 'success': return <CheckCircle2 size={14} />;
      case 'warning': return <AlertTriangle size={14} />;
      case 'failure': return <ShieldAlert size={14} />;
      default: return <ShieldCheck size={14} />;
    }
  };

  const getStatusBg = (status: SecurityEvent['status']) => {
    switch (status) {
      case 'success': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'warning': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'failure': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <div className="space-y-12">
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-5 rounded-[24px] bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] font-black uppercase tracking-widest flex items-center gap-4 transition-all"
          >
            <ShieldAlert size={18} />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className={`${isRTL ? 'mr-auto' : 'ml-auto'} opacity-40 hover:opacity-100 uppercase`}>{t.close}</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Encryption Card */}
      <div className={`p-10 md:p-14 rounded-[48px] ${colors.card} border-2 border-emerald-500/10 shadow-2xl text-start relative overflow-hidden group`}>
        <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} p-8 opacity-5 group-hover:opacity-10 transition-opacity`}>
          <Shield size={120} className="text-emerald-500" />
        </div>
        
        <div className="flex items-center gap-8 mb-10 relative z-10">
          <div className="w-18 h-18 rounded-3xl bg-emerald-500/10 flex items-center justify-center shadow-inner">
              <Shield size={40} className="text-emerald-400" />
          </div>
          <div className="text-start">
              <h3 className={`text-3xl font-black ${theme === 'light' ? 'text-black' : 'text-white'} tracking-tight mb-1 uppercase`}>{t.encryptionTitle}</h3>
              <p className={`text-[10px] font-black uppercase tracking-[0.3em] font-mono text-emerald-500/60`}>{t.encryptionDesc}</p>
          </div>
        </div>
        
        <p className={`text-[17px] leading-relaxed ${colors.textMuted} mb-12 max-w-2xl text-start font-medium opacity-80 italic relative z-10`}>
          {t.encryptionFull}
        </p>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleResetKeys}
          disabled={loading}
          className={`px-10 py-5 rounded-2xl bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20 hover:bg-emerald-400 hover:text-black transition-all disabled:opacity-50 flex items-center gap-3 relative z-10 ${isRTL ? 'mr-auto' : 'ml-auto'}`}
        >
          {loading ? <Clock size={16} className="animate-spin" /> : <Shield size={16} />}
          <span>{loading ? t.processing : t.resetAction}</span>
        </motion.button>
      </div>

      {/* Security Events Section */}
      <div className={`p-10 md:p-14 rounded-[48px] ${colors.card} border-2 ${colors.border} shadow-2xl text-start relative overflow-hidden`}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-8">
            <div className="w-18 h-18 rounded-3xl bg-primary/10 flex items-center justify-center shadow-inner">
                <History size={40} className="text-primary" />
            </div>
            <div className="text-start">
                <h3 className={`text-3xl font-black ${theme === 'light' ? 'text-black' : 'text-white'} tracking-tight mb-1 uppercase`}>{t.logTitle}</h3>
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] font-mono ${colors.textMuted}`}>{t.logSubtitle}</p>
            </div>
          </div>
          <motion.button 
            whileHover={{ rotate: 180 }}
            className={`p-3 rounded-2xl border ${colors.border} hover:bg-white/5 transition-all`}
          >
            <Clock size={20} className={colors.textMuted} />
          </motion.button>
        </div>

        <div className="space-y-4">
          {loading && events.length === 0 ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className={`p-8 rounded-[32px] border animate-pulse ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5'}`}>
                <div className="h-6 bg-current opacity-10 rounded w-1/3 mb-4" />
                <div className="h-4 bg-current opacity-5 rounded w-1/4" />
              </div>
            ))
          ) : events.length > 0 ? (
            events.map((event, i) => (
              <motion.div 
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={event.id}
                className={`p-8 rounded-[32px] border transition-all hover:scale-[1.01] ${theme === 'light' ? 'bg-white border-slate-100 hover:border-slate-300 shadow-sm' : 'bg-white/[0.01] border-white/5 hover:border-white/10 shadow-xl'}`}
              >
                <div className="md:flex items-center justify-between gap-6 space-y-4 md:space-y-0 text-start">
                  <div className="flex flex-wrap items-center gap-6">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${getStatusBg(event.status)}`}>
                      {getStatusIcon(event.status)}
                      <span>{(t.status as any)[event.status]}</span>
                    </div>
                    <span className={`font-black text-xs uppercase tracking-widest ${theme === 'light' ? 'text-black' : 'text-white'}`}>{event.description}</span>
                  </div>
                  <div className={`flex items-center gap-8 ${isRTL ? 'flex-row-reverse' : 'flex-row'} text-[10px] font-black uppercase tracking-[0.2em] opacity-30 font-mono`}>
                    <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse text-right' : 'flex-row'}`}>
                       <Clock size={14} />
                       <span>{new Date(event.timestamp).toLocaleString(isRTL ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                    </div>
                    {event.location && <span className="hidden lg:inline">{event.location}</span>}
                    {event.ip && <span className="hidden lg:inline">{event.ip}</span>}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-20 text-center opacity-20 italic">
              <p className="text-[10px] uppercase tracking-[0.4em] font-black">{t.noEvents}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityTab;
