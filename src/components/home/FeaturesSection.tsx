import { BookOpen, Bell, FileText, Star, Zap, Users, Atom, FlaskConical, Lightbulb, Beaker, Microscope, Orbit } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const features = [
  {
    icon: Atom,
    title: 'دروس الفيزياء',
    description: 'دروس مفصلة تغطي جميع وحدات الفيزياء بطريقة علمية واضحة',
  },
  {
    icon: FlaskConical,
    title: 'تجارب وتطبيقات',
    description: 'ملخصات ذكية تساعدك على المراجعة السريعة قبل الامتحانات',
  },
  {
    icon: Lightbulb,
    title: 'تمارين متدرجة',
    description: 'تمارين بمستويات صعوبة مختلفة لتعزيز الفهم والتطبيق',
  },
  {
    icon: Bell,
    title: 'إعلانات فورية',
    description: 'تنبيهات فورية عن مواعيد الدروس وأي تغييرات في الجدول',
  },
  {
    icon: Zap,
    title: 'تفاعل مباشر',
    description: 'اطرح أسئلتك واحصل على إجابات من الأستاذ مباشرة',
  },
  {
    icon: Users,
    title: 'مجتمع طلابي',
    description: 'تواصل مع زملائك وشارك في النقاشات العلمية',
  }
];

export function FeaturesSection() {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section ref={ref} className="py-24 relative particles">
      <div className="container mx-auto px-4 relative z-10">
        <div className={`text-center mb-14 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-5">
            <Orbit className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">مميزات حصرية</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="gradient-text">لماذا تختار منصتنا؟</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm">
            منصة متكاملة توفر لك كل ما تحتاجه للتفوق في الفيزياء والكيمياء
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`glass-card p-6 group cursor-default relative overflow-hidden transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-400">
                <feature.icon className="w-5.5 h-5.5 text-primary" />
              </div>
              
              <h3 className="text-lg font-semibold mb-1.5 text-foreground group-hover:text-primary transition-colors duration-300 relative">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed relative">
                {feature.description}
              </p>

              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-right" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
