import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const features = [
  'الوصول لجميع الدروس والملخصات',
  'تمارين متنوعة بمستويات مختلفة',
  'المساعد الذكي للإجابة على أسئلتك',
  'إشعارات فورية بالإعلانات',
  'دعم فني مستمر',
];

export function PricingSection() {
  const { user } = useAuth();

  return (
    <section className="py-20 relative">
      <div className="absolute inset-0 hero-gradient opacity-30" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text">الاشتراك الشهري</span>
          </h2>
          <p className="text-muted-foreground">استثمر في مستقبلك التعليمي</p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="glass-card p-8 border-2 border-primary/50 relative overflow-hidden">
            {/* Glow Effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
            
            <div className="relative">
              {/* Price */}
              <div className="text-center mb-8">
                <div className="text-5xl font-bold gradient-text mb-2">
                  2,500 <span className="text-2xl">دج</span>
                </div>
                <div className="text-muted-foreground">شهرياً</div>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-foreground text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Payment Methods */}
              <div className="flex items-center justify-center gap-4 mb-6 text-sm text-muted-foreground">
                <span className="px-3 py-1 rounded-full bg-secondary">CCP</span>
                <span className="px-3 py-1 rounded-full bg-secondary">البطاقة الذهبية</span>
              </div>

              {/* CTA */}
              <Button variant="hero" size="xl" className="w-full" asChild>
                <Link to={user ? '/payment' : '/auth?mode=signup'}>
                  <CreditCard className="w-5 h-5 ml-2" />
                  {user ? 'ادفع الآن' : 'سجّل واشترك'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
