import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, TrendingUp, AlertTriangle, Lightbulb, ChevronRight, RefreshCw } from 'lucide-react';
import { BusinessProfile, Project } from '../types';
import { generateDashboardInsights, AIInsight } from '../services/geminiService';
import { getDirection } from '../services/utils';

interface AIInsightGeneratorProps {
  profile: BusinessProfile;
  projects: Project[];
  theme: 'dark' | 'light';
}

export const AIInsightGenerator: React.FC<AIInsightGeneratorProps> = ({ profile, projects, theme }) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const results = await generateDashboardInsights(profile, projects);
      setInsights(results);
      setHasGenerated(true);
    } catch (error) {
      console.error("Insight generation failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-rose-500';
      case 'medium': return 'text-amber-500';
      default: return 'text-emerald-500';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp size={18} className="text-emerald-500" />;
      case 'risk': return <AlertTriangle size={18} className="text-rose-500" />;
      default: return <Lightbulb size={18} className="text-amber-500" />;
    }
  };

  const isLight = theme === 'light';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isLight ? 'bg-primary/10' : 'bg-primary/20'}`}>
            <Sparkles size={20} className="text-primary" />
          </div>
          <div className="text-start">
            <h3 className={`text-lg font-bold ${isLight ? 'text-black' : 'text-white'}`}>
              תובנות טייס-משנה (AI)
            </h3>
            <p className={`text-[10px] uppercase tracking-widest ${isLight ? 'text-black/40' : 'text-white/30'}`}>
              ניתוח אסטרטגי בזמן אמת
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGenerate}
          disabled={isLoading}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
            isLight 
              ? 'bg-black text-white hover:bg-neutral-800 shadow-lg' 
              : 'bg-primary text-black hover:bg-primary/90 shadow-lg shadow-primary/20'
          } disabled:opacity-50`}
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>מנתח נתונים...</span>
            </>
          ) : (
            <>
              {hasGenerated ? <RefreshCw size={14} /> : <Sparkles size={14} />}
              <span>{hasGenerated ? 'רענן תובנות' : 'צור תובנות אסטרטגיות'}</span>
            </>
          )}
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={`skeleton-${i}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`h-32 rounded-2xl border-2 border-dashed ${
                  isLight ? 'bg-neutral-50 border-neutral-100' : 'bg-white/[0.02] border-white/5'
                } flex items-center justify-center`}
              >
                <Loader2 size={24} className={`animate-spin ${isLight ? 'text-neutral-200' : 'text-white/10'}`} />
              </motion.div>
            ))
          ) : (
            insights.map((insight, i) => (
              <motion.div
                key={`insight-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-6 rounded-2xl border ${
                  isLight ? 'bg-white border-neutral-100 shadow-sm' : 'bg-white/[0.03] border-white/5 shadow-2xl'
                } group hover:border-primary/30 transition-all`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getIcon(insight.type)}
                    <span className={`text-[9px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-full ${
                      isLight ? 'bg-neutral-100 text-neutral-500' : 'bg-white/5 text-white/40'
                    }`}>
                      {insight.type === 'opportunity' ? 'הזדמנות' : insight.type === 'risk' ? 'סיכון' : 'תובנה'}
                    </span>
                  </div>
                  <span className={`text-[8px] font-mono font-bold uppercase tracking-widest ${getPriorityColor(insight.priority)}`}>
                    עדיפות {insight.priority === 'high' ? 'גבוהה' : insight.priority === 'medium' ? 'בינונית' : 'רגילה'}
                  </span>
                </div>
                <h4 className={`text-sm font-bold mb-2 ${isLight ? 'text-black' : 'text-white'}`}>{insight.title}</h4>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-neutral-600' : 'text-white/50'}`}>{insight.description}</p>
                <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={14} className="text-primary" />
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {!isLoading && insights.length === 0 && !hasGenerated && (
        <div className={`py-12 border-2 border-dashed rounded-[32px] text-center ${
          isLight ? 'border-neutral-100 bg-neutral-50/50' : 'border-white/5 bg-white/[0.01]'
        }`}>
          <Sparkles size={32} className={`mx-auto mb-4 ${isLight ? 'text-neutral-200' : 'text-white/10'}`} />
          <p className={`text-xs uppercase tracking-[0.3em] font-bold ${isLight ? 'text-neutral-300' : 'text-white/10'}`}>
            לחץ על הכפתור לשיקוף אסטרטגי מבוסס בינה מלאכותית
          </p>
        </div>
      )}
    </div>
  );
};
