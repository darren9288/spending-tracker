"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import {
  LayoutDashboard, PlusCircle, Wallet, List, Tag, Target,
  Settings, User, LogOut, ChevronDown, ChevronRight,
  BarChart2, RefreshCw, CreditCard, TrendingUp,
} from "lucide-react";

type NavLink = { href: string; icon: React.ElementType; label: string };

const BOTTOM_LINKS: NavLink[] = [
  { href: "/", icon: LayoutDashboard, label: "Home" },
  { href: "/transactions/add", icon: PlusCircle, label: "Add" },
  { href: "/wallets", icon: Wallet, label: "Wallets" },
  { href: "/transactions", icon: List, label: "History" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const SECTION_LINKS: { title: string; links: NavLink[] }[] = [
  {
    title: "Track",
    links: [
      { href: "/", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/transactions", icon: List, label: "Transactions" },
      { href: "/wallets", icon: Wallet, label: "Wallets" },
      { href: "/categories", icon: Tag, label: "Categories" },
    ],
  },
  {
    title: "Plan",
    links: [
      { href: "/budgets", icon: Target, label: "Budgets" },
      { href: "/goals", icon: Target, label: "Goals" },
      { href: "/recurring", icon: RefreshCw, label: "Recurring" },
    ],
  },
  {
    title: "Finance",
    links: [
      { href: "/debts", icon: CreditCard, label: "Debts" },
      { href: "/investments", icon: TrendingUp, label: "Investments" },
      { href: "/analytics", icon: BarChart2, label: "Analytics" },
    ],
  },
];

export default function Nav() {
  const path = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUsername(user.email?.replace("@placeholder.com", "") ?? null);
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/") return path === "/";
    return path.startsWith(href);
  }

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 h-full w-56 bg-slate-900 border-r border-slate-800 p-4 gap-1 z-50 overflow-y-auto">
        <div className="mb-5 px-2">
          <h1 className="text-xl font-bold text-emerald-400">SpendTrack</h1>
          <p className="text-xs text-slate-500 mt-0.5">Personal Finance</p>
        </div>

        {/* Quick add button */}
        <Link href="/transactions/add"
          className="flex items-center justify-center gap-2 mb-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors">
          <PlusCircle size={16} /> Add Transaction
        </Link>

        {SECTION_LINKS.map(({ title, links }) => {
          const isOpen = expanded === title || links.some((l) => isActive(l.href));
          return (
            <div key={title} className="mb-1">
              <button
                onClick={() => setExpanded(isOpen ? null : title)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
              >
                {title}
                {isOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              </button>
              {isOpen && links.map(({ href, icon: Icon, label }) => (
                <Link key={href} href={href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(href) ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}>
                  <Icon size={16} /> {label}
                </Link>
              ))}
            </div>
          );
        })}

        {/* More links */}
        <div className="mt-1 mb-1">
          <p className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">More</p>
          {[
            { href: "/subscriptions", label: "Subscriptions" },
            { href: "/bills", label: "Bills" },
            { href: "/refunds", label: "Refunds" },
            { href: "/wishlist", label: "Wishlist" },
            { href: "/tax", label: "Tax" },
            { href: "/achievements", label: "Achievements" },
            { href: "/import-export", label: "Import / Export" },
          ].map(({ href, label }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(href) ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}>
              {label}
            </Link>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-slate-800 flex flex-col gap-1">
          <Link href="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive("/settings") ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
            <Settings size={16} /> Settings
          </Link>
          <Link href="/account"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive("/account") ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
            <User size={16} /> {username ?? "Account"}
          </Link>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </nav>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex z-50">
        {BOTTOM_LINKS.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors ${
              isActive(href) ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"
            }`}>
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
