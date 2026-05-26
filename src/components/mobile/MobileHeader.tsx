import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  X, 
  Sparkles, 
  LayoutDashboard, 
  Package, 
  User as LucideUser, 
  Settings as LucideSettings, 
  Bot, 
  LogOut,
  ChevronLeft
} from 'lucide-react';
import { User } from '../../types';
import { Logo } from '../Logo';

interface MobileHeaderProps {
  user: User | null;
  onNavigate: (tab: string) => void;
  leftAction?: React.ReactNode;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ user, onNavigate, leftAction }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const userName = user?.fullName || 'אורח';

  const menuItems = [
    { id: 'dashboard', label: 'ראשי וביצועים', icon: LayoutDashboard, path: 'dashboard' },
    { id: 'chat', label: 'צ\'אט AI אסטרטגי', icon: Bot, path: 'chat' },
    { id: 'inventory', label: 'ניהול מלאי וספקים', icon: Package, path: 'inventory' },
    { id: 'profile', label: 'פרופיל ו-DNA עסקי', icon: LucideUser, path: 'profile' },
    { id: 'settings', label: 'הגדרות מערכת', icon: LucideSettings, path: 'settings' },
  ];

  const handleItemClick = (path: string) => {
    setIsDrawerOpen(false);
    onNavigate(path);
  };

  return (
    <>
      {/* Real-time Luxurious Header */}
      <div className="flex items-center justify-between mb-6 z-40 relative">
        {/* Left Action: either avatar or special action like Share */}
        {leftAction ? (
          <div className="flex items-center justify-center">
            {leftAction}
          </div>
        ) : (
          <button 
            onClick={() => onNavigate('profile')}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#6a5a3d]/20 bg-white shadow-sm active:scale-95 transition-all relative flex items-center justify-center shrink-0"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={userName} className="w-full text-center h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#6a5a3d]/10 text-[#6a5a3d]">
                <LucideUser size={18} />
              </div>
            )}
            {/* Online Pulse status */}
            <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
          </button>
        )}
        
        {/* QYZVO Brand Logo */}
        <button 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1 active:scale-95 transition-all"
        >
          <Logo size={24} showText={false} />
          <span className="font-sans font-black text-base tracking-wider text-[#6a5a3d] ml-1">QYZVO</span>
        </button>

        {/* Menu Toggle Trigger */}
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-[#6a5a3d]/10 text-[#6a5a3d] hover:bg-[#6a5a3d]/5 active:scale-95 transition-all shadow-sm"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Slideout Fullscreen Drawer navigation Menu */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-[200] flex justify-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Sidebar drawer panel */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-[290px] h-full bg-[#fbf9f8] text-[#2D2924] p-6 shadow-2xl flex flex-col justify-between"
              dir="rtl"
            >
              <div>
                {/* Drawer close and logo */}
                <div className="flex items-center justify-between mb-8 border-b pb-4 border-[#6a5a3d]/10">
                  <div className="flex items-center gap-1.5">
                    <Logo size={28} showText={false} />
                    <span className="font-sans font-black text-lg tracking-wider text-[#6a5a3d] ml-1">QYZVO</span>
                  </div>

                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-8 h-8 rounded-full bg-white border border-[#6a5a3d]/10 flex items-center justify-center text-[#6a5a3d] active:scale-95 transition-all shadow-sm"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* User quick profile */}
                <div className="flex items-center gap-3 mb-8 bg-white/50 p-3 rounded-2xl border border-[#6a5a3d]/5">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#6a5a3d]/20 bg-white shrink-0">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={userName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#6a5a3d]/10 text-[#6a5a3d]">
                        <LucideUser size={18} />
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <h4 className="font-bold text-xs text-[#2D2924] truncate max-w-[150px]">{userName}</h4>
                    <p className="text-[10px] text-[#7e766b] mt-0.5 truncate max-w-[150px]">{user?.bio || 'מנהל מערכת'}</p>
                  </div>
                </div>

                {/* Navigation links */}
                <div className="space-y-2">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.path)}
                      className="w-full p-3.5 rounded-2xl flex items-center justify-between hover:bg-[#6a5a3d]/5 active:bg-[#6a5a3d]/10 text-right transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white border border-[#6a5a3d]/10 flex items-center justify-center text-[#6a5a3d] shadow-sm">
                          <item.icon size={15} />
                        </div>
                        <span className="text-xs font-bold text-[#2D2924] group-hover:text-[#6a5a3d]">
                          {item.label}
                        </span>
                      </div>
                      <ChevronLeft size={14} className="text-[#7e766b]/60 group-hover:text-[#6a5a3d] transition-all" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer inside drawer panel */}
              <div className="space-y-4 pt-4 border-t border-[#6a5a3d]/10">
                <div className="flex items-center gap-1 text-[10px] text-[#7e766b] font-mono leading-none justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ONLINE • V1.4.0
                </div>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    // Standard action
                    window.location.reload();
                  }}
                  className="w-full py-3 rounded-full bg-[#e35a3e]/10 text-[#e35a3e] hover:bg-[#e35a3e]/20 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 border border-[#e35a3e]/10 shadow-sm"
                >
                  <LogOut size={13} />
                  רענן והתנתק מהמערכת
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
