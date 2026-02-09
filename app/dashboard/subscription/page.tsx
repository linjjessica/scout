import PricingTable from '@/components/pricing-table';

export default function SubscriptionPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Subscription</h1>
        <p className="text-slate-600 mt-2">Manage your plan and billing details.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <PricingTable />
      </div>
    </div>
  );
}
