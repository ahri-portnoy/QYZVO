import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, Check, Eye, EyeOff, LayoutGrid, RotateCcw, Plus, Trash2, 
  HelpCircle, ChevronDown, Award, Sparkles, DollarSign, MoveUp, MoveDown, Brush, X
} from 'lucide-react';

export interface WidgetConfig {
  id: string;
  label: string;
  type: 'total_value' | 'low_stock' | 'out_of_stock' | 'suppliers' | 'burn_rate' | 'dead_stock' | 'target_fill' | 'recent_actions';
  visible: boolean;
  color: 'emerald' | 'amber' | 'rose' | 'blue' | 'purple' | 'gold' | 'cyan' | 'slate';
  targetValue?: number; // Custom metric configuration line
  customIcon?: string;
}

interface WidgetCustomizerProps {
  configs: WidgetConfig[];
  onConfigsChange: (newConfigs: WidgetConfig[]) => void;
  currencySymbol: string;
  onCurrencyChange: (currency: string) => void;
  theme: 'dark' | 'light';
  isRTL: boolean;
  onClose?: () => void;
}

export const WidgetCustomizer: React.FC<WidgetCustomizerProps> = ({
  configs,
  onConfigsChange,
  currencySymbol,
  onCurrencyChange,
  theme,
  isRTL,
  onClose
}) => {
  const [addingNew, setAddingNew] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<WidgetConfig['type']>('burn_rate');
  const [newColor, setNewColor] = useState<WidgetConfig['color']>('purple');

  const isLight = theme === 'light';

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= configs.length) return;

    const result = [...configs];
    const [removed] = result.splice(index, 1);
    result.splice(targetIdx, 0, removed);
    onConfigsChange(result);
  };

  const toggleVisibility = (id: string) => {
    onConfigsChange(configs.map(w => 
      w.id === id ? { ...w, visible: !w.visible } : w
    ));
  };

  const updateWidgetColor = (id: string, color: WidgetConfig['color']) => {
    onConfigsChange(configs.map(w => 
      w.id === id ? { ...w, color } : w
    ));
  };

  const updateWidgetTarget = (id: string, value: number) => {
    onConfigsChange(configs.map(w => 
      w.id === id ? { ...w, targetValue: Math.max(0, value) } : w
    ));
  };

  const handleAddNewWidget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const newWidget: WidgetConfig = {
      id: 'custom_' + Date.now(),
      label: newLabel,
      type: newType,
      visible: true,
      color: newColor,
      targetValue: newType === 'target_fill' ? 10000 : undefined
    };

    onConfigsChange([...configs, newWidget]);
    setNewLabel('');
    setAddingNew(false);
  };

  const handleRemoveWidget = (id: string) => {
    // Only allow removing custom added ones, not core templates
    if (['total_value', 'low_stock', 'out_of_stock', 'suppliers'].includes(id)) {
      alert('לא ניתן למחוק פאנל ליבה מקורי, אך ניתן להסתיר אותו בלחיצה על עין סגורה.');
      return;
    }
    onConfigsChange(configs.filter(w => w.id !== id));
  };

  const resetToDefault = () => {
    const defaultWebWidgets: WidgetConfig[] = [
      { id: 'total_value', label: 'ערך מלאי כולל', type: 'total_value', visible: true, color: 'emerald' },
      { id: 'low_stock', label: 'במלאי נמוך', type: 'low_stock', visible: true, color: 'amber' },
      { id: 'out_of_stock', label: 'אזל מהמלאי', type: 'out_of_stock', visible: true, color: 'rose' },
      { id: 'suppliers', label: 'ספקים פעילים', type: 'suppliers', visible: true, color: 'blue' },
    ];
    onConfigsChange(defaultWebWidgets);
    onCurrencyChange('$');
  };

  const t = {
    title: 'ניהול והתאמת וידגטים',
    subtitle: 'שנה סגנון, הוסף מדדים משלימים ושלוט בתצוגת המלאי שלך',
    currency: 'מטבע תצוגה',
    reset: 'החזר לברירת מחדל',
    addWidget: 'הוסף מדד חדש',
    dragTip: 'שנה את הסדר באמצעות כפתורי החצים',
    cardLabel: 'שם המדד',
    cardType: 'סוג חישוב המדד',
    cardColor: 'צבע נוכחי',
    targetVal: 'ערך יעד',
  };

  const colorVariants: Record<WidgetConfig['color'], string> = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    gold: 'bg-yellow-600',
    cyan: 'bg-cyan-500',
    slate: 'bg-slate-500'
  };

  return (
    <div className={`p-6 md:p-8 rounded-[40px] border ${
      isLight ? 'bg-white border-black/5 shadow-xl' : 'bg-[#04081c]/90 border-white/10 shadow-2xl backdrop-blur-3xl'
    } w-full relative h-full flex flex-col md:overflow-hidden text-start`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-5 mb-6 border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
            <LayoutGrid size={20} />
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

      <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
        
        {/* Core Global Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Currency configuration */}
          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-black/5' : 'bg-white/5 border-white/5'} flex items-center justify-between`}>
            <div>
              <span className="text-[10px] font-black uppercase text-white/40 tracking-wider block mb-1">{t.currency}</span>
              <span className={`text-xs font-bold ${isLight ? 'text-black/70' : 'text-white/80'}`}>סימון כספי בלוח הבקרה</span>
            </div>
            <select
              value={currencySymbol}
              onChange={(e) => onCurrencyChange(e.target.value)}
              className={`py-1.5 px-3 text-xs font-bold rounded-xl border focus:outline-none ${isLight ? 'bg-white text-slate-900 border-black/15' : 'bg-slate-950 text-slate-200 border-white/10'}`}
            >
              <option value="$">US Dollar ($)</option>
              <option value="₪">שקל חדש (₪)</option>
              <option value="€">Euro (€)</option>
              <option value="£">Pound (£)</option>
            </select>
          </div>

          {/* Quick reset option */}
          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-black/5' : 'bg-white/5 border-white/5'} flex items-center justify-between`}>
            <div>
              <span className="text-[10px] font-black uppercase text-white/40 tracking-wider block mb-1">אתחול פריסה</span>
              <span className={`text-xs font-bold ${isLight ? 'text-black/70' : 'text-white/80'}`}>סנכרון חזרה לעיצוב המקורי</span>
            </div>
            <button
              onClick={resetToDefault}
              className={`py-2 px-4 rounded-xl text-xs font-bold tracking-tight bg-rose-500/10 text-rose-500 border border-rose-500/15 hover:bg-rose-500/20 active:scale-95 transition-all flex items-center gap-1.5`}
            >
              <RotateCcw size={13} />
              {t.reset}
            </button>
          </div>
        </div>

        {/* List of Widgets Configured */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-primary tracking-widest">מבנה ורכיבי סיכום פעילים ({configs.length})</span>
            <span className={`text-[10px] ${isLight ? 'text-black/40' : 'text-white/30'}`}>{t.dragTip}</span>
          </div>

          <div className="space-y-2.5">
            {configs.map((widget, i) => {
              const bgBadgeClass = colorVariants[widget.color] || 'bg-primary';
              const isCore = ['total_value', 'low_stock', 'out_of_stock', 'suppliers'].includes(widget.id);

              return (
                <div 
                  key={widget.id}
                  className={`p-4 rounded-2xl border ${
                    widget.visible ? (isLight ? 'bg-white border-black/10' : 'bg-white/[0.04] border-white/15 shadow-sm') : 'opacity-50 bg-black/5 border-dashed border-white/5'
                  } flex items-center justify-between gap-4 transition-all hover:bg-primary/[0.01]`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Visual representation ball / status */}
                    <div className={`w-3.5 h-3.5 rounded-full ${bgBadgeClass}`} />
                    
                    <div className="text-start min-w-0">
                      <p className={`text-xs font-bold truncate ${isLight ? 'text-black' : 'text-white'}`}>{widget.label}</p>
                      <p className={`text-[9px] ${isLight ? 'text-slate-400' : 'text-white/30'} font-mono uppercase`}>
                        {widget.type} • {isCore ? 'Core Metric' : 'Custom Added'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Controller adjustments */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Custom Metric values configuration */}
                    {widget.type === 'target_fill' && (
                      <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10 shrink-0">
                        <span className="text-[9px] font-mono text-white/50">{t.targetVal}:</span>
                        <input
                          type="number"
                          value={widget.targetValue || 0}
                          onChange={(e) => updateWidgetTarget(widget.id, Number(e.target.value))}
                          className="w-14 bg-transparent outline-none border-b border-primary text-xs text-primary font-bold font-mono text-center"
                        />
                      </div>
                    )}

                    {/* Color picker box */}
                    <div className="flex gap-1">
                      {(['emerald', 'amber', 'rose', 'blue', 'gold', 'slate'] as WidgetConfig['color'][]).map(col => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => updateWidgetColor(widget.id, col)}
                          className={`w-3 h-3 rounded-full ${colorVariants[col]} ${widget.color === col ? 'ring-2 ring-primary scale-110' : 'opacity-60 hover:opacity-100'}`}
                        />
                      ))}
                    </div>

                    {/* Layout modifiers */}
                    <div className="flex items-center border-s border-white/10 ps-3 gap-1">
                      <button
                        onClick={() => moveWidget(i, 'up')}
                        disabled={i === 0}
                        className={`p-1 hover:bg-white/5 rounded text-white/40 hover:text-white disabled:opacity-20`}
                        title="הזז מעלה"
                      >
                        <MoveUp size={13} />
                      </button>
                      <button
                        onClick={() => moveWidget(i, 'down')}
                        disabled={i === configs.length - 1}
                        className={`p-1 hover:bg-white/5 rounded text-white/40 hover:text-white disabled:opacity-20`}
                        title="הזז מטה"
                      >
                        <MoveDown size={13} />
                      </button>

                      <button
                        onClick={() => toggleVisibility(widget.id)}
                        className={`p-1.5 rounded transition-colors ${widget.visible ? 'text-primary/70 hover:text-primary bg-primary/5' : 'text-slate-500 hover:text-white'}`}
                        title={widget.visible ? 'הסתר פריט' : 'הצג פריט'}
                      >
                        {widget.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>

                      {!isCore && (
                        <button
                          onClick={() => handleRemoveWidget(widget.id)}
                          className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded transition-colors"
                          title="מחק מדד"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modular Adding New widget drawer panel */}
        <AnimatePresence>
          {addingNew ? (
            <motion.form 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleAddNewWidget}
              className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-black/10' : 'bg-slate-950 border-white/10'} space-y-3 p-4 overflow-hidden text-start`}
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-xs font-black uppercase text-primary tracking-wider">{t.addWidget}</span>
                <button type="button" onClick={() => setAddingNew(false)} className={`text-[10px] ${isLight ? 'text-black/50 hover:text-black' : 'text-white/40 hover:text-white'}`}>ביטול</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 font-bold">{t.cardLabel}</label>
                  <input
                    type="text"
                    required
                    placeholder="קבוצה או כותרת מדד..."
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className={`w-full py-2 px-3 text-xs rounded-xl focus:outline-none border ${isLight ? 'bg-white text-black border-black/15' : 'bg-slate-900 border-white/10 text-white'}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 font-bold">{t.cardType}</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className={`w-full py-2 px-3 text-xs font-bold rounded-xl border focus:outline-none ${isLight ? 'bg-white text-black border-black/15' : 'bg-slate-900 border-white/10'}`}
                  >
                    <option value="burn_rate">ממוצע קצב צריכה יומי</option>
                    <option value="dead_stock">כמות מלאי מת (ללא שימוש)</option>
                    <option value="target_fill">ערך מלאי מבוקש (Target)</option>
                    <option value="recent_actions">פעולות רכב אחרונות</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 font-bold">צבע תגית</label>
                  <select
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value as any)}
                    className={`w-full py-2 px-3 text-xs font-bold rounded-xl border focus:outline-none ${isLight ? 'bg-white text-black border-black/15' : 'bg-slate-900 border-white/10'}`}
                  >
                    <option value="purple">סגול ניאון</option>
                    <option value="cyan">טורקיז (Cyan)</option>
                    <option value="slate">אפור פלדה</option>
                    <option value="gold">זהב כהה</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-primary text-black text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all text-center flex items-center justify-center gap-1.5 shadow-lg"
              >
                <Plus size={14} />
                שמור והוסף ללוח
              </button>
            </motion.form>
          ) : (
            <button
              onClick={() => setAddingNew(true)}
              className={`w-full py-4 rounded-2xl border-2 border-dashed ${isLight ? 'border-black/10 bg-slate-50 hover:bg-slate-100 text-slate-800' : 'border-white/10 bg-white/[0.01] hover:bg-white/[0.04] text-white/70'} flex items-center justify-center gap-2 text-xs font-bold transition-all hover:border-primary/30`}
            >
              <Plus size={16} />
              {t.addWidget}
            </button>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};
