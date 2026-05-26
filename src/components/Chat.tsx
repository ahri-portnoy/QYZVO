import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User as LucideUser, Sparkles, Loader2, History as HistoryIcon, Paperclip, X, File as FileIcon, ExternalLink, Globe, UploadCloud, Brain, Fingerprint, Zap, RefreshCw, Download, Share2, Cloud, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Logo } from './Logo';
import { getPilotResponse, Attachment, startVideoGeneration, pollVideoStatus, downloadVideo, generateImage, generateSpeech } from '../services/pilotService';
import { StorageProvider } from '../services/storage';
import { BusinessProfile, Product, Supplier, User } from '../types';
import { getDirection } from '../services/utils';
import { initWorkspaceAuth, googleSignIn, uploadFileToDrive, uploadBlobToDrive } from '../services/workspaceService';
import { Dashboard } from './Dashboard';
import { Profile as ProfileView } from './Profile';

interface Message {
  role: 'user' | 'model';
  content: string;
  attachments?: Attachment[];
  grounding?: any;
  modality?: {
    type: 'image' | 'video' | 'audio';
    url?: string;
    prompt?: string;
    status: 'generating' | 'completed';
  };
}

interface ChatProps {
  user: User | null;
  onUserUpdate: (updatedUser: User) => void;
  profile: BusinessProfile | null;
  onProfileUpdate: (newProfile: BusinessProfile) => void;
  onInventoryUpdate: (type: 'product' | 'supplier', data: any) => void;
  products: Product[];
  suppliers: Supplier[];
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  isRTL: boolean;
  activePanel: 'none' | 'memory' | 'identity';
  setActivePanel: (panel: 'none' | 'memory' | 'identity') => void;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  clearTrigger: number;
}

interface PendingAction {
  type: 'business_update' | 'theme_change' | 'inventory_update' | 'generate_image' | 'generate_video' | 'generate_audio' | 'market_analysis' | 'generate_business_report' | 'get_weather';
  data: any;
  description: string;
}

