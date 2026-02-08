'use client';

import { Sidebar } from './sidebar';
import { Header } from './header';
import { MobileNav } from './mobile-nav';
import { VinnyChatPanel } from '@/components/vinny/vinny-chat-panel';
import { VinnyFab } from '@/components/vinny/vinny-fab';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6"
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* Vinny chat */}
      <VinnyChatPanel />
      <VinnyFab />
    </div>
  );
}
