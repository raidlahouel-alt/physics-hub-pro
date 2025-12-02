import { BookOpen, Bell, FileText, Star } from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'دروس شاملة',
    description: 'دروس مفصلة تغطي جميع وحدات البرنامج الدراسي بطريقة واضحة ومنظمة'
  },
  {
    icon: FileText,
    title: 'ملخصات مركزة',
    description: 'ملخصات ذكية تساعدك على المراجعة السريعة قبل الامتحانات'
  },
  {
    icon: Star,
    title: 'تمارين متدرجة',
    description: 'تمارين بمستويات صعوبة مختلفة من نجمة إلى ثلاث نجوم'
  },
  {
    icon: Bell,
    title: 'إعلانات فورية',
    description: 'تنبيهات فورية عن مواعيد الدروس وأي تغييرات في الجدول'
  }
];

export function FeaturesSection() {
  return (
    <section className="py-20 relative">
      <div className="absolute inset-0 hero-gradient opacity-50" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text">لماذا تختار منصتنا؟</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            منصة متكاملة توفر لك كل ما تحتاجه للتفوق في مادة الفيزياء
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card p-6 hover:border-primary/50 transition-all duration-300 group animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
