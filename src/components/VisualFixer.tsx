import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Zap, RefreshCw, AlertTriangle, CheckCircle2, Layout, Type, Palette } from 'lucide-react';
import { PILOT_DESIGN_TOKENS } from '../constants';

interface VisualFixerProps {
  theme: 'dark' | 'light';
}

export const VisualFixer: React.FC<VisualFixerProps> = ({ theme }) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditComplete, setAuditComplete] = useState(false);
  const [issuesFound, setIssuesFound] = useState<string[]>([]);
  const [repaired, setRepaired] = useState(false);

  const performAudit = () => {
    setIsAuditing(true);
    setRepaired(false);
    
    // Simulate auditing the codebase for design inconsistencies
    setTimeout(() => {
      const simulatedIssues = [
        'זוהה ריווח לא עקבי בכפתורים בלוח הבקרה',
        'יחס ניגודיות טקסט נמוך מ-4.5:1 בתוויות מסוימות',
        'התנגשות Z-index בשכבות הניווט',
        'ריווח לא סטנדרטי (13px) נמצא בשדות הפרופיל',
        'חוסר התאמה במשקל הגופנים בכותרות משניות'
      ];
      setIssuesFound(simulatedIssues);
      setIsAuditing(false);
      setAuditComplete(true);
    }, 2000);
  };

  const applyFixes = () => {
    setIsAuditing(true);
    // Simulate "fixing" the design by enforcing tokens
    setTimeout(() => {
      setIsAuditing(false);
      setIssuesFound([]);
      setRepaired(true);
      // In a real app, this could trigger a global state update or CSS injection
      // but here we just show success to the user as per the "Pilot" behavior.
    }, 1500);
  };

  const isLight = theme === 'light';

  return (
    <div className={`p-8 rounded-[40px] border ${
      isLight ? 'bg-white/50 border-black/5' : 'bg-white/5 border-white/10'
    } relative overflow-hidden`}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
          <ShieldCheck size={24} />
        </div>
        <div className="text-start">
          <h3 className={`text-xl font-bold ${isLight ? 'text-black' : 'text-white'}`}>תיקון שגיאות עיצוב (UI Core)</h3>
          <p className={`text-[10px] uppercase tracking-widest font-black ${isLight ? 'text-black/40' : 'text-white/30'}`}>פרוטוקול QYZVO Core Pilot</p>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <p className={`text-sm ${isLight ? 'text-black/60' : 'text-white/60'} leading-relaxed text-start`}>
          מערכת ה-Pilot מנתחת את ה-DOM ומזהה חריגות מהנחיות העיצוב המקוריות (Typography, Spacing, Buttons). 
          הפעל את הסורק כדי להבטיח עקביות אסתטית מקסימלית.
        </p>

        <AnimatePresence mode="wait">
          {isAuditing ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-8 gap-4"
            >
              <RefreshCw className="animate-spin text-primary" size={32} />
              <span className="text-xs font-mono font-bold tracking-[0.2em] text-primary">מנתח_אסתטיקת_ליבה...</span>
            </motion.div>
          ) : auditComplete && issuesFound.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 text-rose-500 mb-2">
                <AlertTriangle size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">נמצאו {issuesFound.length} חריגות עיצוב</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {issuesFound.map((issue, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${isLight ? 'bg-black/5 border-black/5' : 'bg-white/5 border-white/5'} flex items-center gap-3 text-start`}>
                    <div className="w-1 h-4 bg-primary rounded-full" />
                    <span className={`text-[11px] font-medium ${isLight ? 'text-black/70' : 'text-white/50'}`}>{issue}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : repaired ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col items-center gap-3`}
            >
              <CheckCircle2 className="text-emerald-500" size={32} />
              <div className="text-center">
                <h4 className="text-emerald-500 font-bold text-sm">המערכת עברה אופטימיזציה</h4>
                <p className="text-[10px] text-emerald-500/60 font-mono tracking-wider mt-1 uppercase">סנכרון_אסתטי_הושלם</p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap gap-4">
        {!auditComplete && !repaired && !isAuditing && (
          <button 
            onClick={performAudit}
            className="flex-1 py-4 rounded-2xl bg-primary text-black font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Zap size={14} />
            סרוק שגיאות עיצוב
          </button>
        )}
        
        {auditComplete && issuesFound.length > 0 && !isAuditing && (
          <button 
            onClick={applyFixes}
            className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            <ShieldCheck size={14} />
            תקן הכל (Apply Tokens)
          </button>
        )}

        {(auditComplete || repaired) && !isAuditing && (
          <button 
            onClick={() => { setAuditComplete(false); setRepaired(false); setIssuesFound([]); }}
            className={`flex-1 py-4 rounded-2xl border ${isLight ? 'border-black/10 text-black/40' : 'border-white/10 text-white/30'} font-bold text-xs uppercase tracking-widest hover:text-primary hover:border-primary transition-all`}
          >
            איפוס
          </button>
        )}
      </div>

      <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
          <Type size={16} />
          <span className="text-[8px] font-mono tracking-widest uppercase">Typography</span>
        </div>
        <div className="flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
          <Layout size={16} />
          <span className="text-[8px] font-mono tracking-widest uppercase">Spacing</span>
        </div>
        <div className="flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
          <Palette size={16} />
          <span className="text-[8px] font-mono tracking-widest uppercase">Palettes</span>
        </div>
      </div>
    </div>
  );
};
