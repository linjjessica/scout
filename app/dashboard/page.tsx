"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PlaidLink from "@/components/plaid-link";
import { CreditCard, DollarSign, TrendingUp, AlertCircle, ArrowUpRight, ShoppingBag, RefreshCw, Landmark, ArrowDownLeft, BadgeDollarSign, LayoutGrid, CheckCircle } from "lucide-react";
import { getCategoryStyle, formatCategoryName } from "@/lib/categories";
import { getCategoryCoverage, getBaselineRate } from "@/lib/analysis";

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Derive flat accounts list for existing logic
  const allAccounts = institutions.flatMap(inst => inst.accounts || []);
  const creditCards = allAccounts.filter((acc: any) => acc.subtype === 'credit card');
  
  // calculate coverage based on accounts
  const accountNames = creditCards.map((acc: any) => acc.name);
  const categoryCoverage = getCategoryCoverage(accountNames);

  const fetchTransactions = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const cacheKey = 'scout_transactions_cache';
      const cachedData = localStorage.getItem(cacheKey);

      if (!forceRefresh && cachedData) {
        const parsed = JSON.parse(cachedData);
        setTransactions(parsed.transactions || []);
        
        if (parsed.institutions) {
          setInstitutions(parsed.institutions);
        } else if (parsed.accounts) {
          // Migration: Map old flat accounts to a generic institution
          setInstitutions([{ 
            institution: { name: 'Linked Accounts', logo: null }, 
            accounts: parsed.accounts 
          }]);
        }
        setLoading(false);
        return;
      }

      const res = await fetch('/api/plaid/transactions');
      const data = await res.json();
      
      if (res.ok) {
        setTransactions(data.transactions || []);
        if (data.institutions) {
          setInstitutions(data.institutions);
        } else if (data.accounts) {
          setInstitutions([{ 
            institution: { name: 'Linked Accounts', logo: null }, 
            accounts: data.accounts 
          }]);
        }
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

  // Calculate dynamic baseline based on user's actual cards
  const baselineRate = getBaselineRate(accountNames);
  const cashbackEarned = transactions.reduce((sum, tx) => sum + (tx.amount * baselineRate), 0);
  const missedRewards = transactions.reduce((sum, tx) => sum + (tx.amount * Math.max(0, (tx.analysis?.rate || baselineRate) - baselineRate)), 0);
  
  // Calculate distinct accounts connected (filtering for credit cards only)
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
                 const MainCategory = formatCategoryName(tx.category?.[0]);
                 const cache = getCategoryStyle(tx.category?.[0]);
                 const IconComponent = cache.icon;

                 return (
                    <div key={i} className="py-4 flex items-center justify-between group gap-4">
                       <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shadow-sm border group-hover:scale-105 transition-transform duration-300 flex-shrink-0", cache.color)}>
                             <IconComponent className="w-5 h-5" /> 
                          </div>
                          <div className="min-w-0 flex-1">
                             <h3 className="font-semibold text-black tracking-tight truncate max-w-[180px] sm:max-w-xs">{tx.name || tx.merchant_name}</h3>
                             <div className="flex flex-wrap items-center gap-3 mt-0.5">
                               <span className="text-[10px] font-semibold text-neutral-400">{tx.date}</span>
                               {tx.accountName && tx.accountName.trim() && (
                                 <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest bg-black/[0.03] px-1.5 py-0.5 rounded border border-black/5">
                                   {tx.accountName}
                                 </span>
                               )}
                               <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">{MainCategory}</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                           {tx.analysis?.isOptimized ? (
                             <div className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 shadow-sm uppercase tracking-tighter">
                                <CheckCircle className="w-2.5 h-2.5" />
                                <span>Optimized</span>
                             </div>
                           ) : (
                             <div className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 shadow-sm whitespace-nowrap uppercase tracking-tighter">
                                <AlertCircle className="w-2.5 h-2.5" />
                                <span>Use {tx.analysis?.optimalCard}</span>
                             </div>
                           )}
                           <p className="text-sm font-semibold text-black tabular-nums tracking-tight">-${tx.amount.toFixed(2)}</p>
                       </div>
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
              const cache = getCategoryStyle(cat.category);
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
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900 tracking-tight">Connected Accounts</h2>
            <p className="text-sm text-neutral-500 mt-1">Manage your linked institutions and their associated accounts.</p>
          </div>
          <div className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center shadow-lg">
            <Landmark className="w-6 h-6 text-white" />
          </div>
        </div>
        
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-neutral-200 border-t-neutral-800 rounded-full animate-spin mb-4"></div>
            <p className="text-neutral-500 font-bold tracking-widest uppercase text-xs">Fetching institutions...</p>
          </div>
        ) : institutions.length > 0 ? (
          <div className="grid gap-8">
            {institutions.map((inst, idx) => (
              <div key={idx} className="bg-white/40 border border-white/60 rounded-[2rem] overflow-hidden shadow-sm transition-all hover:shadow-md hover:bg-white/50">
                <div className="p-8 border-b border-black/5 flex items-center justify-between bg-white/30">
                  <div className="flex items-center gap-5">
                    {inst.institution.logo ? (
                      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center p-2 shadow-sm border border-black/5 overflow-hidden">
                        <img 
                          src={`data:image/png;base64,${inst.institution.logo}`} 
                          alt={inst.institution.name}
                          className="w-full h-full object-contain"
                        />
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
                </div>
                
                <div className="p-4 sm:p-8">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inst.accounts.map((acc: any, i: number) => (
                      <div key={i} className="bg-white/60 p-6 rounded-2xl border border-white/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] transition-all hover:-translate-y-1 group">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110",
                            acc.subtype === 'credit card' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                          )}>
                            {acc.subtype === 'credit card' ? <CreditCard className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-neutral-900 tracking-tight truncate">{acc.name}</h4>
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5 truncate">
                              {acc.subtype} •••• {acc.mask}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
                           <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Available Balance</p>
                           <p className="font-semibold text-neutral-900 tabular-nums">
                             ${(acc.balances.available || acc.balances.current || 0).toLocaleString()}
                           </p>
                        </div>
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
             <p className="text-neutral-500 max-w-sm mx-auto">Sync your first bank account to start analyzing your rewards across all your cards.</p>
             <div className="mt-8 flex justify-center">
               <PlaidLink />
             </div>
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

