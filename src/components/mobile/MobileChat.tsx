import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Sparkles, 
  Paperclip, 
  Mic, 
  HardDrive, 
  CheckCircle, 
  Menu, 
  Bot, 
  User as UserIcon,
  Loader2,
  X,
  Volume2,
  VolumeX,
  MicOff
} from 'lucide-react';
import { getPilotResponse } from '../../services/pilotService';
import { StorageProvider } from '../../services/storage';
import { Product, Supplier, User, BusinessProfile } from '../../types';
import { MobileHeader } from './MobileHeader';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface MobileChatProps {
  user: User | null;
  profile: BusinessProfile | null;
  products: Product[];
  suppliers: Supplier[];
  onInventoryUpdate: (type: 'product' | 'supplier', data: any) => void;
  onNavigate: (tab: string) => void;
}

export const MobileChat: React.FC<MobileChatProps> = ({ 
  user, 
  profile,
  products,
  suppliers,
  onInventoryUpdate,
  onNavigate
}) => {
  const [messages, setMessages] = useState<Message[]>(StorageProvider.getChatHistory().map(m => ({
    role: m.role,
    content: m.content
  })));
  const [input, setInput] = useState('');
  const [inputValidationError, setInputValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize with fallback start messages if empty to match exact screen layout
  useEffect(() => {
    if (messages.length === 0) {
      const defaultMsgs: Message[] = [
        {
          role: 'model',
          content: 'שלום! אני העוזר האסטרטגי שלך לניהול המלאי של QYZVO. סרקתי את רשומות המלאי וזיהיתי 3 מוצרים שחלה ירידה תלולה במלאי שלהם. באפשרותנו לבחון את קצב הצריכה של האייפד, להפיק דו״ח מלא, או להציג המלצות להזמנות חדשות.'
        }
      ];
      setMessages(defaultMsgs);
      StorageProvider.saveChatHistory(defaultMsgs as any);
    }
  }, []);

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (isLoading) return;

    if (!text) {
      setInputValidationError('לא ניתן לשלוח הודעה ריקה. אנא הקלד תוכן.');
      return;
    }

    setInputValidationError(null);

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Add empty model placeholder
      const botMsgPlaceholder: Message = { role: 'model', content: '' };
      setMessages([...newMessages, botMsgPlaceholder]);

      let fullText = "";

      // Fetch response with streaming chunks
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
              const lastIndex = updated.length - 1;
              if (lastIndex >= 0 && updated[lastIndex].role === 'model') {
                updated[lastIndex] = {
                  ...updated[lastIndex],
                  content: fullText
                };
              }
              return updated;
            });
          }
        }
      );

      // Save updated messages layout
      setMessages(prev => {
        StorageProvider.saveChatHistory(prev as any);
        return prev;
      });
    } catch (error) {
      console.error("Gemini Pilot chat error:", error);
      setMessages(prev => {
        const cleaned = prev.slice(0, -1); // remove placeholder
        return [...cleaned, {
          role: 'model',
          content: 'מצטער, חלה שגיאה בתקשורת עם שרת האסטרטגיה של QYZVO.'
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    const defaultMsgs = [
      {
        role: 'model',
        content: 'שלום! אני העוזר האסטרטגי שלך לניהול המלאי של QYZVO. סרקתי את רשומות המלאי וזיהיתי 3 מוצרים שחלה ירידה תלולה במלאי שלהם. באפשרותנו לבחון את קצב הצריכה של האייפד, להפיק דו״ח מלא, או להציג המלצות להזמנות חדשות.'
      }
    ];
    setMessages(defaultMsgs as any);
    StorageProvider.saveChatHistory(defaultMsgs as any);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Simulate speech-to-text input inclusion
      setTimeout(() => {
        setInput('נתח את מלאי המחסן המרכזי עם התחשבנות בקצבי הצריכה הנוכחיים');
        setIsRecording(false);
      }, 3000);
    }
  };

  const suggestions = [
    "סכום דוח רבעוני",
    "ניתוח ערים",
    "השוואה למתחרים",
    "קצב צריכה יומי"
  ];

  return (
    <div className="absolute inset-0 pb-20 flex flex-col bg-[#fbf9f8] text-[#2D2924] font-sans overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="px-5 pt-4 pb-2 bg-[#fbf9f8]/90 backdrop-blur-md z-30 flex-shrink-0">
        <MobileHeader user={user} onNavigate={onNavigate} />
      </div>

      {/* Strategic AI intro */}
      <div className="px-5 pt-2 text-right flex-shrink-0">
        <h2 className="text-xl font-bold text-[#2D2924]">צ'אט AI אסטרטגי</h2>
        <p className="text-xs text-[#7e766b] mt-0.5">מחובר לזיכרון הארגוני של QYZVO</p>
      </div>

      {/* Pills statuses row */}
      <div className="flex items-center gap-2 px-5 py-3 overflow-x-auto no-scrollbar flex-shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#6a5a3d]/10 text-xs font-semibold text-[#2D2924] shrink-0 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          מערכת במצב אופטימלי
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#6a5a3d]/10 text-xs font-semibold text-[#2D2924] shrink-0 shadow-sm">
          <HardDrive size={12} className="text-[#6a5a3d]" />
          זיכרון פעיל: 4.2GB
        </div>
        <button 
          onClick={handleClear}
          className="text-xs font-bold text-[#e35a3e] px-3 py-1.5 rounded-full bg-white border border-[#e35a3e]/10 hover:bg-rose-50 active:scale-95 transition-all shrink-0"
        >
          נקה צ׳אט
        </button>
      </div>

      {/* Chat Messages Feed Container */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-[100px]">
        {messages.map((message, i) => {
          const isBot = message.role === 'model';
          return (
            <div 
              key={i} 
              className={`flex items-start gap-3 text-right max-w-[85%] ${
                isBot ? 'mr-0' : 'ml-0 mr-auto flex-row-reverse'
              }`}
            >
              {/* Message Avatar bubble */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border relative ${
                isBot 
                  ? 'bg-white border-[#6a5a3d]/10 text-[#6a5a3d]' 
                  : 'bg-[#6a5a3d] border-[#6a5a3d] text-white shadow-sm'
              }`}>
                {isBot ? <Bot size={14} /> : <UserIcon size={14} />}
              </div>

              {/* Text Bubble */}
              <div className={isBot 
                ? "py-2 text-sm leading-relaxed text-[#2D2924]" 
                : "p-4 rounded-3xl text-sm leading-relaxed bg-[#6a5a3d] text-white shadow-md"
              }>
                <p className="font-sans font-medium whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex items-start gap-3 text-right max-w-[85%] mr-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border bg-white border-[#6a5a3d]/10 text-[#6a5a3d] animate-pulse">
              <Bot size={14} />
            </div>
            <div className="py-2 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-[#6a5a3d]" />
              <span className="text-xs font-semibold text-[#7e766b]">מעבד תובנות מלאי...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Suggested Input options Carousel */}
      <div className="flex items-center gap-2 px-5 py-2.5 overflow-x-auto no-scrollbar flex-shrink-0 bg-[#fbf9f8]">
        {suggestions.map((sug, id) => (
          <button
            key={id}
            onClick={() => handleSend(sug)}
            className="px-4 py-2 rounded-full bg-white border border-[#6a5a3d]/10 text-xs font-bold text-[#6a5a3d] hover:bg-[#6a5a3d]/5 active:scale-95 transition-all shrink-0 shadow-sm"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Mic Recording Popup */}
      <AnimatePresence>
        {isRecording && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bottom-24 left-6 right-6 p-4 rounded-2xl bg-white border border-[#6a5a3d]/15 shadow-xl flex items-center justify-between z-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-rose-500 rounded-full animate-ping" />
              <p className="text-xs font-bold text-[#2D2924]">מקליט פקודה קולית...</p>
            </div>
            <button 
              onClick={() => setIsRecording(false)}
              className="text-xs font-bold text-[#e35a3e]"
            >
              ביטול
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lower controls section */}
      <div className="px-5 py-4 bg-[#fbf9f8] border-t border-[#6a5a3d]/5 flex-shrink-0 flex flex-col items-center justify-center gap-2 w-full">
        {/* Unified Pill-style Text Box */}
        <div className={`w-full relative flex items-center bg-white rounded-full border ${
          inputValidationError 
            ? 'bg-red-50/50 border-red-500 border-2 ring-2 ring-red-500/15 shadow-md shadow-red-500/5' 
            : 'border-[#6a5a3d]/15 shadow-[0_3px_12px_rgba(106,90,61,0.04)]'
        } transition-all h-12 px-1.5`} dir="rtl">
          {/* Paperclip Button (Inside on the right) */}
          <button 
            type="button"
            className="p-2 text-[#7e766b]/80 hover:text-[#6a5a3d] hover:bg-[#6a5a3d]/5 rounded-full transition-all active:scale-90 shrink-0 cursor-pointer"
          >
            <Paperclip size={18} strokeWidth={2} />
          </button>

          {/* Central Input Field */}
          <input 
            type="text" 
            placeholder="כתוב הודעה לאסטרטג..."
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (inputValidationError) setInputValidationError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            className="flex-1 bg-transparent border-none outline-none text-right px-2 font-medium text-xs md:text-sm text-[#2D2924] placeholder-[#7e766b]/50 focus:ring-0 h-full"
          />

          {/* Leftside Controls (Mic and Send circular button) */}
          <div className="flex items-center gap-1.5">
            {/* Microphone Button */}
            <button 
              type="button"
              onClick={toggleRecording}
              className={`p-2 rounded-full transition-all active:scale-90 cursor-pointer ${
                isRecording ? 'text-rose-500 bg-rose-50' : 'text-[#7e766b]/80 hover:text-[#6a5a3d] hover:bg-[#6a5a3d]/5'
              }`}
            >
              <Mic size={18} strokeWidth={2} />
            </button>

            {/* Solid Send Circle Button */}
            <button 
              type="button"
              disabled={isLoading}
              onClick={() => handleSend()}
              className="w-9 h-9 rounded-full bg-[#6a5a3d] hover:bg-[#8c7a5b] disabled:opacity-40 text-white flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <Send size={13} className="transform rotate-180" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {inputValidationError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-600 text-xs font-black text-right w-full px-4 flex items-center gap-1.5"
          >
            <span className="inline-block w-1 h-1 rounded-full bg-red-600"></span>
            {inputValidationError}
          </motion.p>
        )}
      </div>
    </div>
  );
};
