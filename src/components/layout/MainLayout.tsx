import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="main-layout flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
      <WhatsAppButton />
    </div>
  );
}