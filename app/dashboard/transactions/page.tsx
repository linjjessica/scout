"use client";

import { useEffect, useState, useMemo } from "react";
import { ShoppingBag, RefreshCw, BadgeDollarSign, DollarSign, ArrowUpRight, ArrowDownLeft, AlertCircle, Landmark, CheckCircle, Chrome, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryStyle, formatCategoryName } from "@/lib/categories";
import { analyzeTransaction, CardRule } from "@/lib/analysis";

interface Transaction {
  transaction_id: string;
  name: string;
  amount: number;
  date: string;
  category: string[];
  merchant_name: string;
  payment_channel: string;
  iso_currency_code: string;
  accountName: string;
  analysis?: {
    optimalCard: string | null;
    rate: number;
    currentRate: number;
    isOptimized: boolean;
    rewardGap: number;
  };
}

type DatePreset = 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'all';

function getPresetRange(preset: DatePreset): { start: Date | null; end: Date | null } {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (preset === 'all') return { start: null, end: null };

  if (preset === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end };
  }
  if (preset === 'last_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start, end };
  }
  if (preset === 'last_3_months') {
    const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    return { start, end: startOfToday };
  }
  if (preset === 'last_6_months') {
    const start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    return { start, end: startOfToday };
  }
  return { start: null, end: null };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState<DatePreset>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const fetchTransactions = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const cacheKey = 'scout_transactions_cache';
      const cachedData = localStorage.getItem(cacheKey);
      
      const customCardsData = localStorage.getItem('scout_custom_cards');
      const customCards: CardRule[] = customCardsData ? JSON.parse(customCardsData) : [];
      
      const accountMappingsData = localStorage.getItem('scout_account_mappings');
      const accountMappings = accountMappingsData ? JSON.parse(accountMappingsData) : {};

      const getMappedUserCardNames = (institutions: any[], fallbackNames: string[]) => {
        if (!institutions) return fallbackNames;
        const names = new Set<string>();
        institutions.forEach(inst => {
          inst.accounts.forEach((acc: any) => {
            if (acc.subtype === 'credit card' || acc.type === 'credit') {
              names.add(accountMappings[acc.account_id] || acc.name);
            }
          });
        });
        return Array.from(names);
      };

      if (!forceRefresh && cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed.transactions) {
           const mappedUserCardNames = getMappedUserCardNames(parsed.institutions, parsed.userCardNames);
           const analyzed = parsed.transactions.map((tx: any) => {
             const mappedAccountName = accountMappings[tx.account_id] || tx.accountName;
             return {
               ...tx,
               analysis: analyzeTransaction(tx, mappedUserCardNames, mappedAccountName, tx.scoutDebugIsCreditCard, customCards)
             };
           });
           setTransactions(analyzed);
        }
        setLoading(false);
        return;
      }

      const res = await fetch('/api/plaid/transactions');
      const data = await res.json();
      
      if (res.ok) {
        if (data.transactions) {
          const mappedUserCardNames = getMappedUserCardNames(data.institutions, data.userCardNames);
          const analyzed = data.transactions.map((tx: any) => {
             const mappedAccountName = accountMappings[tx.account_id] || tx.accountName;
             return {
               ...tx,
               analysis: analyzeTransaction(tx, mappedUserCardNames, mappedAccountName, tx.scoutDebugIsCreditCard, customCards)
             };
          });
          setTransactions(analyzed);
        }
        localStorage.setItem(cacheKey, JSON.stringify(data));
      }
    } catch (error) {
      console.error("Failed to fetch transactions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // --- Date Filtering ---
  const filteredTransactions = useMemo(() => {
    let start: Date | null = null;
    let end: Date | null = null;

    if (showCustom && customStart && customEnd) {
      start = new Date(customStart + 'T00:00:00');
      end = new Date(customEnd + 'T23:59:59');
    } else {
      const range = getPresetRange(datePreset);
      start = range.start;
      end = range.end;
    }

    return transactions.filter(tx => {
      if (!start && !end) return true;
      const txDate = new Date(tx.date + 'T00:00:00');
      if (start && txDate < start) return false;
      if (end && txDate > end) return false;
      return true;
    });
  }, [transactions, datePreset, showCustom, customStart, customEnd]);

  // --- Summary Stats ---
  const totalSpent = useMemo(() => 
    filteredTransactions
      .filter(tx => tx.amount > 0) // positive = money out in Plaid
      .reduce((sum, tx) => sum + tx.amount, 0),
    [filteredTransactions]
  );

  const rewardsEarned = useMemo(() =>
    filteredTransactions
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + (tx.amount * (tx.analysis?.currentRate || 0)), 0),
    [filteredTransactions]
  );

  const PRESETS: { label: string; value: DatePreset }[] = [
    { label: 'This Month', value: 'this_month' },
    { label: 'Last Month', value: 'last_month' },
    { label: 'Last 3 Mo', value: 'last_3_months' },
    { label: 'Last 6 Mo', value: 'last_6_months' },
    { label: 'All Time', value: 'all' },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-5xl font-semibold text-black tracking-tight">Transactions</h1>
          <p className="text-neutral-500 mt-2 text-lg">Deep analysis of your spending habits and reward distribution.</p>
        </div>
        <button 
          onClick={() => fetchTransactions(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-3 bg-white/50 hover:bg-white text-black rounded-xl font-semibold text-sm uppercase tracking-widest transition-all shadow-sm border border-black/5 disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", loading ? "animate-spin" : "")} />
          Refresh
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => { setDatePreset(p.value); setShowCustom(false); }}
              className={cn(
                "px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all border",
                !showCustom && datePreset === p.value
                  ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                  : "bg-white/60 text-neutral-500 border-neutral-200 hover:bg-white hover:text-neutral-800"
              )}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setShowCustom(v => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all border",
              showCustom
                ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                : "bg-white/60 text-neutral-500 border-neutral-200 hover:bg-white hover:text-neutral-800"
            )}
          >
            <CalendarDays className="w-3.5 h-3.5" /> Custom
          </button>
        </div>

        {showCustom && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="px-3 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-200"
            />
            <span className="text-neutral-400 text-xs font-bold">→</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="px-3 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-200"
            />
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="apple-glass rounded-2xl px-6 py-5">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Total Spent</p>
          <p className="text-3xl font-semibold text-black tabular-nums tracking-tight">${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-neutral-400 mt-1">{filteredTransactions.filter(t => t.amount > 0).length} transactions</p>
        </div>
        <div className="apple-glass rounded-2xl px-6 py-5">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Rewards Earned</p>
          <p className="text-3xl font-semibold text-emerald-600 tabular-nums tracking-tight">${rewardsEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-neutral-400 mt-1">estimated cashback</p>
        </div>
        <div className="apple-glass rounded-2xl px-6 py-5 col-span-2 sm:col-span-1">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Avg Reward Rate</p>
          <p className="text-3xl font-semibold text-blue-600 tabular-nums tracking-tight">
            {totalSpent > 0 ? ((rewardsEarned / totalSpent) * 100).toFixed(2) : '0.00'}%
          </p>
          <p className="text-[10px] text-neutral-400 mt-1">across all spending</p>
        </div>
      </div>

      {/* Transaction List */}
      <div className="apple-glass rounded-[2rem] overflow-hidden">
        {loading ? (
            <div className="p-24 text-center">
              <div className="inline-block w-8 h-8 border-4 border-neutral-200 border-t-neutral-800 rounded-full animate-spin mb-4"></div>
              <p className="text-neutral-500 font-bold tracking-widest uppercase text-xs">Syncing...</p>
            </div>
         ) : (
          <div className="divide-y divide-black/5 bg-white/20">
             {filteredTransactions.map((tx, i) => {
               const MainCategory = formatCategoryName(tx.category?.[0]);
               const cache = getCategoryStyle(tx.category?.[0]);
               const IconComponent = cache.icon;

               return (
                 <div key={i} className="p-6 sm:px-8 py-6 flex flex-col sm:flex-row gap-6 sm:items-center justify-between group hover:bg-white/60 transition-colors">
                    <div className="flex items-center gap-6 min-w-0 flex-1">
                       <div className={cn("w-14 h-14 rounded-full flex items-center justify-center shadow-sm border border-black/5 group-hover:scale-105 transition-transform duration-300 flex-shrink-0", cache.color)}>
                          <IconComponent className="w-5 h-5" /> 
                       </div>
                       <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-black text-lg tracking-tight uppercase truncate max-w-md sm:max-w-lg lg:max-w-xl">
                            {tx.name || tx.merchant_name}
                          </h3>
                           <div className="flex flex-wrap items-center gap-2 mt-2">
                             <span className="text-xs font-bold text-neutral-400 uppercase tracking-tight">{tx.date}</span>
                             <span className="text-neutral-300">•</span>
                             {tx.accountName && tx.accountName.trim() && (
                               <>
                                 <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{tx.accountName}</span>
                                 <span className="text-neutral-300">•</span>
                               </>
                             )}
                             <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest pt-0.5">
                               {MainCategory}
                             </span>
                           </div>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-6 sm:gap-8 justify-between sm:justify-end flex-shrink-0 mt-4 sm:mt-0 w-full sm:w-auto">
                       <div className="text-right w-24 sm:w-28 flex-shrink-0">
                           <p className={cn("text-xl font-semibold tabular-nums tracking-tight", tx.amount < 0 ? "text-emerald-600" : "text-black")}>
                             {tx.amount < 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                           </p>
                           <p className="text-[10px] font-semibold text-neutral-500 tracking-widest uppercase text-right">{tx.iso_currency_code}</p>
                       </div>
                       <div className="flex flex-col items-end gap-2 sm:w-72 lg:w-80 flex-shrink-0">
                           {tx.amount < 0 ? (
                             <div className="text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 shadow-sm">
                               <ArrowDownLeft className="w-3.5 h-3.5" />
                               <span className="tracking-tight uppercase">Credit / Income</span>
                             </div>
                           ) : tx.analysis?.isOptimized ? (
                             <div className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 shadow-sm">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span className="tracking-tight uppercase">Optimized</span>
                             </div>
                           ) : (
                             <div className="text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 shadow-sm whitespace-nowrap">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span className="tracking-tight uppercase whitespace-nowrap">Opportunity • Use {tx.analysis?.optimalCard}</span>
                             </div>
                           )}
                           {tx.amount > 0 && tx.analysis && (
                             <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-right">
                               {tx.analysis.isOptimized ? (
                                 `${tx.analysis.optimalCard || 'SAVVY SPENDING'} • ${((tx.analysis.rate || 0) * 100).toFixed(0)}%`
                               ) : (
                                 <span className="text-amber-600/70 font-bold">
                                   Earned {((tx.analysis.currentRate || 0) * 100).toFixed(0)}% • Could have earned {((tx.analysis.rate || 0) * 100).toFixed(0)}%
                                 </span>
                               )}
                             </span>
                           )}
                        </div>
                    </div>
                 </div>
               );
             })}
             {filteredTransactions.length === 0 && !loading && (
                <div className="py-24 text-center">
                  <div className="w-16 h-16 border border-neutral-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CalendarDays className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-black font-semibold text-lg tracking-tight">No transactions in this period</p>
                  <p className="text-sm text-neutral-500 mt-1">Try adjusting your date filter or syncing a new account.</p>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
