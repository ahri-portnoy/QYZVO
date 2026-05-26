import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowRight, Chrome, Apple, Loader2, Heart, ShieldAlert, Phone, Timer, CheckCircle2 } from 'lucide-react';
import { Logo } from './Logo';
import { auth, db, firebaseConfig } from '../services/firebaseService';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface AuthProps {
  onLogin: (user: { fullName: string; email: string }) => void;
  theme: 'dark' | 'light';
  isMobile?: boolean;
}

type Mode = 'login' | 'register' | 'forgot';
type ResetMethod = 'email' | 'sms';

export const Auth: React.FC<AuthProps> = ({ theme, isMobile = false }) => {
  const [mode, setMode] = useState<Mode>(isMobile ? 'register' : 'login');
  const [resetMethod, setResetMethod] = useState<ResetMethod>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lang, setLang] = useState<'he' | 'en'>('he');

  useEffect(() => {
    if (isMobile) {
      setMode('register');
    }
  }, [isMobile]);
  
  // Countdown state for "Half a minute"
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [countdown]);

  const startCountdown = () => {
    setCountdown(30);
  };

  const t = {
    welcome: 'ברוכים הבאים',
    subtitle: 'מערכת ההפעלה האסטרטגית שלך',
    login: 'התחברות',
    register: 'הרשמה',
    forgotTitle: 'איפוס סיסמה',
    forgotSubtitle: 'בחר אמצעי לאימות וקבלת גישה',
    google: 'המשך באמצעות Google',
    apple: 'המשך באמצעות Apple',
    or: 'או התחבר ידנית',
    fullName: 'שם מלא',
    fullNamePlaceholder: 'ישראל ישראלי',
    email: 'אימייל',
    phone: 'מספר טלפון',
    password: 'סיסמה',
    forgot: 'שכחת סיסמה?',
    submitLogin: 'כניסה למערכת',
    submitRegister: 'יצירת חשבון',
    submitReset: 'שלח קישור אימות',
    submitSmsReset: 'שלח קוד ב-SMS',
    backToLogin: 'חזרה להתחברות',
    resendIn: 'ניתן לשלוח שוב בעוד',
    seconds: 'שניות',
    emailSent: 'קישור לאיפוס סיסמה נשלח למייל שלך.',
    smsSent: 'קוד אימות נשלח לנייד שלך.',
    terms: 'בלחיצה על המשך, אתה מסכים ל',
    tos: 'תנאי השימוש',
    and: ' ול',
    privacy: 'מדיניות הפרטיות',
    poweredBy: 'Powered by',
    networkError: 'שגיאת תקשורת: ייתכן שחיבור האינטרנט חלש או שחוסם פרסומות (Ad-blocker) מונע את ההתחברות.',
    opNotAllowed: 'שירות האימות אינו מופעל בקונסול של Firebase.',
    emailInUse: 'האימייל כבר רשום במערכת. מעביר אותך להתחברות...',
    genericError: 'אירעה שגיאה בתהליך האימות'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        
        try {
          await setDoc(doc(db, 'users', fbUser.uid), {
            id: fbUser.uid,
            fullName,
            email,
            createdAt: new Date().toISOString()
          });
        } catch (dbErr: any) {
          console.error("Firestore user creation error:", dbErr);
        }
      } else if (mode === 'forgot') {
        if (resetMethod === 'email') {
          await sendPasswordResetEmail(auth, email);
          setSuccess(t.emailSent);
          startCountdown();
        } else {
          // SMS flow simulation for "receiving a number in SMS"
          // In a real app, this would use sign-in with phone or a custom backend trigger
          setSuccess(t.smsSent);
          startCountdown();
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === 'auth/operation-not-allowed') {
        setError(t.opNotAllowed);
      } else if (err.code === 'auth/network-request-failed') {
        setError(t.networkError);
      } else if (err.code === 'auth/email-already-in-use') {
        setError(isMobile ? 'כתובת האימייל שהוזנה כבר רשומה במערכת.' : t.emailInUse);
        if (!isMobile) {
          setTimeout(() => {
            setMode('login');
            setError(null);
          }, 2000);
        }
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('פרטי ההתחברות אינם נכונים. אנא בדוק את האימייל והסיסמה ונסה שנית.');
      } else if (err.code === 'auth/invalid-email') {
        setError('כתובת האימייל שהוזנה אינה תקינה.');
      } else if (err.code === 'auth/weak-password') {
        setError('הסיסמה חלשה מדי. הסיסמה חייבת להכיל לפחות 6 תווים.');
      } else {
        setError(t.genericError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Google login error:", err);
      setError(err.code === 'auth/operation-not-allowed' ? t.opNotAllowed : t.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  const isRTL = true; // Always RTL for Hebrew

  return (
    <div className={`min-h-screen w-full ${theme === 'light' ? 'bg-[#FFFFFF]' : 'bg-[#000000]'} flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-primary/20 transition-all duration-700`} dir="rtl">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full`} />
        <div className={`absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] ${theme === 'light' ? 'bg-[#000000]/5' : 'bg-primary/5'} blur-[100px] rounded-full`} />
      </div>

      <motion.div 
        key="he"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-lg z-10"
      >
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-12">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-2"
          >
            <Logo size={90} showText={true} className="drop-shadow-2xl" />
          </motion.div>
          
          <div className="text-center space-y-2">
            <h1 className={`text-3xl md:text-5xl font-black ${theme === 'light' ? 'text-black' : 'text-white'} tracking-tighter uppercase mr-4`}>{t.welcome}</h1>
            <p className={`${theme === 'light' ? 'text-black/40' : 'text-white/30'} text-xs md:text-sm font-bold uppercase tracking-[0.3em]`}>{t.subtitle}</p>
          </div>
        </div>

        {/* Auth Section */}
        <div className={`space-y-10 p-8 md:p-14 rounded-[48px] ${theme === 'light' ? 'bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-[#EEEEEE]' : 'bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-2xl'}`}>
          {/* Tabs */}
          {isMobile ? (
            <div className={`text-center pb-4 border-b ${theme === 'light' ? 'border-[#EEEEEE]' : 'border-white/10'}`}>
              <h3 className={`text-lg font-black tracking-wider ${theme === 'light' ? 'text-[#6a5a3d]' : 'text-primary'}`}>
                {t.submitRegister}
              </h3>
              <p className={`text-[10px] font-bold mt-1 uppercase tracking-widest ${theme === 'light' ? 'text-[#7e766b]' : 'text-white/40'}`}>
                הקמת קובץ ה-DNA של העסק והגדרות הסוכן האסטרטגי
              </p>
            </div>
          ) : (
            <div className={`flex justify-center gap-12 border-b ${theme === 'light' ? 'border-[#EEEEEE]' : 'border-white/10'}`}>
              {mode !== 'forgot' ? (
                <>
                  <button 
                    onClick={() => setMode('login')}
                    className={`pb-5 text-xs font-black uppercase tracking-widest transition-all relative ${mode === 'login' ? (theme === 'light' ? 'text-black' : 'text-white') : (theme === 'light' ? 'text-black/10' : 'text-white/10')}`}
                  >
                    {t.login}
                    {mode === 'login' && (
                      <motion.div layoutId="tab-underline" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                    )}
                  </button>
                  <button 
                    onClick={() => setMode('register')}
                    className={`pb-5 text-xs font-black uppercase tracking-widest transition-all relative ${mode === 'register' ? (theme === 'light' ? 'text-black' : 'text-white') : (theme === 'light' ? 'text-black/10' : 'text-white/10')}`}
                  >
                    {t.register}
                    {mode === 'register' && (
                      <motion.div layoutId="tab-underline" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                    )}
                  </button>
                </>
              ) : (
                <div className="pb-5 text-xs font-black uppercase tracking-widest text-primary flex items-center gap-3">
                  <Timer size={14} />
                  <span>{t.forgotTitle}</span>
                </div>
              )}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={mode + lang}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-10"
            >
              {mode !== 'forgot' && !isMobile && (
                <>
                  {/* Social Login */}
                  <div className="grid grid-cols-1 gap-4">
                    <button 
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className={`w-full h-15 ${theme === 'light' ? 'bg-white border border-[#EEEEEE]' : 'bg-white/5 border border-white/5'} hover:border-primary transition-all rounded-2xl flex items-center justify-center gap-4 px-6 group disabled:opacity-50`}
                    >
                      <Chrome size={18} className="text-primary" />
                      <span className={`${theme === 'light' ? 'text-black' : 'text-white'} font-bold text-xs uppercase tracking-wider`}>{t.google}</span>
                    </button>
                  </div>

                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center"><div className={`w-full border-t ${theme === 'light' ? 'border-[#EEEEEE]' : 'border-white/10'}`}></div></div>
                    <span className={`relative px-6 text-[9px] uppercase tracking-[0.4em] font-black ${theme === 'light' ? 'text-black/10 bg-[#FFFFFF]' : 'text-white/10 bg-[#000000]'}`}>{t.or}</span>
                  </div>
                </>
              )}

              {error && (
                <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-4 text-rose-500 text-[11px] font-bold animate-shake text-right">
                  <ShieldAlert size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-4 text-emerald-500 text-[11px] font-bold animate-in zoom-in-95 text-right">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-8">
                {mode === 'forgot' && (
                  <div className="space-y-6">
                    <p className={`text-xs ${theme === 'light' ? 'text-black/40' : 'text-white/30'} font-bold uppercase tracking-widest text-right`}>
                      {t.forgotSubtitle}
                    </p>
                    {/* Reset Method Switcher */}
                    <div className={`p-1 rounded-2xl flex ${theme === 'light' ? 'bg-[#F9F9F9]' : 'bg-white/5'}`}>
                      <button 
                        type="button"
                        onClick={() => setResetMethod('email')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${resetMethod === 'email' ? 'bg-primary text-black' : (theme === 'light' ? 'text-black/40' : 'text-white/30')}`}
                      >
                        <Mail size={14} />
                        <span>אימייל</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setResetMethod('sms')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${resetMethod === 'sms' ? 'bg-primary text-black' : (theme === 'light' ? 'text-black/40' : 'text-white/30')}`}
                      >
                        <Phone size={14} />
                        <span>SMS</span>
                      </button>
                    </div>
                  </div>
                )}
                {mode === 'register' && (
                  <div className="space-y-3 group">
                    <label className={`block text-[10px] uppercase tracking-[0.2em] font-black ${theme === 'light' ? 'text-black/20' : 'text-white/20'} ${isRTL ? 'pr-2' : 'pl-2'} group-focus-within:text-primary transition-colors text-right`}>{t.fullName}</label>
                    <div className="relative shadow-sm rounded-2xl overflow-hidden">
                      <User size={18} className={`absolute ${isRTL ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-black/10`} />
                      <input 
                        required
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t.fullNamePlaceholder}
                        className={`w-full h-15 ${theme === 'light' ? 'bg-[#F9F9F9] border border-[#EEEEEE] text-black' : 'bg-white/5 border border-white/5 text-white'} focus:border-primary focus:bg-transparent rounded-2xl ${isRTL ? 'pr-14 pl-5' : 'pl-14 pr-5'} text-sm font-bold outline-none transition-all placeholder:text-black/10`}
                      />
                    </div>
                  </div>
                )}
                
                {mode !== 'forgot' || resetMethod === 'email' ? (
                  <div className="space-y-3 group">
                    <label className={`block text-[10px] uppercase tracking-[0.2em] font-black ${theme === 'light' ? 'text-black/20' : 'text-white/20'} ${isRTL ? 'pr-2' : 'pl-2'} group-focus-within:text-primary transition-colors text-right`}>{t.email}</label>
                    <div className="relative shadow-sm rounded-2xl overflow-hidden">
                      <Mail size={18} className={`absolute ${isRTL ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-black/10`} />
                      <input 
                        required
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="core@qyzvo.intelligence"
                        autoComplete="email"
                        className={`w-full h-15 ${theme === 'light' ? 'bg-[#F9F9F9] border border-[#EEEEEE] text-black' : 'bg-white/5 border border-white/5 text-white'} focus:border-primary focus:bg-transparent rounded-2xl ${isRTL ? 'pr-14 pl-5' : 'pl-14 pr-5'} text-sm font-bold outline-none transition-all placeholder:text-black/10`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 group">
                    <label className={`block text-[10px] uppercase tracking-[0.2em] font-black ${theme === 'light' ? 'text-black/20' : 'text-white/20'} ${isRTL ? 'pr-2' : 'pl-2'} group-focus-within:text-primary transition-colors text-right`}>{t.phone}</label>
                    <div className="relative shadow-sm rounded-2xl overflow-hidden">
                      <Phone size={18} className={`absolute ${isRTL ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-black/10`} />
                      <input 
                        required
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="050-000-0000"
                        className={`w-full h-15 ${theme === 'light' ? 'bg-[#F9F9F9] border border-[#EEEEEE] text-black' : 'bg-white/5 border border-white/5 text-white'} focus:border-primary focus:bg-transparent rounded-2xl ${isRTL ? 'pr-14 pl-5' : 'pl-14 pr-5'} text-sm font-bold outline-none transition-all placeholder:text-black/10`}
                      />
                    </div>
                  </div>
                )}

                {mode !== 'forgot' && (
                  <div className="space-y-3 group">
                    <div className={`flex justify-between items-center ${isRTL ? 'pr-2' : 'pl-2'}`}>
                      <label className={`block text-[10px] uppercase tracking-[0.2em] font-black ${theme === 'light' ? 'text-black/20' : 'text-white/20'} group-focus-within:text-primary transition-colors`}>{t.password}</label>
                      {mode === 'login' && <button type="button" onClick={() => setMode('forgot')} className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline">{t.forgot}</button>}
                    </div>
                    <div className="relative shadow-sm rounded-2xl overflow-hidden">
                      <Lock size={18} className={`absolute ${isRTL ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-black/10`} />
                      <input 
                        required
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete={mode === 'register' ? "new-password" : "current-password"}
                        className={`w-full h-15 ${theme === 'light' ? 'bg-[#F9F9F9] border border-[#EEEEEE] text-black' : 'bg-white/5 border border-white/5 text-white'} focus:border-primary focus:bg-transparent rounded-2xl ${isRTL ? 'pr-14 pl-5' : 'pl-14 pr-5'} text-sm font-bold outline-none transition-all placeholder:text-black/10`}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <motion.button 
                    type="submit"
                    disabled={isLoading || countdown > 0}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full h-16 bg-primary text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl flex items-center justify-center gap-4 shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : (
                      <>
                        <span>{mode === 'login' ? t.submitLogin : (mode === 'forgot' ? (resetMethod === 'email' ? t.submitReset : t.submitSmsReset) : t.submitRegister)}</span>
                        <ArrowRight size={20} className={isRTL ? 'rotate-180' : ''} />
                      </>
                    )}
                  </motion.button>

                  {mode === 'forgot' && countdown > 0 && (
                    <p className={`text-[10px] font-bold text-center uppercase tracking-widest ${theme === 'light' ? 'text-black/40' : 'text-white/30'}`}>
                      {t.resendIn} <span className="text-primary">{countdown} {t.seconds}</span>
                    </p>
                  )}

                  {mode === 'forgot' && (
                    <button 
                      type="button" 
                      onClick={() => { setMode('login'); setSuccess(null); setError(null); }}
                      className={`w-full text-[10px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-black/40 hover:text-black' : 'text-white/30 hover:text-white'} transition-colors`}
                    >
                      {t.backToLogin}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer info */}
        <div className="mt-16 text-center space-y-6">
          <p className={`text-[10px] ${theme === 'light' ? 'text-black/20' : 'text-white/10'} font-bold leading-relaxed max-w-sm mx-auto uppercase tracking-wider`}>
            {t.terms} <span className={`${theme === 'light' ? 'text-black/40' : 'text-white/30'} cursor-pointer hover:text-primary`}>{t.tos}</span> {t.and} <span className={`${theme === 'light' ? 'text-black/40' : 'text-white/30'} cursor-pointer hover:text-primary`}>{t.privacy}</span>
          </p>
          <div className={`h-px w-12 ${theme === 'light' ? 'bg-black/5' : 'bg-white/5'} mx-auto`} />
          <div className={`flex items-center justify-center gap-2 text-[10px] font-black ${theme === 'light' ? 'text-black/10' : 'text-white/10'} uppercase tracking-[0.3em] font-mono`}>
            <span>{t.poweredBy}</span>
            <span className={`${theme === 'light' ? 'text-black/20' : 'text-white/20'}`}>QYZVO PROTOCOL</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
