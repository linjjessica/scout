import PlaidLink from "@/components/plaid-link";
import { CreditCard, DollarSign, TrendingUp, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-2">Welcome back! Here's your financial overview.</p>
        </div>
        <PlaidLink />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Spend", value: "$4,250.00", icon: DollarSign, color: "bg-blue-500" },
          { label: "Cashback Earned", value: "$124.50", icon: TrendingUp, color: "bg-emerald-500" },
          { label: "Missed Rewards", value: "$32.10", icon: AlertCircle, color: "bg-rose-500" },
          { label: "Linked Cards", value: "3", icon: CreditCard, color: "bg-purple-500" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10`}>
                 {/* Hack for bg opacity with arbitrary colors if not using strict tailwind classes for bg-opacity, 
                     but standard tailwind bg-blue-500/10 works in v3.3+ or v4 */}
                <stat.icon className={`w-6 h-6 text-${stat.color.split('-')[1]}-600`} /> 
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Transactions</h2>
          <div className="space-y-4">
             {/* Placeholder for transaction list */}
             <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Connect your bank account to see transactions.
             </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
           <h2 className="text-lg font-bold text-slate-900 mb-4">Suggested Actions</h2>
           <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
                  <h3 className="font-semibold text-rose-700 text-sm mb-1">Missed Opportunity</h3>
                  <p className="text-xs text-rose-600">You used Chase Sapphire for Groceries. Using Amex Gold would have earned 4x points.</p>
              </div>
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                  <h3 className="font-semibold text-indigo-700 text-sm mb-1">New Offer</h3>
                  <p className="text-xs text-indigo-600">Activate 5% cashback on Amazon with your Discover card this quarter.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
