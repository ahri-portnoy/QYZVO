import React, { useState, useRef } from 'react';
import { Building, ShieldAlert, Loader2, User as UserIcon, Camera, Save, Mail } from 'lucide-react';
import { BusinessProfile, User } from '../../types';
import { StorageProvider } from '../../services/storage';

interface ProfileTabProps {
  colors: any;
  theme: string;
  profile: BusinessProfile | null;
  onProfileUpdate: (newProfile: BusinessProfile) => void;
  user: User | null;
  onUserUpdate: (updatedUser: User) => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ colors, theme, profile, onProfileUpdate, user, onUserUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(profile?.name || '');
  const [desc, setDesc] = useState(profile?.description || '');
  const [fullName, setFullName] = useState(user?.fullName || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRTL = document.dir === 'rtl';

  const t = {
    nameRequired: 'שם אופרטיבי הוא חובה',
    updateFailed: 'עדכון ה-DNA העסקי נכשל. נסה שוב.',
    close: 'סגור',
    title: 'DNA עסקי וליבה',
    subtitle: 'נהל את מזהי הליבה האסטרטגיים שלך',
    labelName: 'שם אופרטיבי (עסק)',
    labelMission: 'משימה אסטרטגית',
    updating: 'מעדכן DNA...',
    update: 'עדכן DNA',
    personalTitle: 'פרופיל אישי',
    personalSubtitle: 'נהל את הזהות שלך במערכת',
    labelFullName: 'שם מלא',
    labelEmail: 'אימייל (לקריאה בלבד)',
    avatarLabel: 'תמונת פרופיל'
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      setError(t.nameRequired);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedProfile: BusinessProfile = {
        industry: '',
        goals: [],
        values: [],
        targetAudience: '',
        kpis: [],
        competitors: [],
        ...(profile || {}),
        name,
        description: desc,
        updatedAt: new Date().toISOString()
      };

      onProfileUpdate(updatedProfile);
    } catch (err) {
      console.error('Failed to update business DNA:', err);
      setError(t.updateFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSave = async () => {
    if (!user) return;
    setUserLoading(true);
    try {
      onUserUpdate({
        ...user,
        fullName
      });
    } catch (err) {
      console.error('Failed to update user profile:', err);
    } finally {
      setUserLoading(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUserUpdate({
          ...user,
          avatarUrl: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 text-start pb-20`}>
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold flex items-center gap-3 transition-all animate-in zoom-in-95">
          <ShieldAlert size={18} />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="opacity-50 hover:opacity-100 uppercase text-[10px]">{t.close}</button>
        </div>
      )}

      {/* Personal Profile Section */}
      <div className={`p-10 rounded-[32px] ${colors.card} border border-white/5`}>
        <div className="flex items-center justify-between mb-10">
          <div className="text-start">
            <h3 className={`text-xl font-bold ${colors.text} tracking-tight`}>{t.personalTitle}</h3>
            <p className={`text-xs ${colors.textMuted} mt-1`}>{t.personalSubtitle}</p>
          </div>
          <UserIcon size={32} className={colors.textMuted} />
        </div>

        <div className="flex flex-col md:flex-row gap-10">
          <div className="flex-shrink-0 flex flex-col items-center gap-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`w-32 h-32 rounded-3xl border-2 border-dashed ${theme === 'light' ? 'border-black/10 bg-black/5' : 'border-white/10 bg-white/5'} flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer shadow-xl transition-all hover:border-primary/50`}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110" />
              ) : (
                <UserIcon size={40} className={colors.textMuted} />
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2">
                <Camera size={24} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-center px-2">החלף תמונה</span>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            </div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${colors.textMuted}`}>{t.avatarLabel}</p>
          </div>

          <div className="flex-1 space-y-6">
             <div className="group">
                <label className={`block text-[10px] uppercase tracking-[0.2em] ${colors.textMuted} mb-3 group-focus-within:text-primary transition-colors text-start font-bold`}>{t.labelFullName}</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full ${colors.input} rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-start border ${colors.border} ${theme === 'light' ? 'text-black' : 'text-white'}`}
                />
             </div>
             <div className="group opacity-60">
                <label className={`block text-[10px] uppercase tracking-[0.2em] ${colors.textMuted} mb-3 transition-colors text-start font-bold`}>{t.labelEmail}</label>
                <div className="relative">
                  <Mail size={16} className={`absolute start-5 top-1/2 -translate-y-1/2 ${colors.textMuted}`} />
                  <input 
                    type="email" 
                    value={user?.email || ''}
                    disabled
                    className={`w-full ${colors.input} rounded-2xl ps-12 pe-6 py-4 text-sm font-medium text-start border ${colors.border} cursor-not-allowed`}
                  />
                </div>
             </div>
             <button 
              onClick={handleUserSave}
              disabled={userLoading}
              className={`px-8 py-3 rounded-xl text-xs font-bold shadow-lg transition-all ${colors.accent} hover:shadow-primary/40 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3`}
            >
              {userLoading && <Loader2 size={14} className="animate-spin" />}
              <span>{userLoading ? 'שומר זהות...' : 'שמור פרופיל אישי'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`p-10 rounded-[32px] ${colors.card} border border-white/5`}>
        <div className="flex items-center justify-between mb-10">
          <div className="text-start">
            <h3 className={`text-xl font-bold ${colors.text} tracking-tight`}>{t.title}</h3>
            <p className={`text-xs ${colors.textMuted} mt-1`}>{t.subtitle}</p>
          </div>
          <Building size={32} className={colors.textMuted} />
        </div>
        <div className="space-y-8 max-w-2xl">
          <div className="group">
            <label className={`block text-[10px] uppercase tracking-[0.2em] ${colors.textMuted} mb-3 group-focus-within:text-primary transition-colors text-start font-bold`}>{t.labelName}</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className={`w-full ${colors.input} rounded-2xl px-6 py-5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-start border ${colors.border} ${theme === 'light' ? 'text-black' : 'text-white'} disabled:opacity-50`}
            />
          </div>
          <div className="group">
            <label className={`block text-[10px] uppercase tracking-[0.2em] ${colors.textMuted} mb-3 group-focus-within:text-primary transition-colors text-start font-bold`}>{t.labelMission}</label>
            <textarea 
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              disabled={loading}
              rows={4}
              className={`w-full ${colors.input} rounded-2xl px-6 py-5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all leading-relaxed resize-none text-start border ${colors.border} ${theme === 'light' ? 'text-black' : 'text-white'} disabled:opacity-50`}
            />
          </div>
          <button 
            onClick={handleUpdate}
            disabled={loading}
            className={`px-10 py-4 rounded-2xl text-sm font-bold shadow-xl transition-all ${colors.accent} hover:shadow-primary/40 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3`}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            <span>{loading ? t.updating : t.update}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
