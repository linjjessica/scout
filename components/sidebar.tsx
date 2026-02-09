"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CreditCard, Settings, LogOut, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Transactions", href: "/dashboard/transactions", icon: CreditCard },
  { name: "Subscription", href: "/dashboard/subscription", icon: Settings }, // Replaced Settings with Subscription for MVP
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-screen w-64 flex-col bg-slate-900 text-white">
      <div className="flex h-20 items-center gap-2 px-6 border-b border-slate-800">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-900/50">
          S
        </div>
        <span className="text-xl font-bold tracking-tight">Scout</span>
      </div>
      <div className="flex-1 px-4 py-8 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all",
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-slate-800">
        <button className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 rounded-xl hover:text-white hover:bg-slate-800 transition-all">
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
