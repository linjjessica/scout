"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PlaidLink from "@/components/plaid-link";
import { CreditCard, DollarSign, TrendingUp, AlertCircle, ArrowUpRight, ShoppingBag, RefreshCw, Landmark, ArrowDownLeft, BadgeDollarSign, LayoutGrid, CheckCircle, Wallet } from "lucide-react";
import { getCategoryStyle, formatCategoryName } from "@/lib/categories";
import { getCategoryCoverage, getBaselineRate, analyzeTransaction, CardRule } from "@/lib/analysis";

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [customCards, setCustomCards] = useState<CardRule[]>([]);

  // Derive flat accounts list for existing logic
  const allAccounts = institutions.flatMap(inst => inst.accounts || []);
  const creditCards = allAccounts.filter((acc: any) => acc.subtype === 'credit card');
  
  // calculate coverage based on accounts
  const accountNames = creditCards.map((acc: any) => acc.name);
  const categoryCoverage = getCategoryCoverage(accountNames, customCards);

  const fetchTransactions = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const cacheKey = 'scout_transactions_cache';
      const cachedData = localStorage.getItem(cacheKey);

      const customCardsData = localStorage.getItem('scout_custom_cards');
      const loadedCustomCards = customCardsData ? JSON.parse(customCardsData) : [];
      setCustomCards(loadedCustomCards);

      if (!forceRefresh && cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed.transactions) {
           const analyzed = parsed.transactions.map((tx: any) => ({
             ...tx,
             analysis: analyzeTransaction(tx, parsed.userCardNames, tx.accountName, tx.scoutDebugIsCreditCard, loadedCustomCards)
           }));
           setTransactions(analyzed);
        }
        
        if (parsed.institutions) {
          setInstitutions(parsed.institutions);
        } else if (parsed.accounts) {
          // Migration
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
        if (data.transactions) {
           const analyzed = data.transactions.map((tx: any) => ({
             ...tx,
             analysis: analyzeTransaction(tx, data.userCardNames, tx.accountName, tx.scoutDebugIsCreditCard, loadedCustomCards)
           }));
           setTransactions(analyzed);
        }
        if (data.institutions) {
          setInstitutions(data.institutions);
        } else if (data.accounts) {
          setInstitutions([{ 
            institution: { name: 'Linked Accounts', logo: null }, 
            accounts: data.accounts 
          }]);
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

  const totalSpend = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  // Calculate dynamic baseline based on user's actual cards
  const baselineRate = getBaselineRate(accountNames, customCards);
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
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Spend", value: `$${Math.abs(totalSpend).toFixed(2)}`, icon: DollarSign, trend: totalSpend > 0 ? "+12%" : "0%" },
          { label: "Cashback Earned", value: `$${Math.abs(cashbackEarned).toFixed(2)}`, icon: TrendingUp, trend: cashbackEarned > 0 ? "+5.4%" : "0%" },
          { label: "Missed Rewards", value: `-$${missedRewards.toFixed(2)}`, icon: AlertCircle, trend: missedRewards > 0 ? "-2%" : "0%" },
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
                Please sync your bank account on the My Cards page to unlock your personalized cashback analysis.
              </p>
              <div className="flex justify-center">
                <Link href="/dashboard/cards">
                  <button className="flex items-center gap-2 px-8 py-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl font-bold uppercase tracking-widest transition-all shadow-lg">
                    <Wallet className="w-5 h-5" />
                    Go to My Cards
                  </button>
                </Link>
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

                // Debug log for Inspector > Console
                console.log(`[Dashboard Debug] ${tx.name || tx.merchant_name} -> Account: ${tx.accountName}`);

                 return (
                    <div key={i} className="py-4 flex items-center justify-between group gap-4">
                       <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shadow-sm border group-hover:scale-105 transition-transform duration-300 flex-shrink-0", cache.color)}>
                             <IconComponent className="w-5 h-5" /> 
                          </div>
                          <div className="min-w-0 flex-1">
                             <h3 className="font-semibold text-black tracking-tight truncate max-w-[180px] sm:max-w-xs">{tx.name || tx.merchant_name}</h3>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-[10px] font-semibold text-neutral-400">{tx.date}</span>
                                <span className="text-neutral-300">•</span>
                                {tx.accountName && tx.accountName.trim() && (
                                  <>
                                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">{tx.accountName}</span>
                                    <span className="text-neutral-300">•</span>
                                  </>
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
                           <div className="text-right">
                              <p className="text-sm font-semibold text-black tabular-nums tracking-tight">
                                ${Math.abs(tx.amount || 0).toFixed(2)}
                              </p>
                             {tx.analysis && (
                               <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter mt-0.5">
                                 {tx.analysis.isOptimized ? (
                                   `${((tx.analysis.rate || 0) * 100).toFixed(0)}% Earned`
                                 ) : (
                                   <span className="text-amber-600/70">
                                     {((tx.analysis.currentRate || 0) * 100).toFixed(0)}% Earned • {((tx.analysis.rate || 0) * 100).toFixed(0)}% Available
                                   </span>
                                 )}
                               </p>
                             )}
                           </div>
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
    </div>
  );
}

// Helper component for className conditional logic
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

