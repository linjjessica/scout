"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PlaidLink from "@/components/plaid-link";
import { CreditCard, DollarSign, TrendingUp, AlertCircle, ArrowUpRight, ShoppingBag, Car, Coffee, Play, Zap, LayoutGrid, RefreshCw, Landmark, ArrowDownLeft, BadgeDollarSign } from "lucide-react";

interface CategoryStyle {
  icon: any;
  color: string;
}

const categoryIcons: Record<string, CategoryStyle> = {
  'TRAVEL': { icon: Car, color: 'bg-blue-50 text-blue-600 border-blue-100' },
  'FOOD AND DRINK': { icon: Coffee, color: 'bg-orange-50 text-orange-600 border-orange-100' },
  'SERVICE': { icon: Play, color: 'bg-purple-50 text-purple-600 border-purple-100' },
  'SERVICES': { icon: Play, color: 'bg-purple-50 text-purple-600 border-purple-100' },
  'SHOPS': { icon: ShoppingBag, color: 'bg-pink-50 text-pink-600 border-pink-100' },
  'HEALTHCARE': { icon: Zap, color: 'bg-red-50 text-red-600 border-red-100' },
  'ENTERTAINMENT': { icon: Play, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  'UTILITIES': { icon: Zap, color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
  'RENT AND UTILITIES': { icon: Zap, color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
  'COMMUNITY': { icon: LayoutGrid, color: 'bg-teal-50 text-teal-600 border-teal-100' },
  'PAYMENT': { icon: DollarSign, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  'LOAN PAYMENTS': { icon: Landmark, color: 'bg-slate-50 text-slate-600 border-slate-100' },
  'TRANSFER': { icon: ArrowUpRight, color: 'bg-neutral-50 text-neutral-600 border-neutral-100' },
  'TRANSFER OUT': { icon: ArrowUpRight, color: 'bg-neutral-50 text-neutral-600 border-neutral-100' },
  'TRANSFER IN': { icon: ArrowDownLeft, color: 'bg-neutral-50 text-neutral-600 border-neutral-100' },
  'INCOME': { icon: BadgeDollarSign, color: 'bg-green-50 text-green-600 border-green-100' },
  'BANK FEES': { icon: AlertCircle, color: 'bg-rose-50 text-rose-600 border-rose-100' },
  'RECREATION': { icon: Play, color: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100' },
  'TAX': { icon: DollarSign, color: 'bg-stone-50 text-stone-600 border-stone-100' },
  'TRANSPORTATION': { icon: Car, color: 'bg-sky-50 text-sky-600 border-sky-100' },
  'GENERAL': { icon: ShoppingBag, color: 'bg-neutral-50 text-neutral-600 border-neutral-100' },
  'GENERAL MERCHANDISE': { icon: ShoppingBag, color: 'bg-cyan-50 text-cyan-600 border-cyan-100' }
};

import { getCategoryCoverage } from "@/lib/analysis";

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ... (use effect fetching here, leaving alone with replace) ...

  // calculate coverage based on accounts
  const accountNames = accounts.filter(acc => acc.subtype === 'credit card').map(acc => acc.name);
  const categoryCoverage = getCategoryCoverage(accountNames);

  const fetchTransactions = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const cacheKey = 'scout_transactions_cache';
      const cachedData = localStorage.getItem(cacheKey);

      if (!forceRefresh && cachedData) {
        const parsed = JSON.parse(cachedData);
        setTransactions(parsed.transactions || []);
        setAccounts(parsed.accounts || []);
        setLoading(false);
        return;
      }

      const res = await fetch('/api/plaid/transactions');
      const data = await res.json();
      
      if (res.ok) {
        setTransactions(data.transactions || []);
        setAccounts(data.accounts || []);
        // Save to cache
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

  const totalSpend = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  // The user currently uses Citi Double Cash for all purchases (2% flat rate)
  const baselineRate = 0.02;
  const cashbackEarned = transactions.reduce((sum, tx) => sum + (tx.amount * baselineRate), 0);
  const missedRewards = transactions.reduce((sum, tx) => sum + (tx.amount * Math.max(0, (tx.analysis?.rate || baselineRate) - baselineRate)), 0);
  
  // Calculate distinct accounts connected (filtering for credit cards only)
  const creditCards = accounts.filter(acc => acc.subtype === 'credit card');
  const linkedCards = creditCards.length > 0 ? creditCards.length : (transactions.length > 0 ? 1 : 0);
  
  const recentTransactions = transactions.slice(0, 50);

  return (
    <div className="space-y-16 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-semibold text-black tracking-tight">
            Wealth Overview
          </h1>
          <p className="text-neutral-500 mt-2 text-lg">
            Welcome back! Your portfolio is optimized for maximum rewards.
          </p>
        </div>
        <PlaidLink />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Spend", value: `$${totalSpend.toFixed(2)}`, icon: DollarSign, trend: totalSpend > 0 ? "+12%" : "0%" },
          { label: "Cashback Earned", value: `$${cashbackEarned.toFixed(2)}`, icon: TrendingUp, trend: cashbackEarned > 0 ? "+5.4%" : "0%" },
          { label: "Missed Rewards", value: `$${missedRewards.toFixed(2)}`, icon: AlertCircle, trend: missedRewards > 0 ? "-2%" : "0%" },
          { label: "Linked Cards", value: linkedCards.toString(), icon: CreditCard, trend: "0%" },
        ].map((stat, i) => (
          <div key={i} className="apple-glass p-7 flex flex-col apple-glass-hover group">
            <div className="flex items-center justify-between mb-8">
              <div className="p-3.5 bg-neutral-900 rounded-[1.25rem] text-white shadow-md">
                <stat.icon className="w-5 h-5 transition-transform group-hover:scale-110" /> 
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border",
                stat.trend.startsWith('+') ? "bg-emerald-50 text-emerald-600 border-emerald-200" : 
                stat.trend.startsWith('-') ? "bg-rose-50 text-rose-600 border-rose-200" :
                "bg-neutral-50 text-neutral-600 border-neutral-200"
              )}>
                {stat.trend}
                {stat.trend !== "0%" && <ArrowUpRight className="w-3 h-3" />}
              </div>
            </div>
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest mb-1.5">{stat.label}</p>
            <p className="text-3xl font-semibold text-neutral-900 tabular-nums tracking-tight">{loading ? '...' : stat.value}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        {/* Unsynced State Overlay */}
        {!loading && transactions.length === 0 && (
          <div className="absolute inset-0 z-10 apple-glass-deep flex items-center justify-center rounded-[2.5rem] border-2 border-white/50 backdrop-blur-xl animate-in fade-in duration-700">
            <div className="text-center max-w-md p-10">
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/40 rotate-12 animate-bounce">
                <LayoutGrid className="w-10 h-10 text-white -rotate-12" />
              </div>
              <h2 className="text-3xl font-bold text-neutral-900 tracking-tight mb-4">Analysis Incomplete</h2>
              <p className="text-neutral-500 text-lg mb-8 leading-relaxed">
                Please sync your bank account to unlock your personalized cashback analysis and rewards optimization.
              </p>
              <div className="flex justify-center">
                <PlaidLink />
              </div>
            </div>
          </div>
        )}

        <div className={cn("grid lg:grid-cols-3 gap-8", !loading && transactions.length === 0 && "opacity-40 grayscale-[0.5] pointer-events-none")}>
          <div className="lg:col-span-2 apple-glass p-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 tracking-tight">Recent Activity</h2>
              <Link href="/dashboard/transactions">
                <button className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors bg-white/50 px-4 py-2 rounded-xl border border-white/50 shadow-sm">View All</button>
              </Link>
            </div>
          
          {loading ? (
            <div className="bg-white/40 border border-white/60 p-12 rounded-[1.5rem] text-center shadow-inner">
               <div className="inline-block w-8 h-8 border-4 border-neutral-200 border-t-neutral-800 rounded-full animate-spin mb-4"></div>
               <p className="font-semibold text-neutral-900">Syncing Data...</p>
            </div>
          ) : recentTransactions.length > 0 ? (
            <div className="divide-y divide-black/5 max-h-[420px] overflow-y-auto pr-2">
               {recentTransactions.map((tx, i) => {
                 const rawCategory = tx.category?.[0] || 'GENERAL';
                 // Simply normalize to uppercase with spaces to match dictionary keys
                 const MainCategory = rawCategory.toUpperCase().replace(/_/g, ' ');
                 const cache = categoryIcons[MainCategory] || categoryIcons['GENERAL'];
                 const IconComponent = cache.icon;

                 return (
                   <div key={i} className="py-4 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                         <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shadow-sm border group-hover:scale-105 transition-transform duration-300", cache.color)}>
                            <IconComponent className="w-5 h-5" /> 
                         </div>
                         <div>
                            <h3 className="font-semibold text-black tracking-tight">{tx.name || tx.merchant_name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-neutral-500">{tx.date}</span>
                              <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">{MainCategory}</span>
                            </div>
                         </div>
                      </div>
                      <p className="font-semibold text-black tracking-tight">-${tx.amount.toFixed(2)}</p>
                   </div>
                 );
               })}
            </div>
          ) : (
            <div className="bg-white/40 border border-white/60 p-12 rounded-[1.5rem] text-center shadow-inner">
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-neutral-100">
                 <span className="text-neutral-300">∅</span>
               </div>
               <p className="font-semibold text-neutral-900">No recent transactions synced</p>
               <p className="text-sm text-neutral-500 mt-1">Connect your account to start analyzing spend patterns.</p>
            </div>
          )}
        </div>
        
        <div className="apple-glass p-10">
          <h2 className="text-2xl font-semibold text-neutral-900 tracking-tight mb-8">Category Coverage</h2>
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2 pb-2">
            {loading ? (
              <div className="py-8 text-center text-neutral-500">Evaluating coverage...</div>
            ) : categoryCoverage.map((cat, i) => {
              const cache = categoryIcons[cat.category.toUpperCase().replace(/_/g, ' ')] || categoryIcons['GENERAL'];
              const IconComponent = cache.icon;
              return (
                <div key={i} className="bg-white/60 p-4 rounded-[1.25rem] border border-white/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-1 flex items-center gap-4 group">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-transform group-hover:scale-105",
                    cat.hasBonusCoverage ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                  )}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900 text-sm mb-1">{cat.category}</h3>
                    <div className="flex flex-col gap-0.5">
                      {cat.optimalCards.map(card => (
                        <div key={card} className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                          <p className="text-[11px] font-bold text-neutral-700 uppercase tracking-widest">
                            {card} • {(cat.bestRate * 100).toFixed(0)}%
                          </p>
                        </div>
                      ))}
                      {cat.unknownCards.map(card => (
                        <div key={card} className="flex items-center gap-1.5 opacity-70">
                          <span className="w-1 h-1 rounded-full bg-neutral-400"></span>
                          <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">
                            {card} • Unknown%
                          </p>
                        </div>
                      ))}
                      {cat.optimalCards.length === 0 && cat.unknownCards.length === 0 && (
                        <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">Not Covered</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>
      </div>

      <div className="apple-glass p-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-neutral-900 tracking-tight">Connected Credit Cards</h2>
          <CreditCard className="w-5 h-5 text-neutral-400" />
        </div>
        
        {loading ? (
          <div className="py-8 text-center text-neutral-500">Loading accounts...</div>
        ) : accounts.filter(acc => acc.subtype === 'credit card').length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.filter(acc => acc.subtype === 'credit card').map((acc, i) => (
              <div key={i} className="bg-white/60 p-6 rounded-[1.25rem] border border-white/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-1 group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center shadow-md">
                    <CreditCard className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 tracking-tight">{acc.name}</h3>
                    <p className="text-xs text-neutral-500 uppercase tracking-widest mt-0.5">{acc.subtype} •••• {acc.mask}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 bg-white/40 border border-white/60 rounded-[1.5rem] shadow-inner text-center">
            <p className="text-neutral-500 font-medium">No accounts linked yet. Use the Sync Account button to connect.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for className conditional logic
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
