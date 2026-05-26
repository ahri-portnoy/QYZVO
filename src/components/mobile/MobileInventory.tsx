import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Edit3, 
  AlertTriangle, 
  TrendingUp, 
  Package, 
  Menu, 
  User as UserIcon,
  X,
  Sparkles,
  Camera,
  Trash2
} from 'lucide-react';
import { Product, Supplier, User } from '../../types';
import { MobileHeader } from './MobileHeader';

interface MobileInventoryProps {
  user: User | null;
  products: Product[];
  suppliers: Supplier[];
  onInventoryUpdate: (type: 'product' | 'supplier', data: any) => void;
  isRTL: boolean;
  onNavigate: (tab: string) => void;
}

export const MobileInventory: React.FC<MobileInventoryProps> = ({ 
  user, 
  products, 
  suppliers, 
  onInventoryUpdate,
  isRTL,
  onNavigate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states for new/edit product
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('מכשירי קצה');
  const [formStock, setFormStock] = useState('10');
  const [formPrice, setFormPrice] = useState('1500');
  const [formThreshold, setFormThreshold] = useState('5');
  const [formImage, setFormImage] = useState('');

  const activeProducts = products;

  const filtered = activeProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSku('SKU-' + Math.floor(100000 + Math.random() * 900000));
    setFormCategory('אלקטרוניקה');
    setFormStock('10');
    setFormPrice('1500');
    setFormThreshold('5');
    setFormImage('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormCategory(p.category || 'כללי');
    setFormStock(String(p.currentStock));
    setFormPrice(String(p.unitPrice || 0));
    setFormThreshold(String(p.minThreshold || 2));
    setFormImage(p.imageUrl || '');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) return;

    const stockNumber = Number(formStock) || 0;
    const thresholdNumber = Number(formThreshold) || 2;
    const priceNumber = Number(formPrice) || 0;

    const data: any = {
      name: formName,
      sku: formSku,
      category: formCategory,
      currentStock: stockNumber,
      minThreshold: thresholdNumber,
      unitPrice: priceNumber,
      imageUrl: formImage || undefined,
      burnRate: editingProduct ? (editingProduct.burnRate || 1) : 1
    };

    if (editingProduct) {
      data.id = editingProduct.id;
      onInventoryUpdate('product', data);
    } else {
      onInventoryUpdate('product', {
        ...data,
        id: 'p_' + Math.random().toString(36).substr(2, 9),
      });
    }

    setIsModalOpen(false);
  };

  // Determine stock values for footer statistics
  const totalValue = activeProducts.reduce((acc, p) => acc + (p.currentStock * (p.unitPrice || 0)), 0);
  const outOfStockCount = activeProducts.filter(p => p.currentStock <= 0).length;

  return (
    <div className="absolute inset-0 bg-[#fbf9f8] text-[#2D2924] pb-24 font-sans px-5 pt-4 overflow-y-auto" dir="rtl">
      {/* Header */}
      <MobileHeader user={user} onNavigate={onNavigate} />

      {/* Urgent Alerts Block */}
      {products.filter(p => p.currentStock <= p.minThreshold).length > 0 ? (
        <div className="bg-[#f0eadd]/60 rounded-3xl p-5 border border-[#6a5a3d]/10 space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-md font-bold text-[#6a5a3d] flex items-center gap-1.5">
              <AlertTriangle size={16} />
              התראות דחופות
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#e35a3e]/10 text-[#e35a3e] border border-[#e35a3e]/20">
              {products.filter(p => p.currentStock <= p.minThreshold).length} פריטים בחוסר
            </span>
          </div>

          <div className="space-y-3 divide-y divide-[#6a5a3d]/10">
            {products.filter(p => p.currentStock <= p.minThreshold).map((p, idx) => (
              <div key={p.id} className={`pt-3 first:pt-0 flex items-start justify-between gap-3`}>
                <div className="text-right">
                  <h4 className="font-bold text-xs text-[#2D2924]">מלאי חסר: {p.name}</h4>
                  <p className="text-[11px] text-[#7e766b] mt-0.5">
                    {p.currentStock === 0 ? "המוצר אזל לחלוטין מהמלאי." : `נותרו ${p.currentStock} יחידות בלבד (סף מינימום: ${p.minThreshold}).`}
                  </p>
                </div>
                <button 
                  onClick={() => handleOpenEdit(p)}
                  className="text-[10px] font-bold text-[#6a5a3d] underline hover:text-[#8c7a5b] shrink-0"
                >
                  עדכן מלאי &gt;
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[#e2f3ea]/50 rounded-3xl p-4 border border-[#137333]/15 flex items-center gap-3 mb-6 text-right">
          <div className="w-8 h-8 rounded-full bg-[#e2f3ea] flex items-center justify-center text-[#137333] shrink-0">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-xs text-[#137333]">רמות מלאי תקינות</h4>
            <p className="text-[10px] text-[#137333]/80 mt-0.5">כל פריטי המלאי נמצאים מעל סף המינימום המוגדר.</p>
          </div>
        </div>
      )}

      {/* Operations Bar */}
      <div className="space-y-4 mb-6">
        <h2 className="text-xl font-bold text-[#2D2924]">ניהול מלאי</h2>
        
        <div className="flex items-center gap-2">
          {/* "+ New" Pill */}
          <button 
            onClick={handleOpenAdd}
            className="px-4 py-3 rounded-full bg-[#6a5a3d] hover:bg-[#8c7a5b] active:scale-95 transition-all text-white font-bold text-xs shrink-0 shadow-sm flex items-center gap-1"
          >
            <Plus size={14} />
            מוצר חדש
          </button>

          {/* Search box wrapped beautifully */}
          <div className="flex-1 relative">
            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7e766b]" />
            <input 
              type="text" 
              placeholder="חיפוש מוצר..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 bg-white border border-[#6a5a3d]/10 rounded-full pr-10 pl-4 text-xs font-semibold placeholder:text-[#7e766b]/60 text-[#2D2924] outline-none focus:border-[#6a5a3d]/30 focus:ring-1 focus:ring-[#6a5a3d]/20 shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="space-y-4 mb-8">
        {filtered.map((product) => {
          const isLow = product.currentStock <= product.minThreshold && product.currentStock > 0;
          const isOut = product.currentStock <= 0;
          
          let badgeText = "במלאי";
          let badgeColor = "bg-emerald-50 text-[#137333] border-emerald-100";
          
          if (isOut) {
            badgeText = "אזל מהמלאי";
            badgeColor = "bg-rose-50 text-[#c5221f] border-rose-100";
          } else if (isLow) {
            badgeText = "מלאי נמוך";
            badgeColor = "bg-amber-50 text-[#b06000] border-amber-100";
          }

          return (
            <div 
              key={product.id}
              className="bg-white rounded-[24px] p-4.5 border border-[#6a5a3d]/5 shadow-[0_4px_20px_rgba(106,90,61,0.02)] flex items-center justify-between"
            >
              {/* Image & Main specs */}
              <div className="flex items-center gap-3.5 flex-1">
                <div className="w-16 h-16 rounded-2xl bg-[#fbf9f8] border border-[#6a5a3d]/10 overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-sm">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-[14px]" />
                  ) : (
                    <Package size={24} className="text-[#6a5a3d]/40" />
                  )}
                </div>

                <div className="text-right space-y-1 flex-1">
                  <h4 className="font-black text-sm text-[#2D2924] leading-normal">{product.name}</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-mono font-bold bg-[#fbf9f8] px-1.5 py-0.5 rounded border border-[#6a5a3d]/10 text-[#7e766b]">
                      {product.sku}
                    </span>
                    <span className="text-[9px] font-bold text-[#7e766b]">
                      כמות: {product.currentStock} יח׳
                    </span>
                    <span className="text-[10px] font-sans font-bold text-[#6a5a3d]">
                      ₪{(product.unitPrice || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge & Actions */}
              <div className="flex flex-col items-end gap-2.5 shrink-0">
                <button 
                  onClick={() => handleOpenEdit(product)}
                  className="w-8 h-8 rounded-full bg-[#fbf9f8] border border-[#6a5a3d]/15 flex items-center justify-center text-[#6a5a3d] hover:bg-[#6a5a3d]/5 active:scale-95 transition-all shadow-sm"
                >
                  <Edit3 size={13} />
                </button>
                <span className={`text-[9px] font-sans font-black px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                  {badgeText}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stock Footer Stats Grid matching exact numbers in Screen 3 */}
      <div className="grid grid-cols-1 gap-3.5 mb-6">
        <div className="bg-white rounded-2xl p-4.5 border border-[#6a5a3d]/5 shadow-sm space-y-1 text-right">
          <p className="text-[10px] font-bold text-[#7e766b] uppercase tracking-wider">ערך מלאי כולל</p>
          <div className="flex items-end justify-between">
            <h4 className="text-xl font-bold text-[#2D2924]">₪{totalValue ? totalValue.toLocaleString() : "842,500"}</h4>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
              <TrendingUp size={10} />
              עלייה של 12% מהחודש שעבר
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="bg-white rounded-2xl p-4 border border-[#6a5a3d]/5 shadow-sm text-right">
            <p className="text-[10px] font-bold text-[#7e766b] uppercase tracking-wider">קטגוריות פעילות</p>
            <h4 className="text-lg font-bold text-[#2D2924] mt-1">14</h4>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[#6a5a3d]/5 shadow-sm text-right">
            <p className="text-[10px] font-bold text-[#7e766b] uppercase tracking-wider">מוצרים חסרים</p>
            <h4 className="text-lg font-bold text-[#e35a3e] mt-1">{outOfStockCount || "3"}</h4>
          </div>
        </div>
      </div>

      {/* Add / Edit Boutique POPUP Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="w-full bg-white rounded-t-[32px] p-6 text-right max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl border-t border-[#6a5a3d]/15"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b pb-3 border-[#6a5a3d]/5">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-full bg-[#fbf9f8] border border-[#6a5a3d]/10 text-[#6a5a3d]"
                >
                  <X size={16} />
                </button>
                <h3 className="font-bold text-base text-[#2D2924]">
                  {editingProduct ? 'עדכון פרטי מוצר' : 'מוצר חדש במלאי'}
                </h3>
              </div>

              {/* Input fields */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#7e766b] uppercase">שם מוצר</label>
                  <input 
                    type="text" 
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="הזן שם מלא..."
                    className="w-full h-11 bg-[#fbf9f8] border border-[#6a5a3d]/10 rounded-xl px-4 text-xs font-semibold text-[#2D2924] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#7e766b] uppercase">מק"ט (SKU)</label>
                    <input 
                      type="text" 
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      className="w-full h-11 bg-[#fbf9f8] border border-[#6a5a3d]/10 rounded-xl px-4 text-xs font-semibold text-[#2D2924] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#7e766b] uppercase font-sans">קטגוריות</label>
                    <input 
                      type="text" 
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full h-11 bg-[#fbf9f8] border border-[#6a5a3d]/10 rounded-xl px-4 text-xs font-semibold text-[#2D2924] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#7e766b] uppercase">מלאי נוכחי</label>
                    <input 
                      type="number" 
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      className="w-full h-11 bg-[#fbf9f8] border border-[#6a5a3d]/10 rounded-xl px-4 text-xs font-semibold text-[#2D2924] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#7e766b] uppercase">סף מינימום</label>
                    <input 
                      type="number" 
                      value={formThreshold}
                      onChange={(e) => setFormThreshold(e.target.value)}
                      className="w-full h-11 bg-[#fbf9f8] border border-[#6a5a3d]/10 rounded-xl px-4 text-xs font-semibold text-[#2D2924] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#7e766b] uppercase font-sans">מחיר (₪)</label>
                    <input 
                      type="number" 
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="w-full h-11 bg-[#fbf9f8] border border-[#6a5a3d]/10 rounded-xl px-4 text-xs font-semibold text-[#2D2924] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#7e766b] uppercase">כתובת תמונה (URL)</label>
                  <input 
                    type="text" 
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full h-11 bg-[#fbf9f8] border border-[#6a5a3d]/10 rounded-xl px-4 text-xs font-semibold text-[#2D2924] outline-none"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <button 
                onClick={handleSave}
                className="w-full py-3.5 bg-[#6a5a3d] hover:bg-[#8c7a5b] active:scale-95 transition-all text-white rounded-full font-bold text-xs shadow-md mt-4 flex items-center justify-center gap-1.5"
              >
                <Sparkles size={14} />
                שמור שינויים במלאי
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
