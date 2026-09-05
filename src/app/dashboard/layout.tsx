'use client';

import { Sidebar } from '@/pagefront/layout/Sidebar';
import { Header } from '@/pagefront/layout/Header';
import { SidebarProvider } from '@/pagefront/providers/SidebarProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        <Sidebar />
        <div className="lg:ml-64 ml-0 flex flex-col min-h-screen transition-all duration-300">
          <Header />
          <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

