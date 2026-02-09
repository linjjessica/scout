import Link from "next/link";
import { ArrowRight, CreditCard, PieChart, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="px-6 lg:px-12 h-20 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
            S
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Scout</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
          <Link href="#features" className="hover:text-indigo-600 transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it Works</Link>
          <Link href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
            Log in
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-all hover:shadow-lg active:scale-95 flex items-center gap-2"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative px-6 py-24 lg:py-32 lg:px-12 overflow-hidden">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-6 border border-indigo-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Now available in Beta
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                Stop missing out on <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">cashback</span>.
              </h1>
              <p className="text-xl text-slate-600 mb-8 max-w-lg leading-relaxed">
                Connect your cards. Scout automatically analyzes your spending to find missed rewards and tells you which card to use next time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/dashboard"
                  className="px-8 py-4 rounded-full bg-indigo-600 text-white font-semibold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 hover:-translate-y-1 active:translate-y-0 text-center"
                >
                  Start Saving Free
                </Link>
                <Link
                  href="#how-it-works"
                  className="px-8 py-4 rounded-full bg-white text-slate-700 font-semibold text-lg border border-slate-200 hover:bg-slate-50 transition-all text-center"
                >
                  See how it works
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-4 text-sm text-slate-500">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden relative">
                       {/* Placeholder avatars would go here, using gray bg for now */}
                       <div className="absolute inset-0 bg-slate-300"></div>
                    </div>
                  ))}
                </div>
                <p>Trusted by 2,000+ early users</p>
              </div>
            </div>
            <div className="relative lg:h-[600px] w-full bg-gradient-to-tr from-indigo-50 to-violet-50 rounded-3xl border border-slate-100 p-8 flex items-center justify-center shadow-2xl overflow-hidden">
               {/* Abstract UI representation */}
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
               <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 p-6 space-y-4 transform rotate-[-3deg] hover:rotate-0 transition-transform duration-500">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">+$24.50 Saved</span>
                  </div>
                  <div className="space-y-3">
                     <div className="h-2 bg-slate-100 rounded w-3/4"></div>
                     <div className="h-2 bg-slate-100 rounded w-1/2"></div>
                  </div>
                  <div className="pt-4 flex gap-3">
                      <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                          <span className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Spent</span>
                          <span className="block font-bold text-slate-900">$1,240</span>
                      </div>
                      <div className="flex-1 bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-center">
                          <span className="block text-xs text-indigo-400 uppercase tracking-wider mb-1">Earned</span>
                          <span className="block font-bold text-indigo-700">$64.20</span>
                      </div>
                  </div>
               </div>
               
                <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-violet-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -top-10 -left-10 w-64 h-64 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Your money, automatically optimized.</h2>
              <p className="text-lg text-slate-600">Stop scrolling through spreadsheets to find which card to use. Scout does the heavy lifting for you.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <CreditCard className="w-6 h-6 text-white" />,
                  title: "Smart Card Selection",
                  desc: "We analyze every transaction to tell you which of your cards would have earned the most rewards.",
                  color: "bg-blue-500"
                },
                {
                  icon: <ShieldCheck className="w-6 h-6 text-white" />,
                  title: "Bank-Grade Security",
                  desc: "Read-only access via Plaid. We never see your login credentials or move your money.",
                  color: "bg-emerald-500"
                },
                {
                  icon: <PieChart className="w-6 h-6 text-white" />,
                  title: "Missed Value Reports",
                  desc: "See exactly how much money you left on the table last month by using the wrong cards.",
                  color: "bg-purple-500"
                }
              ].map((feature, i) => (
                <div key={i} className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow">
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-6 shadow-md`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xs">S</div>
            <span className="font-bold text-white">Scout</span>
          </div>
          <div className="text-sm">
            © {new Date().getFullYear()} Scout Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
