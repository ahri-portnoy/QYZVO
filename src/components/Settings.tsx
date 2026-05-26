import React, { useState, lazy, Suspense, useMemo } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, Cpu, Activity, Shield, Trash2, ChevronRight, 
  Sparkles, Building, Lock, Monitor, Zap, BrainCircuit, Loader2
} from 'lucide-react';
import { User, BusinessProfile } from '../types';
import { getDirection } from '../services/utils';

// Components
import OverviewTab from './settings/OverviewTab';

// Lazy loaded components
const ProfileTab = lazy(() => import('./settings/ProfileTab'));
const PilotPreferencesTab = lazy(() => import('./settings/PilotPreferencesTab'));
const InterfaceTab = lazy(() => import('./settings/InterfaceTab'));
const UsageTab = lazy(() => import('./settings/UsageTab'));
const SecurityTab = lazy(() => import('./settings/SecurityTab'));
const TrainingTab = lazy(() => import('./settings/TrainingTab'));
const DangerTab = lazy(() => import('./settings/DangerTab'));

interface SettingsProps {
  user: User | null;
  onUserUpdate: (updatedUser: User) => void | Promise<void>;
  profile: BusinessProfile | null;
  onProfileUpdate: (newProfile: BusinessProfile) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  isRTL: boolean;
  onResetAll: () => Promise<void>;
  isAdmin: boolean;
}

type SettingTab = 'overview' | 'profile' | 'pilot' | 'interface' | 'usage' | 'security' | 'danger' | 'training';

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center p-20 space-y-4 opacity-50">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    <p className="text-xs font-bold uppercase tracking-widest">טוען פרוטוקול...</p>
  </div>
);

