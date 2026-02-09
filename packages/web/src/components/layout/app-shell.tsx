'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { MobileNav } from './mobile-nav';
import dynamic from 'next/dynamic';
import { VinnyFab } from '@/components/vinny/vinny-fab';
import { OnboardingWizard } from '@/components/onboarding';

const VinnyChatPanel = dynamic(
  () => import('@/components/vinny/vinny-chat-panel').then(mod => ({ default: mod.VinnyChatPanel })),
  { ssr: false }
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Auth pages use their own layout — skip the app shell
  if (pathname.startsWith('/auth')) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Onboarding overlay (first visit only) */}
      <OnboardingWizard />

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
