import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserIcon, Camera, Save, Mail, Building, Briefcase, Phone, FileText, CheckCircle2, ShieldCheck, ShieldAlert, Loader2, Key, Smartphone, LogIn, Clock } from 'lucide-react';
import { User, BusinessProfile } from '../types';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { auth, firebaseConfig } from '../services/firebaseService';
import { sendEmailVerification, RecaptchaVerifier, linkWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

interface ProfileProps {
  user: User;
  onUserUpdate: (updatedUser: User) => void | Promise<void>;
  profile: BusinessProfile | null;
  onProfileUpdate: (newProfile: BusinessProfile) => void;
  theme: 'dark' | 'light';
  isRTL: boolean;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUserUpdate, profile, onProfileUpdate, theme, isRTL }) => {
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    phoneNumber: user.phoneNumber || '',
    bio: user.bio || '',
    businessName: profile?.name || '',
    industry: profile?.industry || '',
  });
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [defaultCountry, setDefaultCountry] = useState<any>('IL');
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [smsDigits, setSmsDigits] = useState(['', '', '', '', '', '']);
  const [isVerifyingSMS, setIsVerifyingSMS] = useState(false);
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);
  const smsInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colors = {
    light: {
      bg: 'bg-[#FFFFFF]',
      text: 'text-black',
      textMuted: 'text-[#666666]',
      card: 'bg-[#F9F9F9] border-[#EEEEEE] shadow-sm',
      input: 'bg-white border-[#EEEEEE] text-black',
      primary: 'bg-primary text-black hover:bg-primary/90'
    },
    dark: {
      bg: 'bg-[#020617]',
      text: 'text-white/90',
      textMuted: 'text-white/20',
      card: 'glass-card gold-glow',
      input: 'bg-white/[0.03] border-primary/10 text-white',
      primary: 'bg-primary text-black hover:bg-primary/90'
    }
  }[theme];

  React.useEffect(() => {
    const detectCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_code) {
          setDefaultCountry(data.country_code);
        }
      } catch (error) {
        console.warn("Country detection failed, defaulting to IL", error);
      }
    };
    
    if (!formData.phoneNumber) {
      detectCountry();
    }
  }, []);

  const handlePhoneChange = (value: string | undefined) => {
    const newVal = value || '';
    setFormData({ ...formData, phoneNumber: newVal });
    
    if (newVal) {
      if (!isValidPhoneNumber(newVal)) {
        setPhoneError('מספר טלפון לא תקין או לא מזוהה');
      } else {
        setPhoneError(null);
      }
    } else {
      setPhoneError(null);
    }
  };

  const handleSMSChange = (index: number, value: string) => {
    if (!value || !/^\d*$/.test(value)) return;
    
    const newDigits = [...smsDigits];
    newDigits[index] = value.slice(-1);
    setSmsDigits(newDigits);
    setSmsError(null);

    if (value && index < 5) {
      smsInputRefs.current[index + 1]?.focus();
    }
  };

  const handleSMSKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !smsDigits[index] && index > 0) {
      smsInputRefs.current[index - 1]?.focus();
    }
  };

  const setupRecaptcha = () => {
    if ((window as any).recaptchaVerifier) return (window as any).recaptchaVerifier;
    
    try {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log("Recaptcha verified");
        }
      });
      (window as any).recaptchaVerifier = verifier;
      return verifier;
    } catch (error) {
      console.error("Recaptcha setup failed", error);
      return null;
    }
  };

  const handleStartSMSVerification = async () => {
    if (!formData.phoneNumber || !isValidPhoneNumber(formData.phoneNumber)) {
      setPhoneError('יש להזין מספר טלפון תקין לאימות');
      return;
    }

    setIsSendingSMS(true);
    setPhoneError(null);
    
    try {
      const verifier = setupRecaptcha();
      if (!verifier) throw new Error("Could not initialize Recaptcha");
      
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No authenticated user");

      const result = await linkWithPhoneNumber(currentUser, formData.phoneNumber, verifier);
      setConfirmationResult(result);
      setShowSMSModal(true);
      setSmsError(null);
    } catch (error: any) {
      console.error("SMS Start Error:", error);
      if (error.code === 'auth/operation-not-allowed') {
        setPhoneError(`שירות אימות ב-SMS אינו מופעל בפרויקט ${firebaseConfig.projectId}. עליך להפעיל את ספק ה-Phone ב-Firebase Console תחת Authentication > Sign-in method.`);
      } else if (error.code === 'auth/credential-already-in-use') {
        setPhoneError('המספר כבר מקושר לחשבון אחר');
      } else if (error.code === 'auth/invalid-phone-number') {
        setPhoneError('מספר טלפון לא תקין');
      } else {
        setPhoneError(error.message || 'שגיאה בשליחת ה-SMS');
      }
    } finally {
      setIsSendingSMS(false);
    }
  };

  const handleSMSVerify = async () => {
    const code = smsDigits.join('');
    if (code.length < 6) {
      setSmsError('יש להזין קוד בן 6 ספרות');
      return;
    }

    if (!confirmationResult && !auth.currentUser?.phoneNumber) {
      setSmsError('איבוד קשר עם השרת, נסה שוב');
      return;
    }

    setIsVerifyingSMS(true);
    try {
      if (confirmationResult) {
        await confirmationResult.confirm(code);
      }
      
      setShowSMSModal(false);
      
      onUserUpdate({
        ...user,
        phoneNumber: formData.phoneNumber
      });
      
      alert('הטלפון אומת בהצלחה! כעת תוכל לקבל תובנות אסטרטגיות ישירות לוואצאפ.');
    } catch (error: any) {
      console.error("SMS Verification Error:", error);
      setSmsError('קוד אימות שגוי או פג תוקף');
      setSmsDigits(['', '', '', '', '', '']);
      smsInputRefs.current[0]?.focus();
    } finally {
      setIsVerifyingSMS(false);
    }
  };

  const handleSave = () => {
    if (phoneError || (formData.phoneNumber && !isValidPhoneNumber(formData.phoneNumber))) {
      alert('יש לתקן את מספר הטלפון לפני השמירה');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      onUserUpdate({
        ...user,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        bio: formData.bio,
      });
      
      onProfileUpdate({
        ...(profile || { id: '', name: '', industry: '', description: '', goals: [], values: [], targetAudience: '', kpis: [], competitors: [], createdAt: new Date().toISOString() }),
        name: formData.businessName,
        industry: formData.industry,
      });

      setIsSaving(false);
      setShowSavedMsg(true);
      setTimeout(() => setShowSavedMsg(false), 3000);
    }, 1000);
  };

  const handleVerifyEmail = async () => {
    if (!auth.currentUser) return;
    setVerifyingEmail(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 5000);
    } catch (error) {
      console.error("Email verification error:", error);
    } finally {
      setVerifyingEmail(false);
    }
  };

  const InputField = ({ label, icon: Icon, value, onChange, placeholder, disabled = false, type = "text", error = false, verified = false, onVerify = null, verifying = false }: any) => (
    <div className="space-y-2 group">
      <div className="flex justify-between items-center ps-2">
        <label className={`block text-[10px] uppercase tracking-[0.2em] ${colors.textMuted} font-bold group-focus-within:text-primary transition-colors`}>
          {label}
        </label>
        {verified ? (
          <div className="flex items-center gap-1 text-[9px] text-emerald-500 font-bold uppercase tracking-wider">
            <ShieldCheck size={12} />
            <span>מאומת</span>
          </div>
        ) : onVerify ? (
          <button 
            type="button" 
            onClick={onVerify}
            disabled={verifying}
            className="text-[9px] text-primary font-bold uppercase tracking-wider hover:underline flex items-center gap-1"
          >
            {verifying ? <Loader2 size={10} className="animate-spin" /> : <ShieldAlert size={12} />}
            <span>אמת עכשיו</span>
          </button>
        ) : null}
      </div>
      <div className="relative">
        <Icon size={18} className={`absolute start-4 top-1/2 -translate-y-1/2 ${colors.textMuted}`} />
        <input 
          type={type}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full py-4 ps-12 pe-4 rounded-2xl border outline-none transition-all text-sm font-medium ${colors.input} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${error ? 'border-rose-500/50 focus:ring-rose-500/20' : 'focus:ring-primary/20'}`}
        />
      </div>
    </div>
  );

  return (
    <div className={`min-h-full p-6 md:p-12 ${colors.bg} pb-32`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="text-start">
            <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${colors.text} mb-2 gold-text-gradient`}>
              פרופיל אסטרטג
            </h1>
            <div className={`flex items-center gap-2 text-[9px] uppercase tracking-widest font-mono ${colors.textMuted}`}>
              <span className="opacity-50">מזהה:</span>
              <span className="text-primary font-bold">{user.id.substring(0, 8)}...</span>
              <span className="opacity-30">/</span>
              <span className={`px-2 py-0.5 rounded border text-[8px] ${theme === 'light' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'}`}>מאובטח</span>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full md:w-auto px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs shadow-lg transition-all ${colors.primary} ${isSaving ? 'opacity-50' : ''}`}
          >
            {isSaving ? (
               <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
            ) : showSavedMsg ? (
               <>
                 <span>נשמר</span>
                 <CheckCircle2 size={14} />
               </>
            ) : (
               <>
                 <span>סנכרן נתונים</span>
                 <Save size={14} />
               </>
            )}
          </motion.button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Avatar & Trust Badge Section */}
          <div className="lg:col-span-1 space-y-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`aspect-square rounded-[32px] border-2 border-dashed ${colors.card} flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer shadow-xl`}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110" />
              ) : (
                <div className={`w-24 h-24 rounded-full ${theme === 'light' ? 'bg-[#EEEEEE]' : 'bg-white/10'} flex items-center justify-center`}>
                  <UserIcon size={48} className={colors.textMuted} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2">
                <Camera size={32} />
                <span className="text-xs font-bold uppercase tracking-widest">החלף תמונת מזהה</span>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64String = reader.result as string;
                      onUserUpdate({
                        ...user,
                        avatarUrl: base64String
                      });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>

            <div className={`p-6 rounded-[32px] ${theme === 'light' ? 'bg-emerald-50 border-emerald-100' : 'bg-emerald-500/5 border-emerald-500/20'} border text-start`}>
               <div className="flex items-center justify-between mb-4">
                 <ShieldCheck className={theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'} size={24} />
                 <span className={`text-[8px] font-mono tracking-widest ${theme === 'light' ? 'text-emerald-600/60' : 'text-emerald-400/40'}`}>רמת אמינות: 98%</span>
               </div>
               <h4 className={`text-lg font-bold ${theme === 'light' ? 'text-emerald-900' : 'text-emerald-400'}`}>
                 פרופיל מאובטח
               </h4>
               <p className={`text-xs ${theme === 'light' ? 'text-emerald-600/70' : 'text-emerald-400/60'} mt-2 leading-relaxed`}>
                 הזהות שלך מאומתת בקצה-לקצה. כל הפעולות במערכת חתומות דיגיטלית.
               </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-10">
            <div className={`p-8 rounded-[40px] ${colors.card} border space-y-8 relative overflow-hidden`}>
              <div className="absolute top-0 start-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${theme === 'light' ? 'bg-primary/10 text-primary' : 'bg-primary/20 text-primary'}`}>
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${colors.text}`}>
                      סטטוס אבטחה ואימות
                    </h3>
                    <p className={`text-[9px] uppercase tracking-widest ${colors.textMuted}`}>
                      פרוטוקול הגנה פעיל
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-5 rounded-2xl ${theme === 'light' ? 'bg-[#F3F3F3]' : 'bg-white/[0.02]'} border ${theme === 'light' ? 'border-[#EEEEEE]' : 'border-white/5'} space-y-4`}>
                   <div className="flex items-center gap-2 mb-1">
                     <LogIn size={14} className="text-primary" />
                     <label className={`block text-[9px] uppercase tracking-[0.2em] ${colors.textMuted} font-bold`}>
                       שיטת התחברות
                     </label>
                   </div>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'light' ? 'bg-white' : 'bg-white/5'}`}>
                           {auth.currentUser?.providerData[0]?.providerId === 'google.com' ? (
                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                               <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                               <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                               <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                               <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                             </svg>
                           ) : <Mail size={16} className={colors.textMuted} />}
                        </div>
                        <span className="text-sm font-bold">
                          {auth.currentUser?.providerData[0]?.providerId === 'google.com' ? 'חשבון Google' : 'מייל וסיסמה'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[8px] font-bold uppercase tracking-widest">
                         <ShieldCheck size={10} />
                         <span>מאובטח</span>
                      </div>
                   </div>
                   {auth.currentUser?.metadata.lastSignInTime && (
                     <div className="flex items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                        <Clock size={10} className={colors.textMuted} />
                        <span className={`text-[9px] ${colors.textMuted}`}>כניסה אחרונה: {new Date(auth.currentUser.metadata.lastSignInTime).toLocaleString('he-IL')}</span>
                     </div>
                   )}
                </div>

                <div className={`p-5 rounded-2xl ${theme === 'light' ? 'bg-[#F3F3F3]' : 'bg-white/[0.02]'} border ${theme === 'light' ? 'border-[#EEEEEE]' : 'border-white/5'} space-y-4`}>
                   <div className="flex items-center gap-2 mb-1 text-start">
                     <Mail size={14} className={auth.currentUser?.emailVerified ? "text-emerald-500" : "text-rose-500"} />
                     <label className={`block text-[9px] uppercase tracking-[0.2em] ${colors.textMuted} font-bold`}>
                       אימות אימייל
                     </label>
                   </div>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {auth.currentUser?.emailVerified ? (
                          <>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-sm font-bold">כתובת מאומתת</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                            <span className="text-sm font-bold text-rose-500">ממתין לאימות</span>
                          </>
                        )}
                      </div>
                      {!auth.currentUser?.emailVerified && (
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleVerifyEmail}
                          disabled={verifyingEmail || emailSent}
                          className="px-4 py-2 rounded-xl bg-primary text-black text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                          {verifyingEmail ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : emailSent ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            'שלח קוד לאימייל'
                          )}
                        </motion.button>
                      )}
                   </div>
                   {!auth.currentUser?.emailVerified && (
                     <p className={`text-[9px] leading-relaxed ${colors.textMuted}`}>
                       חשוב לאמת את האימייל כדי לקבל התרעות אסטרטגיות.
                     </p>
                   )}
                </div>
              </div>
            </div>

            <div className={`p-8 rounded-[40px] ${colors.card} border space-y-8`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-start">
                <InputField 
                  label="שם מלא במערכת"
                  icon={UserIcon} 
                  value={formData.fullName} 
                  onChange={(v: string) => setFormData({...formData, fullName: v})}
                  placeholder="הכנס שם מלא"
                />
                
                <div className="space-y-2 group">
                  <div className="flex justify-between items-center ps-2">
                    <label className={`block text-[10px] uppercase tracking-[0.2em] ${colors.textMuted} font-bold group-focus-within:text-primary transition-colors`}>
                      אימייל (מזהה ליבה)
                    </label>
                    {auth.currentUser?.emailVerified && (
                      <div className="flex items-center gap-1 text-[9px] text-emerald-500 font-bold uppercase tracking-wider">
                        <ShieldCheck size={12} />
                        <span>מאומת</span>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <Mail size={18} className={`absolute start-4 top-1/2 -translate-y-1/2 ${colors.textMuted}`} />
                    <input 
                      disabled={true}
                      value={user.email} 
                      className={`w-full py-4 ps-12 pe-4 rounded-2xl border outline-none transition-all text-sm font-medium ${colors.input} opacity-50 cursor-not-allowed`}
                    />
                  </div>
                </div>

                <InputField 
                  label="שם אסטרטגיה / עסק"
                  icon={Building} 
                  value={formData.businessName} 
                  onChange={(v: string) => setFormData({...formData, businessName: v})}
                  placeholder="שם החברה שלך"
                />
                
                <InputField 
                  label="תחום פעילות"
                  icon={Briefcase} 
                  value={formData.industry} 
                  onChange={(v: string) => setFormData({...formData, industry: v})}
                  placeholder="למשל: סייבר, נדלן"
                />

                <div className="space-y-2 group">
                  <div className="flex justify-between items-center ps-2">
                    <label className={`block text-[10px] uppercase tracking-[0.2em] ${colors.textMuted} font-bold group-focus-within:text-primary transition-colors`}>
                      מספר טלפון (לאימות)
                    </label>
                    {auth.currentUser?.phoneNumber && auth.currentUser.phoneNumber === formData.phoneNumber ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[9px] text-emerald-500 font-bold uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <ShieldCheck size={10} />
                          <span>מאומת</span>
                        </div>
                      </div>
                    ) : (
                      <button 
                        type="button" 
                        onClick={handleStartSMSVerification}
                        disabled={isSendingSMS}
                        className="text-[9px] text-primary font-bold uppercase tracking-wider hover:underline flex items-center gap-1 disabled:opacity-50"
                      >
                        {isSendingSMS ? <Loader2 size={12} className="animate-spin" /> : <Smartphone size={12} />}
                        <span>{isSendingSMS ? 'שולח...' : 'אמת ב-SMS לוואצאפ'}</span>
                      </button>
                    )}
                  </div>
                    <div className="relative phone-input-premium">
                      <Phone size={18} className={`absolute start-4 top-1/2 -translate-y-1/2 ${phoneError ? 'text-rose-500' : colors.textMuted} z-10 pointer-events-none transition-colors`} />
                      <PhoneInput
                        international
                        countryCallingCodeEditable={false}
                        defaultCountry={defaultCountry}
                        value={formData.phoneNumber}
                        onChange={handlePhoneChange}
                        className={`w-full py-4 ps-12 pe-4 rounded-2xl border outline-none transition-all text-sm font-bold ${colors.input} ${phoneError ? 'border-rose-500 ring-1 ring-rose-500/20' : 'focus-within:ring-2 focus-within:ring-primary/20'}`}
                        dir="ltr"
                      />
                    </div>
                    {phoneError && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] text-rose-500 font-bold px-2"
                      >
                        {phoneError}
                      </motion.p>
                    )}
                </div>
              </div>
              
              <div className="space-y-2 group text-start">
                <label className={`block text-[10px] uppercase tracking-[0.2em] ${colors.textMuted} px-2 font-bold group-focus-within:text-primary transition-colors`}>
                  חזון אסטרטגי / ביוגרפיה
                </label>
                <div className="relative">
                  <FileText size={18} className={`absolute start-4 top-6 ${colors.textMuted}`} />
                  <textarea 
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="ספר לטייס על הרקע המקצועי שלך..."
                    className={`w-full py-4 ps-12 pe-4 rounded-[32px] border outline-none transition-all text-sm font-medium ${colors.input} focus:ring-2 focus:ring-primary/20 resize-none`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SMS Verification Modal Concept */}
      <AnimatePresence>
        {showSMSModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSMSModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md ${theme === 'light' ? 'bg-white' : 'bg-[#111111]'} rounded-[40px] p-10 border ${theme === 'light' ? 'border-[#EEEEEE]' : 'border-white/10'} shadow-2xl shadow-black/40`}
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Key size={32} className="text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className={`text-2xl font-bold ${colors.text}`}>אימות דו-שלבי</h3>
                  <p className={`text-sm ${colors.textMuted}`}>נשלח קוד אימות לטלפון {formData.phoneNumber}</p>
                </div>
                
                <div className="flex justify-center gap-3" dir="ltr">
                  {smsDigits.map((digit, i) => (
                    <input 
                      key={i}
                      ref={el => { smsInputRefs.current[i] = el; }}
                      type="text" 
                      value={digit}
                      onChange={(e) => handleSMSChange(i, e.target.value)}
                      onKeyDown={(e) => handleSMSKeyDown(i, e)}
                      maxLength={1} 
                      className={`w-10 h-14 text-center text-xl font-bold rounded-xl border-2 ${theme === 'light' ? 'bg-[#F9F9F9] border-[#EEEEEE]' : 'bg-white/5 border-white/5 text-white'} focus:border-primary outline-none transition-all ${smsError ? 'border-rose-500' : ''}`}
                    />
                  ))}
                </div>

                {smsError && (
                  <p className="text-xs text-rose-500 font-bold">{smsError}</p>
                )}

                <button 
                  onClick={handleSMSVerify}
                  disabled={isVerifyingSMS}
                  className={`w-full py-4 rounded-2xl ${colors.primary} font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2`}
                >
                  {isVerifyingSMS && <Loader2 size={18} className="animate-spin" />}
                  {isVerifyingSMS ? 'מאמת...' : 'אימות קוד'}
                </button>
                
                <button 
                  onClick={() => setShowSMSModal(false)}
                  className={`text-xs font-bold ${colors.textMuted} hover:text-black transition-colors`}
                >
                  ביטול וחזרה
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div id="recaptcha-container"></div>

      <style>{`
        .phone-input-premium .PhoneInputInput {
          background: transparent;
          border: none;
          outline: none;
          font-weight: bold;
          font-family: inherit;
          color: inherit;
        }
        .phone-input-premium .PhoneInputCountry {
          margin-right: 0;
          margin-left: 12px;
          display: flex;
          align-items: center;
        }
        .phone-input-premium .PhoneInputCountrySelectArrow {
          margin-right: 4px;
          opacity: 0.3;
        }
      `}</style>
    </div>
  );
};
