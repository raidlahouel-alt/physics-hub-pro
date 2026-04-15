import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { AnnouncementsSection } from '@/components/home/AnnouncementsSection';
import { ParticlesBackground } from '@/components/common/ParticlesBackground';

const Index = () => {
  return (
    <Layout>
      <ParticlesBackground />
      <HeroSection />
      <AnnouncementsSection />
      <FeaturesSection />
    </Layout>
  );
};

export default Index;
