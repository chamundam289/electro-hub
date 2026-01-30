import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { LazyWrapper } from '@/components/ui/LazyWrapper';
import { HeaderShimmer, FooterShimmer } from '@/components/ui/Shimmer';
import { Suspense } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="main-layout flex min-h-screen flex-col">
      <Suspense fallback={<HeaderShimmer />}>
        <LazyWrapper delay={0} fallback={<HeaderShimmer />}>
          <Header />
        </LazyWrapper>
      </Suspense>
      
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      
      <Suspense fallback={<FooterShimmer />}>
        <LazyWrapper delay={100} fallback={<FooterShimmer />}>
          <Footer />
        </LazyWrapper>
      </Suspense>
      
      <MobileBottomNav />
    </div>
  );
}