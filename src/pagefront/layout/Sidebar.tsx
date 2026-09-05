'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useLocale } from '@/pagefront/providers/LocaleProvider';
import { useSidebar } from '@/pagefront/providers/SidebarProvider';
import { HugeiconsIcon } from '@hugeicons/react';
import { LayoutDashboardIcon, HierarchyIcon, Briefcase06Icon, User03Icon, Task01Icon, MicVocalIcon, ChatBotIcon } from '@hugeicons/core-free-icons';

const navItems = [
  {
    href: '/dashboard',
    icon: <HugeiconsIcon icon={LayoutDashboardIcon} size={18} />,
    key: 'nav.dashboard' as const,
  },
  {
    href: '/dashboard/employees',
    icon: <HugeiconsIcon icon={HierarchyIcon} size={18} />,
    key: 'nav.personnel' as const,
  },
  {
    href: '/dashboard/vacancies',
    icon: <HugeiconsIcon icon={Briefcase06Icon} size={18} />,
    key: 'nav.vacancies' as const,
  },
  {
    href: '/dashboard/candidates',
    icon: <HugeiconsIcon icon={User03Icon} size={18} />,
    key: 'nav.candidates' as const,
  },
  {
    href: '/dashboard/applications',
    icon: <HugeiconsIcon icon={Task01Icon} size={18} />,
    key: 'nav.applications' as const,
  },
  {
    href: '/dashboard/interviews',
    icon: <HugeiconsIcon icon={MicVocalIcon} size={18} />,
    key: 'nav.interviews' as const,
  },
  {
    href: '/dashboard/ai-agent',
    icon: <HugeiconsIcon icon={ChatBotIcon} size={18} />,
    key: 'nav.aiAgent' as const,
  },
];








export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLocale();
  const { isMobileOpen, closeMobile } = useSidebar();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity duration-300 animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-72 lg:w-64 border-r border-rose-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl lg:shadow-xs flex flex-col transition-transform duration-300 ease-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Part: Logo & Navigation */}
        <div className="flex-1 overflow-y-auto">
          {/* Logo & Mobile Close Button */}
          <div className="flex h-16 items-center justify-between px-5 sm:px-6 border-b border-rose-50 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-rose-600 flex items-center justify-center text-sm font-bold text-white shadow-md shadow-pink-500/20">
                HR
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100">HR AI Agent</h1>
                <p className="text-[11px] text-pink-600 dark:text-pink-400 font-semibold">Recruitment System</p>
              </div>
            </div>

            {/* Close Button on Mobile */}
            <button
              onClick={closeMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="px-3 py-4 space-y-1.5">
            {navItems.map((item) => {
              const isActive = item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobile}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group active:scale-[0.98] ${
                    isActive
                      ? 'bg-pink-50 dark:bg-pink-950/40 text-pink-900 dark:text-pink-300 font-bold border border-pink-200/80 dark:border-pink-800/60 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-pink-800 dark:hover:text-pink-300 hover:bg-pink-50/50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className={`text-base transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                    {item.icon}
                  </span>
                  <span>{t(item.key)}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-pink-600 dark:bg-pink-400 animate-pulse shadow-xs" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Footer Info */}
        <div className="p-4 border-t border-rose-50 dark:border-slate-800 bg-rose-50/20 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
            <span>Live Sync with Supabase</span>
          </div>
        </div>
      </aside>
    </>
  );
}
