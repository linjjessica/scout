"use client";

import { useState, useEffect } from "react";
import { CreditCard, Plus, Trash2, Save, X, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CardRule, CARDS } from "@/lib/analysis";

const COMMON_CATEGORIES = [
  "FOOD AND DRINK",
  "GROCERIES",
  "TRAVEL",
  "GAS STATION",
  "SERVICE", 
  "SHOPS",
  "ENTERTAINMENT",
  "HEALTHCARE",
  "TRANSPORT"
];

const TRUSTED_PROVIDERS = [
  "Chase", "Amex", "Discover", "Capital One", "Citi", "Wells Fargo", "Bank of America", "US Bank", "Apple", "Other"
];

export default function CustomCardsPage() {
  const [customCards, setCustomCards] = useState<CardRule[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Form State
  const [provider, setProvider] = useState("Chase");
  const [cardName, setCardName] = useState("");
  const [defaultRate, setDefaultRate] = useState("1");
  const [categories, setCategories] = useState<{name: string, rate: string}[]>([{ name: COMMON_CATEGORIES[0], rate: "3" }]);

  useEffect(() => {
    const customCardsData = localStorage.getItem('scout_custom_cards');
    if (customCardsData) {
      setCustomCards(JSON.parse(customCardsData));
    }
  }, []);

  const saveCustomCards = (newCards: CardRule[]) => {
    setCustomCards(newCards);
    localStorage.setItem('scout_custom_cards', JSON.stringify(newCards));
  };

  const deleteCard = (index: number) => {
    const newCards = [...customCards];
    newCards.splice(index, 1);
    saveCustomCards(newCards);
  };

  const handleAddCategory = () => {
    setCategories([...categories, { name: COMMON_CATEGORIES[0], rate: "2" }]);
  };

  const handleCategoryChange = (index: number, field: 'name' | 'rate', value: string) => {
    const newCategories = [...categories];
    newCategories[index][field] = value;
    setCategories(newCategories);
  };

  const handleRemoveCategory = (index: number) => {
    const newCategories = [...categories];
    newCategories.splice(index, 1);
    setCategories(newCategories);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct the formatted CardRule
    const formattedCardName = provider === "Other" ? cardName : `${provider} ${cardName}`;
    
    // Convert percentages to decimals
    const parsedDefaultRate = parseFloat(defaultRate) / 100;
    
    const categoriesMap: { [key: string]: number } = {};
    categories.forEach(cat => {
      if (cat.name && cat.rate) {
         categoriesMap[cat.name] = parseFloat(cat.rate) / 100;
      }
    });

    const newCard: CardRule = {
      cardName: formattedCardName.trim(),
      categories: categoriesMap,
      defaultRate: isNaN(parsedDefaultRate) ? 0.01 : parsedDefaultRate
    };

    saveCustomCards([...customCards, newCard]);
    
    // Reset
    setIsFormOpen(false);
    setProvider("Chase");
    setCardName("");
    setDefaultRate("1");
    setCategories([{ name: COMMON_CATEGORIES[0], rate: "3" }]);
  };

  return (
    <div className="space-y-16 pb-20">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div>
          <h1 className="text-5xl font-semibold text-black tracking-tight">Your Custom Wallet</h1>
          <p className="text-neutral-500 mt-2 text-lg">Define specific cashback rates for cards that aren't in our database.</p>
         </div>
         <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-semibold text-sm uppercase tracking-widest transition-all shadow-lg"
          >
            {isFormOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {isFormOpen ? 'Cancel' : 'Add Custom Card'}
          </button>
       </div>

       {isFormOpen && (
         <div className="apple-glass p-8 rounded-[2rem] animate-in fade-in slide-in-from-top-4 duration-500">
           <h2 className="text-2xl font-bold text-neutral-900 mb-6">Create Custom Card Context</h2>
           <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Provider</label>
                  <select 
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full bg-white/50 border border-black/10 rounded-xl px-4 py-3 text-black font-medium focus:outline-none focus:ring-2 focus:ring-black/5"
                  >
                    {TRUSTED_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Card Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder={provider === "Chase" ? "Sapphire Reserve" : "My Credit Card"}
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full bg-white/50 border border-black/10 rounded-xl px-4 py-3 text-black font-medium focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Default Base Rate (%)</label>
                 <div className="relative w-1/3">
                    <input 
                      required
                      type="number" 
                      step="0.1"
                      min="0"
                      value={defaultRate}
                      onChange={(e) => setDefaultRate(e.target.value)}
                      className="w-full bg-white/50 border border-black/10 rounded-xl px-4 py-3 text-black font-medium focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">%</span>
                 </div>
                 <p className="text-xs text-neutral-400">The "catch-all" cashback rate for un-categorized purchases.</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-black/5">
                 <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Specialized Categories</label>
                 {categories.map((cat, i) => (
                   <div key={i} className="flex items-center gap-4">
                      <select 
                        value={cat.name}
                        onChange={(e) => handleCategoryChange(i, 'name', e.target.value)}
                        className="flex-1 bg-white/50 border border-black/10 rounded-xl px-4 py-3 text-black font-medium focus:outline-none focus:ring-2 focus:ring-black/5"
                      >
                        {COMMON_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      
                      <div className="relative w-32">
                        <input 
                          required
                          type="number" 
                          step="0.1"
                          min="0"
                          value={cat.rate}
                          onChange={(e) => handleCategoryChange(i, 'rate', e.target.value)}
                          className="w-full bg-white/50 border border-black/10 rounded-xl px-4 py-3 text-black font-medium focus:outline-none focus:ring-2 focus:ring-black/5"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">%</span>
                      </div>
                      
                      <button type="button" onClick={() => handleRemoveCategory(i)} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                   </div>
                 ))}
                 
                 <button type="button" onClick={handleAddCategory} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors">
                   <Plus className="w-4 h-4" /> Add Category Rate
                 </button>
              </div>

              <div className="pt-6 border-t border-black/5 flex justify-end">
                 <button type="submit" className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-widest transition-all shadow-md">
                   <Save className="w-5 h-5" />
                   Save Custom Card
                 </button>
              </div>

           </form>
         </div>
       )}

       <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
         {customCards.length === 0 ? (
           <div className="md:col-span-2 lg:col-span-3 py-20 bg-white/40 border border-white/60 rounded-[2.5rem] shadow-inner text-center">
             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-neutral-100">
               <CreditCard className="w-7 h-7 text-neutral-300" />
             </div>
             <p className="text-neutral-900 font-bold text-lg mb-2 tracking-tight">No Custom Cards Added</p>
             <p className="text-neutral-500 max-w-sm mx-auto">Scout will use its default database of standard cards until you override them here.</p>
           </div>
         ) : customCards.map((card, idx) => (
           <div key={idx} className="apple-glass p-8 rounded-[2rem] relative group border border-white/80">
              <button 
                onClick={() => deleteCard(idx)}
                className="absolute top-6 right-6 p-2 bg-rose-50 text-rose-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-100"
              >
                 <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center mb-6 shadow-md">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-black tracking-tight mb-6">{card.cardName}</h3>
              
              <div className="space-y-3">
                 <div className="flex items-center justify-between pb-3 border-b border-black/5">
                   <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Base Rate</span>
                   <span className="text-sm font-bold text-black tabular-nums">{(card.defaultRate * 100).toFixed(1)}%</span>
                 </div>
                 
                 {Object.entries(card.categories).map(([cat, rate]) => (
                   <div key={cat} className="flex items-center justify-between pb-3 border-b border-black/5 last:border-0 last:pb-0">
                     <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest truncate mr-4">{cat}</span>
                     <span className="text-sm font-bold text-emerald-600 tabular-nums">{(rate * 100).toFixed(1)}%</span>
                   </div>
                 ))}
              </div>
           </div>
         ))}
       </div>
    </div>
  );
}
