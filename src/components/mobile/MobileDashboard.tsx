import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderOpen, 
  Users, 
  TrendingUp, 
  ChevronLeft, 
  Sparkles, 
  ArrowUpRight, 
  Menu,
  Clock,
  Compass,
  Type,
  User as UserIcon,
  Plus,
  Settings,
  Image as ImageIcon,
  AlertTriangle,
  Package,
  Truck,
  Award,
  Minus,
  History,
  X
} from 'lucide-react';
import { Product, Supplier, User } from '../../types';
import { MobileHeader } from './MobileHeader';
import { WidgetConfig, WidgetCustomizer } from '../WidgetCustomizer';
import { ImageCaptionStudio } from '../ImageCaptionStudio';

interface MobileDashboardProps {
  user: User | null;
  products: Product[];
  suppliers: Supplier[];
  onNavigate: (tab: string) => void;
  onInventoryUpdate?: (type: 'product' | 'supplier', data: any) => void;
}

export const MobileDashboard: React.FC<MobileDashboardProps> = ({ 
  user, 
  products = [], 
  suppliers = [], 
  onNavigate,
  onInventoryUpdate
}) => {
  const userName = user?.fullName?.split(' ')[0] || 'אורח';

  // Dynamic dashboard states matching Desktop configs
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem('qyzvo_dashboard_widgets_v1');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'total_value', label: 'ערך מלאי כולל', type: 'total_value', visible: true, color: 'emerald' },
      { id: 'low_stock', label: 'במלאי נמוך', type: 'low_stock', visible: true, color: 'amber' },
      { id: 'out_of_stock', label: 'אזל מהמלאי', type: 'out_of_stock', visible: true, color: 'rose' },
      { id: 'suppliers', label: 'ספקים פעילים', type: 'suppliers', visible: true, color: 'blue' },
    ];
  });
  
  const [currencySymbol, setCurrencySymbol] = useState<string>(() => 
    localStorage.getItem('qyzvo_currency_symbol') || '$'
  );

  const [isWidgetEditorOpen, setIsWidgetEditorOpen] = useState(false);
  const [isImageStudioOpen, setIsImageStudioOpen] = useState(false);

  const handleWidgetsChange = (newConfigs: WidgetConfig[]) => {
    setWidgets(newConfigs);
    localStorage.setItem('qyzvo_dashboard_widgets_v1', JSON.stringify(newConfigs));
  };

  const handleCurrencyChange = (sym: string) => {
    setCurrencySymbol(sym);
    localStorage.setItem('qyzvo_currency_symbol', sym);
  };

  // Math helper stats
  const totalValue = products.reduce((acc, p) => acc + (p.currentStock * (p.unitPrice || 0)), 0);
  const lowStockCount = products.filter(p => p.currentStock <= p.minThreshold && p.currentStock > 0).length;
  const outOfStockCount = products.filter(p => p.currentStock <= 0).length;
  const deadStockCount = products.filter(p => (p.burnRate || 0) === 0).length;

  const colorBorderVariants: Record<string, string> = {
    emerald: 'border-emerald-500/10 text-emerald-600 bg-emerald-50/50',
    amber: 'border-amber-500/10 text-amber-600 bg-amber-50/50',
    rose: 'border-rose-500/10 text-rose-500 bg-rose-50/50',
    blue: 'border-blue-500/10 text-blue-600 bg-blue-50/50',
    purple: 'border-purple-500/10 text-purple-600 bg-purple-50/50',
    gold: 'border-yellow-500/10 text-yellow-600 bg-yellow-50/50',
    cyan: 'border-cyan-500/10 text-cyan-500 bg-cyan-50/50',
    slate: 'border-slate-500/10 text-slate-500 bg-slate-50/50'
  };

  return (
    <div className="absolute inset-0 bg-[#fbf9f8] text-[#2D2924] pb-24 font-sans px-5 pt-4 overflow-y-auto" dir="rtl">
      {/* Header */}
      <MobileHeader user={user} onNavigate={onNavigate} />

      {/* Greetings */}
      <div className="mb-6 text-right flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2924] tracking-tight">בוקר טוב, {userName}</h1>
          <p className="text-xs text-[#7e766b] mt-1 font-medium">הנה סיכום ביצועים אמיתי ומדויק של QYZVO.</p>
        </div>

        {/* Floating customization tiny button handle */}
        <div className="flex gap-1">
          <button 
            onClick={() => setIsImageStudioOpen(true)}
            title="ערוך תמונות"
            className="p-2.5 rounded-full bg-white border border-[#6a5a3d]/15 text-[#6a5a3d] hover:bg-orange-50 active:scale-95 transition-all shadow-sm"
          >
            <ImageIcon size={14} />
          </button>
          <button 
            onClick={() => setIsWidgetEditorOpen(true)}
            title="התאם וידגטים"
            className="p-2.5 rounded-full bg-white border border-[#6a5a3d]/15 text-[#6a5a3d] hover:bg-orange-50 active:scale-95 transition-all shadow-sm"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Main Stats Cards (Custom Dynamic Widgets) */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {widgets.filter(w => w.visible).map((widget) => {
          let valueDisplay = '';
          let IconComponent = Package;

          switch (widget.type) {
            case 'total_value':
              valueDisplay = `${currencySymbol}${totalValue.toLocaleString()}`;
              IconComponent = TrendingUp;
              break;
            case 'low_stock':
              valueDisplay = `${lowStockCount} פריטים`;
              IconComponent = Clock;
              break;
            case 'out_of_stock':
              valueDisplay = `${outOfStockCount} פריטים`;
              IconComponent = Clock;
              break;
            case 'suppliers':
              valueDisplay = `${suppliers.length} ספקים`;
              IconComponent = Users;
              break;
            case 'burn_rate':
              const totalBurn = products.reduce((acc, p) => acc + (p.burnRate || 0), 0);
              valueDisplay = `${totalBurn.toFixed(1)}/יום`;
              IconComponent = TrendingUp;
              break;
            case 'dead_stock':
              valueDisplay = `${deadStockCount} יח׳`;
              IconComponent = Minus;
              break;
            case 'target_fill':
              const pct = widget.targetValue ? Math.round((totalValue / widget.targetValue) * 100) : 0;
              valueDisplay = `${pct}% מהיעד`;
              IconComponent = Award;
              break;
            case 'recent_actions':
              valueDisplay = 'עודכן מלאי';
              IconComponent = History;
              break;
            default:
              valueDisplay = 'N/A';
          }

          const styleClasses = colorBorderVariants[widget.color] || 'border-[#6a5a3d]/5 text-[#6a5a3d] bg-white';

          return (
            <div 
              key={widget.id}
              className={`rounded-[24px] p-4 shadow-[0_4px_20px_rgba(106,90,61,0.03)] border flex flex-col justify-between text-right transition-all bg-white ${styleClasses.split(' ')[0]}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-3 shrink-0 ${styleClasses.split(' ').slice(1).join(' ')}`}>
                <IconComponent size={14} />
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-[#7e766b] leading-tight truncate">{widget.label}</h3>
                <p className="text-[16px] font-extrabold text-[#2D2924] tracking-tight mt-1 truncate">
                  {valueDisplay}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Inventory Products Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-md font-bold text-[#2D2924]">מוצרים אחרונים במערכת</h2>
          <button 
            onClick={() => onNavigate('inventory')} 
            className="text-xs font-bold text-[#6a5a3d] flex items-center gap-0.5 hover:underline"
          >
            ניהול מלאי
            <ChevronLeft size={14} />
          </button>
        </div>

        {products.length === 0 ? (
          <button
            onClick={() => onNavigate('inventory')}
            className="w-full py-8 px-4 rounded-[24px] border-2 border-dashed border-[#6a5a3d]/20 bg-white hover:bg-[#6a5a3d]/5 text-center flex flex-col items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <div className="w-10 h-10 rounded-full bg-[#6a5a3d]/10 flex items-center justify-center text-[#6a5a3d]">
              <Plus size={18} />
            </div>
            <span className="text-xs font-bold text-[#2D2924]">אין עדיין מוצרים במערכת</span>
            <p className="text-[10px] text-[#7e766b]">לחץ כאן כדי להגדיר ולהוסיף את מוצר המלאי הראשון שלך.</p>
          </button>
        ) : (
          <div className="space-y-2.5">
            {products.slice(-3).reverse().map((product) => {
              const isLow = product.currentStock <= product.minThreshold;
              return (
                <div 
                  key={product.id}
                  className="bg-white rounded-2xl p-3 border border-[#6a5a3d]/5 shadow-sm flex items-center justify-between hover:border-[#6a5a3d]/15 transition-all text-right"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#6a5a3d]/15 bg-[#6a5a3d]/5 flex items-center justify-center text-[#6a5a3d] shrink-0 relative">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <FolderOpen size={16} strokeWidth={1.5} />
                      )}

                      {/* Small visual camera click to edit quickly */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsImageStudioOpen(true);
                        }}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 active:opacity-100 transition-opacity"
                      >
                        <Settings size={12} className="text-primary" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#2D2924] line-clamp-1 max-w-[150px]">{product.name}</h4>
                      <p className="text-[10px] text-[#7e766b] mt-0.5">מק"ט: {product.sku} • {product.category || 'כללי'}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      product.currentStock <= 0 
                        ? 'bg-[#e35a3e]/10 text-[#e35a3e]' 
                        : isLow 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-[#6a5a3d]/10 text-[#6a5a3d]'
                    }`}>
                      {product.currentStock <= 0 ? 'אזל במלאי' : isLow ? `מלאי נמוך: ${product.currentStock}` : `מלאי: ${product.currentStock}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Strategist Context Insight */}
      <div className="bg-gradient-to-br from-[#6a5a3d] to-[#4c463c] rounded-[24px] p-5 text-white shadow-md space-y-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
            <Sparkles size={14} className="text-[#fbf9f8]" />
          </div>
          <h3 className="font-bold text-xs">ייעוץ וניתוח QYZVO AI</h3>
        </div>
        <p className="text-[11px] leading-relaxed text-[#fbf9f8]/95 font-sans">
          {products.length === 0 
            ? "המערכת ריקה כעת. לאחר שתוסיף מוטבי מלאי וספקים, מודל הבינה המלאכותית ינתח אופטימיזציית מלאי, חישובי קצב שריפה והמלצות להזמנות רכש חלופיות."
            : `מנותח קצב שריפת מלאי עבור ${products.length} מוצרים פעילים. לקבלת ייעוץ מלאי וסימולציית תרחיש, לחץ על לחצן האופטימיזציה למטה.`
          }
        </p>
        <button 
          onClick={() => onNavigate('chat')}
          className="w-full py-2.5 rounded-full bg-white text-[#6a5a3d] hover:bg-[#fbf9f8]/95 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
        >
          <Sparkles size={13} />
          התחל צ'אט אסטרטגי
        </button>
      </div>

      {/* MODAL OVERLAYS FOR MOBILE */}
      <AnimatePresence>
        {isWidgetEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWidgetEditorOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-h-[85vh] bg-[#030712] rounded-t-[32px] border-t border-white/10 z-10 flex flex-col text-slate-250 overflow-y-auto"
            >
              <div className="p-1 flex justify-center"><div className="w-10 h-1 bg-white/20 rounded-full my-2.5" /></div>
              <WidgetCustomizer
                configs={widgets}
                onConfigsChange={handleWidgetsChange}
                currencySymbol={currencySymbol}
                onCurrencyChange={handleCurrencyChange}
                theme="dark"
                isRTL={true}
                onClose={() => setIsWidgetEditorOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isImageStudioOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImageStudioOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-h-[90vh] bg-[#030712] rounded-t-[32px] border-t border-white/10 z-10 flex flex-col text-slate-250 overflow-y-auto"
            >
              <div className="p-1 flex justify-center"><div className="w-10 h-1 bg-white/20 rounded-full my-2.5" /></div>
              <ImageCaptionStudio
                products={products}
                onInventoryUpdate={onInventoryUpdate}
                theme="dark"
                isRTL={true}
                onClose={() => setIsImageStudioOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
