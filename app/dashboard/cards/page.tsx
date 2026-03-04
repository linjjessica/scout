"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PlaidLink from "@/components/plaid-link";
import { CreditCard, Plus, Trash2, Save, X, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { CardRule, CARDS, findDBProps } from "@/lib/analysis";
import { getCategoryStyle } from "@/lib/categories";

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
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [userCardNames, setUserCardNames] = useState<string[]>([]);
  const [accountMappings, setAccountMappings] = useState<Record<string, string>>({});
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  
  // Form State
  const [provider, setProvider] = useState("Chase");
  const [cardName, setCardName] = useState("");
  const [defaultRate, setDefaultRate] = useState("1");
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  
  // Inline editing state for connected accounts
  const [inlineEditingAccountId, setInlineEditingAccountId] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState("");
  const [categories, setCategories] = useState<{name: string, rate: string}[]>([{ name: COMMON_CATEGORIES[0], rate: "3" }]);

  useEffect(() => {
    const customCardsData = localStorage.getItem('scout_custom_cards');
    if (customCardsData) {
      setCustomCards(JSON.parse(customCardsData));
    }
    const mappingsData = localStorage.getItem('scout_account_mappings');
    if (mappingsData) {
      setAccountMappings(JSON.parse(mappingsData));
    }
    
    // Load institutions from the cache first
    const cachedData = localStorage.getItem('scout_transactions_cache');
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      if (parsed.institutions) {
        setInstitutions(parsed.institutions);
      }
      if (parsed.userCardNames) {
        setUserCardNames(parsed.userCardNames);
      }
      setLoadingAccounts(false);
    } else {
      // If no cache, fetch directly
      fetch('/api/plaid/transactions')
        .then(r => r.json())
        .then(data => {
          if (data.institutions) setInstitutions(data.institutions);
          if (data.userCardNames) setUserCardNames(data.userCardNames);
          localStorage.setItem('scout_transactions_cache', JSON.stringify(data));
        })
        .finally(() => setLoadingAccounts(false));
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
    const finalCardName = provider === "Other" ? cardName : `${provider} ${cardName}`;
    const formattedCardName = finalCardName.trim();
    
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
    
    if (editingAccountId) {
      const newMappings = { ...accountMappings, [editingAccountId]: formattedCardName.trim() };
      setAccountMappings(newMappings);
      localStorage.setItem('scout_account_mappings', JSON.stringify(newMappings));
    }
    
    // Reset
    setIsFormOpen(false);
    setEditingAccountId(null);
    setProvider("Chase");
    setCardName("");
    setDefaultRate("1");
    setCategories([{ name: COMMON_CATEGORIES[0], rate: "3" }]);
  };

  const handleInlineEditStart = (acc: any) => {
    setInlineEditingAccountId(acc.account_id);
    setInlineEditValue(accountMappings[acc.account_id] || acc.name);
  };

  const handleInlineEditSave = (accId: string) => {
    if (inlineEditValue.trim() === "") return;
    
    const newMappings = { ...accountMappings, [accId]: inlineEditValue.trim() };
    setAccountMappings(newMappings);
    localStorage.setItem('scout_account_mappings', JSON.stringify(newMappings));
    setInlineEditingAccountId(null);
  };

  const handleEditBenefits = (acc: any) => {
    const lookupName = accountMappings[acc.account_id] || acc.name;
    setEditingAccountId(acc.account_id);
    
    const existingCustom = customCards.find(c => c.cardName === lookupName);
    if (existingCustom) {
      setProvider("Other");
      setCardName(lookupName);
      setDefaultRate((existingCustom.defaultRate * 100).toString());
      
      const catsArray = Object.entries(existingCustom.categories).map(([name, rate]) => ({
        name,
        rate: ((rate as number) * 100).toString()
      }));
      setCategories(catsArray.length > 0 ? catsArray : [{ name: COMMON_CATEGORIES[0], rate: "3" }]);
    } else {
      setProvider("Other");
      setCardName(lookupName);
      setDefaultRate("1");
      setCategories([{ name: COMMON_CATEGORIES[0], rate: "3" }]);
    }
    
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  return (
    <div className="space-y-16 pb-20">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div>
          <h1 className="text-5xl font-semibold text-black tracking-tight">Your Custom Wallet</h1>
          <p className="text-neutral-500 mt-2 text-lg">Define specific cashback rates for cards that aren't in our database.</p>
         </div>
         <button 
            onClick={() => {
              if (isFormOpen) {
                setEditingAccountId(null);
                setProvider("Chase");
                setCardName("");
                setDefaultRate("1");
                setCategories([{ name: COMMON_CATEGORIES[0], rate: "3" }]);
              }
              setIsFormOpen(!isFormOpen);
            }}
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

       {/* Connected Accounts Section */}
       <div className="apple-glass p-10">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
           <div>
             <h2 className="text-2xl font-semibold text-neutral-900 tracking-tight">Connected Accounts</h2>
             <p className="text-sm text-neutral-500 mt-1">Sync a bank account to start analyzing cashback rewards.</p>
           </div>
           <div className="flex items-center gap-4">
             <PlaidLink />
             <div className="hidden sm:flex w-12 h-12 bg-neutral-900 rounded-2xl items-center justify-center shadow-lg">
               <Landmark className="w-6 h-6 text-white" />
             </div>
           </div>
         </div>

         {loadingAccounts ? (
           <div className="py-20 text-center">
             <div className="inline-block w-8 h-8 border-4 border-neutral-200 border-t-neutral-800 rounded-full animate-spin mb-4"></div>
             <p className="text-neutral-500 font-bold tracking-widest uppercase text-xs">Fetching institutions...</p>
           </div>
         ) : institutions.length > 0 ? (
           <div className="grid gap-8">
             {institutions.map((inst: any, idx: number) => (
               <div key={idx} className="bg-white/40 border border-white/60 rounded-[2rem] overflow-hidden shadow-sm transition-all hover:shadow-md hover:bg-white/50">
                 <div className="p-8 border-b border-black/5 flex items-center gap-5 bg-white/30">
                   {inst.institution.logo ? (
                     <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center p-2 shadow-sm border border-black/5 overflow-hidden">
                       <img src={`data:image/png;base64,${inst.institution.logo}`} alt={inst.institution.name} className="w-full h-full object-contain" />
                     </div>
                   ) : (
                     <div className="w-14 h-14 rounded-2xl bg-neutral-900 flex items-center justify-center shadow-md">
                       <Landmark className="w-7 h-7 text-white" />
                     </div>
                   )}
                   <div>
                     <h3 className="text-xl font-bold text-neutral-900 tracking-tight">{inst.institution.name}</h3>
                     <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">{inst.accounts.length} Accounts Linked</p>
                   </div>
                 </div>
                 <div className="p-4 sm:p-8">
                   <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6">
                     {inst.accounts.map((acc: any, i: number) => (
                       <div key={i} className="bg-white/60 p-6 rounded-2xl border border-white/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] transition-all hover:-translate-y-1 group">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 flex-shrink-0",
                                acc.subtype === 'credit card' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                              )}>
                                {acc.subtype === 'credit card' ? <CreditCard className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                {inlineEditingAccountId === acc.account_id ? (
                                  <div className="flex items-center gap-2 mb-1">
                                    <input 
                                      className="font-semibold text-neutral-900 tracking-tight bg-white border border-neutral-200 rounded px-2 py-1 w-full text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200"
                                      value={inlineEditValue}
                                      onChange={(e) => setInlineEditValue(e.target.value)}
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleInlineEditSave(acc.account_id);
                                        if (e.key === 'Escape') setInlineEditingAccountId(null);
                                      }}
                                    />
                                    <button onClick={() => handleInlineEditSave(acc.account_id)} className="p-1.5 bg-neutral-900 text-white rounded hover:bg-neutral-800 transition-colors">
                                      <Save className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => setInlineEditingAccountId(null)} className="p-1.5 bg-neutral-100 text-neutral-500 rounded hover:bg-neutral-200 transition-colors">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <h4 className="font-semibold text-neutral-900 tracking-tight truncate">
                                    {accountMappings[acc.account_id] || acc.name}
                                  </h4>
                                )}
                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5 truncate">
                                  {acc.subtype} •••• {acc.mask}
                                </p>
                              </div>
                            </div>
                            
                            {inlineEditingAccountId !== acc.account_id && (
                              <button onClick={() => handleInlineEditStart(acc)} className="w-[124px] justify-center text-[9px] font-bold text-neutral-600 hover:text-neutral-900 uppercase tracking-widest px-2.5 py-1.5 rounded-md bg-white hover:bg-neutral-50 transition-all border border-neutral-200 shadow-sm flex flex-shrink-0 items-center">
                                Edit Card Name
                              </button>
                            )}
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Available Balance</p>
                            <div className="flex items-center gap-4">
                              <p className="font-semibold text-neutral-900 tabular-nums">
                                ${(acc.balances.available || acc.balances.current || 0).toLocaleString()}
                              </p>
                              <button 
                                onClick={() => handleEditBenefits(acc)}
                                className="w-[124px] justify-center text-[10px] font-bold text-neutral-600 hover:text-neutral-900 uppercase tracking-widest px-2.5 py-1.5 rounded-md bg-white hover:bg-neutral-50 transition-all border border-neutral-200 shadow-sm flex items-center flex-shrink-0"
                              >
                                Edit Benefits
                              </button>
                            </div>
                          </div>
                          {/* Card Benefits Section */}
                          {(() => {
                            const allCardsList = [...customCards, ...CARDS];
                            const lookupName = accountMappings[acc.account_id] || acc.name;
                            const dbCard = findDBProps(lookupName, allCardsList);
                            if (!dbCard) {
                              return (
                                <div className="mt-4 pt-4 border-t border-black/5">
                                  <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">Card information not found</p>
                                </div>
                              );
                            }
                            const cats = Object.entries(dbCard.categories);
                            const allRates = cats.length > 0
                              ? [...cats, ['DEFAULT', dbCard.defaultRate]]
                              : [['DEFAULT', dbCard.defaultRate]];
                            return (
                              <div className="mt-4 pt-4 border-t border-black/5 flex flex-wrap gap-2">
                                {cats.map(([cat, rate]) => {
                                  const style = getCategoryStyle(cat);
                                  const Icon = style.icon;
                                  return (
                                    <div key={cat} className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border", style.color)}>
                                      <Icon className="w-3 h-3 flex-shrink-0" />
                                      <span>{cat.replace('AND', '&')}</span>
                                      <span className="text-emerald-600">{((rate as number) * 100).toFixed(0)}%</span>
                                    </div>
                                  );
                                })}
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border bg-neutral-50 text-neutral-500 border-neutral-200">
                                  <span>All else</span>
                                  <span>{(dbCard.defaultRate * 100).toFixed(0)}%</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                     ))}
                   </div>
                 </div>
               </div>
             ))}
           </div>
         ) : (
           <div className="py-20 bg-white/40 border border-white/60 rounded-[2.5rem] shadow-inner text-center">
             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-neutral-100">
               <span className="text-neutral-200 text-3xl">∅</span>
             </div>
             <p className="text-neutral-900 font-bold text-lg mb-2 tracking-tight">No institutions connected</p>
             <p className="text-neutral-500 max-w-sm mx-auto">Sync your first bank account to start analyzing your rewards.</p>
             <div className="mt-8 flex justify-center">
               <PlaidLink />
             </div>
           </div>
         )}
       </div>
    </div>
  );
}
