import { 
  ShoppingBag, 
  Car, 
  Coffee, 
  Play, 
  Zap, 
  LayoutGrid, 
  DollarSign, 
  ArrowUpRight, 
  AlertCircle, 
  Landmark, 
  ArrowDownLeft, 
  BadgeDollarSign,
  LucideIcon
} from "lucide-react";

export interface CategoryStyle {
  icon: LucideIcon;
  color: string;
}

export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  'TRAVEL': { icon: Car, color: 'bg-blue-50 text-blue-600 border-blue-100' },
  'FOOD AND DRINK': { icon: Coffee, color: 'bg-orange-50 text-orange-600 border-orange-100' },
  'SERVICE': { icon: Play, color: 'bg-purple-50 text-purple-600 border-purple-100' },
  'SERVICES': { icon: Play, color: 'bg-purple-50 text-purple-600 border-purple-100' },
  'SHOPS': { icon: ShoppingBag, color: 'bg-pink-50 text-pink-600 border-pink-100' },
  'HEALTHCARE': { icon: Zap, color: 'bg-red-50 text-red-600 border-red-100' },
  'ENTERTAINMENT': { icon: Play, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  'STREAMING': { icon: Play, color: 'bg-red-50 text-red-600 border-red-100' },
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
  'TRANSPORT': { icon: Car, color: 'bg-sky-50 text-sky-600 border-sky-100' },
  'TRANSPORTATION': { icon: Car, color: 'bg-sky-50 text-sky-600 border-sky-100' },
  'GAS STATION': { icon: Zap, color: 'bg-amber-50 text-amber-600 border-amber-100' },
  'GROCERIES': { icon: ShoppingBag, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  'GENERAL': { icon: ShoppingBag, color: 'bg-neutral-50 text-neutral-600 border-neutral-100' },
  'GENERAL MERCHANDISE': { icon: ShoppingBag, color: 'bg-cyan-50 text-cyan-600 border-cyan-100' }
};

export function getCategoryStyle(categoryName: string | undefined): CategoryStyle {
  const rawCategory = categoryName || 'GENERAL';
  const normalizedKey = rawCategory.toUpperCase().replace(/_/g, ' ');
  return CATEGORY_STYLES[normalizedKey] || CATEGORY_STYLES['GENERAL'];
}

export function formatCategoryName(categoryName: string | undefined): string {
  const rawCategory = categoryName || 'GENERAL';
  return rawCategory.toUpperCase().replace(/_/g, ' ');
}
