import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Brain, Cpu, MessageSquare, Zap, ShieldAlert, Loader2 } from 'lucide-react';

interface PilotPreferencesTabProps {
  colors: any;
  theme: string;
}

const PilotPreferencesTab: React.FC<PilotPreferencesTabProps> = ({ colors, theme }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState('Balanced');
  const [activeTone, setActiveTone] = useState('Professional');
  const [isLearningActive, setIsLearningActive] = useState(false);
  const isRTL = document.dir === 'rtl';

  const t = {
    updateFailed: 'עדכון נכשל. שגיאת בקר מערכת.',
    close: 'סגור',
    analysisTitle: 'עומק ניתוח',
    analysisSubtitle: 'הגדר את רמת הלוגיקה האסטרטגית',
    toneTitle: 'טון תקשורת',
    toneSubtitle: 'כיצד המערכת פונה אליך',
    learningTitle: 'למידה פעילה',
    learningDesc: 'כאשר מופעלת, הטייס יסיק מהחלטות העבר שלך ויבצע אופטימיזציה פרואקטיבית ל-DNA העסקי שלך. מצריך אישור מפורש לשינויים מבניים בעלי השפעה גבוהה.',
    learningActive: 'למידה פעילה',
    learningInactive: 'למידה כבויה',
    deactivate: 'נטרל למידה',
    activate: 'הפעל פרוטוקול למידה',
    modes: {
      Aggressive: 'אגרסיבי',
      Balanced: 'מאוזן',
      Conservative: 'שמרני',
      Professional: 'מקצועי',
      Friendly: 'ידידותי',
      Concise: 'תמציתי'
    }
  };

  const handleModeChange = async (type: 'analysis' | 'tone' | 'learning', value: any) => {
    setLoading(type);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));
      
      if (type === 'analysis') setActiveAnalysis(value);
      if (type === 'tone') setActiveTone(value);
      if (type === 'learning') setIsLearningActive(value);
      
      console.log(`Setting updated: ${type} = ${value}`);
    } catch (err) {
      console.error(`Failed to update ${type}:`, err);
      setError(t.updateFailed);
    } finally {
      setLoading(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold flex items-center gap-3 mb-8 overflow-hidden"
          >
            <ShieldAlert size={18} />
            <span className="flex-1 text-start">{error}</span>
            <button onClick={() => setError(null)} className="opacity-50 hover:opacity-100 uppercase text-[10px]">{t.close}</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className={`p-8 rounded-[40px] ${colors.card} border flex flex-col gap-6 relative shadow-sm`}>
          {loading === 'analysis' && (
            <div className="absolute inset-0 z-10 bg-black/5 backdrop-blur-[1px] flex items-center justify-center rounded-[40px]">
              <Loader2 className="animate-spin text-primary" />
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <Brain size={24} />
            </div>
            <div className="text-start">
              <h3 className={`text-lg font-bold ${colors.text} tracking-tight uppercase`}>{t.analysisTitle}</h3>
              <p className={`text-xs ${colors.textMuted}`}>{t.analysisSubtitle}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {['Aggressive', 'Balanced', 'Conservative'].map((mode) => (
              <button 
                key={mode}
                disabled={!!loading}
                onClick={() => handleModeChange('analysis', mode)}
                className={`w-full p-4 rounded-[20px] border flex items-center justify-between transition-all ${
                  activeAnalysis === mode ? 'border-primary bg-primary/5 text-primary' : `${colors.border} ${colors.textMuted} hover:bg-white/5`
                } disabled:opacity-50 font-bold text-sm tracking-tight`}
              >
                <div className="flex items-center gap-3">
                  <span className={activeAnalysis === mode ? 'opacity-100' : 'opacity-40'}>{(t.modes as any)[mode]}</span>
                </div>
                {activeAnalysis === mode && <Zap size={14} className="fill-current animate-pulse" />}
              </button>
            ))}
          </div>
        </section>

        <section className={`p-8 rounded-[40px] ${colors.card} border flex flex-col gap-6 relative shadow-sm`}>
          {loading === 'tone' && (
            <div className="absolute inset-0 z-10 bg-black/5 backdrop-blur-[1px] flex items-center justify-center rounded-[40px]">
              <Loader2 className="animate-spin text-primary" />
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <MessageSquare size={24} />
            </div>
            <div className="text-start">
              <h3 className={`text-lg font-bold ${colors.text} tracking-tight uppercase`}>{t.toneTitle}</h3>
              <p className={`text-xs ${colors.textMuted}`}>{t.toneSubtitle}</p>
            </div>
          </div>

          <div className="space-y-3">
            {['Professional', 'Friendly', 'Concise'].map((tone) => (
              <button 
                key={tone}
                disabled={!!loading}
                onClick={() => handleModeChange('tone', tone)}
                className={`w-full p-4 rounded-[20px] border flex items-center justify-between transition-all ${
                  activeTone === tone ? 'border-primary bg-primary/5 text-primary' : `${colors.border} ${colors.textMuted} hover:bg-white/5`
                } disabled:opacity-50 font-bold text-sm tracking-tight`}
              >
                <span className={activeTone === tone ? 'opacity-100' : 'opacity-40'}>{(t.modes as any)[tone]}</span>
                {activeTone === tone && <Cpu size={14} className="fill-current animate-pulse" />}
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className={`p-10 rounded-[44px] ${colors.card} border border-dashed flex flex-col md:flex-row items-center gap-10 relative overflow-hidden bg-gradient-to-br from-transparent via-transparent to-primary/5`}>
        {loading === 'learning' && (
          <div className="absolute inset-0 z-10 bg-black/5 backdrop-blur-[2px] flex items-center justify-center">
             <Loader2 className="animate-spin text-primary" />
          </div>
        )}
        <div className={`p-8 rounded-[32px] ${isLearningActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'} ${isLearningActive ? 'animate-none shadow-lg shadow-emerald-500/10' : 'animate-pulse shadow-lg shadow-primary/10'}`}>
          <Sparkles size={40} />
        </div>
        <div className="text-start flex-1">
          <h3 className={`text-2xl font-black ${colors.text} mb-2 tracking-tighter uppercase`}>{t.learningTitle}</h3>
          <p className={`text-sm ${colors.textMuted} leading-relaxed max-w-xl font-medium`}>
            {t.learningDesc}
          </p>
        </div>
        <button 
          disabled={!!loading}
          onClick={() => handleModeChange('learning', !isLearningActive)}
          className={`px-10 py-5 ${isLearningActive ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-primary text-black hover:bg-primary/90'} rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all shadow-2xl disabled:opacity-50 min-w-[240px] flex items-center justify-center gap-3`}
        >
          {loading === 'learning' && <Loader2 size={16} className="animate-spin text-current" />}
          {isLearningActive ? t.deactivate : t.activate}
        </button>
      </div>
    </motion.div>
  );
};

export default PilotPreferencesTab;
