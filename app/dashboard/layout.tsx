import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="fixed inset-y-0 z-50 hidden lg:block">
        <Sidebar />
      </div>
      <main className="flex-1 lg:pl-64">
        <div className="px-6 py-8 lg:px-12 lg:py-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
