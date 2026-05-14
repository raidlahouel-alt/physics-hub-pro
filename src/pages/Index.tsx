import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { AnnouncementsSection } from '@/components/home/AnnouncementsSection';
import { RatingsSection } from '@/components/home/RatingsSection';
import { ParticlesBackground } from '@/components/common/ParticlesBackground';

const Index = () => {
  return (
    <Layout>
      <ParticlesBackground />
      <HeroSection />
      <AnnouncementsSection />
      <FeaturesSection />
      <RatingsSection />
    </Layout>
  );
};

export default Index;
