/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, LayoutDashboard, MessageSquare, Shield, Activity, Settings, Sparkles, User as LucideUser, LogOut, Search, X, Folder, Loader2, History as HistoryIcon, Cloud, Bell, BellOff, BellRing, Check, CheckCheck, AlertTriangle, Package, Truck, Info, Trash2 } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Chat } from './components/Chat';
import { Settings as SettingsView } from './components/Settings';
import { Profile as ProfileView } from './components/Profile';
import { WorkspaceHub } from './components/WorkspaceHub';
import { Auth } from './components/Auth';
import { Logo } from './components/Logo';
import { MobileDashboard } from './components/mobile/MobileDashboard';
import { MobileProfile } from './components/mobile/MobileProfile';
import { MobileInventory } from './components/mobile/MobileInventory';
import { MobileChat } from './components/mobile/MobileChat';
import { MobileSettings } from './components/mobile/MobileSettings';
import { StorageProvider } from './services/storage';
import { BusinessProfile, Product, Supplier, User, AppNotification } from './types';
import { getDirection } from './services/utils';
import { auth, db, handleFirestoreError, OperationType } from './services/firebaseService';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot, collection, query, orderBy, where } from 'firebase/firestore';

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lang, setLang] = useState<'he' | 'en'>('he');

  // Notifications & Toasts states
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'welcome',
      title: 'ברוך הבא ל-QYZVO!',
      message: 'סמנכ"ל המלאי החכם שלך פעיל. המערכת תסרוק באופן אוטומטי ותתריע על חוסרים ומלאי קריטי.',
      timestamp: new Date().toISOString(),
      type: 'system',
      read: false
    }
  ]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; message: string; type: string }>>([]);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('Notification' in window ? Notification.permission : 'default');
  const [firedAlerts, setFiredAlerts] = useState<Record<string, string>>({}); // productId -> 'low' or 'empty'

  const [mobileNotificationsOnly, setMobileNotificationsOnly] = useState(() => {
    const saved = localStorage.getItem('mobile_notifications_only');
    return saved !== null ? saved === 'true' : true;
  });

  const isMobileClient = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  }, []);

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = useMemo(() => {
    return isMobileClient || windowWidth < 768;
  }, [isMobileClient, windowWidth]);

  // Listen for local storage change to sync settings instantly
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('mobile_notifications_only');
      setMobileNotificationsOnly(saved !== null ? saved === 'true' : true);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addToast = (title: string, message: string, type: 'info' | 'success' | 'warn' | 'error' | 'system' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const requestPushPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
      addToast(
        perm === 'granted' ? 'ההתראות בדפדפן הופעלו' : 'הרשאת התראות נדחתה',
        perm === 'granted' ? 'ההתראות בדפדפן הופעלו בהצלחה!' : 'הרשאת התראות דפדפן נדחתה מהמשתמש.',
        perm === 'granted' ? 'success' : 'warn'
      );
    }
  };

  const triggerDemoNotification = () => {
    const demoAlerts = [
      {
        title: '📈 עליית קצב ביקוש',
        message: 'הסוכן זיהה עליה פתאומית של 25% בקצב הצריכה של קטגוריית המשקאות. מומלץ להצטייד מראש.',
        type: 'supplier'
      },
      {
        title: '🔒 ניסיון כניסה מאובטח',
        message: 'זוהתה כניסה מוצלחת לחשבון שלך מכתובת IP חדשה (תל אביב, ישראל).',
        type: 'security'
      },
      {
        title: '🚛 ספק חלופי מוצע',
        message: 'ה-AI איתר ספק חלופי עבור מוצרי חלב עם זמני אספקה קצרים ביומיים ונתוני מחיר עדיפים ב-5%.',
        type: 'supplier'
      },
      {
        title: '⚙️ אופטימיזציית מלאי הושלמה',
        message: 'ניתוח המלאי החודשי הושלם בהצלחה. כל המדדים תקינים והמערכת התייצבה.',
        type: 'system'
      }
    ];

    const randomAlert = demoAlerts[Math.floor(Math.random() * demoAlerts.length)];
    const id = `demo-${Math.random().toString(36).substring(2, 9)}`;
    
    const newN: AppNotification = {
      id,
      title: randomAlert.title,
      message: randomAlert.message,
      timestamp: new Date().toISOString(),
      type: randomAlert.type as any,
      read: false
    };

    setNotifications(prev => [newN, ...prev]);
    addToast(randomAlert.title, randomAlert.message, randomAlert.type === 'security' ? 'error' : randomAlert.type === 'supplier' ? 'info' : 'success');

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(randomAlert.title, { body: randomAlert.message });
    }
  };

  // Auto scanning products for stock warning notifications
  useEffect(() => {
    if (products.length === 0) return;

    const newNotifications: AppNotification[] = [];
    const updatedFired = { ...firedAlerts };
    let hasNewNotification = false;

    // Filter intrusive UI alerts (sound prompts, toast sliders, push notices) if user enabled mobile-only alerts other than on phone screens
    const shouldAlertUserIntrusively = !mobileNotificationsOnly || isMobileClient;

    products.forEach(p => {
      const isLow = p.currentStock <= p.minThreshold && p.currentStock > 0;
      const isEmpty = p.currentStock <= 0;

      if (isEmpty && firedAlerts[p.id] !== 'empty') {
        const title = `🚨 אזל המלאי: ${p.name}`;
        const message = `המוצר ${p.name} (SKU: ${p.sku}) אזל לחלוטין מהמלאי! נדרש להזמין בדחיפות מהספק.`;
        
        newNotifications.push({
          id: `empty-${p.id}-${Date.now()}`,
          title,
          message,
          timestamp: new Date().toISOString(),
          type: 'stock_empty',
          read: false,
          itemId: p.id
        });

        if (shouldAlertUserIntrusively) {
          addToast(title, message, 'error');
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body: message });
          }
        }
        updatedFired[p.id] = 'empty';
        hasNewNotification = true;
      } else if (isLow && firedAlerts[p.id] !== 'low') {
        const title = `⚠️ מלאי נמוך: ${p.name}`;
        const message = `מלאי של ${p.name} הגיע ל- ${p.currentStock} יחידות, מתחת לסף המינימום (${p.minThreshold}).`;

        newNotifications.push({
          id: `low-${p.id}-${Date.now()}`,
          title,
          message,
          timestamp: new Date().toISOString(),
          type: 'stock_low',
          read: false,
          itemId: p.id
        });

        if (shouldAlertUserIntrusively) {
          addToast(title, message, 'warn');
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body: message });
          }
        }
        updatedFired[p.id] = 'low';
        hasNewNotification = true;
      } else if (!isLow && !isEmpty && firedAlerts[p.id]) {
        // Product restocked, clear alert trace
        delete updatedFired[p.id];
        
        const title = `✓ חודש מלאי: ${p.name}`;
        const message = `מלאי של ${p.name} חודש ועומד כעת על ${p.currentStock} יחידות.`;
        newNotifications.push({
          id: `restocked-${p.id}-${Date.now()}`,
          title,
          message,
          timestamp: new Date().toISOString(),
          type: 'system',
          read: false,
          itemId: p.id
        });
        if (shouldAlertUserIntrusively) {
          addToast(title, message, 'success');
        }
        hasNewNotification = true;
      }
    });

    if (hasNewNotification) {
      setNotifications(prev => {
        const filtered = prev.filter(n => {
          const isOlderDup = newNotifications.some(newN => newN.itemId === n.itemId && newN.type === n.type);
          return !isOlderDup;
        });
        return [...newNotifications, ...filtered];
      });
      setFiredAlerts(updatedFired);
    }
  }, [products]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  // Chat integration state
  const [chatActivePanel, setChatActivePanel] = useState<'none' | 'memory' | 'identity'>('none');
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [clearChatTrigger, setClearChatTrigger] = useState(0);

  // Auth & Data Sync
  useEffect(() => {
    const savedTheme = StorageProvider.getTheme();
    setTheme(savedTheme as any);

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setIsInitialLoading(false);

        // Check for admin status
        try {
          const adminDocRef = doc(db, 'admins', fbUser.uid);
          const adminSnap = await getDoc(adminDocRef);
          setIsAdmin(adminSnap.exists());
        } catch (e) {
          setIsAdmin(false);
        }

        // Sync user data
        const userDocRef = doc(db, 'users', fbUser.uid);
        const unsubUser = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            setUser(snap.data() as User);
          } else {
            const newUser: User = {
              id: fbUser.uid,
              fullName: fbUser.displayName || 'משתמש QYZVO',
              email: fbUser.email || '',
            };
            if (fbUser.phoneNumber) {
              newUser.phoneNumber = fbUser.phoneNumber;
            }
            // Sanitize to be 100% sure we never push undefined fields to firestore
            const sanitized = JSON.parse(JSON.stringify(newUser));
            setDoc(userDocRef, sanitized).catch(e => console.error("User init error", e));
            setUser(newUser);
          }
        }, (error) => {
          console.error("User sync error:", error);
        });

        // Sync Profile
        const profileDocRef = doc(db, 'businessProfiles', fbUser.uid);
        const unsubProfile = onSnapshot(profileDocRef, (snap) => {
          if (snap.exists()) setProfile(snap.data() as BusinessProfile);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'businessProfiles/' + fbUser.uid);
        });

        // Sync Products
        const qProducts = query(collection(db, 'products'), where('ownerId', '==', fbUser.uid));
        const unsubProducts = onSnapshot(qProducts, (snapshot) => {
          const productList: Product[] = [];
          snapshot.forEach((doc) => productList.push({ id: doc.id, ...doc.data() } as Product));
          setProducts(productList);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'products');
        });

        // Sync Suppliers
        const qSuppliers = query(collection(db, 'suppliers'), where('ownerId', '==', fbUser.uid));
        const unsubSuppliers = onSnapshot(qSuppliers, (snapshot) => {
          const supplierList: Supplier[] = [];
          snapshot.forEach((doc) => supplierList.push({ id: doc.id, ...doc.data() } as Supplier));
          setSuppliers(supplierList);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'suppliers');
        });

        return () => {
          unsubUser();
          unsubProfile();
          unsubProducts();
          unsubSuppliers();
        };
      } else {
        setUser(null);
        setProducts([]);
        setSuppliers([]);
        setIsInitialLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return [];
    return products.filter(p => 
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  useEffect(() => {
    StorageProvider.saveTheme(theme);
  }, [theme]);

  const activeTab = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/chat')) return 'chat';
    if (path.startsWith('/dashboard')) return 'dashboard';
    if (path.startsWith('/workspace')) return 'workspace';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/settings')) return 'settings';
    return 'chat';
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleUserUpdate = async (updatedUser: User) => {
    if (!auth.currentUser) return;
    setUser(updatedUser);
    
    // Sanitize for Firestore (remove undefined)
    const sanitized = JSON.parse(JSON.stringify(updatedUser));
    
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), sanitized);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users/' + auth.currentUser.uid);
    }
  };

  const handleProfileUpdate = async (newProfile: BusinessProfile) => {
    if (!auth.currentUser) return;
    setProfile(newProfile);
    
    // Sanitize for Firestore
    const sanitized = JSON.parse(JSON.stringify(newProfile));
    
    try {
      await setDoc(doc(db, 'businessProfiles', auth.currentUser.uid), sanitized);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'businessProfiles/' + auth.currentUser.uid);
    }
  };

  const handleInventoryUpdate = async (type: 'product' | 'supplier', item: any) => {
    if (!auth.currentUser) return;
    const path = type === 'product' ? 'products' : 'suppliers';
    const itemId = item.id || Math.random().toString(36).substr(2, 9);
    const docRef = doc(db, path, itemId);
    
    // Ensure ownerId is set
    const itemWithAuth = {
      ...item,
      id: itemId,
      ownerId: auth.currentUser.uid,
      updatedAt: new Date().toISOString()
    };
    
    try {
      await setDoc(docRef, JSON.parse(JSON.stringify(itemWithAuth)));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${path}/${itemId}`);
    }
  };

  const handleResetAll = async () => {
    if (!auth.currentUser) return;
    
    // 1. Delete all products
    for (const product of products) {
      await deleteDoc(doc(db, 'products', product.id)).catch(console.error);
    }
    
    // 2. Delete all suppliers
    for (const supplier of suppliers) {
      await deleteDoc(doc(db, 'suppliers', supplier.id)).catch(console.error);
    }
    
    // 3. Reset Profile
    const profileRef = doc(db, 'businessProfiles', auth.currentUser.uid);
    await deleteDoc(profileRef).catch(console.error);
    
    // 4. Reset Local Storage & Chat History/Archive
    const cachedUser = StorageProvider.getUser();
    StorageProvider.reset();
    if (cachedUser) {
      StorageProvider.saveUser(cachedUser);
    }
    
    // 5. Force reset local state
    setProducts([]);
    setSuppliers([]);
    setProfile(null);
    navigate('/chat');
  };

  if (isInitialLoading) {
    return (
      <div className={`h-screen w-full flex items-center justify-center ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth theme={theme} onLogin={() => {}} isMobile={isMobile} />;
  }

  if (isMobile) {
    return (
      <div className="h-screen w-full bg-[#fbf9f8] flex flex-col overflow-hidden select-none" dir="rtl">
        {/* Mobile Viewport Container */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <Routes location={location}>
              <Route path="/chat" element={<MobileChat user={user} profile={profile} products={products} suppliers={suppliers} onInventoryUpdate={handleInventoryUpdate} onNavigate={(tab) => navigate('/' + tab)} />} />
              <Route path="/dashboard" element={<MobileDashboard user={user} products={products} suppliers={suppliers} onNavigate={(tab) => navigate('/' + tab)} onInventoryUpdate={handleInventoryUpdate} />} />
              <Route path="/inventory" element={<MobileInventory user={user} products={products} suppliers={suppliers} onInventoryUpdate={handleInventoryUpdate} isRTL={true} onNavigate={(tab) => navigate('/' + tab)} />} />
              <Route path="/profile" element={<MobileProfile user={user} profile={profile} onNavigate={(tab) => navigate('/' + tab)} />} />
              <Route path="/settings" element={<MobileSettings user={user} profile={profile} theme={theme} setTheme={setTheme} onUserUpdate={handleUserUpdate} onProfileUpdate={handleProfileUpdate} onResetAll={handleResetAll} isRTL={true} onNavigate={(tab) => navigate('/' + tab)} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AnimatePresence>
        </div>

        {/* Floating Capsule Bottom Nav matching Screen 1 */}
        <div className="h-20 bg-white border-t border-[#6a5a3d]/10 px-6 pb-2.5 pt-2 flex items-center justify-between shadow-[0_-5px_25px_rgba(106,90,61,0.04)] absolute bottom-0 left-0 right-0 z-50">
          {[
            { id: 'dashboard', label: 'ראשי', icon: LayoutDashboard, path: '/dashboard' },
            { id: 'chat', label: 'AI Chat', icon: Sparkles, path: '/chat' },
            { id: 'inventory', label: 'מלאי', icon: Package, path: '/inventory' },
            { id: 'profile', label: 'פרופיל', icon: LucideUser, path: '/profile' },
            { id: 'settings', label: 'הגדרות', icon: Settings, path: '/settings' }
          ].map((item) => {
            const pathActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center relative flex-1 group"
              >
                {pathActive ? (
                  <motion.div 
                    layoutId="activeMobileIndicator"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#6a5a3d] text-white shadow-sm scale-105"
                  >
                    <item.icon size={14} />
                    <span className="text-[10px] font-bold font-sans tracking-tight">{item.label}</span>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center text-[#7e766b]/70 group-hover:text-[#6a5a3d] transition-colors p-2">
                    <item.icon size={18} strokeWidth={1.5} />
                    <span className="text-[8px] font-bold font-sans mt-0.5">{item.label}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const isRTL = lang === 'he';

  const t = {
    search: "חיפוש מלאי",
    chat: "ניהול חכם (AI)",
    dashboard: "לוח בקרה",
    profile: "פרופיל",
    settings: "הגדרות",
    logout: "התנתק",
    pilotStatus: "מנהל מלאי",
    coreActive: "מערכת פעילה",
    secureMemory: "מלאי מאובטח",
    searchPlaceholder: "חפש מוצר, SKU או קטגוריה...",
    searchResults: "תוצאות חיפוש",
    noResults: "לא נמצאו מוצרים",
    projectsLabel: "מוצרים",
    actionsLabel: "פעולות נפוצות",
    viewProfile: "צפה בפרופיל",
    viewConfig: "הצג הגדרות",
    strategicInsight: "תובנת מלאי",
    strategicQuote: '"ניהול מלאי חכם הוא קריטי לרווחיות. חוסר במלאי הוא הפסד מכירה, עודף במלאי הוא בזבוז מזומנים."',
    entropyResistance: "בריאות המלאי",
    decisionLogic: "דיוק מלאי",
    strategicDepth: "זמינות מוצרים",
    memoryRetention: "שימור נתונים",
    upgradeLogic: "שדרוג לוגי",
    startTyping: "התחל להקליד כדי לחפש",
    view: "צפה"
  };

  const getBgColor = () => {
    switch (theme) {
      case 'light': return 'bg-[#FDFDFD] text-black';
      default: return 'bg-[#000000] text-white';
    }
  };

  const getBorderColor = () => {
    switch (theme) {
      case 'light': return 'border-black/5';
      default: return 'border-white/10';
    }
  };

  const getNavIconColor = (active: boolean) => {
    if (active) return 'bg-primary text-black shadow-[0_10px_30px_rgba(212,175,55,0.3)] ring-1 ring-primary/20';
    switch (theme) {
      case 'light': return 'text-black/60 hover:text-black hover:bg-black/5';
      default: return 'text-white/60 hover:text-white hover:bg-white/5';
    }
  };

  return (
    <div className={`flex flex-col md:flex-row h-screen w-full transition-colors duration-1000 overflow-hidden font-sans ${getBgColor()}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Tactical Rail / Bottom Bar */}
      <nav className={`fixed bottom-0 left-0 right-0 h-16 md:h-full md:w-20 md:relative flex flex-row md:flex-col items-center px-4 md:px-0 py-1.5 md:py-6 gap-0 md:gap-6 border-t md:border-t-0 md:border-e ${getBorderColor()} z-50 backdrop-blur-3xl ${theme === 'light' ? 'bg-white/90 shadow-[0_-4px_24px_rgba(0,0,0,0.05)] border-t-black/[0.03]' : 'bg-black/90 shadow-[0_-10px_40px_rgba(0,0,0,0.6)]'}`}>
        <motion.div 
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className={`w-10 h-10 rounded-xl hidden md:flex items-center justify-center mb-4 cursor-pointer relative group transition-all duration-500`}
          onClick={() => navigate('/chat')}
        >
          <Logo size={32} />
          <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
        
        <div className="flex-1 w-full flex flex-row md:flex-col items-center justify-around md:justify-start gap-0 md:gap-4 py-1">
            {[
              { id: 'chat', icon: MessageSquare, label: t.chat, onClick: () => navigate('/chat'), isActive: activeTab === 'chat' },
              { id: 'dashboard', icon: LayoutDashboard, label: t.dashboard, onClick: () => navigate('/dashboard'), isActive: activeTab === 'dashboard' },
              { id: 'workspace', icon: Cloud, label: 'Workspace', onClick: () => navigate('/workspace'), isActive: activeTab === 'workspace' },
              { id: 'search', icon: Search, label: t.search, onClick: () => setIsSearchOpen(true), isActive: isSearchOpen },
              { id: 'profile', icon: LucideUser, label: t.profile, onClick: () => navigate('/profile'), isActive: activeTab === 'profile' },
              { id: 'settings', icon: Settings, label: t.settings, onClick: () => navigate('/settings'), isActive: activeTab === 'settings' },
            ].map((item) => (
              <motion.button 
                key={item.id}
                whileTap={{ scale: 0.9 }}
                onClick={item.onClick}
                className={`flex-1 md:flex-initial flex items-center justify-center rounded-xl transition-all h-11 w-11 max-w-[50px] md:w-12 md:h-12 cursor-pointer group ${getNavIconColor(item.isActive && item.id !== 'search')}`}
              >
                <div className={`${item.isActive && item.id !== 'search' ? 'text-black' : ''} flex items-center justify-center`}>
                  <item.icon size={18} className="transition-transform duration-300" strokeWidth={item.isActive ? 2.5 : 1.5} />
                </div>
              </motion.button>
            ))}
        </div>

        {/* Action Panel Trigger (Floating on Chat) - Hidden on Mobile to avoid overlapping with Chat Input */}
        <AnimatePresence>
          {activeTab === 'chat' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute -top-16 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2 p-1.5 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl"
            >
               <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setChatActivePanel(chatActivePanel === 'memory' ? 'none' : 'memory')}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${chatActivePanel === 'memory' ? 'bg-primary text-black' : 'text-white/60'}`}
              >
                <Activity size={18} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setClearChatTrigger(prev => prev + 1)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl text-white/60`}
              >
                <Sparkles size={18} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowChatHistory(!showChatHistory)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${showChatHistory ? 'bg-primary text-black' : 'text-white/60'}`}
              >
                <HistoryIcon size={18} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="hidden md:flex flex-col gap-4 mb-4 px-1 flex-shrink-0">
          <motion.div 
            whileHover={{ scale: 1.1, color: '#f43f5e' }}
            whileTap={{ scale: 0.9 }}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl ${theme === 'light' ? 'text-black/20' : 'text-white/20'} hover:bg-rose-500/10 cursor-pointer transition-all border border-transparent hover:border-rose-500/20`} 
            title={t.logout} 
            onClick={handleLogout}
          >
            <LogOut size={20} strokeWidth={1.5} />
          </motion.div>
        </div>
      </nav>

      {/* Main Content Pane */}
      <main className="flex-1 relative flex flex-col overflow-hidden mb-16 md:mb-0">
        {/* Header */}
        <header className={`h-11 flex items-center justify-between px-4 border-b ${getBorderColor()} backdrop-blur-xl ${theme === 'light' ? 'bg-white/20' : 'bg-black/20'} relative z-40`}>
          <div className={`flex items-center gap-3`}>
            {activeTab === 'chat' ? (
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${theme === 'light' ? 'bg-black text-white' : 'bg-primary text-black'}`}>
                  <Sparkles size={12} />
                </div>
                <h2 className={`text-[10px] font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'} uppercase`}>
                  ערוץ אסטרטגי
                </h2>
                
                {/* Mobile Quick Action Buttons - integrated to save block space */}
                <div className="flex items-center gap-1 border-s border-primary/20 ps-2 ms-1 md:hidden">
                  <button
                    onClick={() => setChatActivePanel(chatActivePanel === 'memory' ? 'none' : 'memory')}
                    className={`p-1 rounded-md transition-all ${chatActivePanel === 'memory' ? 'bg-primary text-black shadow-inner shadow-black/10' : 'text-slate-400 hover:text-white bg-white/5'}`}
                    title="זיכרון"
                  >
                    <Activity size={10} />
                  </button>
                  <button
                    onClick={() => setClearChatTrigger(prev => prev + 1)}
                    className="p-1 rounded-md transition-all text-slate-400 hover:text-white bg-white/5 border border-transparent active:scale-95"
                    title="נקה צ'אט"
                  >
                    <Trash2 size={10} />
                  </button>
                  <button
                    onClick={() => setShowChatHistory(!showChatHistory)}
                    className={`p-1 rounded-md transition-all ${showChatHistory ? 'bg-primary text-black shadow-inner shadow-black/10' : 'text-slate-400 hover:text-white bg-white/5'}`}
                    title="היסטוריה"
                  >
                    <HistoryIcon size={10} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]`}></div>
                </div>
                <span className={`text-[9px] font-black ${theme === 'light' ? 'text-black' : 'text-white'} tracking-widest uppercase`}>{t.coreActive}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`p-1.5 rounded-xl border relative cursor-pointer flex items-center justify-center transition-all ${
                  isNotificationsOpen 
                    ? 'bg-primary border-primary text-black shadow-lg shadow-primary/20' 
                    : theme === 'light' 
                      ? 'bg-black/5 hover:bg-black/10 border-black/5 text-black/70' 
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70'
                }`}
                title="התראות מערכת"
              >
                <Bell size={14} className={unreadCount > 0 ? 'animate-bounce' : ''} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -end-1 w-4.5 h-4.5 bg-rose-500 text-white font-mono text-[9px] font-black rounded-full flex items-center justify-center border border-slate-950 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </motion.button>

              {/* Notification Center Dropdown */}
              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsNotificationsOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={`absolute ${isRTL ? 'start-0' : 'end-0'} mt-3 w-80 md:w-96 rounded-[24px] overflow-hidden shadow-2xl border ${getBorderColor()} ${
                        theme === 'light' ? 'bg-white text-slate-800' : 'bg-[#0B0B0B] text-slate-100'
                      } z-50`}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    >
                      <div className={`p-4 border-b ${getBorderColor()} flex items-center justify-between ${theme === 'light' ? 'bg-black/[0.01]' : 'bg-white/[0.02]'}`}>
                        <div className="flex items-center gap-2">
                          <BellRing size={16} className="text-primary" />
                          <h4 className="text-xs font-black uppercase tracking-tight">מרכז התראות</h4>
                        </div>
                        {unreadCount > 0 && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500">
                            {unreadCount} חדשות
                          </span>
                        )}
                      </div>

                      {/* Push Permission Quick Promo */}
                      {pushPermission !== 'granted' && (
                        <div className={`p-3 border-b ${getBorderColor()} ${theme === 'light' ? 'bg-primary/5' : 'bg-primary/10'} flex items-center justify-between gap-3`}>
                          <p className="text-[10px] font-bold text-slate-400 leading-tight">קבל התראות דפדפן ונייד:</p>
                          <button
                            onClick={requestPushPermission}
                            className="text-[9px] font-black bg-primary text-black px-2.5 py-1 rounded-lg shadow-md hover:opacity-90 active:scale-95 transition-all shrink-0 cursor-pointer"
                          >
                            הפעל כעת
                          </button>
                        </div>
                      )}

                      {/* Notification Actions */}
                      <div className={`px-4 py-2 border-b ${getBorderColor()} flex justify-between items-center text-[10px] ${theme === 'light' ? 'bg-slate-50' : 'bg-black/40'}`}>
                        <button
                          onClick={triggerDemoNotification}
                          className="text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles size={10} />
                          סמלץ התראה
                        </button>
                        
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                              addToast('סומן כנקרא', 'כל ההתראות סומנו כנקראו.', 'success');
                            }}
                            className="text-slate-400 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCheck size={10} />
                            סמן הכל
                          </button>
                          <span className="text-slate-600">|</span>
                          <button
                            onClick={() => {
                              setNotifications([]);
                              addToast('נוקה בהצלחה', 'כל ההתראות נמחקו.', 'info');
                            }}
                            className="text-rose-500 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={10} />
                            נקה
                          </button>
                        </div>
                      </div>

                      {/* Notification Items List */}
                      <div className="max-h-[320px] overflow-y-auto custom-scrollbar divide-y divide-white/5">
                        {notifications.length === 0 ? (
                          <div className="py-12 text-center text-slate-500 space-y-2">
                            <BellOff className="mx-auto w-8 h-8 opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-wider">אין התראות חדשות</p>
                            <p className="text-[10px] text-slate-600">כל המערכות תקינות והמלאי מאוזן.</p>
                          </div>
                        ) : (
                          notifications.map((n) => {
                            let nIcon = <Info size={14} className="text-blue-400" />;
                            let nColor = 'bg-blue-500/10 border-blue-500/20';
                            if (n.type === 'stock_empty') {
                              nIcon = <Package size={14} className="text-rose-500" />;
                              nColor = 'bg-rose-500/10 border-rose-500/20';
                            } else if (n.type === 'stock_low') {
                              nIcon = <AlertTriangle size={14} className="text-amber-500" />;
                              nColor = 'bg-amber-500/10 border-amber-500/20';
                            } else if (n.type === 'security') {
                              nIcon = <Shield size={14} className="text-red-500" />;
                              nColor = 'bg-red-500/10 border-red-500/20';
                            } else if (n.type === 'supplier') {
                              nIcon = <Truck size={14} className="text-primary" />;
                              nColor = 'bg-primary/10 border-primary/20';
                            }

                            return (
                              <div
                                key={n.id}
                                onClick={() => {
                                  // Mark as read
                                  setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                                  if (n.itemId) {
                                    setIsSearchOpen(true);
                                    setSearchQuery(products.find(p => p.id === n.itemId)?.name || '');
                                  } else if (n.type === 'supplier') {
                                    navigate('/workspace');
                                  }
                                  setIsNotificationsOpen(false);
                                }}
                                className={`p-3.5 transition-all flex items-start gap-3 cursor-pointer text-start ${
                                  n.read 
                                    ? 'opacity-60 hover:opacity-100 bg-transparent' 
                                    : theme === 'light' ? 'bg-primary/[0.02] hover:bg-slate-50' : 'bg-primary/[0.02] hover:bg-white/[0.03]'
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${nColor}`}>
                                  {nIcon}
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div className="flex justify-between items-center">
                                    <h5 className="text-xs font-black tracking-tight leading-none text-primary">{n.title}</h5>
                                    <span className="text-[8px] font-mono opacity-40">
                                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className={`text-[10px] leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                                    {n.message}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className={`hidden sm:flex items-center gap-2 px-2 py-0.5 rounded-full border ${theme === 'light' ? 'bg-primary/5 border-primary/20' : 'bg-primary/10 border-primary/30'}`}>
              <Shield size={10} className="text-primary" />
              <span className={`text-[7px] font-black text-primary tracking-widest font-mono uppercase`}>{t.secureMemory}</span>
            </div>

            <div className={`text-[9px] font-black uppercase tracking-widest font-mono ${theme === 'light' ? 'text-black/40' : 'text-white/30'} border-s ${getBorderColor()} ps-4 flex items-center gap-4`}>
              <div className="flex items-center gap-3 pe-4 border-e border-white/10 ms-2">
                 <div 
                   onClick={() => navigate('/profile')}
                   className="flex items-center gap-2 cursor-pointer group hover:opacity-80 transition-all"
                 >
                   <div className="text-end hidden sm:block">
                     <p className={`text-[9px] font-black tracking-tighter ${theme === 'light' ? 'text-slate-900' : 'text-white'} uppercase`}>{user.fullName}</p>
                     <p className={`text-[7px] ${theme === 'light' ? 'text-black/30' : 'text-white/30'} font-mono`}>{isAdmin ? 'מנהל מערכת' : 'אסטרטג'}</p>
                   </div>
                   <div className={`w-7 h-7 rounded-lg overflow-hidden border ${theme === 'light' ? 'border-black/10' : 'border-primary/30'} bg-black group-hover:border-primary transition-colors`}>
                     {user.avatarUrl ? (
                       <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center bg-primary text-black">
                         <LucideUser size={14} />
                       </div>
                     )}
                   </div>
                 </div>
              </div>
              <div className="flex items-center">
                <span 
                  onClick={() => setLang('en')}
                  className={`cursor-pointer transition-colors ${lang === 'en' ? 'text-primary' : 'hover:text-black dark:hover:text-white'}`}
                >
                  EN
                </span>
                <span className="mx-2 opacity-30">|</span>
                <span 
                  onClick={() => setLang('he')}
                  className={`cursor-pointer transition-colors ${lang === 'he' ? 'text-primary' : 'hover:text-black dark:hover:text-white'}`}
                >
                  HE
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 relative bg-transparent overflow-hidden">
          {/* Live Toast Container */}
          <div className={`fixed top-14 ${isRTL ? 'left-6' : 'right-6'} z-[9999] flex flex-col gap-3 w-80 max-w-full pointer-events-none`}>
            <AnimatePresence>
              {toasts.map((toast) => {
                let icon = <Info size={16} className="text-blue-400" />;
                let borderClass = 'border-blue-500/30';
                let bgClass = theme === 'dark' ? 'bg-[#0F172A]/95 text-white' : 'bg-white/95 text-slate-800';
                if (toast.type === 'success') {
                  icon = <Check size={16} className="text-emerald-500" />;
                  borderClass = 'border-emerald-500/30';
                } else if (toast.type === 'warn') {
                  icon = <AlertTriangle size={16} className="text-amber-500" />;
                  borderClass = 'border-amber-500/30';
                } else if (toast.type === 'error') {
                  icon = <AlertTriangle size={16} className="text-rose-500 animate-pulse" />;
                  borderClass = 'border-rose-500/30';
                } else if (toast.type === 'system') {
                  icon = <Sparkles size={16} className="text-primary" />;
                  borderClass = 'border-primary/30';
                }

                return (
                  <motion.div
                    key={toast.id}
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, x: isRTL ? -100 : 100 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className={`p-4 rounded-2xl flex items-start gap-3 shadow-xl backdrop-blur-xl border ${borderClass} ${bgClass} pointer-events-auto`}
                  >
                    <div className="mt-0.5 shrink-0">{icon}</div>
                    <div className="flex-1 text-start">
                      <h5 className="text-xs font-black tracking-tight leading-none mb-1">{toast.title}</h5>
                      <p className="text-[10px] text-slate-400 font-medium leading-normal">{toast.message}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            <Routes location={location}>
              <Route path="/" element={<Navigate to="/chat" replace />} />
              <Route 
                path="/chat/*" 
                element={
                  <motion.div
                    initial={{ opacity: 0, x: isRTL ? 30 : -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRTL ? -30 : 30 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                    className="absolute inset-0"
                  >
                    <Chat 
                      user={user}
                      onUserUpdate={handleUserUpdate}
                      profile={profile}
                      onProfileUpdate={handleProfileUpdate}
                      onInventoryUpdate={handleInventoryUpdate}
                      products={products}
                      suppliers={suppliers}
                      theme={theme}
                      setTheme={setTheme}
                      isRTL={isRTL}
                      activePanel={chatActivePanel}
                      setActivePanel={setChatActivePanel}
                      showHistory={showChatHistory}
                      setShowHistory={setShowChatHistory}
                      clearTrigger={clearChatTrigger}
                    />
                  </motion.div>
                } 
              />
              <Route 
                path="/dashboard/*" 
                element={
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.02, y: -20 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    className="absolute inset-0"
                  >
                    <Dashboard 
                      products={products}
                      suppliers={suppliers}
                      theme={theme}
                      isRTL={isRTL}
                      onInventoryUpdate={handleInventoryUpdate}
                    />
                  </motion.div>
                } 
              />
              <Route 
                path="/workspace/*" 
                element={
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.02, y: -20 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    className="absolute inset-0"
                  >
                    <WorkspaceHub 
                      user={user}
                      profile={profile}
                      products={products}
                      suppliers={suppliers}
                      theme={theme}
                      isRTL={isRTL}
                    />
                  </motion.div>
                } 
              />
              <Route 
                path="/settings/*"  
                element={
                  <motion.div
                    initial={{ opacity: 0, x: isRTL ? -30 : 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRTL ? 30 : -30 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                    className="absolute inset-0"
                  >
                    <SettingsView 
                      user={user}
                      onUserUpdate={handleUserUpdate}
                      profile={profile}
                      onProfileUpdate={handleProfileUpdate}
                      theme={theme}
                      setTheme={setTheme}
                      isRTL={isRTL}
                      onResetAll={handleResetAll}
                      isAdmin={isAdmin}
                    />
                  </motion.div>
                } 
              />
              <Route 
                path="/profile/*" 
                element={
                  <motion.div
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 overflow-y-auto"
                  >
                    <ProfileView 
                      user={user!}
                      onUserUpdate={handleUserUpdate}
                      profile={profile}
                      onProfileUpdate={handleProfileUpdate}
                      theme={theme}
                      isRTL={isRTL}
                    />
                  </motion.div>
                } 
              />
              <Route path="/inventory/*" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
          </AnimatePresence>
        </div>
      </main>

      {/* Right Sidebar (Quick Info) */}
      <aside className={`w-[18rem] flex-shrink-0 ${theme === 'light' ? 'bg-[#FDFDFD]' : 'bg-[#000000]'} border-s ${getBorderColor()} hidden xl:flex flex-col p-6 relative z-30`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-[9px] font-bold ${theme === 'light' ? 'text-black/40' : 'text-white/30'} uppercase tracking-[0.2em]`}>
            {t.strategicInsight}
          </h2>
          <Sparkles size={12} className="text-primary opacity-50" />
        </div>
        
        <div className="space-y-6">
          <div className={`p-6 rounded-[24px] ${theme === 'light' ? 'bg-black/[0.02] border-black/5 shadow-inner' : 'bg-white/[0.03] border-white/5'} border relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl -translate-y-1/2 translate-x-1/2" />
            <p className={`text-xs italic leading-relaxed ${theme === 'light' ? 'text-black/70 font-medium' : 'text-white/60 font-light'} relative z-10 font-serif`}>
              {t.strategicQuote}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-[9px] font-bold ${theme === 'light' ? 'text-black/40' : 'text-white/30'} uppercase tracking-widest`}>
                {t.entropyResistance}
              </h3>
              <Activity size={12} className="text-primary/40" />
            </div>
            <div className="space-y-4">
              {[
                { label: t.decisionLogic, val: 84 },
                { label: t.strategicDepth, val: 62 },
                { label: t.memoryRetention, val: profile ? 92 : 12 }
              ].map((item, id) => (
                <div key={id} className="space-y-2">
                  <div className={`flex justify-between text-[10px] font-bold uppercase tracking-tight`}>
                    <span className={theme === 'light' ? 'text-black/60' : 'text-white/50'}>{item.label}</span>
                    <span className={theme === 'light' ? 'text-black/40 font-mono' : 'text-white/30 font-mono'}>{item.val}%</span>
                  </div>
                  <div className={`h-1 ${theme === 'light' ? 'bg-black/5' : 'bg-white/5'} rounded-full overflow-hidden`}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.val}%` }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      className={`h-full ${theme === 'light' ? 'bg-black' : 'bg-primary'} shadow-[0_0_10px_rgba(212,175,55,0.3)]`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6">
          <motion.div 
            whileHover={{ y: -3 }}
            className={`p-4 rounded-[24px] ${theme === 'light' ? 'bg-black' : 'bg-primary'} cursor-pointer transition-all shadow-lg flex items-center gap-3 group`}
            onClick={() => navigate('/settings')}
          >
            <div className={`w-8 h-8 rounded-xl ${theme === 'light' ? 'bg-white/10' : 'bg-black/10'} flex items-center justify-center backdrop-blur-md`}>
              <Sparkles size={16} className={theme === 'light' ? 'text-white' : 'text-black'} />
            </div>
            <div className={isRTL ? 'text-end' : 'text-start'}>
              <p className={`text-[9px] font-black ${theme === 'light' ? 'text-white' : 'text-black'} uppercase tracking-widest`}>{t.upgradeLogic}</p>
              <p className={`text-[8px] ${theme === 'light' ? 'text-white/40' : 'text-black/40'} font-mono`}>דור 3 פעיל</p>
            </div>
          </motion.div>
        </div>
      </aside>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-6 backdrop-blur-md bg-black/40"
            onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
            }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className={`w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl border ${getBorderColor()} ${theme === 'light' ? 'bg-white' : 'bg-[#0A0A0A]'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="relative">
                  <Search size={20} className={`absolute ${isRTL ? 'end-4' : 'start-4'} top-1/2 -translate-y-1/2 text-primary`} />
                  <input 
                    autoFocus
                    type="text" 
                    placeholder={t.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full h-16 bg-transparent px-16 text-xl font-medium outline-none border-b ${getBorderColor()} ${theme === 'light' ? 'text-black' : 'text-white'}`}
                  />
                  <button 
                    onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery('');
                    }}
                    className={`absolute ${isRTL ? 'start-4' : 'end-4'} top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/5 transition-colors`}
                  >
                    <X size={20} className={theme === 'light' ? 'text-black/30' : 'text-white/30'} />
                  </button>
                </div>

                <div className="mt-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {searchQuery && filteredProducts.length === 0 ? (
                    <div className="py-20 text-center">
                      <p className={`text-sm ${theme === 'light' ? 'text-black/40' : 'text-white/20'} font-mono uppercase tracking-widest`}>
                        {t.noResults}
                      </p>
                    </div>
                  ) : searchQuery ? (
                    <div className="space-y-2">
                      {filteredProducts.map((product) => (
                        <div 
                          key={product.id}
                          onClick={() => {
                            navigate('/chat');
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className={`p-4 rounded-2xl flex items-center justify-between cursor-pointer group transition-all ${theme === 'light' ? 'hover:bg-[#F9F9F9]' : 'hover:bg-white/5'}`}
                          dir={isRTL ? 'rtl' : 'ltr'}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'light' ? 'bg-[#F9F9F9] border-[#EEEEEE]' : 'bg-white/5 border-white/10'} border group-hover:border-primary transition-colors`}>
                              <Folder size={18} className="text-primary" />
                            </div>
                            <div className="text-start">
                              <h4 className={`text-sm font-bold ${theme === 'light' ? 'text-black' : 'text-white'}`}>{product.name}</h4>
                              <p className={`text-[10px] ${theme === 'light' ? 'text-black/40' : 'text-white/40'} font-mono`}>SKU: {product.sku}</p>
                            </div>
                          </div>
                          <div className={`text-[10px] font-mono tracking-widest py-1 px-3 rounded-full border border-primary/20 text-primary opacity-0 group-hover:opacity-100 transition-opacity uppercase`}>
                            {t.view}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center">
                      <p className={`text-sm ${theme === 'light' ? 'text-black/40' : 'text-white/20'} font-mono uppercase tracking-widest`}>
                        {t.startTyping}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