export const Settings: React.FC<SettingsProps> = ({ user, onUserUpdate, profile, onProfileUpdate, theme, setTheme, isRTL, onResetAll, isAdmin }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    // If we have settings/something
    if (segments.length > 1 && segments[0] === 'settings') {
      return segments[1] as SettingTab;
    }
    // Fallback to hash if pathname is exactly /settings
    const hashTab = location.hash.replace('#', '');
    if (hashTab) return hashTab as SettingTab;
    
    return 'overview';
  }, [location.pathname, location.hash]);

  const navItems = useMemo(() => {
    const items = [
      { id: 'overview', icon: Cpu, label: 'מבט על חכם' },
      { id: 'profile', icon: Building, label: 'פרופיל ו-DNA' },
      { id: 'pilot', icon: Sparkles, label: 'העדפות טייס' },
      { id: 'interface', icon: Monitor, label: 'ממשק חוויה' },
      { id: 'usage', icon: Activity, label: 'שימוש ומכסה' },
      { id: 'security', icon: Shield, label: 'אבטחה והצפנה' },
      { id: 'danger', icon: Trash2, label: 'נהלי חירום' }
    ];
    if (isAdmin) {
      items.splice(3, 0, { id: 'training', icon: BrainCircuit, label: 'אימון ליבה' });
    }
    return items;
  }, [isAdmin]);

  const getThemeColors = () => {
    switch (theme) {
      case 'light': return {
        bgMain: 'bg-[#FFFFFF]',
        bgSub: 'bg-[#F9F9F9]',
        border: 'border-[#EEEEEE]',
        text: 'text-black',
        textMuted: 'text-[#666666]',
        card: 'bg-[#F9F9F9] border-[#EEEEEE] shadow-sm',
        input: 'bg-white border-[#EEEEEE]',
        accent: 'bg-primary text-black'
      };
      default: return {
        bgMain: 'bg-[#000000]',
        bgSub: 'bg-[#050505]',
        border: 'border-white/10',
        text: 'text-white',
        textMuted: 'text-white/20',
        card: 'bg-white/[0.03] border-white/10 shadow-2xl shadow-black',
        input: 'bg-white/[0.03] border-white/5',
        accent: 'bg-primary text-black'
      };
    }
  };

  const colors = getThemeColors();

  const handleTabClick = (tabId: string) => {
    navigate(`/settings/${tabId}`);
  };

  return (
    <div className={`h-full flex flex-col md:flex-row transition-colors duration-500 ${colors.bgMain} overflow-hidden`}>
      <aside className={`w-full md:w-72 max-h-[40vh] md:max-h-full ${colors.bgSub} border-e ${colors.border} flex flex-col p-6 md:p-8 space-y-8 md:space-y-12 overflow-y-auto custom-scrollbar shrink-0`}>
        <div>
          <h2 className={`text-[11px] font-mono ${colors.textMuted} uppercase tracking-[0.3em] mb-10 text-start font-bold underline decoration-primary/30 underline-offset-8`}>
            {profile && getDirection(profile.name) === 'rtl' ? 'מרכז תפעול' : 'מרכז תפעול'}
          </h2>
          <nav className="space-y-1.5">
            {navItems.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ x: getDirection(profile?.name || '') === 'rtl' ? -4 : 4 }}
                onClick={() => handleTabClick(tab.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm transition-all group ${
                  activeTab === tab.id 
                    ? `bg-primary text-black shadow-xl shadow-primary/20` 
                    : `${colors.textMuted} ${theme === 'light' ? 'hover:text-black hover:bg-[#F9F9F9]' : 'hover:text-white hover:bg-white/[0.02]'}`
                }`}
              >
                <tab.icon size={18} className={activeTab === tab.id ? 'text-black' : `${colors.textMuted} transition-colors group-hover:text-primary`} />
                <span className="font-bold flex-1 text-start">{tab.label}</span>
                {activeTab === tab.id && <ChevronRight size={14} className={getDirection(profile?.name || '') === 'rtl' ? 'rotate-180' : ''} />}
              </motion.button>
            ))}
          </nav>
        </div>
        
        <div className={`mt-auto p-6 rounded-[32px] ${theme === 'light' ? 'bg-primary/5 border-primary/20' : 'bg-primary/10 border-primary/20'} border text-start`}>
             <div className="flex items-center gap-2 mb-3">
                 <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_12px_rgba(212,175,55,0.8)] animate-pulse" />
                 <span className="text-[10px] font-bold text-primary uppercase tracking-widest">QYZVO PREMIER</span>
             </div>
             <p className={`text-[11px] ${colors.textMuted} leading-relaxed font-medium`}>
                 המערכת עובדת בתיעדוף גבוה. כל תובנות ה-AI מגיעות מליבת הדור הבא.
             </p>
        </div>
      </aside>

      <main className={`flex-1 overflow-y-auto p-8 lg:p-20 ${colors.bgMain} text-start`}>
        <div className="max-w-5xl mx-auto space-y-16">
          <header className="space-y-4 text-start">
            <h1 className={`text-4xl md:text-6xl font-black tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'} mb-1 uppercase`}>
              {{
                overview: 'מבט על חכם',
                profile: 'פרופיל ו-DNA',
                pilot: 'העדפות ליבה',
                training: 'אימון ליבה (DNA)',
                interface: 'ממשק חוויה',
                usage: 'שימוש ומכסה',
                security: 'אבטחה והצפנה',
                danger: 'נהלי חירום'
              }[activeTab] || 'הגדרות'}
            </h1>
            <div className="flex items-center gap-4">
                <p className={`text-[10px] ${colors.textMuted} lowercase font-mono tracking-[0.3em] font-bold`}>
                    /מערכת/ליבה_מתקדמת/{activeTab?.toUpperCase()}
                </p>
                <div className={`h-px flex-1 ${colors.border} opacity-30`} />
            </div>
          </header>

          <AnimatePresence mode="wait">
            <Routes location={location}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                  className="pt-4"
                >
                  <OverviewTab colors={colors} theme={theme} />
                </motion.div>
              } />
              <Route path="profile" element={
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                  className="pt-4"
                >
                  <Suspense fallback={<LoadingState />}>
                    <ProfileTab 
                      colors={colors} 
                      theme={theme} 
                      profile={profile} 
                      onProfileUpdate={onProfileUpdate}
                      user={user}
                      onUserUpdate={onUserUpdate}
                    />
                  </Suspense>
                </motion.div>
              } />
              <Route path="pilot" element={
                <motion.div
                  key="pilot"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                  className="pt-4"
                >
                  <Suspense fallback={<LoadingState />}>
                    <PilotPreferencesTab colors={colors} theme={theme} />
                  </Suspense>
                </motion.div>
              } />
              <Route path="training" element={
                <motion.div
                  key="training"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                  className="pt-4"
                >
                  <Suspense fallback={<LoadingState />}>
                    <TrainingTab colors={colors} theme={theme} user={user} />
                  </Suspense>
                </motion.div>
              } />
              <Route path="interface" element={
                <motion.div
                  key="interface"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="pt-4"
                >
                  <Suspense fallback={<LoadingState />}>
                    <InterfaceTab colors={colors} theme={theme} setTheme={setTheme} />
                  </Suspense>
                </motion.div>
              } />
              <Route path="usage" element={
                <motion.div
                  key="usage"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                  className="pt-4"
                >
                  <Suspense fallback={<LoadingState />}>
                    <UsageTab colors={colors} theme={theme} />
                  </Suspense>
                </motion.div>
              } />
              <Route path="security" element={
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                  className="pt-4"
                >
                  <Suspense fallback={<LoadingState />}>
                    <SecurityTab colors={colors} theme={theme} />
                  </Suspense>
                </motion.div>
              } />
              <Route path="danger" element={
                <motion.div
                  key="danger"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                  className="pt-4"
                >
                  <Suspense fallback={<LoadingState />}>
                    <DangerTab colors={colors} theme={theme} onResetAll={onResetAll} />
                  </Suspense>
                </motion.div>
              } />
            </Routes>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
