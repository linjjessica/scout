"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, RefreshCw, BadgeDollarSign, DollarSign, ArrowUpRight, ArrowDownLeft, AlertCircle, Landmark, CheckCircle, Chrome } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryStyle, formatCategoryName } from "@/lib/categories";

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
    optimalCard: string;
    rate: number;
  };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const cacheKey = 'scout_transactions_cache';
      const cachedData = localStorage.getItem(cacheKey);

      if (!forceRefresh && cachedData) {
        const parsed = JSON.parse(cachedData);
        setTransactions(parsed.transactions || []);
        // The transactions page only needs transactions, but we can set the whole cache
        setLoading(false);
        return;
      }

      const res = await fetch('/api/plaid/transactions');
      const data = await res.json();
      
      if (res.ok) {
        if (data.transactions) {
          setTransactions(data.transactions);
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

  return (
    <div className="space-y-16 pb-20">
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

      <div className="apple-glass rounded-[2rem] overflow-hidden">
        {loading ? (
            <div className="p-24 text-center">
              <div className="inline-block w-8 h-8 border-4 border-neutral-200 border-t-neutral-800 rounded-full animate-spin mb-4"></div>
              <p className="text-neutral-500 font-bold tracking-widest uppercase text-xs">Syncing...</p>
            </div>
         ) : (
          <div className="divide-y divide-black/5 bg-white/20">
             {transactions.map((tx, i) => {
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
                          <div className="flex flex-wrap items-center gap-3 mt-1.5">
                            <span className="text-xs font-semibold text-neutral-400">{tx.date}</span>
                            {tx.accountName && tx.accountName.trim() && (
                              <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest bg-black/[0.03] px-2 py-0.5 rounded-md border border-black/5">
                                {tx.accountName}
                              </span>
                            )}
                            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
                              {MainCategory}
                            </span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-8 justify-between sm:justify-end flex-shrink-0">
                       <div className="text-right">
                           <p className="text-xl font-semibold text-black tabular-nums tracking-tight">-${tx.amount.toFixed(2)}</p>
                           <p className="text-[10px] font-semibold text-neutral-500 tracking-widest uppercase text-right">{tx.iso_currency_code}</p>
                       </div>
                       
                       <div className="flex flex-col items-end gap-2">
                          <div className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 shadow-sm">
                             <CheckCircle className="w-3.5 h-3.5" />
                             <span className="tracking-tight uppercase">Optimized</span>
                          </div>
                          {tx.analysis && (
                            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">
                              {tx.analysis.optimalCard} • {(tx.analysis.rate * 100).toFixed(0)}%
                            </span>
                          )}
                       </div>
                    </div>
                 </div>
               );
             })}
             {transactions.length === 0 && (
                <div className="py-24 text-center">
                  <div className="w-16 h-16 border border-neutral-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Chrome className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-black font-semibold text-lg tracking-tight">No transactions detected</p>
                  <p className="text-sm text-neutral-500 mt-1">Try connecting a different account to sync data.</p>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
