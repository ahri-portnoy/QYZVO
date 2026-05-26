import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Type, Image as ImageIcon, Download, Check, Save, Plus, Trash2, 
  RotateCw, Sparkles, Sliders, ChevronRight, X, ArrowLeftRight, HelpCircle
} from 'lucide-react';
import { Product } from '../types';

interface CaptionText {
  id: string;
  text: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  fontSize: number; // px
  color: string;
  bgColor: string;
  bgOpacity: number; // 0-1
  fontWeight: 'normal' | 'bold' | 'black';
  fontFamily: 'sans' | 'mono' | 'serif';
  padding: number; // px
  borderRadius: number; // px
}

interface ImageCaptionStudioProps {
  products: Product[];
  onInventoryUpdate?: (type: 'product' | 'supplier', data: any) => void;
  theme: 'dark' | 'light';
  isRTL: boolean;
  onClose?: () => void;
}

export const ImageCaptionStudio: React.FC<ImageCaptionStudioProps> = ({
  products = [],
  onInventoryUpdate,
  theme,
  isRTL,
  onClose
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customImageSrc, setCustomImageSrc] = useState<string>('');
  const [activeImage, setActiveImage] = useState<string>('');
  const [captions, setCaptions] = useState<CaptionText[]>([
    {
      id: '1',
      text: 'מבצע מיוחד',
      x: 50,
      y: 15,
      fontSize: 24,
      color: '#000000',
      bgColor: '#D4AF37', // Gold
      bgOpacity: 1,
      fontWeight: 'bold',
      fontFamily: 'sans',
      padding: 10,
      borderRadius: 12,
    }
  ]);
  const [selectedCaptionId, setSelectedCaptionId] = useState<string>('1');
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Default demo images if no images are loaded
  const demoImages = [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600',
  ];

  useEffect(() => {
    // Set first demo image or product image on load
    if (products.length > 0 && products[0].imageUrl) {
      setActiveImage(products[0].imageUrl);
      setSelectedProduct(products[0]);
    } else {
      setActiveImage(demoImages[0]);
    }
  }, [products]);

  const handleProductSelect = (p: Product) => {
    setSelectedProduct(p);
    if (p.imageUrl) {
      setActiveImage(p.imageUrl);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomImageSrc(reader.result);
        setActiveImage(reader.result);
        setSelectedProduct(null); // Clear selected product when uploading custom
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddCaption = () => {
    const newId = String(Date.now());
    const newCaption: CaptionText = {
      id: newId,
      text: 'כיתוב חדש',
      x: 50,
      y: 50,
      fontSize: 18,
      color: '#FFFFFF',
      bgColor: '#000000',
      bgOpacity: 0.75,
      fontWeight: 'bold',
      fontFamily: 'sans',
      padding: 8,
      borderRadius: 8,
    };
    setCaptions([...captions, newCaption]);
    setSelectedCaptionId(newId);
  };

  const handleRemoveCaption = (id: string) => {
    if (captions.length <= 1) return; // Keep at least one
    const remaining = captions.filter(c => c.id !== id);
    setCaptions(remaining);
    setSelectedCaptionId(remaining[0].id);
  };

  const updateSelectedCaption = (fields: Partial<CaptionText>) => {
    setCaptions(captions.map(c => {
      if (c.id === selectedCaptionId) {
        return { ...c, ...fields };
      }
      return c;
    }));
  };

  const activeCaption = captions.find(c => c.id === selectedCaptionId) || captions[0];

  // Helper function to synthesize/flatten canvas image
  const generateFlatImage = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        reject('Canvas not active');
        return;
      }

      const img = new Image();
      img.crossOrigin = "anonymous"; // Enable cross-origin for URL images (Unsplash handles this)
      img.onload = () => {
        // Match canvas dimensions to actual image dimensions
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 800;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject('Context failed');
          return;
        }

        // 1. Draw main image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 2. Draw styled text layers on top
        captions.forEach(cap => {
          // Calculate coordinates matching the canvas aspect ratio
          const capX = (cap.x / 100) * canvas.width;
          const capY = (cap.y / 100) * canvas.height;

          ctx.save();
          
          // Setup Font
          const fontName = cap.fontFamily === 'mono' ? 'Courier New, monospace' : 
                         cap.fontFamily === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif';
          ctx.font = `${cap.fontWeight} ${cap.fontSize * (canvas.width / 400)}px ${fontName}`;
          ctx.textBaseline = 'middle';
          ctx.textAlign = 'center';

          // Measure text for background pill boundary
          const textMetrics = ctx.measureText(cap.text);
          const textWidth = textMetrics.width;
          const textHeight = cap.fontSize * (canvas.width / 400);

          // Draw background badge/pill
          if (cap.bgColor && cap.bgColor !== 'transparent') {
            const padX = cap.padding * (canvas.width / 400);
            const padY = (cap.padding * 0.8) * (canvas.width / 400);
            const r = cap.borderRadius * (canvas.width / 400);

            const rectX = capX - (textWidth / 2) - padX;
            const rectY = capY - (textHeight / 2) - padY;
            const rectW = textWidth + (padX * 2);
            const rectH = textHeight + (padY * 2);

            // Opacity & Fill Style
            ctx.globalAlpha = cap.bgOpacity;
            ctx.fillStyle = cap.bgColor;
            
            // Rounded rectangle path draw
            ctx.beginPath();
            ctx.roundRect(rectX, rectY, rectW, rectH, r);
            ctx.fill();
            ctx.globalAlpha = 1.0;
          }

          // Draw Text itself
          ctx.fillStyle = cap.color;
          ctx.fillText(cap.text, capX, capY);
          ctx.restore();
        });

        // Resolve dataURL representation
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => {
        // If image loading fails due to CORS, fallback to drawing a colored background block
        canvas.width = 600;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#1A1816';
          ctx.fillRect(0, 0, 600, 600);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText("שגיאת CORS. מעבד רקע בלבד...", 300, 250);

          // Draw captions
          captions.forEach(cap => {
            const capX = (cap.x / 100) * 600;
            const capY = (cap.y / 100) * 600;
            ctx.fillStyle = cap.color;
            ctx.font = `${cap.fontWeight} ${cap.fontSize * 1.5}px sans-serif`;
            ctx.fillText(cap.text, capX, capY);
          });
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject('CORS / fallback failed');
        }
      };

      // Handle custom local images vs external URLs
      img.src = activeImage;
    });
  };

  const handleDownload = async () => {
    setExporting(true);
    try {
      const dataUrl = await generateFlatImage();
      const link = document.createElement('a');
      link.download = `captioned_image_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Image compression export error:', err);
      alert('ייצוא התמונה נכשל בעקבות אבטחת שרתי מקור. נסה להשתמש בקובץ מקומי.');
    } finally {
      setExporting(false);
    }
  };

  const handleSaveToProduct = async () => {
    if (!selectedProduct || !onInventoryUpdate) {
      alert('אנא בחר מוצר מתוך המלאי שלך כדי לעדכן אותו.');
      return;
    }

    setExporting(true);
    try {
      const dataUrl = await generateFlatImage();
      const updatedProduct = {
        ...selectedProduct,
        imageUrl: dataUrl
      };
      
      onInventoryUpdate('product', updatedProduct);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Error applying image to target product', err);
      alert('עדכון תמונת המוצר נכשל. נסה שוב.');
    } finally {
      setExporting(false);
    }
  };

  const loadRandomDemoImage = () => {
    const nextIdx = Math.floor(Math.random() * demoImages.length);
    setActiveImage(demoImages[nextIdx]);
    setCustomImageSrc('');
    setSelectedProduct(null);
  };

  const isLight = theme === 'light';

  const t = {
    title: 'סטודיו כיתובים ותמונות',
    subtitle: 'ערוך והוסף כיתוביות, תגיות מחיר ומבצע על גבי תמונות המוצרים שלך',
    selectProduct: 'בחר מוצר במלאי',
    uploadLocal: 'העלה תמונה מהמחשב',
    demoImg: 'תמונת סקיצה',
    addCaption: 'הוסף כיתוב חדש',
    saveProduct: 'עדכן תמונת מוצר',
    exportPng: 'הורד קובץ PNG',
    captionSettings: 'הגדרות כיתוב נבחר',
    textLabel: 'תוכן הטקסט',
    position: 'מיקום על התמונה',
    fontSize: 'גודל גופנים',
    color: 'צבע המילים',
    bgColor: 'רקע תגית',
    opacity: 'שקיפות רקע',
    style: 'סגנון טקסט',
    fontFam: 'סוג גופן',
    borderRad: 'פינות מעוגלות',
    padding: 'ריווח פנימי',
    badge: 'תג',
  };

  return (
    <div className={`p-6 md:p-8 rounded-[40px] border ${
      isLight ? 'bg-white border-black/5 shadow-xl' : 'bg-[#04081c]/90 border-white/10 shadow-2xl backdrop-blur-3xl'
    } w-full relative h-full flex flex-col md:overflow-hidden`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-5 mb-6 border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
            <ImageIcon size={20} />
          </div>
          <div className="text-start">
            <h3 className={`text-md font-black tracking-tight ${isLight ? 'text-black' : 'text-white'}`}>{t.title}</h3>
            <p className={`text-[10px] uppercase font-bold tracking-widest ${isLight ? 'text-black/40' : 'text-white/40'}`}>{t.subtitle}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-white/50 hover:text-white transition-all">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 overflow-hidden">
        {/* Left Side: Canvas Preview Area (XL: 6 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-4 overflow-hidden items-center justify-center min-h-[350px]">
          
          {/* Main Visual Editor Box */}
          <div 
            ref={containerRef}
            className={`relative rounded-3xl border ${isLight ? 'bg-slate-50 border-black/10' : 'bg-black/35 border-white/10'} w-full max-w-[450px] aspect-square overflow-hidden shadow-2xl flex items-center justify-center`}
          >
            {/* Real Background Image */}
            <img 
              src={activeImage || demoImages[0]} 
              alt="Preview Studio" 
              className="w-full h-full object-cover select-none"
              referrerPolicy="no-referrer"
            />

            {/* Visual styled text overlays */}
            {captions.map((cap) => {
              const borderStyle = selectedCaptionId === cap.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-black' : '';
              const fontFamClass = cap.fontFamily === 'mono' ? 'font-mono' : cap.fontFamily === 'serif' ? 'font-serif' : 'font-sans';
              
              const weightClass = cap.fontWeight === 'black' ? 'font-black' : cap.fontWeight === 'bold' ? 'font-bold' : 'font-normal';

              return (
                <div
                  key={cap.id}
                  onClick={() => setSelectedCaptionId(cap.id)}
                  style={{
                    position: 'absolute',
                    left: `${cap.x}%`,
                    top: `${cap.y}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    fontSize: `${cap.fontSize}px`,
                    color: cap.color,
                    backgroundColor: cap.bgColor === 'transparent' ? 'transparent' : cap.bgColor,
                    opacity: 1, // Visual is bright
                    padding: `${cap.padding}px`,
                    borderRadius: `${cap.borderRadius}px`,
                    boxShadow: selectedCaptionId === cap.id ? '0 10px 25px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.22)',
                  }}
                  className={`select-none duration-100 whitespace-nowrap z-20 ${borderStyle} ${fontFamClass} ${weightClass}`}
                >
                  {/* Real visual container matching the opacity of the bg code */}
                  {cap.bgColor !== 'transparent' && (
                    <div 
                      className="absolute inset-0 z-[-1]" 
                      style={{ 
                        backgroundColor: cap.bgColor, 
                        opacity: cap.bgOpacity,
                        borderRadius: `${cap.borderRadius}px` 
                      }} 
                    />
                  )}
                  {cap.text || 'כיתוב'}
                </div>
              );
            })}

            {/* Corner Indicators */}
            <div className="absolute top-4 left-4 py-1 px-3 bg-black/75 backdrop-blur-md rounded-lg text-[9px] font-mono select-none tracking-widest text-primary font-black uppercase z-30">
              QYZVO_ANNOTATE_MODE
            </div>
          </div>

          {/* Action Row Under Image */}
          <div className="flex gap-2 w-full max-w-[450px] shrink-0">
            <button
              onClick={handleAddCaption}
              className={`flex-1 py-3 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500/20 text-xs font-bold transition-all flex items-center justify-center gap-1.5`}
            >
              <Plus size={14} />
              {t.addCaption}
            </button>

            <button
              onClick={loadRandomDemoImage}
              title="תמונת רקע אקראית"
              className={`p-3 rounded-xl ${isLight ? 'bg-black/5 text-black hover:bg-black/10' : 'bg-white/5 text-white hover:bg-white/10'} transition-all`}
            >
              <RotateCw size={14} />
            </button>
          </div>
        </div>

        {/* Right Side: Control Settings Panel (XL: 5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-4 overflow-y-auto pr-1">
          
          {/* Source Selection Panel */}
          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-black/5' : 'bg-white/5 border-white/5'} text-start space-y-3`}>
            <span className="text-[10px] font-black uppercase tracking-wider text-primary">בחר תמונת מקור לעריכה</span>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`py-2 px-3 rounded-xl text-xs font-bold border ${isLight ? 'bg-white border-black/10 text-slate-800' : 'bg-white/[0.03] border-white/10 text-white'} flex items-center justify-center gap-1.5 hover:bg-primary/10 hover:border-primary/30 transition-all`}
              >
                <ImageIcon size={14} />
                {t.uploadLocal}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />

              {selectedProduct ? (
                <div className="py-2 px-3 rounded-xl text-xs font-mono font-bold bg-primary/25 border border-primary/40 text-primary truncate max-w-full text-center">
                  {selectedProduct.name}
                </div>
              ) : (
                <div className={`py-2 px-3 rounded-xl text-xs font-mono text-center ${isLight ? 'bg-black/5 text-black/50' : 'bg-white/5 text-white/40'}`}>
                  סקיצה חופשית
                </div>
              )}
            </div>

            {/* Product selection items drop-down list */}
            {products.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[9px] font-bold text-white/40 block">או שייך למוצר מלאי פעיל:</span>
                <select 
                  onChange={(e) => {
                    const found = products.find(p => p.id === e.target.value);
                    if (found) handleProductSelect(found);
                  }}
                  value={selectedProduct?.id || ''}
                  className={`w-full py-2 px-3 text-xs font-bold rounded-xl border focus:outline-none ${isLight ? 'bg-white text-slate-900 border-black/10' : 'bg-slate-900/40 text-slate-200 border-white/15'}`}
                >
                  <option value="">-- בחר מוצר --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (מחיר: ${p.unitPrice})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Caption Settings Customizer Panel */}
          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-black/5' : 'bg-white/5 border-white/5'} text-start space-y-4`}>
            
            {/* Layers rail */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">{t.captionSettings}</span>
              
              <div className="flex items-center gap-2">
                <select
                  value={selectedCaptionId}
                  onChange={(e) => setSelectedCaptionId(e.target.value)}
                  className={`text-[10px] font-black py-1 px-2.5 rounded-lg border ${isLight ? 'bg-white text-black border-black/15' : 'bg-black text-white border-white/10'}`}
                >
                  {captions.map((cap, idx) => (
                    <option key={cap.id} value={cap.id}>שכבה {idx + 1}: {cap.text.slice(0, 8)}...</option>
                  ))}
                </select>

                <button
                  onClick={() => handleRemoveCaption(selectedCaptionId)}
                  disabled={captions.length <= 1}
                  className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg border border-rose-500/20 disabled:opacity-30 hover:bg-rose-500/20 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {/* Editable items of coordinates and formatting */}
            {activeCaption && (
              <div className="space-y-3.5 text-xs text-white/80">
                {/* 1. Text Field Input */}
                <div className="space-y-1">
                  <label className={`text-[10px] font-bold ${isLight ? 'text-black/50' : 'text-white/40'}`}>{t.textLabel}</label>
                  <input
                    type="text"
                    value={activeCaption.text}
                    onChange={(e) => updateSelectedCaption({ text: e.target.value })}
                    className={`w-full py-2 px-3 rounded-xl border focus:outline-none focus:border-primary/50 ${isLight ? 'bg-white text-slate-900 border-black/10' : 'bg-slate-950 border-white/10 text-white'}`}
                  />
                </div>

                {/* 2. Position X and Y Sliders */}
                <div className="grid grid-cols-2 gap-3 pb-1">
                  <div className="space-y-1">
                    <label className={`text-[10px] font-bold ${isLight ? 'text-black/50' : 'text-white/40'} flex justify-between`}>
                      <span>אופקי (X):</span>
                      <span className="font-mono text-primary font-bold">{activeCaption.x}%</span>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={activeCaption.x}
                      onChange={(e) => updateSelectedCaption({ x: Number(e.target.value) })}
                      className="w-full accent-primary bg-white/5 h-1.5 rounded-full appearance-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={`text-[10px] font-bold ${isLight ? 'text-black/50' : 'text-white/40'} flex justify-between`}>
                      <span>אנכי (Y):</span>
                      <span className="font-mono text-primary font-bold">{activeCaption.y}%</span>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={activeCaption.y}
                      onChange={(e) => updateSelectedCaption({ y: Number(e.target.value) })}
                      className="w-full accent-primary bg-white/5 h-1.5 rounded-full appearance-none"
                    />
                  </div>
                </div>

                {/* Quick Alignment presets */}
                <div className="flex gap-1 justify-between pt-1 pb-1">
                  <span className={`text-[10px] font-bold ${isLight ? 'text-black/50' : 'text-white/40'}`}>קיצור מיקום:</span>
                  <div className="flex gap-1.5">
                    {[
                      { label: 'עליון', val: { x: 50, y: 15 } },
                      { label: 'מרכז', val: { x: 50, y: 50 } },
                      { label: 'תחתון', val: { x: 50, y: 85 } },
                      { label: 'שמאל למטה', val: { x: 18, y: 85 } }
                    ].map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => updateSelectedCaption({ x: preset.val.x, y: preset.val.y })}
                        className={`text-[9px] font-black px-2 py-1 border border-white/5 hover:border-primary/20 hover:text-primary rounded-lg ${isLight ? 'bg-black/5 text-black' : 'bg-white/5 text-white/60'}`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Font formatting controls */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className={`text-[10px] font-bold ${isLight ? 'text-black/50' : 'text-white/40'}`}>{t.fontSize} ({activeCaption.fontSize}px)</label>
                    <input
                      type="range"
                      min="12"
                      max="50"
                      value={activeCaption.fontSize}
                      onChange={(e) => updateSelectedCaption({ fontSize: Number(e.target.value) })}
                      className="w-full accent-primary bg-white/5 h-1.5 rounded-full appearance-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={`text-[10px] font-bold ${isLight ? 'text-black/50' : 'text-white/40'}`}>{t.fontFam}</label>
                    <select
                      value={activeCaption.fontFamily}
                      onChange={(e) => updateSelectedCaption({ fontFamily: e.target.value as any })}
                      className={`w-full py-1.5 px-2 rounded-xl border focus:outline-none ${isLight ? 'bg-white text-slate-900 border-black/10' : 'bg-slate-900 text-slate-200 border-white/10'}`}
                    >
                      <option value="sans">קלאסי (Sans)</option>
                      <option value="mono">טכנולוגי (Mono)</option>
                      <option value="serif">מסורתי (Serif)</option>
                    </select>
                  </div>
                </div>

                {/* 4. Formatting variables */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className={`text-[10px] font-bold ${isLight ? 'text-black/50' : 'text-white/40'}`}>{t.color}</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {['#FFFFFF', '#000000', '#D4AF37', '#EF4444', '#10B981', '#3B82F6'].map(col => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => updateSelectedCaption({ color: col })}
                          style={{ backgroundColor: col }}
                          className={`w-5 h-5 rounded-full border border-white/20 relative flex items-center justify-center`}
                        >
                          {activeCaption.color === col && (
                            <Check size={10} className={col === '#FFFFFF' ? 'text-black' : 'text-white'} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className={`text-[10px] font-bold ${isLight ? 'text-black/50' : 'text-white/40'}`}>{t.bgColor}</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {['transparent', '#000000', '#D4AF37', '#EF4444', '#111827', '#FFFFFF'].map(col => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => updateSelectedCaption({ bgColor: col })}
                          style={{ backgroundColor: col === 'transparent' ? 'transparent' : col }}
                          className={`w-5 h-5 rounded-full border border-white/25 relative flex items-center justify-center overflow-hidden`}
                          title={col === 'transparent' ? 'ללא רקע' : col}
                        >
                          {col === 'transparent' && (
                            <div className="absolute inset-0 bg-transparent flex items-center justify-center">
                              <X size={10} className="text-rose-500" />
                            </div>
                          )}
                          {activeCaption.bgColor === col && col !== 'transparent' && (
                            <Check size={10} className={col === '#FFFFFF' ? 'text-black' : 'text-white'} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 5. Custom borders & padding */}
                {activeCaption.bgColor !== 'transparent' && (
                  <div className="grid grid-cols-2 gap-3.5 pt-1">
                    <div className="space-y-1">
                      <label className={`text-[10px] font-bold ${isLight ? 'text-black/50' : 'text-white/40'}`}>{t.borderRad} ({activeCaption.borderRadius}px)</label>
                      <input
                        type="range"
                        min="0"
                        max="24"
                        value={activeCaption.borderRadius}
                        onChange={(e) => updateSelectedCaption({ borderRadius: Number(e.target.value) })}
                        className="w-full accent-primary bg-white/5 h-1.5 rounded-full appearance-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className={`text-[10px] font-bold ${isLight ? 'text-black/50' : 'text-white/40'}`}>{t.padding} ({activeCaption.padding}px)</label>
                      <input
                        type="range"
                        min="2"
                        max="20"
                        value={activeCaption.padding}
                        onChange={(e) => updateSelectedCaption({ padding: Number(e.target.value) })}
                        className="w-full accent-primary bg-white/5 h-1.5 rounded-full appearance-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2 mt-auto pt-2 shrink-0">
            {/* Display / Success state feedback */}
            <AnimatePresence>
              {exportSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-center text-[10px] font-bold font-mono uppercase tracking-wider"
                >
                  הפעולה בוצעה בהצלחה! התמונה סונכרנה.
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                disabled={exporting}
                className={`flex-1 py-3.5 rounded-2xl ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-black/5' : 'bg-white/5 hover:bg-white/10 text-white/90 border border-white/10'} text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2`}
              >
                <Download size={14} />
                {t.exportPng}
              </button>

              {selectedProduct && onInventoryUpdate && (
                <button
                  onClick={handleSaveToProduct}
                  disabled={exporting}
                  className={`flex-1 py-3.5 rounded-2xl bg-primary text-black hover:opacity-90 active:scale-[0.98] text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(212,175,55,0.2)]`}
                >
                  <Save size={14} />
                  {t.saveProduct}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden processing canvas used exclusively for heavy pixel rendering and flattening */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
