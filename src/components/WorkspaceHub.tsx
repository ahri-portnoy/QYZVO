import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, Mail, FileText, Send, Trash2, Plus, Download, ExternalLink, 
  Search, RefreshCw, AlertTriangle, CheckCircle, ChevronRight, Inbox,
  User, Calendar, Paperclip, Loader2, Sparkles, ArrowRight, X, ArrowLeft
} from 'lucide-react';
import { 
  googleSignIn, 
  getAccessToken, 
  workspaceLogout, 
  listDriveFiles, 
  uploadFileToDrive, 
  deleteDriveFile,
  listGmailEmails,
  getGmailEmail,
  sendGmailEmail
} from '../services/workspaceService';
import { BusinessProfile, Product, Supplier, User as UserType } from '../types';

interface WorkspaceHubProps {
  user: UserType | null;
  profile: BusinessProfile | null;
  products: Product[];
  suppliers: Supplier[];
  theme: 'dark' | 'light';
  isRTL: boolean;
}

export const WorkspaceHub: React.FC<WorkspaceHubProps> = ({
  user,
  profile,
  products,
  suppliers,
  theme,
  isRTL
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'drive' | 'gmail'>('drive');
  const [authError, setAuthError] = useState<string | null>(null);

  // Drive state
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveSearch, setDriveSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gmail state
  const [emails, setEmails] = useState<any[]>([]);
  const [gmailSearch, setGmailSearch] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  // Compose state
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Check auth on load
  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    setIsLoading(true);
    try {
      const token = await getAccessToken();
      if (token) {
        setIsAuthenticated(true);
        loadWorkspaceData();
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Error checking auth state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setIsAuthenticated(true);
        loadWorkspaceData();
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setAuthError('אימות מול Google נכשל. אנא בדוק את הגדרות ה-OAuth או נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await workspaceLogout();
      setIsAuthenticated(false);
      setDriveFiles([]);
      setEmails([]);
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkspaceData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchDriveFiles(),
        fetchGmailEmails()
      ]);
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDriveFiles = async () => {
    try {
      const files = await listDriveFiles();
      setDriveFiles(files);
    } catch (e) {
      console.error('Failed to load Drive files:', e);
    }
  };

  const fetchGmailEmails = async () => {
    try {
      const list = await listGmailEmails();
      setEmails(list);
    } catch (e) {
      console.error('Failed to load Gmail messages:', e);
    }
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(`מעלה את ${file.name}...`);
    try {
      await uploadFileToDrive(file);
      setUploadProgress('הקובץ הועלה בהצלחה!');
      setTimeout(() => setUploadProgress(null), 3000);
      fetchDriveFiles();
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert('העלאת הקובץ נכשלה. אנא נסה שנית.');
      setUploadProgress(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (id: string, name: string) => {
    const confirmed = window.confirm(`האם אתה בטוח שברצונך למחוק את הקובץ "${name}" מ-Google Drive? פעולה זו תימחק לחלוטין את הקובץ מהענן.`);
    if (!confirmed) return;

    try {
      await deleteDriveFile(id);
      setDriveFiles(prev => prev.filter(f => f.id !== id));
      alert('הקובץ נמחק בהצלחה.');
    } catch (err: any) {
      console.error('File delete error:', err);
      alert('מחיקת הקובץ נכשלה. אנא נסה שנית.');
    }
  };

  const handleSelectEmail = async (id: string) => {
    setIsLoadingEmail(true);
    try {
      const detailed = await getGmailEmail(id);
      setSelectedEmail(detailed);
    } catch (err: any) {
      console.error('Failed to load email detailed content:', err);
      alert('טעינת המייל נכשלה.');
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeSubject || !composeBody) return;

    setIsSending(true);
    try {
      await sendGmailEmail(composeTo, composeSubject, composeBody);
      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        setIsComposing(false);
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        fetchGmailEmails();
      }, 2000);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      alert('שליחת המייל נכשלה. אנא נסה שנית.');
    } finally {
      setIsSending(false);
    }
  };

  // Pre-configured dynamic email drafts
  const handleDraftTemplate = (type: 'reorder' | 'negotiation' | 'low_stock') => {
    const lowStockProducts = products.filter(p => p.currentStock <= p.minThreshold);
    
    if (type === 'reorder') {
      const supplierName = suppliers[0]?.name || 'ספק יקר';
      const supplierEmail = suppliers[0]?.email || '';
      
      setComposeTo(supplierEmail);
      setComposeSubject(`הזמנת רכש דחופה - ${profile?.name || 'העסק שלנו'}`);
      
      let itemsList = lowStockProducts.length > 0
        ? lowStockProducts.map(p => `- ${p.name} (SKU: ${p.sku}) | כמות מבוקשת: ${p.minThreshold * 2}`).join('\n')
        : '- [נא להזין מוצרים וכמויות מבוקשות]';

      setComposeBody(`שלום ${supplierName},

בהמשך לניתוח המלאי השוטף המנוהל במערכת QYZVO Inventory Intelligence, ברצוננו לבצע הזמנת רכש דחופה עבור הפריטים הבאים עקב הגעה לסף מינימום קריטי:

${itemsList}

נא לאשר קבלה של הזמנה זו, ולספק מועד אספקה משוער בהתאם לימי האספקה המוסכמים.

בברכה,
צוות רכש ולוגיסטיקה
${profile?.name || 'ניהול מלאי חכם'}`);
    } else if (type === 'negotiation') {
      const supplierName = suppliers[0]?.name || 'ספק יקר';
      const supplierEmail = suppliers[0]?.email || '';
      
      setComposeTo(supplierEmail);
      setComposeSubject(`בקשה לשיפור תנאי ס 공급 / מחיר פריטים - ${profile?.name || 'העסק שלנו'}`);
      setComposeBody(`שלום ${supplierName},

אנו עורכים מעקב שבועי של עלויות רכש וביצועי ספקים עבור ${profile?.name || 'החברה'}.

לאור היקף ההזמנות הגדל שלנו בחודשים האחרונים, נרצה לבקש פגישה קצרה או הצעה מחודשת לטובת הוזלת עלויות יחידה ושיפור ימי אשראי עבור המלאי המשותף.

נשמח למענה בהקדם עם הצעה מעודכנת.

בברכה,
מנהל מלאי ואסטרטגיה
${profile?.name || 'QYZVO Host'}`);
    } else if (type === 'low_stock') {
      setComposeTo(user?.email || '');
      setComposeSubject(`דוח פריטים בחוסר קריטי לטיפול מיידי - ${new Date().toLocaleDateString('he-IL')}`);
      
      const items = products.filter(p => p.currentStock === 0);
      let list = items.length > 0
        ? items.map(p => `- ${p.name} (SKU: ${p.sku}) - חוסר מוחלט (0 יחידות)!`).join('\n')
        : '- לא נמצאו פריטים בחוסר של 0 יחידות כרגע. עבודה מעולה!';

      setComposeBody(`שלום,

להלן רשימת המוצרים שנמצאים בחוסר מלאי מלא (0 יחידות) נכון להיום, ומצריכים פנייה מיידית לספקים המתאימים למניעת אובדן מכירות:

${list}

מערכת QYZVO מציעה ללחוץ על קשר מהיר לספק מהמערכת כדי לשלוח אימייל רכש ייעודי.

בברכה,
סוכן בינה מלאכותית QYZVO`);
    }
  };

  // Filter lists based on search
  const filteredFiles = driveFiles.filter(f => 
    f.name.toLowerCase().includes(driveSearch.toLowerCase()) ||
    f.mimeType.toLowerCase().includes(driveSearch.toLowerCase())
  );

  const filteredEmails = emails.filter(e => 
    e.subject.toLowerCase().includes(gmailSearch.toLowerCase()) ||
    e.from.toLowerCase().includes(gmailSearch.toLowerCase()) ||
    e.snippet.toLowerCase().includes(gmailSearch.toLowerCase())
  );

  const colors = {
    bgCard: theme === 'light' ? 'bg-white border-[#EEEEEE] shadow-sm' : 'bg-white/[0.03] border-white/10 shadow-2xl',
    bgHeader: theme === 'light' ? 'bg-slate-100/75' : 'bg-white/[0.02]',
    text: theme === 'light' ? 'text-slate-900 border-[#EEEEEE]' : 'text-white border-white/10',
    textMuted: theme === 'light' ? 'text-[#666666]' : 'text-white/40',
    border: theme === 'light' ? 'border-[#EEEEEE]' : 'border-white/10',
    hover: theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]',
    input: theme === 'light' ? 'bg-white border-[#DDDDDD] text-black focus:border-black' : 'bg-white/[0.03] border-white/10 text-white focus:border-primary/50'
  };

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-xl mx-auto space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary"
        >
          <Cloud size={40} className="animate-pulse" />
        </motion.div>
        
        <div className="space-y-3">
          <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            סנכרון Google Workspace
          </h2>
          <p className={`text-sm leading-relaxed ${colors.textMuted}`}>
            חבר את החשבון העסקי שלך כדי לאפשר ל-Pilot גישה מלאה ל-Google Drive ו-Gmail. 
            סנכרון זה יאפשר שליחת מכתבים לספקים, שמירת דוחות מלאי ותפעול מתקדם ישירות מהבינה המלאכותית.
          </p>
        </div>

        {authError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-3">
            <AlertTriangle size={16} />
            <span>{authError}</span>
          </div>
        )}

        <button 
          onClick={handleSignIn}
          className="gsi-material-button w-full sm:w-auto shadow-lg hover:shadow-primary/10 transition-shadow"
        >
          <div className="gsi-material-button-state"></div>
          <div className="gsi-material-button-content-wrapper">
            <div className="gsi-material-button-icon">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            </div>
            <span className="gsi-material-button-contents font-bold text-sm">התחבר באמצעות Google</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden p-6 md:p-8 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl md:text-3xl font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            מרכז Google Workspace
          </h1>
          <p className={`text-xs ${colors.textMuted} mt-1`}>
            ניהול קבצים ותקשורת ספקים ישירה המסונכרנת עם נתוני המלאי
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={loadWorkspaceData}
            title="רענן נתונים"
            className={`p-2 rounded-xl border ${colors.border} ${colors.hover} transition-all`}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin text-primary' : `${colors.textMuted}`} />
          </button>
          
          <button
            onClick={handleSignOut}
            className="text-[10px] font-black uppercase tracking-wider px-3 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 rounded-xl transition-all"
          >
            נתק חשבון
          </button>
        </div>
      </div>

      {/* Outer Tab Controls */}
      <div className={`flex border-b ${colors.border} w-full gap-8`}>
        {[
          { id: 'drive', icon: Cloud, label: 'Google Drive' },
          { id: 'gmail', icon: Mail, label: 'Gmail (תקשורת)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 pb-3.5 text-sm font-bold relative transition-colors ${
              activeTab === tab.id 
                ? 'text-primary' 
                : `${colors.textMuted} hover:${theme === 'light' ? 'text-slate-900' : 'text-white'}`
            }`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="workspaceActiveIndicator" 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" 
              />
            )}
          </button>
        ))}
      </div>

      {/* Main Panel Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className={`text-xs font-bold tracking-widest ${colors.textMuted} uppercase`}>טוען מידע מהענן...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'drive' ? (
              <motion.div
                key="drive"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="h-full flex flex-col gap-6"
              >
                {/* Search / Upload controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${colors.textMuted}`} size={16} />
                    <input 
                      type="text"
                      placeholder="חפש קבצים ב-Drive..."
                      value={driveSearch}
                      onChange={e => setDriveSearch(e.target.value)}
                      className={`w-full pr-10 pl-4 py-2.5 text-sm rounded-xl focus:outline-none transition-all ${colors.input}`}
                    />
                  </div>

                  <button
                    onClick={handleFileUploadClick}
                    disabled={isUploading}
                    className="flex items-center justify-center gap-2 bg-primary text-black font-bold text-xs tracking-tight px-5 py-2.5 rounded-xl hover:opacity-90 active:scale-98 transition-all disabled:opacity-50 shrink-0"
                  >
                    <Plus size={16} />
                    <span>העלה מסמך חדש</span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                </div>

                {uploadProgress && (
                  <div className={`p-4 rounded-xl border ${colors.border} bg-primary/5 text-primary text-xs font-bold animate-pulse`}>
                    {uploadProgress}
                  </div>
                )}

                {/* Files Browser Grid */}
                <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                  {filteredFiles.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center p-16 text-center border-2 border-dashed ${colors.border} rounded-3xl space-y-4`}>
                      <Inbox className={`w-12 h-12 ${colors.textMuted}`} />
                      <div className="space-y-1">
                        <p className={`font-bold text-sm ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>לא נמצאו מסמכים</p>
                        <p className={`text-xs ${colors.textMuted}`}>אנא העלה מסמכי PDF, אקסל או Word לתיעוד המלאי</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredFiles.map((file: any) => (
                        <motion.div 
                          key={file.id}
                          layout
                          className={`p-4 rounded-2xl border ${colors.border} ${colors.bgCard} flex items-start gap-4 group hover:border-pointer transition-colors`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                            <FileText size={20} />
                          </div>

                          <div className="flex-1 min-w-0 space-y-1 text-start">
                            <p className="font-bold text-xs leading-snug line-clamp-1 truncate text-ellipsis" title={file.name}>{file.name}</p>
                            <p className={`text-[10px] ${colors.textMuted} font-mono uppercase`}>
                              {file.mimeType.split('/').pop()} • {file.size ? `${Math.round(file.size / 1024)} KB` : 'קובץ סנכרון'}
                            </p>
                            <span className={`text-[9px] ${colors.textMuted} block`}>
                              עודכן ב: {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('he-IL') : 'לא קבוע'}
                            </span>
                          </div>

                          <div className="flex flex-col gap-2 shrink-0">
                            {file.webViewLink && (
                              <a 
                                href={file.webViewLink} 
                                target="_blank" 
                                rel="referrer" 
                                className={`p-1.5 rounded-lg border ${colors.border} ${colors.hover} transition-all`}
                                title="פתח דרך Google"
                              >
                                <ExternalLink size={12} className={colors.textMuted} />
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteFile(file.id, file.name)}
                              className="p-1.5 rounded-lg border border-rose-500/10 hover:bg-rose-500/10 text-rose-500/70 hover:text-rose-500 transition-all"
                              title="מחק קובץ"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="gmail"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="h-full flex flex-col gap-6"
              >
                {/* Search / Compose controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${colors.textMuted}`} size={16} />
                    <input 
                      type="text"
                      placeholder="חפש מיילים בתיבת הדואר..."
                      value={gmailSearch}
                      onChange={e => setGmailSearch(e.target.value)}
                      className={`w-full pr-10 pl-4 py-2.5 text-sm rounded-xl focus:outline-none transition-all ${colors.input}`}
                    />
                  </div>

                  <button
                    onClick={() => setIsComposing(true)}
                    className="flex items-center justify-center gap-2 bg-primary text-black font-bold text-xs tracking-tight px-5 py-2.5 rounded-xl hover:opacity-90 active:scale-98 transition-all shrink-0"
                  >
                    <Plus size={16} />
                    <span>מייל חדש לספק</span>
                  </button>
                </div>

                {/* Email content layout split */}
                <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                  {/* Emails List */}
                  <div className="flex-1 overflow-y-auto pr-1">
                    {filteredEmails.length === 0 ? (
                      <div className={`flex flex-col items-center justify-center p-16 text-center border-2 border-dashed ${colors.border} rounded-3xl space-y-4`}>
                        <Inbox className={`w-12 h-12 ${colors.textMuted}`} />
                        <div className="space-y-1">
                          <p className={`font-bold text-sm ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>תיבת המיילים ריקה</p>
                          <p className={`text-xs ${colors.textMuted}`}>אין הודעות רלבנטיות מהספקים שלך כרגע</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredEmails.map((email: any) => (
                          <motion.div
                            key={email.id}
                            whileHover={{ y: -1 }}
                            onClick={() => handleSelectEmail(email.id)}
                            className={`p-4 rounded-2xl border text-start ${colors.border} ${colors.bgCard} ${colors.hover} transition-all cursor-pointer relative overflow-hidden group`}
                          >
                            <div className="flex justify-between items-start gap-3 mb-1.5">
                              <p className="font-bold text-xs truncate max-w-[70%]" title={email.from}>{email.from}</p>
                              <span className={`text-[10px] ${colors.textMuted} font-mono`}>
                                {new Date(email.date).toLocaleDateString('he-IL')}
                              </span>
                            </div>

                            <p className="font-bold text-xs text-primary mb-1 line-clamp-1">{email.subject}</p>
                            <p className={`text-[11px] ${colors.textMuted} line-clamp-2 leading-relaxed`}>
                              {email.snippet}
                            </p>
                            
                            <div className="absolute left-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-primary text-[10px] font-bold">
                              <span>הצג מכתב</span>
                              <ChevronRight size={10} className="rotate-180" />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Detail Email Modal (Slices) */}
      <AnimatePresence>
        {selectedEmail && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-2xl rounded-[32px] border ${colors.border} ${theme === 'light' ? 'bg-white' : 'bg-slate-950'} overflow-hidden flex flex-col max-h-[85vh] shadow-2xl`}
            >
              <div className={`p-6 border-b ${colors.border} flex justify-between items-start gap-4`}>
                <div className="space-y-1.5 text-start">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">תיבת דואר לקוח / ספק</span>
                  <h3 className={`text-lg font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{selectedEmail.subject}</h3>
                  <div className="flex flex-col gap-1 text-[11px]">
                    <p className={colors.textMuted}><strong className="text-primary font-bold">מאת: </strong> {selectedEmail.from}</p>
                    <p className={colors.textMuted}><strong className="text-primary font-bold">תאריך: </strong> {new Date(selectedEmail.date).toLocaleString('he-IL')}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedEmail(null)}
                  className={`p-2 rounded-xl border ${colors.border} ${colors.hover} transition-all shrink-0`}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 text-start">
                <p className={`text-sm leading-relaxed whitespace-pre-wrap font-medium ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                  {selectedEmail.body}
                </p>
              </div>
              
              <div className={`p-4 bg-slate-100/30 dark:bg-black/20 border-t ${colors.border} flex justify-end`}>
                <button
                  onClick={() => {
                    setComposeTo(selectedEmail.from.match(/<(.+?)>/)?.[1] || selectedEmail.from);
                    setComposeSubject(`Re: ${selectedEmail.subject}`);
                    setComposeBody(`\n\n\n--- מכתב קודם ---\nמאת: ${selectedEmail.from}\n${selectedEmail.body}`);
                    setIsComposing(true);
                    setSelectedEmail(null);
                  }}
                  className="flex items-center gap-2 bg-primary text-black font-bold text-xs tracking-tight px-4 py-2.5 rounded-xl hover:opacity-90 active:scale-98 transition-all"
                >
                  <Send size={14} />
                  <span>השב למכתב זה</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Compose Email Modal */}
      <AnimatePresence>
        {isComposing && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-3xl rounded-[32px] border ${colors.border} ${theme === 'light' ? 'bg-white' : 'bg-slate-950'} overflow-hidden flex flex-col max-h-[85vh] shadow-2xl`}
            >
              <div className={`p-6 border-b ${colors.border} flex justify-between items-center`}>
                <div className="flex items-center gap-3">
                  <Mail className="text-primary" size={20} />
                  <h3 className={`text-lg font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>יצירת מכתב ומייל חדש</h3>
                </div>

                <button 
                  onClick={() => setIsComposing(false)}
                  className={`p-2 rounded-xl border ${colors.border} ${colors.hover} transition-all`}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden min-h-0">
                {/* Mail Templates Rail */}
                <div className={`p-6 border-l md:border-l-0 md:border-e ${colors.border} bg-slate-100/20 dark:bg-black/20 flex flex-col gap-4 text-start overflow-y-auto`}>
                  <div className="flex items-center gap-1.5 mb-2 text-primary">
                    <Sparkles size={14} />
                    <span className="text-[11px] font-black uppercase tracking-wider">טמפלטים חכמים (QYZVO)</span>
                  </div>
                  
                  {[
                    { id: 'reorder', label: 'הזמנת רכש חוסרים', type: 'reorder' },
                    { id: 'low_stock', label: 'דו"ח חוסרים לעצמי', type: 'low_stock' },
                    { id: 'negotiation', label: 'משא ומתן עם ספק', type: 'negotiation' }
                  ].map(tmpl => (
                    <button
                      key={tmpl.id}
                      onClick={() => handleDraftTemplate(tmpl.type as any)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border ${colors.border} ${colors.hover} bg-white dark:bg-black/30 text-start group transition-colors`}
                    >
                      <span className="text-xs font-bold leading-normal">{tmpl.label}</span>
                      <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                  
                  <div className={`p-4 mt-auto rounded-2xl bg-primary/5 border border-primary/15 text-[10px] leading-relaxed ${colors.textMuted}`}>
                    בחר אחד מהטמפלטס כדי לבצע מילוי אוטומטי של כמויות וספקים מתוך המערכת הפעילה כעת, בצורה דינמית.
                  </div>
                </div>

                {/* Mail Inputs Form */}
                <form onSubmit={handleSendEmail} className="col-span-1 md:col-span-2 p-6 flex flex-col gap-4 overflow-y-auto">
                  {sendSuccess ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                      <CheckCircle className="w-12 h-12 text-emerald-500" />
                      <p className="font-bold text-sm text-emerald-500">המייל נשלח בהצלחה!</p>
                      <p className={`text-xs ${colors.textMuted}`}>הודעת דואר אלקטרוני הועברה דרך שרתי Google לספק.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1 text-start">
                        <label className={`text-[10px] font-bold ${colors.textMuted} uppercase`}>אל (נמען דוא"ל):</label>
                        <input
                          type="email"
                          required
                          placeholder="supplier@example.com"
                          value={composeTo}
                          onChange={e => setComposeTo(e.target.value)}
                          className={`w-full py-2.5 px-4 rounded-xl text-sm focus:outline-none transition-all ${colors.input}`}
                        />
                      </div>

                      <div className="space-y-1 text-start">
                        <label className={`text-[10px] font-bold ${colors.textMuted} uppercase`}>נושא המכתב:</label>
                        <input
                          type="text"
                          required
                          placeholder="נושא..."
                          value={composeSubject}
                          onChange={e => setComposeSubject(e.target.value)}
                          className={`w-full py-2.5 px-4 rounded-xl text-sm focus:outline-none transition-all ${colors.input}`}
                        />
                      </div>

                      <div className="space-y-1 text-start flex-1 flex flex-col min-h-[200px]">
                        <label className={`text-[10px] font-bold ${colors.textMuted} uppercase`}>תוכן המייל:</label>
                        <textarea
                          required
                          placeholder="שלח מיילים מקצועיים..."
                          value={composeBody}
                          onChange={e => setComposeBody(e.target.value)}
                          className={`w-full flex-1 p-4 rounded-xl text-sm focus:outline-none transition-all min-h-[180px] ${colors.input}`}
                        />
                      </div>

                      <div className="flex justify-end gap-3 mt-4 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsComposing(false)}
                          className={`px-4 py-2.5 rounded-xl border ${colors.border} ${colors.hover} text-xs font-bold`}
                        >
                          ביטול
                        </button>
                        <button
                          type="submit"
                          disabled={isSending}
                          className="flex items-center gap-2 bg-primary text-black font-bold text-xs tracking-tight px-5 py-2.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                        >
                          {isSending ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>שולח...</span>
                            </>
                          ) : (
                            <>
                              <Send size={14} />
                              <span>שלח דוא"ל</span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
