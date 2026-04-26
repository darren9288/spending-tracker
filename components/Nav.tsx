"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, Wallet, List } from "lucide-react";

const links = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/input", icon: PlusCircle, label: "Add" },
  { href: "/wallets", icon: Wallet, label: "Wallets" },
  { href: "/transactions", icon: List, label: "History" },
];

export default function Nav() {
  const path = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 h-full w-56 bg-slate-900 border-r border-slate-800 p-4 gap-1 z-50">
        <div className="mb-6 px-2">
          <h1 className="text-xl font-bold text-indigo-400">SpendTrack</h1>
          <p className="text-xs text-slate-500 mt-0.5">AI Spending Tracker</p>
        </div>
        {links.map(({ href, icon: Icon, label }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex z-50">
        {links.map(({ href, icon: Icon, label }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                active ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
