import { BookOpen, Bell, FileText, Star, Zap, Users } from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'دروس شاملة',
    description: 'دروس مفصلة تغطي جميع وحدات البرنامج الدراسي بطريقة واضحة ومنظمة',
    gradient: 'from-primary to-accent'
  },
  {
    icon: FileText,
    title: 'ملخصات مركزة',
    description: 'ملخصات ذكية تساعدك على المراجعة السريعة قبل الامتحانات',
    gradient: 'from-accent to-success'
  },
  {
    icon: Star,
    title: 'تمارين متدرجة',
    description: 'تمارين بمستويات صعوبة مختلفة من نجمة إلى ثلاث نجوم',
    gradient: 'from-warning to-destructive'
  },
  {
    icon: Bell,
    title: 'إعلانات فورية',
    description: 'تنبيهات فورية عن مواعيد الدروس وأي تغييرات في الجدول',
    gradient: 'from-primary to-primary'
  },
  {
    icon: Zap,
    title: 'تفاعل مباشر',
    description: 'اطرح أسئلتك واحصل على إجابات من الأستاذ مباشرة',
    gradient: 'from-success to-accent'
  },
  {
    icon: Users,
    title: 'مجتمع طلابي',
    description: 'تواصل مع زملائك وشارك في النقاشات العلمية',
    gradient: 'from-accent to-primary'
  }
];

export function FeaturesSection() {
  return (
    <section className="py-20 relative particles">
      <div className="absolute inset-0 hero-gradient opacity-50" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6 animate-bounce-in">
            <Zap className="w-4 h-4 text-accent animate-pulse" />
            <span className="text-sm text-accent">مميزات حصرية</span>
          </div>
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
              className="glass-card p-6 group cursor-pointer icon-bounce animate-slide-up relative overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Icon container with animation */}
              <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} p-[1px] mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                <div className="w-full h-full rounded-xl bg-card flex items-center justify-center">
                  <feature.icon className={`w-6 h-6 bg-gradient-to-br ${feature.gradient} bg-clip-text`} style={{ color: 'hsl(var(--primary))' }} />
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors duration-300 relative">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm relative">
                {feature.description}
              </p>

              {/* Bottom line animation */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-right" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}