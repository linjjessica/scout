"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CreditCard, Settings, LogOut, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Transactions", href: "/dashboard/transactions", icon: CreditCard },
  { name: "My Cards", href: "/dashboard/cards", icon: Wallet },
  { name: "Subscription", href: "/dashboard/subscription", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await fetch('/api/plaid/signout', { method: 'POST' });
      window.location.reload();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <div className="flex h-full min-h-screen w-64 flex-col bg-white/60 backdrop-blur-3xl border-r border-white/50 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.02)]">
      <div className="flex h-24 items-center gap-3 px-8">
        <div className="w-10 h-10 bg-gradient-to-br from-neutral-800 to-black rounded-[0.85rem] flex items-center justify-center text-white font-semibold text-2xl shadow-md border border-white/20">
          S
        </div>
        <span className="text-2xl font-semibold tracking-tight text-neutral-900">Scout</span>
      </div>
      
      <div className="flex-1 px-4 py-10 space-y-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-4 px-5 py-4 text-sm font-medium transition-all duration-300 rounded-[1.25rem]",
                isActive
                  ? "text-neutral-900 bg-white/80 border border-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
                  : "text-neutral-500 hover:text-neutral-900 hover:bg-white/40"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform group-hover:scale-110",
                isActive ? "text-black" : "text-neutral-400 group-hover:text-black"
              )} />
              {item.name}
            </Link>
          );
        })}
      </div>
      <div className="px-6 pb-8 space-y-3">
        <div className="rounded-[1.25rem] bg-white/50 border border-neutral-100 p-4 space-y-2.5">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Security & Limits</p>
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            Scout does not store any of your data. All account info is saved via cookies — clear them anytime to reset your session.
          </p>
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            Plaid has limited our production access. If syncing or refresh stops working, we may have hit our API limit while pursuing full production access.
          </p>
          <div className="pt-2 mt-2 border-t border-neutral-100 flex items-center justify-between">
            <p className="text-[10px] font-medium text-neutral-400">
              Made with ❤️ by <a href="https://www.linkedin.com/in/jjessicalin/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold underline decoration-indigo-200 underline-offset-2 hover:text-indigo-500 transition-colors">Jessica Lin</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
