// Strategic Overview Component
import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Activity } from 'lucide-react';

interface OverviewTabProps {
  colors: any;
  theme: string;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ colors, theme }) => {
  const isRTL = document.dir === 'rtl';

  const t = {
    aiInsightTitle: "תובנת AI פרואקטיבית",
    aiInsightDesc: '"הפרופיל העסקי שלך מראה פער במיקוד ב-KPI רבעוניים. הוספת 2 מדדי הצלחה מדידים יכולה להגדיל את דיוק הטייס המשנה ב-15%."',
    aiInsightAction: "שדרג פרופיל עכשיו",
    systemHealth: "בריאות מערכת ליבה",
    systemStatus: "אופטימלי",
    activityTitle: "פעילות מודיעין אחרונה",
    activities: [
      { msg: 'סנכרון זיכרון הושלם בהצלחה', time: 'לפני 12 דקות', status: 'success' },
      { msg: 'זוהתה הזדמנות צמיחה במגזר הנדל"ן', time: 'לפני 4 שעות', status: 'info' },
      { msg: 'לוגיקת הטייס עודכנה לגרסה 3.4.1', time: 'אתמול', status: 'system' }
    ]
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-start">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-8 rounded-[32px] ${colors.card} border-2 border-primary/20 relative overflow-hidden group`}>
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="flex items-center gap-3 mb-6">
            <Sparkles size={18} className="text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary">{t.aiInsightTitle}</h3>
          </div>
          <p className={`text-lg leading-relaxed ${theme === 'light' ? 'text-slate-700' : 'text-white/80'} italic mb-6`}>
            {t.aiInsightDesc}
          </p>
          <button className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${colors.accent} hover:scale-105 active:scale-95`}>{t.aiInsightAction}</button>
        </div>
        
        <div className={`p-8 rounded-[32px] ${colors.card} flex flex-col justify-between border border-white/5`}>
          <div>
            <h3 className={`text-[10px] uppercase tracking-widest ${colors.textMuted} mb-2 font-bold`}>{t.systemHealth}</h3>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-3xl font-bold ${colors.text}`}>94.2%</span>
              <span className="text-emerald-400 text-[10px] font-bold px-2 py-1 bg-emerald-500/10 rounded-full">{t.systemStatus}</span>
            </div>
          </div>
          <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: '94.2%' }} transition={{ duration: 1.5 }} className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
          </div>
        </div>
      </section>

      <section className={`p-8 rounded-[32px] ${colors.card} border border-white/5`}>
        <div className="flex items-center gap-3 mb-8">
          <Activity size={18} className={colors.textMuted} />
          <h3 className={`text-[10px] uppercase tracking-widest ${colors.textMuted} font-bold`}>{t.activityTitle}</h3>
        </div>
        <div className="space-y-4">
          {t.activities.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 opacity-60 hover:opacity-100 transition-all cursor-default">
              <div className="flex items-center gap-4">
                <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'success' ? 'bg-emerald-500' : 'bg-primary'}`} />
                <span className={`text-sm font-medium ${colors.text}`}>{item.msg}</span>
              </div>
              <span className={`text-[10px] font-mono ${colors.textMuted}`}>{item.time}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default OverviewTab;
