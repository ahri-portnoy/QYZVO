import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Supplier, InventoryStats } from '../types';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Truck, 
  Search, 
  Plus, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  History,
  LayoutGrid,
  List as ListIcon,
  DollarSign,
  BarChart3,
  Clock,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  Minus,
  Settings,
  Image as ImageIcon,
  Sparkles,
  X,
  Award,
  Edit,
  Sliders
} from 'lucide-react';
import { Logo } from './Logo';
import { WidgetCustomizer, WidgetConfig } from './WidgetCustomizer';
import { ImageCaptionStudio } from './ImageCaptionStudio';

interface DashboardProps {
  products: Product[];
  suppliers: Supplier[];
  onInventoryUpdate?: (type: 'product' | 'supplier', data: any) => void;
  theme: 'dark' | 'light';
  isRTL: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ products, suppliers, onInventoryUpdate, theme, isRTL }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterCategory, setFilterCategory] = useState<string>('הכול');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Widget settings state with LocalStorage persistence
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

  // Modal active states
  const [isWidgetEditorOpen, setIsWidgetEditorOpen] = useState(false);
  const [isImageStudioOpen, setIsImageStudioOpen] = useState(false);
  const [selectedProductForStudio, setSelectedProductForStudio] = useState<Product | null>(null);

  const safeProducts = products || [];
  const safeSuppliers = suppliers || [];

  const categories = ['הכול', ...Array.from(new Set(safeProducts.map(p => p.category || 'כללי')))];

  const handleStockAdjust = async (product: Product, delta: number) => {
    if (!onInventoryUpdate) return;
    const updated = {
      ...product,
      currentStock: Math.max(0, product.currentStock + delta),
      lastRestocked: delta > 0 ? new Date().toISOString() : product.lastRestocked
    };
    setUpdatingId(product.id);
    await onInventoryUpdate('product', updated);
    setUpdatingId(null);
  };

  const getThemeStyles = () => {
    switch (theme) {
      case 'light': return {
        text: 'text-black',
        textMuted: 'text-black/40',
        card: 'bg-white border border-black/5 shadow-sm',
        cardHover: 'hover:border-primary/30 hover:shadow-md',
        input: 'bg-black/5 border-transparent text-black focus:bg-white focus:ring-2 focus:ring-primary/20',
      };
      default: return {
        text: 'text-white/90',
        textMuted: 'text-white/30',
        card: 'bg-white/[0.03] border border-white/10 shadow-xl backdrop-blur-md',
        cardHover: 'hover:bg-white/[0.05] hover:border-primary/30',
        input: 'bg-white/5 border-transparent text-white focus:bg-white/10 focus:ring-2 focus:ring-primary/20',
      };
    }
  };

  const styles = getThemeStyles();

  // Stats computation
  const stats: InventoryStats = {
    totalValue: safeProducts.reduce((acc, p) => acc + (p.currentStock * (p.unitPrice || 0)), 0),
    lowStockCount: safeProducts.filter(p => p.currentStock <= p.minThreshold && p.currentStock > 0).length,
    outOfStockCount: safeProducts.filter(p => p.currentStock <= 0).length,
    topMovingProducts: [...safeProducts].sort((a, b) => (b.burnRate || 0) - (a.burnRate || 0)).slice(0, 3).map(p => p.name),
    deadStockCount: safeProducts.filter(p => (p.burnRate || 0) === 0).length,
  };

  const filteredProducts = safeProducts.filter(p => 
    filterCategory === 'הכול' || p.category === filterCategory
  );

  const t = {
    totalValue: 'ערך מלאי כולל',
    lowStock: 'במלאי נמוך',
    outOfStock: 'אזל מהמלאי',
    criticalItems: 'פריטים קריטיים',
    inventoryList: 'רשימת מלאי',
    suppliers: 'ספקים פעילים',
    categories: 'קטגוריות',
    all: 'הכול',
    restockSoon: 'נדרש להזמין בקרוב',
    sku: 'מק"ט',
    stock: 'מלאי',
    price: 'מחיר',
    daysLeft: 'ימים',
    unit: 'יח׳',
    burnRate: 'קצב צריכה יומי',
    leadTime: 'זמן אספקה',
  };

  // Dynamically resolve colors for widgets
  const widgetColorClasses: Record<string, string> = {
    emerald: 'text-emerald-500 bg-emerald-500/10',
    amber: 'text-amber-500 bg-amber-500/10',
    rose: 'text-rose-500 bg-rose-500/10',
    blue: 'text-blue-500 bg-blue-500/10',
    purple: 'text-purple-500 bg-purple-500/10',
    gold: 'text-yellow-500 bg-yellow-500/10',
    cyan: 'text-cyan-500 bg-cyan-500/10',
    slate: 'text-slate-400 bg-slate-400/10'
  };

  const handleWidgetsChange = (newConfigs: WidgetConfig[]) => {
    setWidgets(newConfigs);
    localStorage.setItem('qyzvo_dashboard_widgets_v1', JSON.stringify(newConfigs));
  };

  const handleCurrencyChange = (sym: string) => {
    setCurrencySymbol(sym);
    localStorage.setItem('qyzvo_currency_symbol', sym);
  };

  // Launch Studio for specific selected product
  const handleLaunchStudioForProduct = (p: Product) => {
    setSelectedProductForStudio(p);
    setIsImageStudioOpen(true);
  };

  const isLight = theme === 'light';

  return (
    <div className="h-full overflow-y-auto p-6 lg:p-12 space-y-8 custom-scrollbar" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* 1. Header Studio Controls Launcher Line */}
      <div className={`p-5 rounded-[28px] ${
        isLight ? 'bg-slate-50 border border-slate-200' : 'bg-white/[0.02] border border-white/5'
      } flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
        <div className="flex items-center gap-3 relative z-10 text-start">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div>
            <h4 className={`text-sm font-black ${isLight ? 'text-black' : 'text-white'}`}>מרכז התאמה אישית ועריכת מדיה</h4>
            <p className={`text-[10px] ${isLight ? 'text-black/50' : 'text-white/40'}`}>שלוט על כרטיסיות הנתונים, עצב את לוח הבקרה וצייר כיתובים על מוצרים</p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={() => setIsWidgetEditorOpen(true)}
            className={`py-2 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
              isLight ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-250 shadow-sm' : 'bg-white/[0.04] text-white border-white/10 hover:bg-white/[0.08]'
            }`}
          >
            <Settings size={13} />
            שינוי וידגטים קטנים
          </button>

          <button
            onClick={() => {
              setSelectedProductForStudio(null);
              setIsImageStudioOpen(true);
            }}
            className="py-2 px-4 rounded-xl bg-primary text-black hover:opacity-95 active:scale-[0.98] text-xs font-black transition-all flex items-center gap-1.5 shadow-[0_0_24px_rgba(212,175,55,0.25)]"
          >
            <ImageIcon size={13} />
            סטודיו כיתובי תמונות
          </button>
        </div>
      </div>

      {/* 2. Custom Configured Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {widgets.filter(w => w.visible).map((widget, i) => {
          let valueDisplay = '';
          let IconComponent = Package;

          // Compute dynamic calculation string/data
          switch (widget.type) {
            case 'total_value':
              valueDisplay = `${currencySymbol}${stats.totalValue.toLocaleString()}`;
              IconComponent = DollarSign;
              break;
            case 'low_stock':
              valueDisplay = `${stats.lowStockCount} ${t.unit}`;
              IconComponent = AlertTriangle;
              break;
            case 'out_of_stock':
              valueDisplay = `${stats.outOfStockCount} ${t.unit}`;
              IconComponent = Package;
              break;
            case 'suppliers':
              valueDisplay = `${safeSuppliers.length} ספקים`;
              IconComponent = Truck;
              break;
            case 'burn_rate':
              const sumBurn = safeProducts.reduce((acc, p) => acc + (p.burnRate || 0), 0);
              valueDisplay = `${sumBurn.toFixed(1)} ${t.unit}/יום`;
              IconComponent = TrendingUp;
              break;
            case 'dead_stock':
              valueDisplay = `${stats.deadStockCount} ${t.unit}`;
              IconComponent = Minus;
              break;
            case 'target_fill':
              const pct = widget.targetValue && widget.targetValue > 0 
                ? Math.round((stats.totalValue / widget.targetValue) * 100) 
                : 0;
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

          const styleColor = widgetColorClasses[widget.color] || 'text-primary bg-primary/10';

          return (
            <motion.div 
              key={widget.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-6 rounded-[28px] ${styles.card} flex items-center justify-between group overflow-hidden relative`}
            >
              <div className="relative z-10 text-start">
                <p className={`text-[10px] uppercase tracking-widest font-black ${styles.textMuted} mb-1`}>{widget.label}</p>
                <h3 className={`text-2xl font-black tracking-tight ${styles.text}`}>{valueDisplay}</h3>
                
                {widget.type === 'target_fill' && widget.targetValue && (
                  <p className="text-[9px] text-white/40 mt-1 font-mono">יעד: {currencySymbol}{widget.targetValue.toLocaleString()}</p>
                )}
              </div>
              <div className={`p-3 rounded-2xl ${styleColor.split(' ')[1]} group-hover:scale-105 transition-transform shrink-0`}>
                <IconComponent size={20} className={styleColor.split(' ')[0]} strokeWidth={2} />
              </div>
              <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-3xl opacity-[0.03] transition-colors ${styleColor.split(' ')[0].replace('text', 'bg')}`} />
            </motion.div>
          );
        })}
      </div>

      {/* 3. Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Inventory List Column */}
        <div className="xl:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BarChart3 size={20} className="text-primary" />
              <h2 className={`text-xl font-black tracking-tight ${styles.text}`}>{t.inventoryList}</h2>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Category Filter */}
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className={`text-xs font-bold py-2.5 px-4 rounded-xl border ${styles.card} focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none bg-none`}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <div className={`flex rounded-xl overflow-hidden p-1 ${theme === 'light' ? 'bg-black/5' : 'bg-white/5'}`}>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-black shadow-lg scale-105' : styles.textMuted}`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-black shadow-lg scale-105' : styles.textMuted}`}
                >
                  <ListIcon size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}>
            {filteredProducts.length === 0 ? (
              <div className={`p-12 text-center border-2 border-dashed ${theme === 'light' ? 'border-black/5 bg-[#F9F9F9]' : 'border-white/10 bg-white/[0.01]'} rounded-3xl col-span-2 space-y-4`}>
                <Package className={`mx-auto opacity-30 ${theme === 'light' ? 'text-black' : 'text-white'}`} size={40} />
                <div className="space-y-1">
                  <p className={`font-bold text-sm ${styles.text}`}>המלאי ריק כרגע</p>
                  <p className={`text-xs ${styles.textMuted}`}>
                    בקש מ-Pilot בצ׳אט ליצור עבורך מוצרים או ספקים ראשונים בשניות בלבד.
                  </p>
                </div>
              </div>
            ) : (
              filteredProducts.map((product, i) => (
                <motion.div 
                  key={product.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-5 rounded-2xl ${styles.card} ${styles.cardHover} transition-all relative overflow-hidden group`}
                >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    
                    {/* ENHANCED: Product image with edit/caption overlay launcher handle */}
                    <div className="w-14 h-14 rounded-xl border shadow-inner relative overflow-hidden group/img cursor-pointer bg-black/15 flex items-center justify-center shrink-0">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Package size={22} className="opacity-40" />
                      )}

                      {/* Tool overlay banner on hover */}
                      <button
                        onClick={() => handleLaunchStudioForProduct(product)}
                        title="ערוך וכתוביות סטודיו"
                        className="absolute inset-0 bg-black/75 backdrop-blur-sm opacity-0 group-hover/img:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[8px] font-black gap-1 uppercase tracking-widest"
                      >
                        <Edit size={12} className="text-primary" />
                        <span>ערוך כיתוב</span>
                      </button>
                    </div>

                    <div className="text-start">
                      <h4 className={`font-bold ${styles.text} text-base mb-1`}>{product.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono py-0.5 px-1.5 rounded bg-primary/10 text-primary border border-primary/20`}>{product.sku}</span>
                        <span className={`text-[10px] ${styles.textMuted} font-bold`}>{product.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="text-xl font-black tracking-tight">{currencySymbol}{product.unitPrice}</div>
                    <div className={`text-[9px] font-bold ${styles.textMuted} uppercase`}>{t.unit}</div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex justify-between items-end mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black`}>{product.currentStock}</span>
                      <span className={`text-[10px] ${styles.textMuted} font-bold`}>/ {product.minThreshold} {t.stock}</span>
                    </div>
                    {product.daysRemaining !== undefined && (
                      <div className={`flex items-center gap-1 text-[10px] font-black ${product.daysRemaining < 7 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        <Clock size={10} />
                        <span>{product.daysRemaining} {t.daysLeft}</span>
                      </div>
                    )}
                  </div>
                  <div className={`w-full h-2 rounded-full ${theme === 'light' ? 'bg-black/5' : 'bg-white/5'} overflow-hidden shadow-inner`}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((product.currentStock / product.minThreshold) * 50, 100)}%` }}
                      className={`h-full transition-all ${
                        product.currentStock <= product.minThreshold ? 'bg-rose-500' : 
                        product.currentStock <= product.minThreshold * 1.5 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4">
                   <div className="flex items-center gap-4">
                     <div className="text-start">
                        <p className={`text-[8px] uppercase tracking-widest ${styles.textMuted} font-black`}>{t.burnRate}</p>
                        <p className={`text-xs font-bold`}>{product.burnRate || 0} {t.unit}/יום</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-2">
                     <button 
                        onClick={() => handleStockAdjust(product, -1)}
                        disabled={updatingId === product.id || product.currentStock <= 0}
                        className={`p-2 rounded-lg ${theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-white/5 hover:bg-white/10 text-white/40'} transition-all disabled:opacity-50`}
                     >
                        <Minus size={14} />
                     </button>
                     <button 
                        onClick={() => handleStockAdjust(product, 1)}
                        disabled={updatingId === product.id}
                        className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-black transition-all disabled:opacity-50"
                     >
                        {updatingId === product.id ? <Clock size={14} className="animate-spin" /> : <Plus size={14} />}
                     </button>
                   </div>
                </div>
                </motion.div>
              )))}
          </div>
        </div>

        {/* Right Sidebar - Alerts & Suppliers */}
        <div className="xl:col-span-4 space-y-8">
           {/* Critical Alerts */}
           <section className="space-y-4">
             <div className="flex items-center gap-3 px-2">
               <ShieldAlert size={18} className="text-rose-500" />
               <h3 className={`text-sm font-black uppercase tracking-widest ${styles.textMuted}`}>{t.criticalItems}</h3>
             </div>
             <div className="space-y-3">
               {safeProducts.filter(p => p.currentStock <= p.minThreshold).slice(0, 4).map(p => (
                 <motion.div 
                  key={p.id}
                  whileHover={{ x: isRTL ? -4 : 4 }}
                  className={`p-4 rounded-2xl ${theme === 'light' ? 'bg-rose-50 border-rose-100' : 'bg-rose-500/5 border-rose-500/10'} border flex items-center justify-between gap-4`}
                 >
                   <div className="flex items-center gap-3">
                     <AlertTriangle size={16} className="text-rose-500 shrink-0" />
                     <div className="text-start">
                       <p className={`text-xs font-bold ${styles.text} line-clamp-1`}>{p.name}</p>
                       <p className="text-[10px] text-rose-500/60 font-black font-mono">מלאי: {p.currentStock}</p>
                     </div>
                   </div>
                   <button 
                    onClick={() => handleStockAdjust(p, 5)} // Quick restock 5 items
                    disabled={updatingId === p.id}
                    className={`p-1.5 rounded-lg bg-rose-500 text-white shadow-lg hover:bg-rose-600 transition-all disabled:opacity-50`}
                   >
                     {updatingId === p.id ? <Clock size={12} className="animate-spin" /> : <Plus size={12} />}
                   </button>
                 </motion.div>
                ))}
               {stats.lowStockCount === 0 && (
                 <div className="py-8 text-center border border-dashed rounded-2xl opacity-20">
                     <CheckCircle2 size={32} className="mx-auto mb-2" />
                     <p className="text-[10px] font-black uppercase tracking-widest">מלאי תקין</p>
                 </div>
               )}
             </div>
           </section>

           {/* Suppliers Quick List */}
           <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <Truck size={18} className="text-blue-500" />
                  <h3 className={`text-sm font-black uppercase tracking-widest ${styles.textMuted}`}>{t.suppliers}</h3>
                </div>
                <button className="text-[10px] font-black text-primary hover:underline transition-all">הצג הכל</button>
              </div>
              <div className="space-y-3">
                {safeSuppliers.length === 0 ? (
                  <div className="py-8 text-center border border-dashed rounded-2xl opacity-20">
                     <Truck size={32} className="mx-auto mb-2" />
                     <p className="text-[10px] font-black uppercase tracking-widest">אין ספקים מחוברים</p>
                  </div>
                ) : (
                  safeSuppliers.slice(0, 3).map(s => (
                    <div key={s.id} className={`p-4 rounded-2xl ${styles.card} group`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-start">
                           <h5 className={`text-sm font-black ${styles.text}`}>{s.name}</h5>
                           <p className={`text-[10px] ${styles.textMuted} font-bold`}>{s.contactName}</p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                          <Clock size={10} />
                          <span>{s.leadTimeDays} ימים</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap mt-3">
                        {(s.categories || []).slice(0, 2).map(c => (
                          <span key={c} className={`text-[8px] font-bold py-0.5 px-2 rounded-full ${theme === 'light' ? 'bg-black/5' : 'bg-white/5'} border border-white/5`}>{c}</span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
           </section>
        </div>
      </div>

      {/* 4. DRAWER DIALOG OVERLAYS (Widget Editor) */}
      <AnimatePresence>
        {isWidgetEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWidgetEditorOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[#030712] rounded-[40px] shadow-2xl border border-white/10 overflow-hidden z-10 max-h-[90vh] flex flex-col"
            >
              <WidgetCustomizer
                configs={widgets}
                onConfigsChange={handleWidgetsChange}
                currencySymbol={currencySymbol}
                onCurrencyChange={handleCurrencyChange}
                theme={theme}
                isRTL={isRTL}
                onClose={() => setIsWidgetEditorOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. DRAWER DIALOG OVERLAYS (Image Captioning Studio) */}
      <AnimatePresence>
        {isImageStudioOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImageStudioOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl bg-[#030712] rounded-[40px] shadow-2xl border border-white/10 overflow-hidden z-10 max-h-[90vh] flex flex-col"
            >
              <ImageCaptionStudio
                products={safeProducts}
                onInventoryUpdate={(t, data) => {
                  if (onInventoryUpdate) {
                    onInventoryUpdate(t, data);
                  }
                }}
                theme={theme}
                isRTL={isRTL}
                onClose={() => setIsImageStudioOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
