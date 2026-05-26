import React from 'react';
import { motion } from 'motion/react';
import { Activity, Zap, Database, Clock } from 'lucide-react';

interface UsageTabProps {
  colors: any;
  theme: string;
}

const UsageTab: React.FC<UsageTabProps> = ({ colors, theme }) => {
  const isRTL = document.dir === 'rtl';

  const t = {
    aiCredit: 'קרדיט AI',
    coreMemory: 'זיכרון ליבה',
    responseTime: 'זמן תגובה',
    analysisTitle: 'ניתוח עומס מערכת',
    analysisSubtitle: 'פעילות 24 שעות אחרונות'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: t.aiCredit, value: '84%', icon: Zap, color: 'text-primary' },
          { label: t.coreMemory, value: '1.2GB', icon: Database, color: 'text-amber-500' },
          { label: t.responseTime, value: '0.8s', icon: Clock, color: 'text-emerald-500' }
        ].map((stat, i) => (
          <div key={i} className={`p-8 rounded-[40px] ${colors.card} border-2 ${colors.border} text-start shadow-xl hover:scale-[1.02] transition-all`}>
            <div className={`p-4 rounded-2xl w-fit mb-8 ${theme === 'light' ? 'bg-slate-100' : 'bg-white/5'} ${stat.color} ${isRTL ? 'mr-0 ml-auto' : 'ml-0'}`}>
              <stat.icon size={24} />
            </div>
            <p className={`text-[10px] uppercase tracking-[0.3em] ${colors.textMuted} mb-2 font-black font-mono`}>{stat.label}</p>
            <h3 className={`text-5xl font-black ${theme === 'light' ? 'text-black' : 'text-white'} tracking-tight`}>{stat.value}</h3>
          </div>
        ))}
      </div>

      <section className={`p-10 md:p-14 rounded-[48px] ${colors.card} border-2 ${colors.border} shadow-2xl`}>
        <div className="flex items-center justify-between mb-12">
          <div className="text-start">
            <h3 className={`text-3xl font-black ${theme === 'light' ? 'text-black' : 'text-white'} tracking-tight mb-2 uppercase`}>{t.analysisTitle}</h3>
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] font-mono ${colors.textMuted}`}>{t.analysisSubtitle}</p>
          </div>
          <Activity size={32} className="text-primary opacity-50" />
        </div>

        <div className="h-64 flex items-end gap-3 justify-between">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="flex-1 group relative h-full flex flex-col justify-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.random() * 80 + 20}%` }}
                transition={{ 
                  delay: i * 0.05,
                  type: 'spring',
                  stiffness: 50
                }}
                className={`w-full rounded-t-xl bg-gradient-to-t ${theme === 'light' ? 'from-[#EEEEEE] to-primary/40' : 'from-primary/10 to-primary/60'} group-hover:to-primary transition-all duration-300 shadow-lg shadow-primary/10`}
              />
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-black text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-tighter">
                {Math.floor(Math.random() * 100)}%
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-8 text-[10px] font-black font-mono opacity-20 uppercase tracking-[0.4em]">
          <span>00:00</span>
          <span>12:00</span>
          <span>23:59</span>
        </div>
      </section>
    </motion.div>
  );
};

export default UsageTab;
