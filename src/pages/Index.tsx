import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { AnnouncementsSection } from '@/components/home/AnnouncementsSection';
import { PricingSection } from '@/components/home/PricingSection';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <AnnouncementsSection />
      <FeaturesSection />
      <PricingSection />
    </Layout>
  );
};

export default Index;
