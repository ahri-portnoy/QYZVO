import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Award, 
  MapPin, 
  Share2, 
  Users, 
  User as UserIcon, 
  Sparkles, 
  FileText, 
  Menu,
  ChevronLeft,
  CheckCircle,
  Gem,
  Compass,
  Leaf
} from 'lucide-react';
import { User, BusinessProfile } from '../../types';
import { MobileHeader } from './MobileHeader';

interface MobileProfileProps {
  user: User;
  profile: BusinessProfile | null;
  onNavigate: (tab: string) => void;
}

export const MobileProfile: React.FC<MobileProfileProps> = ({ user, profile, onNavigate }) => {
  const userName = user?.fullName || 'אלכס ריברס';
  const userBio = user?.bio || 'אדריכל ראשי ומייסד שותף ב-QYZVO';
  const businessName = profile?.name || 'QYZVO ארכיטקטים';

  return (
    <div className="absolute inset-0 bg-[#fbf9f8] text-[#2D2924] pb-24 font-sans px-5 pt-4 overflow-y-auto" dir="rtl">
      {/* Header */}
      <MobileHeader 
        user={user} 
        onNavigate={onNavigate} 
        leftAction={(
          <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-[#6a5a3d]/10 text-[#6a5a3d] active:scale-95 transition-all shadow-sm">
            <Share2 size={18} />
          </button>
        )}
      />

      {/* Avatar Container */}
      <div className="flex flex-col items-center justify-center text-center mt-2 mb-8">
        <div className="relative mb-4">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-md bg-white p-0.5">
            <div className="w-full h-full rounded-full overflow-hidden bg-slate-200">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&auto=format" alt={userName} className="w-full h-full object-cover" />
              )}
            </div>
          </div>
          {/* Verified Badge */}
          <div className="absolute bottom-1 right-1 bg-amber-500 text-white rounded-full p-1.5 border-2 border-white shadow-sm flex items-center justify-center">
            <CheckCircle size={14} className="fill-white stroke-amber-500" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-[#2D2924]">{userName}</h2>
        <p className="text-xs text-[#7e766b] mt-1 font-medium font-sans px-4 leading-relaxed">{userBio}</p>

        {/* Experience Badges Row */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4">
          <span className="text-[10px] font-sans font-bold bg-[#6a5a3d]/10 text-[#6a5a3d] px-3 py-1 rounded-full border border-[#6a5a3d]/5">
            תכנון אסטרטגי
          </span>
          <span className="text-[10px] font-sans font-bold bg-[#6a5a3d]/10 text-[#6a5a3d] px-3 py-1 rounded-full border border-[#6a5a3d]/5">
            עיצוב יוקרתי
          </span>
          <span className="text-[10px] font-sans font-bold bg-[#6a5a3d]/10 text-[#6a5a3d] px-3 py-1 rounded-full border border-[#6a5a3d]/5">
            ניהול פרויקטים
          </span>
        </div>
      </div>

      {/* DNA section */}
      <div className="space-y-6 mb-8">
        <h3 className="text-lg font-bold text-[#2D2924] text-right">DNA עסקי מנצח</h3>

        {/* Card 1: Vision */}
        <div className="bg-white rounded-[24px] p-5 border border-[#6a5a3d]/5 shadow-[0_4px_20px_rgba(106,90,61,0.02)] space-y-4">
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-bold text-[#7e766b] uppercase tracking-wider">החזון המוביל</span>
            <h4 className="font-bold text-base text-[#2D2924] leading-snug">יצירת מרחבים שמעוררים השראה ומשפרים את איכות החיים בקנה מידה רחב.</h4>
          </div>
          
          <div className="relative h-44 rounded-2xl overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop" 
              alt="Skyscraper project" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2D2924]/60 via-transparent to-transparent flex items-end p-4">
              <p className="text-xs font-serif italic text-white/95 leading-relaxed">
                "אדריכלות היא שפה של רגשות שנשארת חקוקה בחומר."
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Growth Strategy */}
        <div className="bg-white rounded-[24px] p-5 border border-[#6a5a3d]/5 shadow-[0_4px_20px_rgba(106,90,61,0.02)] space-y-4 text-right">
          <span className="text-[10px] font-bold text-[#7e766b] uppercase tracking-wider">אסטרטגיית צמיחה</span>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6a5a3d] mt-1.5 shrink-0" />
              <p className="text-xs text-[#2D2924] font-medium leading-relaxed">התמקדות בפתרונות בנייה ירוקה וקיימות מרבית</p>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6a5a3d] mt-1.5 shrink-0" />
              <p className="text-xs text-[#2D2924] font-medium leading-relaxed">שילוב כלי בינה מלאכותית (AI) לייעול ניהול המלאי והתאמת המשאבים</p>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6a5a3d] mt-1.5 shrink-0" />
              <p className="text-xs text-[#2D2924] font-medium leading-relaxed">הרחבת מעגל הלקוחות ושותפויות אסטרטגיות בשילוב בינלאומי</p>
            </li>
          </ul>
          <button 
            onClick={() => onNavigate('dashboard')}
            className="w-full py-2.5 rounded-full border border-[#6a5a3d]/20 text-[#6a5a3d] text-xs font-bold hover:bg-[#6a5a3d]/5 transition-all"
          >
            קרא עוד
          </button>
        </div>

        {/* Card 3: Experience count summary */}
        <div className="bg-white rounded-[24px] p-5 border border-[#6a5a3d]/5 shadow-[0_4px_20px_rgba(106,90,61,0.02)] flex items-center justify-between">
          <div className="text-right">
            <h4 className="font-bold text-sm text-[#2D2924]">+15 שנות ניסיון גלובלי</h4>
            <p className="text-xs text-[#7e766b] mt-0.5">לונדון | ניו יורק | תל אביב</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#6a5a3d]/5 flex items-center justify-center text-[#6a5a3d]">
            <Award size={20} />
          </div>
        </div>

        {/* Card 4: Collaborators & Blueprint */}
        <div className="bg-white rounded-[24px] p-5 border border-[#6a5a3d]/5 shadow-[0_4px_20px_rgba(106,90,61,0.02)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <h4 className="font-bold text-sm text-[#2D2924]">שיתוף פעולה כערך עליון</h4>
              <p className="text-xs text-[#7e766b] mt-0.5">מעל 12 צוותים מחוברים</p>
            </div>
            <div className="flex items-center -space-x-1 rtl:space-x-reverse">
              <div className="w-6 h-6 rounded-full border border-white bg-slate-200">
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80" alt="avatar" className="w-full h-full object-cover rounded-full" />
              </div>
              <div className="w-6 h-6 rounded-full border border-white bg-slate-300">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80" alt="avatar" className="w-full h-full object-cover rounded-full" />
              </div>
              <div className="w-6 h-6 rounded-full bg-[#6a5a3d]/10 border border-white flex items-center justify-center text-[8px] font-bold text-[#6a5a3d]">
                12+
              </div>
            </div>
          </div>
          
          <div className="h-32 rounded-xl overflow-hidden border border-[#6a5a3d]/10">
            <img 
              src="https://images.unsplash.com/photo-1503387873418-76ad062767ab?q=80&w=400&auto=format&fit=crop" 
              alt="Blueprint details" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* DNA Principles */}
      <div className="space-y-4 mb-4">
        <h3 className="text-lg font-bold text-[#2D2924] text-right">עקרונות ה-DNA שלנו</h3>

        {/* Principle 1 */}
        <div className="bg-white rounded-2xl p-4 border border-[#6a5a3d]/5 shadow-sm flex items-start gap-4 text-right">
          <div className="w-10 h-10 rounded-xl bg-[#6a5a3d]/5 border border-[#6a5a3d]/10 flex items-center justify-center text-[#6a5a3d] shrink-0 mt-0.5">
            <Gem size={18} strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-[#2D2924]">איכות ללא פשרות</h4>
            <p className="text-xs text-[#7e766b] leading-relaxed">שימוש בחומרים הטובים ביותר, דיוק מוחלט בפרטים הקטנים ביותר ופיקוח קפדני.</p>
          </div>
        </div>

        {/* Principle 2 */}
        <div className="bg-white rounded-2xl p-4 border border-[#6a5a3d]/5 shadow-sm flex items-start gap-4 text-right">
          <div className="w-10 h-10 rounded-xl bg-[#6a5a3d]/5 border border-[#6a5a3d]/10 flex items-center justify-center text-[#6a5a3d] shrink-0 mt-0.5">
            <Compass size={18} strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-[#2D2924]">חדשנות עיצובית</h4>
            <p className="text-xs text-[#7e766b] leading-relaxed">פריצת גבולות בכל פרויקט מחדש עם פתרונות וטכנולוגיות יצירתיות ומתקדמות.</p>
          </div>
        </div>

        {/* Principle 3 */}
        <div className="bg-white rounded-2xl p-4 border border-[#6a5a3d]/5 shadow-sm flex items-start gap-4 text-right">
          <div className="w-10 h-10 rounded-xl bg-[#6a5a3d]/5 border border-[#6a5a3d]/10 flex items-center justify-center text-[#6a5a3d] shrink-0 mt-0.5">
            <Leaf size={18} strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-[#2D2924]">אחריות סביבתית</h4>
            <p className="text-xs text-[#7e766b] leading-relaxed">תכנון ירוק המשתלב בסביבה הטבעית ומכבד את המשאבים תוך צמצום טביעת הרגל הפחמנית.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
