"use client";

import { Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: 'Free',
    id: 'tier-free',
    href: '#',
    priceMonthly: '$0',
    description: 'Perfect for getting started with reward tracking.',
    features: ['Link up to 2 cards', 'Basic transaction analysis', 'Monthly summary'],
    mostPopular: false,
  },
  {
    name: 'Pro',
    id: 'tier-pro',
    href: '#',
    priceMonthly: '$9',
    description: 'The ultimate tool for reward optimization.',
    features: [
      'Unlimited rewards processing',
      'Real-time transaction alerts',
      'Advanced export functionality',
      'Priority partner support',
    ],
    mostPopular: true,
  },
];

export default function PricingTable() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
    setLoading(priceId);
    try {
      const response = await fetch('/api/stripe/checkout_session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-xs font-semibold text-black uppercase tracking-[0.3em] mb-4">Pricing</h2>
          <p className="text-5xl font-semibold tracking-tighter text-black sm:text-6xl">
            Choose Your Level
          </p>
        </div>
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                "flex flex-col justify-between p-10 transition-all duration-500 rounded-[2rem]",
                tier.mostPopular 
                  ? "apple-glass apple-glass-hover ring-1 ring-neutral-200 shadow-[0_8px_30px_rgba(0,0,0,0.06)] md:scale-[1.02] z-10" 
                  : "apple-glass bg-white/40"
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-x-4 mb-8">
                  <h3
                    id={tier.id}
                    className="text-xl font-semibold leading-8 tracking-tighter uppercase text-black"
                  >
                    {tier.name}
                  </h3>
                  {tier.mostPopular ? (
                    <div className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white bg-gradient-to-br from-neutral-800 to-black shadow-md rounded-full">
                      <Sparkles className="w-3 h-3 text-neutral-300" />
                      Most popular
                    </div>
                  ) : null}
                </div>
                <p className="text-sm font-medium leading-6 text-neutral-500">{tier.description}</p>
                <div className="mt-8 flex items-baseline gap-x-2">
                  <span className="text-6xl font-semibold tracking-tighter text-black">{tier.priceMonthly}</span>
                  <span className="text-sm font-semibold leading-6 text-neutral-400 uppercase tracking-widest">/month</span>
                </div>
                <ul role="list" className="mt-10 space-y-4 text-sm leading-6 text-black font-medium">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-4 items-center">
                      <div className="flex-none">
                        <Check className="h-4 w-4 text-black" aria-hidden="true" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handleCheckout(tier.id)}
                disabled={loading === tier.id}
                className={cn(
                  "mt-12 block w-full py-4 px-3 text-center text-sm font-semibold uppercase tracking-widest transition-all duration-300 rounded-[1.25rem]",
                  tier.mostPopular
                    ? "bg-gradient-to-br from-neutral-900 to-black text-white hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
                    : "bg-white text-neutral-900 border border-neutral-200 shadow-sm hover:border-neutral-300 hover:bg-neutral-50"
                )}
              >
                {loading === tier.id ? 'Starting Session...' : `Go ${tier.name}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
