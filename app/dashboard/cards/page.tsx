"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PlaidLink from "@/components/plaid-link";
import { CreditCard, Plus, Trash2, Save, X, Landmark, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CardRule, CARDS, findDBProps } from "@/lib/analysis";
import { getCategoryStyle } from "@/lib/categories";

const COMMON_CATEGORIES = [
  "FOOD AND DRINK",
  "GROCERIES",
  "TRAVEL",
  "GAS STATION",
  "STREAMING",
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
  
  const [inlineEditingAccountId, setInlineEditingAccountId] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState("");
  const [categories, setCategories] = useState<{name: string, rate: string}[]>([{ name: COMMON_CATEGORIES[0], rate: "3" }]);

  const [inlineEditingBenefitsAccountId, setInlineEditingBenefitsAccountId] = useState<string | null>(null);
  const [inlineBenefitsCardName, setInlineBenefitsCardName] = useState("");
  const [inlineBenefitsDefaultRate, setInlineBenefitsDefaultRate] = useState("1");
  const [inlineBenefitsCategories, setInlineBenefitsCategories] = useState<{name: string, rate: string}[]>([]);

  const [isAiAnalyzingAccountId, setIsAiAnalyzingAccountId] = useState<string | null>(null);

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
    const allCardsList = [...customCards, ...CARDS];
    const lookupName = accountMappings[acc.account_id] || acc.name;
    const existingCard = findDBProps(lookupName, allCardsList);
    
    setInlineEditingBenefitsAccountId(acc.account_id);
    setInlineBenefitsCardName(lookupName);
    
    if (existingCard) {
      setInlineBenefitsDefaultRate((existingCard.defaultRate * 100).toString());
      const catsArray = Object.entries(existingCard.categories).map(([name, rate]) => ({
        name,
        rate: ((rate as number) * 100).toString()
      }));
      setInlineBenefitsCategories(catsArray.length > 0 ? catsArray : []);
    } else {
      setInlineBenefitsDefaultRate("1");
      setInlineBenefitsCategories([{ name: COMMON_CATEGORIES[0], rate: "3" }]);
    }
  };

  const handleInlineBenefitsSave = () => {
    if (!inlineEditingBenefitsAccountId) return;
    
    const mappedCategories: Record<string, number> = {};
    inlineBenefitsCategories.forEach(cat => {
      if (cat.name.trim() && !isNaN(Number(cat.rate))) {
        mappedCategories[cat.name.trim()] = Number(cat.rate) / 100;
      }
    });

    const newCard: CardRule = {
      cardName: inlineBenefitsCardName,
      categories: mappedCategories,
      defaultRate: Number(inlineBenefitsDefaultRate) / 100 || 0.01
    };

    const updatedCards = [...customCards.filter(c => c.cardName !== inlineBenefitsCardName), newCard];
    setCustomCards(updatedCards);
    localStorage.setItem('scout_custom_cards', JSON.stringify(updatedCards));
    setInlineEditingBenefitsAccountId(null);
  };

  const addInlineCategory = () => setInlineBenefitsCategories([...inlineBenefitsCategories, { name: COMMON_CATEGORIES[0], rate: "3" }]);
  const updateInlineCategory = (index: number, field: 'name' | 'rate', value: string) => {
    const newCats = [...inlineBenefitsCategories];
    newCats[index] = { ...newCats[index], [field]: value };
    setInlineBenefitsCategories(newCats);
  };
  const removeInlineCategory = (index: number) => {
    setInlineBenefitsCategories(inlineBenefitsCategories.filter((_, i) => i !== index));
  };

  const handleAiLookup = async (account: any) => {
    const lookupName = accountMappings[account.account_id] || account.name;
    setIsAiAnalyzingAccountId(account.account_id);
    try {
      const res = await fetch('/api/ai/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardName: lookupName }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Populate inline edit state with AI results
      setInlineEditingBenefitsAccountId(account.account_id);
      setInlineBenefitsCardName(data.cardName || lookupName);
      setInlineBenefitsDefaultRate(((data.defaultRate || 0.01) * 100).toString());
      
      const rawCategories = Object.entries(data.categories || {});
      const uniqueCategories: Record<string, number> = {};
      
      rawCategories.forEach(([name, rate]) => {
        const normalized = name.toUpperCase().trim();
        // If multiple versions of same category, take the highest rate (or just the first)
        if (!uniqueCategories[normalized] || (rate as number) > uniqueCategories[normalized]) {
          uniqueCategories[normalized] = rate as number;
        }
      });

      const mappedCats = Object.entries(uniqueCategories).map(([name, rate]) => ({
        name: name,
        rate: (rate * 100).toString()
      }));
      setInlineBenefitsCategories(mappedCats);
      
    } catch (error: any) {
      console.error("AI Lookup failed:", error);
      alert("Scout AI couldn't find benefits for this card. You can still add them manually!");
    } finally {
      setIsAiAnalyzingAccountId(null);
    }
  };

  return (
    <div className="space-y-16 pb-20">
       <div className="apple-glass p-10 mt-8">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
           <div>
             <h2 className="text-3xl font-semibold text-neutral-900 tracking-tight">Your Wallet</h2>
             <p className="text-sm text-neutral-500 mt-1">Manage your synced bank accounts and custom cards in one place.</p>
           </div>
           <div className="flex items-center gap-4">
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
                className="flex items-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-semibold text-sm uppercase tracking-widest transition-all shadow-lg order-2 sm:order-1"
              >
                {isFormOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {isFormOpen ? 'Cancel' : 'Add Custom'}
              </button>
              <div className="order-1 sm:order-2">
                <PlaidLink />
              </div>
           </div>
         </div>

         {isFormOpen && (
           <div className="bg-white/60 border border-neutral-100 p-8 rounded-[2rem] mb-10 animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm">
             <h2 className="text-2xl font-bold text-neutral-900 mb-6 font-primary">Create Custom Card</h2>
             <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Provider</label>
                    <select 
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-black font-medium focus:outline-none focus:ring-2 focus:ring-black/5"
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
                      className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-black font-medium focus:outline-none focus:ring-2 focus:ring-black/5"
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
                        className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-black font-medium focus:outline-none focus:ring-2 focus:ring-black/5"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">%</span>
                   </div>
                   <p className="text-[10px] text-neutral-400 font-medium">The "catch-all" cashback rate for un-categorized purchases.</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-neutral-100">
                   <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Specialized Categories</label>
                   {categories.map((cat, i) => (
                     <div key={i} className="flex items-center gap-4">
                        <select 
                          value={cat.name}
                          onChange={(e) => handleCategoryChange(i, 'name', e.target.value)}
                          className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-3 text-black font-medium focus:outline-none focus:ring-2 focus:ring-black/5"
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
                            className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-black font-medium focus:outline-none focus:ring-2 focus:ring-black/5"
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

                <div className="pt-6 border-t border-neutral-100 flex justify-end">
                   <button type="submit" className="flex items-center gap-2 px-8 py-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold uppercase tracking-widest transition-all shadow-md">
                     <Save className="w-5 h-5" />
                     Save Card
                   </button>
                </div>
             </form>
           </div>
         )}

         {loadingAccounts ? (
           <div className="py-20 text-center">
             <div className="inline-block w-8 h-8 border-4 border-neutral-200 border-t-neutral-800 rounded-full animate-spin mb-4"></div>
             <p className="text-neutral-500 font-bold tracking-widest uppercase text-xs">Fetching institutions...</p>
           </div>
         ) : (institutions.length > 0 || customCards.length > 0) ? (
           <div className="grid gap-8">
              {/* Custom Cards Row */}
              {customCards.length > 0 && (
                <div className="bg-white/40 border border-white/60 rounded-[2rem] overflow-hidden shadow-sm transition-all hover:shadow-md hover:bg-white/50 border-l-4 border-l-neutral-900">
                  <div className="p-8 border-b border-neutral-200 flex items-center justify-between bg-white/30">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-neutral-900 flex items-center justify-center shadow-md">
                        <Sparkles className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-neutral-900 tracking-tight">Custom Cards</h3>
                        <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">{customCards.length} Manual Entries</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-8">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6">
                      {customCards.map((card, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-2xl border-2 border-neutral-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] transition-all hover:-translate-y-1 group relative">
                          <button 
                            onClick={() => deleteCard(idx)}
                            className="absolute top-4 right-4 p-2 text-neutral-300 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-neutral-50 text-neutral-900 flex items-center justify-center shadow-sm flex-shrink-0">
                              <CreditCard className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-neutral-900 tracking-tight truncate">{card.cardName}</h4>
                                <span className="bg-neutral-100 text-neutral-600 text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-tighter">Custom</span>
                              </div>
                              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5">Manual Entry</p>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Base Rate</span>
                              <span className="text-xs font-bold text-neutral-900">{(card.defaultRate * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex flex-col gap-1 text-right">
                              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Categories</span>
                              <span className="text-xs font-bold text-emerald-600">{Object.keys(card.categories).length} specialized</span>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-wrap gap-2">
                            {Object.entries(card.categories).slice(0, 3).map(([cat, rate]) => (
                               <div key={cat} className="px-2 py-1 bg-neutral-50 text-neutral-500 text-[8px] font-bold uppercase tracking-widest rounded-lg border border-neutral-100">
                                 {cat.split(' ')[0]} {((rate as number) * 100).toFixed(0)}%
                               </div>
                            ))}
                            {Object.keys(card.categories).length > 3 && (
                              <div className="px-2 py-1 bg-neutral-50 text-neutral-400 text-[8px] font-bold uppercase tracking-widest rounded-lg border border-neutral-100">
                                +{Object.keys(card.categories).length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {institutions.map((inst: any, idx: number) => (
                <div key={idx} className="bg-white/40 border border-white/60 rounded-[2rem] overflow-hidden shadow-sm transition-all hover:shadow-md hover:bg-white/50">
                  <div className="p-8 border-b border-neutral-200 flex items-center gap-5 bg-white/30">
                    {inst.institution.logo ? (
                      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center p-2 shadow-sm border border-neutral-200 overflow-hidden">
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
                        <div key={i} className="bg-white p-6 rounded-2xl border-2 border-neutral-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] transition-all hover:-translate-y-1 group">
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
                                 Edit Account Name
                               </button>
                             )}
                           </div>
                           
                           <div className="mt-4 pt-4 border-t border-neutral-200 flex items-center justify-between">
                             <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Available Balance</p>
                             <div className="flex items-center gap-4">
                               <p className="font-semibold text-neutral-900 tabular-nums">
                                 ${(acc.balances.available || acc.balances.current || 0).toLocaleString()}
                               </p>
                               {acc.subtype === 'credit card' && (
                                 <button 
                                   onClick={() => handleEditBenefits(acc)}
                                   className="w-[124px] justify-center text-[10px] font-bold text-neutral-600 hover:text-neutral-900 uppercase tracking-widest px-2.5 py-1.5 rounded-md bg-white hover:bg-neutral-50 transition-all border border-neutral-200 shadow-sm flex items-center flex-shrink-0"
                                 >
                                   Edit Benefits
                                 </button>
                               )}
                             </div>
                           </div>
                           {/* Card Benefits Section */}
                           {acc.subtype === 'credit card' ? (
                             inlineEditingBenefitsAccountId === acc.account_id ? (
                               <div className="mt-4 pt-4 border-t border-neutral-200">
                                 <div className="flex items-center justify-between mb-3">
                                   <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Edit Benefits: <span className="text-neutral-900">{inlineBenefitsCardName}</span></p>
                                   <div className="flex items-center gap-2">
                                     <button onClick={handleInlineBenefitsSave} className="px-3 py-1.5 bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-md hover:bg-neutral-800 transition-colors flex items-center gap-1.5 shadow-sm">
                                       <Save className="w-3.5 h-3.5" /> Save
                                     </button>
                                     <button onClick={() => setInlineEditingBenefitsAccountId(null)} className="p-1 border border-neutral-200 bg-white text-neutral-500 rounded-md hover:bg-neutral-50 shadow-sm transition-colors">
                                       <X className="w-4 h-4" />
                                     </button>
                                   </div>
                                 </div>
                                 <div className="space-y-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                                   {inlineBenefitsCategories.map((cat, idx) => (
                                     <div key={idx} className="flex items-center gap-2">
                                       <select 
                                         value={cat.name}
                                         onChange={(e) => updateInlineCategory(idx, 'name', e.target.value)}
                                         className="flex-1 bg-white border border-neutral-200 rounded-md px-2 py-1.5 text-[10px] uppercase font-bold tracking-widest text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-200 shadow-sm"
                                       >
                                         {COMMON_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                       </select>
                                       <div className="flex items-center gap-1">
                                         <input 
                                           type="number"
                                           value={cat.rate}
                                           onChange={(e) => updateInlineCategory(idx, 'rate', e.target.value)}
                                           className="w-16 bg-white border border-neutral-200 rounded-md px-2 py-1.5 text-xs font-semibold text-center focus:outline-none focus:ring-2 focus:ring-neutral-200 shadow-sm"
                                         />
                                         <span className="text-[10px] font-bold text-neutral-400">%</span>
                                       </div>
                                       <button onClick={() => removeInlineCategory(idx)} className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors">
                                         <Trash2 className="w-4 h-4" />
                                       </button>
                                     </div>
                                   ))}
                                   <button onClick={addInlineCategory} className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest px-2.5 py-1.5 rounded-md bg-indigo-50 border border-indigo-100/50 hover:bg-indigo-100 transition-colors">
                                     <Plus className="w-3.5 h-3.5" /> Add Category
                                   </button>
                                   
                                   <div className="pt-3 border-t border-neutral-200 flex items-center justify-between">
                                     <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Base Rate (All Else)</span>
                                     <div className="flex items-center gap-1 mr-8">
                                       <input 
                                         type="number"
                                         value={inlineBenefitsDefaultRate}
                                         onChange={(e) => setInlineBenefitsDefaultRate(e.target.value)}
                                         className="w-16 bg-white border border-neutral-200 rounded-md px-2 py-1.5 text-xs font-semibold text-center focus:outline-none focus:ring-2 focus:ring-neutral-200 shadow-sm"
                                       />
                                       <span className="text-[10px] font-bold text-neutral-400">%</span>
                                     </div>
                                   </div>
                                 </div>
                               </div>
                             ) : (() => {
                               const allCardsList = [...customCards, ...CARDS];
                               const lookupName = accountMappings[acc.account_id] || acc.name;
                               const dbCard = findDBProps(lookupName, allCardsList);
                               if (!dbCard) {
                                 return (
                                   <div className="mt-4 pt-4 border-t border-neutral-200 space-y-3">
                                     <div className="flex items-center justify-between">
                                       <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">Card information not found</p>
                                       <button 
                                         onClick={() => handleAiLookup(acc)}
                                         disabled={isAiAnalyzingAccountId !== null}
                                         className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-indigo-100 transition-all disabled:opacity-50"
                                       >
                                         {isAiAnalyzingAccountId === acc.account_id ? (
                                           <Loader2 className="w-3 h-3 animate-spin" />
                                         ) : (
                                           <Sparkles className="w-3 h-3" />
                                         )}
                                         {isAiAnalyzingAccountId === acc.account_id ? 'Analyzing...' : 'Look up with Scout AI'}
                                       </button>
                                     </div>
                                   </div>
                                 );
                               }
                               const cats = Object.entries(dbCard.categories);
                               return (
                                 <div className="mt-4 pt-4 border-t border-neutral-200 flex flex-wrap gap-2">
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
                                     <span className="text-neutral-600">{((dbCard.defaultRate as number) * 100).toFixed(0)}%</span>
                                   </div>
                                 </div>
                               );
                             })()
                           ) : (
                             <div className="mt-4 pt-4 border-t border-neutral-200">
                               <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest italic flex items-center gap-2">
                                 <AlertCircle className="w-3 h-3" /> No rewards for {acc.subtype} account
                               </p>
                             </div>
                           )}
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
