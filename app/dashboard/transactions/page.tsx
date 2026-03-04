"use client";

import { useEffect, useState } from "react";
import { CheckCircle, ShoppingBag, Car, Coffee, Play, Zap, LayoutGrid, Chrome, DollarSign, ArrowUpRight, AlertCircle, RefreshCw, Landmark, ArrowDownLeft, BadgeDollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  transaction_id: string;
  name: string;
  amount: number;
  date: string;
  category: string[];
  merchant_name: string;
  payment_channel: string;
  iso_currency_code: string;
  analysis?: {
    optimalCard: string;
    rate: number;
  };
}

interface CategoryStyle {
  icon: any;
  color: string;
}

const categoryIcons: Record<string, CategoryStyle> = {
  'Travel': { icon: Car, color: 'bg-blue-50 text-blue-600 border-blue-100' },
  'Food and Drink': { icon: Coffee, color: 'bg-orange-50 text-orange-600 border-orange-100' },
  'Service': { icon: Play, color: 'bg-purple-50 text-purple-600 border-purple-100' },
  'Services': { icon: Play, color: 'bg-purple-50 text-purple-600 border-purple-100' },
  'Shops': { icon: ShoppingBag, color: 'bg-pink-50 text-pink-600 border-pink-100' },
  'Healthcare': { icon: Zap, color: 'bg-red-50 text-red-600 border-red-100' },
  'Entertainment': { icon: Play, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  'Utilities': { icon: Zap, color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
  'Community': { icon: LayoutGrid, color: 'bg-teal-50 text-teal-600 border-teal-100' },
  'Payment': { icon: DollarSign, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  'Loan Payments': { icon: Landmark, color: 'bg-slate-50 text-slate-600 border-slate-100' },
  'Transfer': { icon: ArrowUpRight, color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
  'Transfer Out': { icon: ArrowUpRight, color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
  'Transfer In': { icon: ArrowDownLeft, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  'Income': { icon: BadgeDollarSign, color: 'bg-green-50 text-green-600 border-green-100' },
  'Bank Fees': { icon: AlertCircle, color: 'bg-rose-50 text-rose-600 border-rose-100' },
  'Recreation': { icon: Play, color: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100' },
  'Tax': { icon: DollarSign, color: 'bg-stone-50 text-stone-600 border-stone-100' },
  'Transportation': { icon: Car, color: 'bg-sky-50 text-sky-600 border-sky-100' },
  'General': { icon: ShoppingBag, color: 'bg-neutral-50 text-neutral-600 border-neutral-100' },
};

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
               const MainCategory = tx.category?.[0] || 'General';
               const cache = categoryIcons[MainCategory] || categoryIcons['General'];
               const IconComponent = cache.icon;

               return (
                 <div key={i} className="p-6 sm:px-8 py-6 flex flex-col sm:flex-row gap-6 sm:items-center justify-between group hover:bg-white/60 transition-colors">
                    <div className="flex items-center gap-6">
                       <div className={cn("w-14 h-14 rounded-full flex items-center justify-center shadow-sm border border-black/5 group-hover:scale-105 transition-transform duration-300", cache.color)}>
                          <IconComponent className="w-5 h-5" /> 
                       </div>
                       <div>
                          <h3 className="font-semibold text-black text-lg tracking-tight uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] sm:max-w-none">
                            {tx.name || tx.merchant_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-semibold text-neutral-500">{tx.date}</span>
                            <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">
                              {MainCategory}
                            </span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-8 justify-between sm:justify-end">
                       <div className="text-right">
                           <p className="text-xl font-semibold text-black tabular-nums tracking-tight">-${tx.amount.toFixed(2)}</p>
                           <p className="text-[10px] font-semibold text-neutral-500 tracking-widest uppercase">{tx.iso_currency_code}</p>
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
