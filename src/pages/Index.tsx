import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { AnnouncementsSection } from '@/components/home/AnnouncementsSection';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <AnnouncementsSection />
      <FeaturesSection />
    </Layout>
  );
};

export default Index;