export const Chat: React.FC<ChatProps> = ({ 
  user, 
  onUserUpdate,
  profile, 
  products,
  suppliers,
  onProfileUpdate, 
  onInventoryUpdate,
  theme, 
  setTheme,
  isRTL,
  activePanel,
  setActivePanel,
  showHistory,
  setShowHistory,
  clearTrigger
}) => {
  const [messages, setMessages] = useState<Message[]>(StorageProvider.getChatHistory());
  const [input, setInput] = useState('');
  const [inputValidationError, setInputValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [archivedChats, setArchivedChats] = useState<any[]>(StorageProvider.getArchivedChats());
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number; address?: string } | undefined>(undefined);
  const [showDriveAuth, setShowDriveAuth] = useState(false);
  const [isDriveAuthenticated, setIsDriveAuthenticated] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const driveUploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize Google Workspace Auth listener
    const unsubscribe = initWorkspaceAuth(
      () => setIsDriveAuthenticated(true),
      () => setIsDriveAuthenticated(false)
    );

    return () => unsubscribe();
  }, []);

  const colors = {
    bg: theme === 'light' ? 'bg-slate-50/30' : 'bg-[#020617]',
    headerBg: theme === 'light' ? 'bg-white/20 shadow-sm border-b border-black/5' : 'bg-black/20 backdrop-blur-3xl border-b border-white/5',
    card: theme === 'light' ? 'bg-white/40 backdrop-blur-2xl border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.02)]' : 'glass-card gold-glow',
    inputBg: theme === 'light' ? 'bg-white/40 shadow-inner' : 'bg-white/[0.02] backdrop-blur-3xl',
    inputText: theme === 'light' ? 'text-slate-900 text-sm font-bold tracking-tight' : 'text-white/90 text-sm font-bold tracking-tight',
    inputBorder: theme === 'light' ? 'border-black/5' : 'border-white/5',
    modelMsg: theme === 'light' 
      ? 'bg-white/80 backdrop-blur-lg text-slate-800 border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.02)]' 
      : 'glass-card text-white/90 shadow-2xl shadow-black/40',
    userMsg: 'bg-primary text-black font-black tracking-tighter shadow-lg shadow-primary/20',
    mutedText: theme === 'light' ? 'text-slate-400' : 'text-white/20',
  };

  const suggestions = [
    "פקודה קולית",
    "מה המצב המלאי הנוכחי?",
    "הוסף מוצר חדש למערכת",
    "נתח קצבי צריכה (Burn Rate)",
    "הפק דוח בריאות מלאי"
  ];

  const handleSuggestionClick = (s: string) => {
    if (s === "פקודה קולית") {
      toggleRecording();
    } else {
      setInput(s);
    }
  };

  const OrbitalView = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-10" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Central Orbital Visual */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
        {/* Decorative Rings */}
        <div className="absolute inset-0 rounded-full border border-primary/5 scale-110" />
        <div className="absolute inset-0 rounded-full border border-primary/5 scale-125" />
        
        {/* Outer Orbit */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className={`absolute inset-0 rounded-full border border-primary/10 border-dashed`} 
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className={`absolute w-3/4 h-3/4 rounded-full border border-primary/20`} 
        />
        
        {/* Orbiting Elements */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary/40 blur-[1px]" />
          <div className="absolute bottom-1/4 right-0 w-1.5 h-1.5 rounded-full bg-primary/20 blur-[1px]" />
        </motion.div>

        {/* Central Sphere */}
        <motion.div 
          animate={{ 
            scale: [1, 1.02, 1],
            boxShadow: [
              "0 0 30px rgba(212,175,55,0.1)",
              "0 0 60px rgba(212,175,55,0.2)",
              "0 0 30px rgba(212,175,55,0.1)"
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-primary via-primary-dark to-black flex items-center justify-center group cursor-pointer overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent)] opacity-50" />
          <div className="absolute inset-0 rounded-full bg-primary opacity-10 blur-2xl" />
          <Logo size={60} className="relative z-10 group-hover:scale-110 transition-all duration-700" />
        </motion.div>
      </div>

      <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-10 px-4">
        <h2 className={`text-3xl lg:text-5xl font-black tracking-tighter ${colors.inputText} leading-tight`}>
          {profile && getDirection(profile.name) === 'rtl' ? 'איך אפשר לייעל את המלאי היום?' : 'איך נוכל לייעל את המלאי היום?'}
        </h2>
        <p className={`text-[10px] ${theme === 'light' ? 'text-black/40' : 'text-white/30'} tracking-[0.5em] uppercase font-black`}>
          מנוע בינה מלאכותית למלאי פעיל
        </p>
      </div>
    </div>
  );

  useEffect(() => {
    if (clearTrigger > 0) {
      handleClear();
    }
  }, [clearTrigger]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        { 
          role: 'model', 
          content: 'ליבת ה-QYZVO פעילה. הנוכחות שלך זוהתה. אין לי זיכרון לגבי הפעילות שלך. הגדר את ה-DNA העסקי שלך במינימום מילים. אני ממתין.' 
        }
      ]);
    }

    // Initialize geolocation
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => console.warn("Location access denied:", error)
      );
    }
  }, []);

  useEffect(() => {
    StorageProvider.saveChatHistory(messages);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const processFiles = async (files: FileList | File[]) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        setAttachments(prev => [...prev.filter(a => a.name !== file.name), {
          name: file.name,
          mimeType: file.type,
          data: base64
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (overrideInput?: string | React.MouseEvent) => {
    const msgToSend = typeof overrideInput === 'string' ? overrideInput : input.trim();
    if (isLoading) return;

    if (!msgToSend && attachments.length === 0) {
      setInputValidationError(isRTL ? 'לא ניתן לשלוח הודעה ריקה. אנא הקלד תוכן או צרף קובץ.' : 'Message cannot be empty. Please type some text or attach a file.');
      return;
    }

    setInputValidationError(null);

    const userMsg = msgToSend;
    if (typeof overrideInput !== 'string') setInput('');
    const currentAttachments = [...attachments];
    setAttachments([]);

    const newMessages: Message[] = [...messages, { 
      role: 'user', 
      content: userMsg || (currentAttachments.length > 0 ? "[נתון מצורף]" : ""),
      attachments: currentAttachments 
    }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Create a placeholder for the model response
      const modelResponse: Message = { 
        role: 'model', 
        content: "",
      };
      setMessages(prev => [...prev, modelResponse]);
      const messageIndex = newMessages.length; // The index where the model response is

      let fullText = "";

      // 1. Get AI response with streaming
      await getPilotResponse(
        newMessages, 
        profile, 
        products, 
        suppliers, 
        (chunk) => {
          if (chunk.text) {
            fullText += chunk.text;
            setMessages(prev => {
              const updated = [...prev];
              if (updated[messageIndex]) {
                updated[messageIndex] = {
                  ...updated[messageIndex],
                  content: fullText
                };
              }
              return updated;
            });
          }

          if (chunk.done) {
            // Handle Grounding and Tool Calls at the end
            if (chunk.groundingMetadata) {
              setMessages(prev => {
                const updated = [...prev];
                if (updated[messageIndex]) {
                  updated[messageIndex].grounding = chunk.groundingMetadata;
                }
                return updated;
              });
            }

            // Handle Tool Calls (Proposals)
            if (chunk.toolCalls && chunk.toolCalls.length > 0) {
              const call = chunk.toolCalls[0];
              
              switch (call.name) {
                case 'propose_business_update':
                  setPendingAction({
                    type: 'business_update',
                    data: call.args.updates,
                    description: `עדכון DNA עסקי: ${Object.keys(call.args.updates).join(', ')}`
                  });
                  break;
                case 'propose_inventory_update':
                  setPendingAction({
                    type: 'inventory_update',
                    data: call.args,
                    description: `ביצוע פעולת מלאי: ${call.args.type.replace('_', ' ')}`
                  });
                  break;
                case 'propose_theme_change':
                  setPendingAction({
                    type: 'theme_change',
                    data: call.args.theme,
                    description: `שינוי ערכת נושא ל-${call.args.theme}`
                  });
                  break;
                case 'generate_image':
                  setPendingAction({
                    type: 'generate_image',
                    data: call.args,
                    description: `ייצור ויז'ואל מוצר: ${(call.args.prompt as string || '').substring(0, 30)}...`
                  });
                  break;
                case 'generate_inventory_report':
                  setPendingAction({
                    type: 'generate_business_report',
                    data: call.args,
                    description: `הפקת דוח מלאי אסטרטגי: ${call.args.title}`
                  });
                  break;
                case 'get_market_prices':
                  console.log("Fetching market prices for:", call.args.sku);
                  break;
              }
            }

            // Handle Voice Output if enabled
            if (voiceOutputEnabled && fullText) {
              handleSpeech(fullText);
            }
          }
        },
        currentLocation
      );
      
    } catch (error: any) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "שיבוש אסטרטגי בחיבור לליבה. נסה שנית.";
      setMessages(prev => [...prev, { role: 'model', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeech = async (text: string) => {
    try {
      setIsSpeaking(true);
      // Clean markdown for better TTS
      const cleanText = text.replace(/[*_#`]/g, '').substring(0, 500);
      const audioBase64 = await generateSpeech(cleanText);
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const binaryString = atob(audioBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const decodedBuffer = await audioCtx.decodeAudioData(bytes.buffer);
      const source = audioCtx.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(audioCtx.destination);
      source.onended = () => {
        setIsSpeaking(false);
        audioCtx.close();
      };
      source.start();
    } catch (err) {
      console.error("Speech playback failed:", err);
      setIsSpeaking(false);
    }
  };

  const b64toBlob = (b64Data: string, contentType = '', sliceSize = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("הדפדפן שלך אינו תומך בזיהוי קולי");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = isRTL ? 'he-IL' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      if (transcript && transcript.length > 3) {
        // Auto-send voice command after a small delay to feel natural
        setTimeout(() => handleSend(transcript), 1000);
      }
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognition.start();
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const handleDriveAuth = async () => {
    if (isDriveAuthenticated) {
      // If already authenticated, maybe trigger a drive-specific file selection
      driveUploadInputRef.current?.click();
    } else {
      setShowDriveAuth(true);
    }
  };

  const completeDriveAuth = async () => {
    try {
      setShowDriveAuth(false);
      setIsLoading(true);
      
      const { user: googleUser, accessToken } = await googleSignIn();
      console.log('Google Auth Success:', googleUser.email);
      setIsDriveAuthenticated(true);
      
      setMessages(prev => [...prev, {
        role: 'model',
        content: `האימות מול Google Drive הושלם בהצלחה עבור ${googleUser.email}. כעת תוכל להעלות קבצים ישירות לענן או לגשת למסמכים אסטרטגיים שסונכרנו.`
      }]);
    } catch (e) {
      console.error('Google Auth Error:', e);
      setMessages(prev => [...prev, {
        role: 'model',
        content: "נכשלה ההתחברות ל-Google Drive. וודא שביצעת את הגדרות ה-OAuth הנדרשות."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDriveFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await uploadFileToDrive(file);
        
        // Add to local attachments for chat context
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = (event.target?.result as string).split(',')[1];
          setAttachments(prev => [...prev, {
            name: `[DRIVE] ${file.name}`,
            mimeType: file.type,
            data: base64,
            url: result.id // Store Drive ID if needed
          }]);
        };
        reader.readAsDataURL(file);
      }

      setMessages(prev => [...prev, {
        role: 'model',
        content: `הקבצים הועלו בהצלחה ל-Google Drive וסונכרנו לתוך הקשר השיחה האסטרטגי.`
      }]);
    } catch (err: any) {
      console.error('Drive upload failed:', err);
      let errorMsg = 'נכשלה העלאת הקבצים ל-Drive. אנא נסה שנית.';
      const rawError = String(err?.message || '');
      if (rawError.includes('Google Drive API has not been used') || rawError.includes('disabled')) {
        errorMsg = 'שגיאת מערכת: יש להפעיל את Google Drive API ב-Google Cloud Console עבור הפרויקט הזה.';
      }
      setMessages(prev => [...prev, {
        role: 'model',
        content: errorMsg
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const bakeLogoOnImage = async (imageBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageBlob);
          return;
        }

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Calculate logo size (e.g., 5% of height)
        const logoSize = Math.min(canvas.width, canvas.height) * 0.1;
        const padding = logoSize * 0.4;
        
        // Draw Logo Path (Simplified Q from Logo.tsx)
        const x = canvas.width - logoSize - padding;
        const y = padding;
        
        ctx.save();
        ctx.strokeStyle = '#D4AF37'; // Gold
        ctx.lineWidth = logoSize * 0.12;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Q Circle
        ctx.beginPath();
        const centerX = x + logoSize * 0.5;
        const centerY = y + logoSize * 0.5;
        const radius = logoSize * 0.25;
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 1.5);
        ctx.stroke();

        // Checkmark
        ctx.beginPath();
        ctx.moveTo(x + logoSize * 0.4, y + logoSize * 0.5);
        ctx.lineTo(x + logoSize * 0.53, y + logoSize * 0.63);
        ctx.lineTo(x + logoSize * 0.85, y + logoSize * 0.31);
        ctx.stroke();
        
        ctx.restore();

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else resolve(imageBlob);
        }, 'image/png');
      };
      img.onerror = () => resolve(imageBlob);
      img.src = URL.createObjectURL(imageBlob);
    });
  };

  const handleMediaDownload = async (url: string, type: string) => {
    try {
      const response = await fetch(url);
      let blob = await response.blob();
      
      if (type === 'image') {
        blob = await bakeLogoOnImage(blob);
      }
      
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `qyzvo-${type}-${Date.now()}.${type === 'image' ? 'png' : 'mp4'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      alert('הורדה נכשלה');
    }
  };

  const handleMediaShare = async (url: string, prompt: string) => {
    if (navigator.share) {
      try {
        // Basic URL validation: ensure it's not empty and is a valid format
        if (!url || (!url.startsWith('http') && !url.startsWith('blob:') && !url.startsWith('data:'))) {
          throw new Error('Invalid URL for sharing');
        }

        await navigator.share({
          title: 'נכס אסטרטגי QYZVO',
          text: prompt,
          url: url
        });
      } catch (error) {
        console.error('Share failed:', error);
        // Fallback to clipboard if share fails
        navigator.clipboard.writeText(url);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('הקישור הועתק ללוח');
    }
  };

  const handleMediaSaveToDrive = async (url: string, type: string, prompt: string) => {
    if (!isDriveAuthenticated) {
      setShowDriveAuth(true);
      return;
    }
    
    try {
      const response = await fetch(url);
      let blob = await response.blob();
      
      if (type === 'image') {
        blob = await bakeLogoOnImage(blob);
      }
      
      const filename = `qyzvo-${type}-${Date.now()}.${type === 'image' ? 'png' : 'mp4'}`;
      await uploadBlobToDrive(blob, filename, blob.type);
      alert('נשמר ב-Google Drive בהצלחה!');
    } catch (error) {
      console.error('Save to Drive failed:', error);
      alert('שגיאה בשמירה ל-Drive');
    }
  };

  const executeAction = () => {
    if (!pendingAction) return;

    let modality: Message['modality'] | undefined;

    switch (pendingAction.type) {
      case 'business_update':
        onProfileUpdate({ ...profile, ...pendingAction.data } as BusinessProfile);
        break;
      case 'theme_change':
        setTheme(pendingAction.data);
        break;
      case 'inventory_update':
        onInventoryUpdate(
          pendingAction.data.type?.includes('supplier') ? 'supplier' : 'product',
          pendingAction.data.data
        );
        break;
      case 'generate_image':
        modality = { type: 'image', prompt: pendingAction.data.prompt, status: 'generating' };
        break;
      case 'generate_video':
        modality = { type: 'video', prompt: pendingAction.data.prompt, status: 'generating' };
        break;
      case 'generate_audio':
        modality = { type: 'audio', prompt: pendingAction.data.prompt, status: 'generating' };
        break;
      case 'market_analysis':
        console.log("Analyzing market:", pendingAction.data.topic);
        break;
      case 'generate_business_report':
        console.log("Generating report:", pendingAction.data.title);
        break;
      case 'get_weather':
        console.log("Getting weather for:", pendingAction.data.location);
        break;
    }

    const responseContent = pendingAction.type.startsWith('generate_') 
      ? `הפקודה התקבלה. הייצור של ${pendingAction.description} החל במעבדות QYZVO. התוצאות יסונכרנו בקרוב.`
      : `הביצוע הושלם: ${pendingAction.description}. המערכת מעודכנת אסטרטגית.`;

    const newMessage: Message = { 
      role: 'model', 
      content: responseContent,
      modality
    };

    setMessages(prev => [...prev, newMessage]);
    const messageIndex = messages.length;
    setPendingAction(null);

    // Handle modality generations
    if (modality) {
      if (modality.type === 'video') {
         // Real Veo Generation
         (async () => {
           try {
             const opName = await startVideoGeneration(modality.prompt!);
             let isDone = false;
             
             // Poll for status
             const pollInterval = setInterval(async () => {
               try {
                 const status = await pollVideoStatus(opName);
                 if (status.done) {
                   clearInterval(pollInterval);
                   if (status.error) throw new Error(status.error.message);
                   
                   // Download the video
                   const videoBlob = await downloadVideo(opName);
                   const videoUrl = URL.createObjectURL(videoBlob);
                   
                   setMessages(prev => {
                     const newMessages = [...prev];
                     const msg = newMessages.find((m, i) => i === messageIndex && m.modality?.type === 'video');
                     if (msg && msg.modality) {
                       msg.modality.status = 'completed';
                       msg.modality.url = videoUrl;
                     }
                     return newMessages;
                   });
                 }
               } catch (pollErr) {
                 clearInterval(pollInterval);
                 console.error('Polling failed:', pollErr);
               }
             }, 5000); // Poll every 5 seconds
           } catch (err) {
             console.error('Video generation failed:', err);
             setMessages(prev => [...prev, { role: 'model', content: 'שגיאה בייצור וידאו. אנא נסה שנית.' }]);
           }
         })();
      } else if (modality.type === 'image') {
         // Real Image Generation
         (async () => {
           try {
             const imageUrl = await generateImage(modality.prompt!, pendingAction.data.aspectRatio || '1:1');
             setMessages(prev => {
               const newMessages = [...prev];
               const msg = newMessages.find((m, i) => i === messageIndex && m.modality?.type === 'image');
               if (msg && msg.modality) {
                 msg.modality.status = 'completed';
                 msg.modality.url = imageUrl;
               }
               return newMessages;
             });
           } catch (err) {
             console.error('Image generation failed:', err);
             setMessages(prev => [...prev, { role: 'model', content: 'שגיאה בייצור תמונה. אנא נסה שנית.' }]);
           }
         })();
      } else {
        // Mock for other modalities (audio) until implemented
      }
    }
  };

  const handleClear = () => {
    if (messages.length > 1) {
      StorageProvider.archiveChat(messages);
      setArchivedChats(StorageProvider.getArchivedChats());
    }
    
    const defaultMsg: Message[] = [
      { 
        role: 'model', 
        content: `נושא חדש אותחל בהצלחה. כל המידע הקודם נשמר בזיכרון לטווח ארוך (Archives). ה-DNA של ${profile?.name || 'העסק'} עדיין פעיל בבסיס הלוגיקה שלי. מה המשימה הבאה?` 
      }
    ];
    setMessages(defaultMsg);
    StorageProvider.saveChatHistory(defaultMsg);
  };

  const loadArchive = (archive: any) => {
    setMessages(archive.messages);
    setShowHistory(false);
    StorageProvider.saveChatHistory(archive.messages);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeAttachment = (name: string) => {
    setAttachments(prev => prev.filter(a => a.name !== name));
  };

  return (
    <div 
      className={`flex flex-col h-full ${colors.bg} border-x ${theme === 'light' ? 'border-slate-200' : 'border-white/5'} relative transition-all duration-300 ${isDragging ? 'ring-4 ring-inset ring-primary/30 scale-[0.995]' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Background Subtle Grid */}
      <div className={`absolute inset-0 z-0 pointer-events-none ${theme === 'light' ? 'opacity-[0.03]' : 'opacity-10'}`} 
           style={{ backgroundImage: `radial-gradient(circle at 2px 2px, ${theme === 'light' ? '#2563eb' : '#2563eb'} 1px, transparent 0)`, backgroundSize: '30px 30px' }} />
      {/* Drag Overlay visual indicator */}
      <AnimatePresence>
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-[2px] flex items-center justify-center pointer-events-none"
          >
            <div className="flex flex-col items-center gap-4 text-primary">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-bounce">
                <Paperclip size={40} />
              </div>
              <p className="text-xl font-bold uppercase tracking-widest">שחרר קבצים לניתוח אסטרטגי</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Integrated Panels Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Chat History Panel (Existing) */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
              className={`absolute top-0 bottom-0 ${isRTL ? 'left-0 border-r' : 'right-0 border-l'} w-80 z-40 ${colors.bg} ${theme === 'light' ? 'border-slate-200 shadow-2xl' : 'border-white/10 shadow-black shadow-2xl'} p-6 overflow-y-auto`}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xs font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>ארכיון שיחות</h3>
                <X size={14} className="cursor-pointer opacity-40 hover:opacity-100" onClick={() => setShowHistory(false)} />
              </div>
              {archivedChats.length === 0 ? (
                <p className="text-xs opacity-30 italic">אין שיחות שמורות עדיין...</p>
              ) : (
                <div className="space-y-4">
                  {archivedChats.map((archive: any) => (
                    <motion.button
                      key={archive.id}
                      whileHover={{ x: isRTL ? 6 : -6, backgroundColor: theme === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.03)' }}
                      onClick={() => loadArchive(archive)}
                      className={`w-full ${isRTL ? 'text-start' : 'text-end'} p-5 rounded-2xl border ${theme === 'light' ? 'border-slate-100 bg-white shadow-sm' : 'border-white/5 bg-white/5'} transition-all group relative overflow-hidden`}
                    >
                      <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity`} />
                      <div className="flex justify-between items-center mb-2">
                         <HistoryIcon size={12} className="text-primary opacity-40" />
                         <p className={`text-[9px] opacity-40 font-mono tracking-tighter`}>{new Date(archive.date).toLocaleString('he-IL')}</p>
                      </div>
                      <p className={`text-xs font-bold ${theme === 'light' ? 'text-slate-700' : 'text-white/80'} line-clamp-1 mb-1`}>{archive.preview}</p>
                      <p className="text-[9px] opacity-30 uppercase tracking-widest">תיעוד אסטרטגי נטען</p>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Business Memory (Dashboard) Panel */}
        <AnimatePresence mode="wait">
          {activePanel !== 'none' && (
            <motion.div
              initial={{ opacity: 0, width: 0, x: isRTL ? 50 : -50 }}
              animate={{ opacity: 1, width: activePanel === 'identity' ? '60%' : '38%', x: 0 }}
              exit={{ opacity: 0, width: 0, x: isRTL ? 50 : -50 }}
              transition={{ type: 'spring', damping: 30, stiffness: 200 }}
              className={`border-r ${theme === 'light' ? 'border-slate-200 bg-white/80' : 'border-white/5 bg-black/40'} backdrop-blur-3xl overflow-y-auto z-30 relative shadow-xl`}
            >
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6 px-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'light' ? 'bg-primary/10 text-primary' : 'bg-primary/20 text-primary'} gold-glow`}>
                      {activePanel === 'memory' ? <Brain size={20} /> : <Fingerprint size={20} />}
                    </div>
                    <div>
                      <h2 className={`text-xs font-black uppercase tracking-[0.25em] gold-text-gradient`}>
                        {activePanel === 'memory' ? 'DNA עסקי' : 'זהות מנהיג'}
                      </h2>
                    </div>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setActivePanel('none')}
                    className="p-2 rounded-full hover:bg-white/5 transition-colors"
                  >
                    <X size={20} className="opacity-30 hover:opacity-100" />
                  </motion.button>
                </div>

                <div className="flex-1 rounded-[40px] overflow-hidden custom-scrollbar">
                  {activePanel === 'memory' ? (
                    <div className="scale-95 origin-top -mt-4 pb-20">
                       <Dashboard 
                        products={products}
                        suppliers={suppliers}
                        theme={theme}
                        isRTL={isRTL}
                      />
                    </div>
                  ) : (
                    <div className="scale-95 origin-top pb-20">
                      <ProfileView 
                        user={user!} 
                        onUserUpdate={onUserUpdate}
                        profile={profile} 
                        onProfileUpdate={onProfileUpdate} 
                        theme={theme} 
                        isRTL={isRTL}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* HUD Decorative Corners */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/20 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/20 pointer-events-none" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Conversation Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-4 md:space-y-5"
          >
            <AnimatePresence initial={false}>
              {messages.length <= 1 ? (
                <OrbitalView />
              ) : (
                messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`} dir={getDirection(m.content)}>
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm font-black text-[9px] ${
                        m.role === 'user' 
                          ? (theme === 'light' ? 'bg-black text-white' : 'bg-white/10 text-white') 
                          : 'bg-primary text-black'
                      }`}
                    >
                      {m.role === 'user' ? (user?.fullName?.[0] || <LucideUser size={14} />) : (
                        <Sparkles size={14} strokeWidth={1.5} />
                      )}
                    </motion.div>
                    <div className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-2.5 ${
                        m.role === 'user' 
                          ? `rounded-[18px] shadow-sm ${colors.userMsg}` 
                          : 'bg-transparent border-none shadow-none px-0'
                      } text-[13px] md:text-sm leading-relaxed markdown-content ${
                        getDirection(m.content) === 'rtl' ? 'text-right' : 'text-left'
                      }`}>
                        {m.role === 'user' ? (
                          <div>
                            {m.attachments && m.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {m.attachments.map((att, idx) => (
                                  <div key={idx} className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-[8px] font-black border border-white/10 backdrop-blur-md">
                                    <FileIcon size={10} />
                                    <span className="line-clamp-1 max-w-[80px]">{att.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <p className="font-black tracking-tighter text-sm md:text-base leading-tight">{m.content}</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className={`font-display font-bold tracking-tight text-sm md:text-lg ${theme === 'light' ? 'text-slate-900' : 'text-white/95'} leading-relaxed`}>
                              <ReactMarkdown>{m.content}</ReactMarkdown>
                            </div>
                            
                            {m.modality && (
                              <div className="mt-3 rounded-xl overflow-hidden border border-white/10 shadow-xl relative group max-w-[260px]">
                                {m.modality.status === 'generating' ? (
                                  <div className="bg-black/60 aspect-video flex flex-col items-center justify-center gap-3 p-8">
                                    <div className="relative">
                                      <Loader2 size={32} className="animate-spin text-primary opacity-50" />
                                      <div className="absolute inset-0 blur-lg bg-primary/20 animate-pulse" />
                                    </div>
                                    <div className="text-center">
                                      <p className="text-[8px] font-black uppercase tracking-[0.3em] text-primary mb-1">מייצר נכס...</p>
                                      <p className="text-[10px] opacity-30 italic line-clamp-1">{m.modality.prompt}</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="relative">
                                    {m.modality.type === 'image' && m.modality.url && (
                                      <img src={m.modality.url} alt="נכס אסטרטגי" className="w-full aspect-auto object-cover group-hover:scale-105 transition-transform duration-1000" />
                                    )}
                                    {m.modality.type === 'video' && m.modality.url && (
                                      <video 
                                        src={m.modality.url} 
                                        controls 
                                        autoPlay 
                                        muted 
                                        loop 
                                        className="w-full aspect-video object-cover"
                                      />
                                    )}
                                    {m.modality.type === 'video' && !m.modality.url && (
                                      <div className="aspect-video bg-black/80 flex items-center justify-center">
                                         <div className="text-center p-6">
                                            <Zap size={32} className="text-primary mx-auto mb-2 animate-pulse" />
                                            <p className="text-xs font-bold gold-text-gradient uppercase tracking-widest">תוצאת וידאו QYZVO</p>
                                            <p className="text-[9px] opacity-30 mt-1 italic">[סיבוב הסנכרון נכשל]</p>
                                         </div>
                                      </div>
                                    )}
                                    {m.modality.type === 'audio' && (
                                      <div className="p-5 bg-black/80 flex items-center gap-4">
                                         <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                            <RefreshCw size={20} className="text-primary animate-spin-slow" />
                                         </div>
                                         <div>
                                            <p className="text-xs font-bold gold-text-gradient uppercase tracking-widest">שמע Lyria</p>
                                            <div className="flex gap-1 mt-1">
                                               {[1,2,3,4,5,6].map(n => (
                                                 <motion.div 
                                                   key={n} 
                                                   animate={{ height: [6, 14, 6] }} 
                                                   transition={{ duration: 1, repeat: Infinity, delay: n * 0.1 }}
                                                   className="w-0.5 bg-primary rounded-full" 
                                                 />
                                               ))}
                                            </div>
                                         </div>
                                      </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 gap-2">
                                       {/* Brand Overlay */}
                                       <div className="absolute top-4 right-4 pointer-events-none drop-shadow-lg">
                                          <Logo size={24} />
                                       </div>
                                       
                                       <div className="flex justify-between items-center w-full">
                                          <p className="text-[8px] font-black uppercase tracking-widest text-white/50">ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                                          <button className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md text-[8px] font-bold hover:bg-white/20 transition-all uppercase">חדש</button>
                                       </div>
                                       {m.modality.url && (
                                         <div className="flex gap-2">
                                            <button 
                                              onClick={() => handleMediaDownload(m.modality!.url!, m.modality!.type)}
                                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-white/10 backdrop-blur-md text-[8px] font-bold hover:bg-white/20 transition-all"
                                              title="Download"
                                            >
                                              <Download size={10} />
                                              <span>הורד</span>
                                            </button>
                                            <button 
                                              onClick={() => handleMediaShare(m.modality!.url!, m.modality!.prompt || '')}
                                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-white/10 backdrop-blur-md text-[8px] font-bold hover:bg-white/20 transition-all"
                                              title="Share"
                                            >
                                              <Share2 size={10} />
                                              <span>שתף</span>
                                            </button>
                                            <button 
                                              onClick={() => handleMediaSaveToDrive(m.modality!.url!, m.modality!.type, m.modality!.prompt || '')}
                                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-primary/20 backdrop-blur-md text-[8px] font-bold hover:bg-primary/30 text-primary transition-all border border-primary/20"
                                              title="Save to Drive"
                                            >
                                              <Cloud size={10} />
                                              <span>דרייב</span>
                                            </button>
                                         </div>
                                       )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {m.role === 'model' && m.grounding?.groundingChunks && (
                        <div className="flex flex-wrap gap-3 mt-4" dir="ltr">
                          {m.grounding.groundingChunks.map((chunk: any, chunkIdx: number) => (
                            chunk.web && (
                              <motion.a 
                                key={chunkIdx} 
                                href={chunk.web.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.05, y: -2 }}
                                className={`flex items-center gap-2.5 px-4 py-2 rounded-full text-[10px] font-black border transition-all ${
                                  theme === 'light' ? 'bg-white border-black/5 text-black/60 shadow-sm hover:border-primary' : 'bg-white/5 border-white/5 text-white/40 hover:border-primary/50'
                                } tracking-tight`}
                              >
                                <Globe size={12} strokeWidth={2} />
                                <span className="line-clamp-1 max-w-[150px] uppercase">{chunk.web.title || 'Source'}</span>
                                <ExternalLink size={12} strokeWidth={2} />
                              </motion.a>
                            )
                          ))}
                        </div>
                      )}
                      
                      {/* Action Confirmation UI */}
                      {i === messages.length - 1 && m.role === 'model' && pendingAction && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`mt-2 p-4 rounded-2xl border ${theme === 'light' ? 'bg-white border-primary/20 shadow-sm' : 'bg-primary/5 border-primary/20'} flex flex-col gap-3 w-full max-w-sm ml-0 mr-auto`}
                          dir="rtl"
                        >
                          <div className="flex items-center gap-2 text-primary">
                            <Sparkles size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">בקשת אישור פעולה</span>
                          </div>
                          <p className={`text-xs font-medium ${theme === 'light' ? 'text-slate-700' : 'text-white/80'}`}>
                            {pendingAction.description}
                          </p>
                          <div className="flex gap-2">
                            <button 
                              onClick={executeAction}
                              className="flex-1 py-2 rounded-xl bg-primary text-white text-[10px] font-bold hover:bg-primary-dark transition-colors"
                            >
                              אישור ביצוע
                            </button>
                            <button 
                              onClick={() => setPendingAction(null)}
                              className={`flex-1 py-2 rounded-xl ${theme === 'light' ? 'bg-slate-100 text-slate-500' : 'bg-white/5 text-white/40'} text-[10px] font-bold hover:opacity-80 transition-colors`}
                            >
                              ביטול
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${theme === 'light' ? 'bg-black text-white' : 'bg-white text-black'} flex items-center justify-center animate-pulse shadow-lg`}>
                      <Bot size={24} strokeWidth={1.5} />
                    </div>
                    <div className={`p-6 ${colors.modelMsg} rounded-3xl border shadow-sm`}>
                      <Loader2 size={24} className={`animate-spin ${theme === 'light' ? 'text-primary' : 'text-white/40'}`} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className={`p-4 md:p-6 border-t ${theme === 'light' ? 'border-black/5 bg-white/5' : 'border-white/5 bg-transparent'} backdrop-blur-3xl`}>
        <div className="max-w-3xl mx-auto space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap justify-center gap-1.5"
          >
            {suggestions.map((s, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.05, y: -1, backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSuggestionClick(s)}
                className={`px-3 py-1.5 rounded-full border ${theme === 'light' ? 'bg-white/30 border-black/5 text-black/50 shadow-sm' : 'bg-white/5 border-white/10 text-white/30'} text-[9px] font-black tracking-wider transition-all whitespace-nowrap`}
              >
                {s}
              </motion.button>
            ))}
          </motion.div>

          {/* New Bento-style Input Area */}
          <div className="relative group max-w-2xl mx-auto">
             <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="flex flex-wrap gap-2 mb-3 px-2"
                >
                  {attachments.map((file, idx) => (
                    <motion.div 
                      key={idx}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                        theme === 'light' ? 'bg-white border-black/5 shadow-sm' : 'bg-white/5 border-white/10 shadow-xl'
                      } group/file`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary overflow-hidden">
                        {file.mimeType.startsWith('image/') ? (
                          <img src={`data:${file.mimeType};base64,${file.data}`} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                          <FileIcon size={12} />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-bold truncate max-w-[120px] ${theme === 'light' ? 'text-slate-700' : 'text-white/80'}`}>{file.name}</span>
                        <span className={`text-[8px] opacity-40 uppercase tracking-tighter`}>{file.mimeType.split('/')[1] || 'FILE'}</span>
                      </div>
                      <button 
                        onClick={() => removeAttachment(file.name)}
                        className="p-1 hover:bg-rose-500/20 hover:text-rose-500 rounded-md transition-colors opacity-0 group-hover/file:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="flex flex-col w-full relative" dir={isRTL ? 'rtl' : 'ltr'}>
              <div className={`relative flex items-center gap-2 p-1 rounded-full ${
                inputValidationError
                  ? 'bg-red-50/50 border-red-500 border-2 ring-2 ring-red-500/20'
                  : (theme === 'light' ? 'bg-white border-[#6a5a3d]/15 shadow-[0_4px_24px_rgba(106,90,61,0.06)]' : 'bg-white/[0.03] border-white/10 backdrop-blur-3xl')
              } border shadow-2xl transition-all duration-300 h-14 px-2`}>
                {/* Paperclip Button (Inside on the right/start of flow) */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2.5 rounded-full transition-all shrink-0 cursor-pointer ${
                    theme === 'light' 
                      ? 'text-[#7e766b] hover:text-[#6a5a3d] hover:bg-[#6a5a3d]/5' 
                      : 'text-white/40 hover:text-primary hover:bg-white/5'
                  }`}
                  title="Attach Document"
                >
                  <Paperclip size={19} strokeWidth={2} />
                </motion.button>

                {/* Central Input and Recording status */}
                <div className="flex-1 relative flex flex-col justify-center min-h-[44px]">
                  {isRecording && (
                    <div className="absolute inset-y-0 right-2 left-2 flex items-center pointer-events-none">
                       <div className="flex gap-1.5 h-4 items-end">
                         {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                           <motion.div 
                             key={n}
                             animate={{ height: [4, Math.random() * 20 + 4, 4] }}
                             transition={{ duration: 0.4, repeat: Infinity, delay: n * 0.03 }}
                             className="w-1 bg-[#6a5a3d] rounded-full"
                           />
                         ))}
                       </div>
                    </div>
                  )}
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      if (inputValidationError) setInputValidationError(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isRecording ? "מקשיב אסטרטגית..." : (isRTL ? "כתוב הודעה לאסטרטג..." : "Write a message to strategy...")}
                    className={`w-full bg-transparent border-none focus:ring-0 outline-none py-3 px-2 ${isRecording ? 'opacity-0' : 'opacity-100'} ${theme === 'light' ? 'text-[#2D2924]' : 'text-white'} font-bold text-sm md:text-base placeholder-[#7e766b]/50`}
                  />
                </div>

                {/* Left Side elements group */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Voice mode speaker */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setVoiceOutputEnabled(!voiceOutputEnabled)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all cursor-pointer ${
                      voiceOutputEnabled 
                        ? 'text-[#6a5a3d] bg-[#6a5a3d]/10' 
                        : (theme === 'light' ? 'text-[#7e766b] hover:bg-[#6a5a3d]/5 hover:text-[#6a5a3d]' : 'text-white/40 hover:bg-white/5')
                    }`}
                    title="Voice Mode"
                  >
                    {voiceOutputEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  </motion.button>

                  {/* Mic input trigger */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleRecording}
                    animate={isRecording ? { scale: [1, 1.15, 1], transition: { repeat: Infinity, duration: 1.5 } } : {}}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all cursor-pointer ${
                      isRecording 
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' 
                        : (theme === 'light' ? 'text-[#7e766b] hover:bg-[#6a5a3d]/5 hover:text-[#6a5a3d]' : 'text-white/40 hover:bg-white/5')
                    }`}
                    title={isRecording ? "Stop Recording" : "Start Voice Input"}
                  >
                    {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                  </motion.button>

                  {/* Solid circular Send button inside the end of capsule */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSend}
                    disabled={isLoading}
                    className={`w-11 h-11 text-white rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer ${
                      theme === 'light' 
                        ? 'bg-[#6a5a3d] hover:bg-[#8c7a5b] shadow-[#6a5a3d]/20 disabled:opacity-40' 
                        : 'bg-[#6a5a3d] hover:bg-[#8c7a5b] text-white disabled:opacity-40'
                    }`}
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={15} className={`transform ${isRTL ? 'rotate-180' : ''}`} strokeWidth={2.5} />}
                  </motion.button>
                </div>
              </div>

              {inputValidationError && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-600 dark:text-red-400 text-xs font-black mt-2 text-right w-full px-5 flex items-center gap-1.5"
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400"></span>
                  {inputValidationError}
                </motion.p>
              )}
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple />
            <input type="file" ref={driveUploadInputRef} onChange={handleDriveFileUpload} className="hidden" multiple />
          </div>
          
          <div className="flex justify-center">
             <p className={`text-[9px] uppercase tracking-[0.4em] font-black ${theme === 'light' ? 'text-black/20' : 'text-white/10'}`}>
               Powered by QYZVO Neural Engine • Proactive Analysis Enabled
             </p>
          </div>
        </div>
      </div>

      {/* Google Drive Auth Modal */}
      <AnimatePresence>
        {showDriveAuth && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDriveAuth(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-md p-8 rounded-[40px] ${colors.card} border-2 border-white/10 shadow-2xl z-[110] text-center`}
              dir="rtl"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Globe size={40} className="text-primary" />
              </div>
              <h3 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>אימות Google Drive</h3>
              <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-white/60'} mb-8 leading-relaxed`}>
                ה-Pilot דורש הרשאה לגישה לקבצים שלך ב-Google Drive כדי לסנכרן נתונים אסטרטגיים ולבצע ניתוחי עומק על מסמכי ה-DNA העסקי שלך.
              </p>
              
              <div className={`p-4 rounded-2xl ${theme === 'light' ? 'bg-slate-50' : 'bg-white/5'} mb-8 text-right space-y-3`}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium">חיבור מאובטח (OAuth 2.0)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium">גישת קריאה בלבד למסמכים נבחרים</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={completeDriveAuth}
                  className="gsi-material-button w-full flex items-center justify-center"
                  style={{ height: '56px', borderRadius: '16px', overflow: 'hidden' }}
                >
                  <div className="gsi-material-button-state"></div>
                  <div className="gsi-material-button-content-wrapper flex items-center justify-center gap-3">
                    <div className="gsi-material-button-icon">
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlnsXlink="http://www.w3.org/1999/xlink" style={{ display: 'block', width: '20px', height: '20px' }}>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                    </div>
                    <span className="gsi-material-button-contents text-sm font-bold">התחבר עם Google</span>
                  </div>
                </button>
                <button 
                  onClick={() => setShowDriveAuth(false)}
                  className={`w-full py-4 rounded-2xl ${theme === 'light' ? 'bg-slate-100 text-slate-500' : 'bg-white/5 text-white/40'} font-bold text-sm hover:opacity-80 transition-all`}
                >
                  ביטול
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
