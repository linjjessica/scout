"use client";

import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, ShoppingBag, Car, Coffee, HelpCircle } from "lucide-react";

interface Transaction {
  transaction_id: string;
  name: string;
  amount: number;
  date: string;
  category: string[];
  merchant_name: string;
  payment_channel: string;
  iso_currency_code: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch('/api/plaid/transactions');
        const data = await res.json();
        if (data.transactions) {
          setTransactions(data.transactions);
        }
      } catch (error) {
        console.error("Failed to fetch transactions", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-bold text-slate-900">Transactions</h1>
        <p className="text-slate-600 mt-2">Your recent spending and rewards analysis.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
           <div className="p-12 text-center text-slate-500">Loading transactions...</div>
        ) : (
          <div className="divide-y divide-slate-100">
             {transactions.map((tx, i) => (
               <div key={i} className="p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <ShoppingBag className="w-5 h-5" /> 
                     </div>
                     <div>
                        <h3 className="font-semibold text-slate-900">{tx.name || tx.merchant_name}</h3>
                        <p className="text-xs text-slate-500">{tx.date} • {tx.category?.[0]}</p>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                     <div className="text-right">
                         <p className="font-bold text-slate-900">-${tx.amount.toFixed(2)}</p>
                         <p className="text-xs text-slate-400 uppercase">{tx.iso_currency_code}</p>
                     </div>
                     
                     {/* Analysis Mock Badge */}
                     <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border border-emerald-100">
                        <CheckCircle className="w-3 h-3" />
                        Optimal Card
                     </div>
                  </div>
               </div>
             ))}
             {transactions.length === 0 && (
                <div className="p-12 text-center text-slate-500">No transactions found.</div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
