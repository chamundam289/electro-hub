import { MainLayout } from '@/components/layout/MainLayout';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { LoyaltyCoinsSection } from '@/components/home/LoyaltyCoinsSection';
import { DealsSection } from '@/components/home/DealsSection';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import OAuthRedirectHandler from '@/components/auth/OAuthRedirectHandler';
import SimpleRedirectFix from '@/components/auth/SimpleRedirectFix';
import WelcomeDialog from '@/components/auth/WelcomeDialog';
// import CompactWelcomeDialog from '@/components/auth/CompactWelcomeDialog';
import { useWelcomeDialog } from '@/hooks/useWelcomeDialog';

const Index = () => {
  const { showWelcome, hideWelcome } = useWelcomeDialog();

  return (
    <>
      <SimpleRedirectFix />
      <OAuthRedirectHandler />
      
      {/* Welcome Dialog - Choose one */}
      <WelcomeDialog 
        open={showWelcome} 
        onClose={hideWelcome}
      />
      {/* Alternative: Compact Version */}
      {/* <CompactWelcomeDialog 
        open={showWelcome} 
        onClose={hideWelcome}
      /> */}
      
      <MainLayout>
        <HeroSection />
        <CategoriesSection />
        <FeaturedProducts />
        <LoyaltyCoinsSection />
        <DealsSection />
        <WhyChooseUs />
      </MainLayout>
    </>
  );
};

export default Index;