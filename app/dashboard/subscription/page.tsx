import PricingTable from '@/components/pricing-table';

export default function SubscriptionPage() {
  return (
    <div className="space-y-16 pb-20">
      <div>
        <h1 className="text-5xl font-semibold text-black tracking-tight">
          Subscription
        </h1>
        <p className="text-neutral-500 mt-2 text-lg">
          Unlock deep insights and personalized reward strategies.
        </p>
      </div>

      <PricingTable />
    </div>
  );
}
