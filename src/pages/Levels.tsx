import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { GraduationCap, BookOpen, ArrowLeft } from 'lucide-react';

const levels = [
  {
    id: 'second_year',
    title: 'السنة الثانية ثانوي',
    description: 'دروس وتمارين الفيزياء للسنة الثانية ثانوي - جميع الشعب',
    icon: BookOpen,
    color: 'from-primary to-blue-500',
    stats: { lessons: '∞', exercises: '∞' }
  },
  {
    id: 'baccalaureate',
    title: 'البكالوريا',
    description: 'دروس وتمارين الفيزياء لطلاب البكالوريا - التحضير للامتحان',
    icon: GraduationCap,
    color: 'from-accent to-cyan-500',
    stats: { lessons: '∞', exercises: '∞' }
  }
];

export default function Levels() {
  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">اختر مستواك الدراسي</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              محتوى تعليمي مخصص لكل مستوى مع دروس شاملة وتمارين متنوعة
            </p>
          </div>

          {/* Level Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {levels.map((level, index) => (
              <Link
                key={level.id}
                to={`/content/${level.id}`}
                className="group animate-slide-up"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="glass-card p-8 h-full hover:border-primary/50 transition-all duration-500 relative overflow-hidden">
                  {/* Background Glow */}
                  <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${level.color} opacity-20 rounded-full blur-3xl group-hover:opacity-40 transition-opacity`} />
                  
                  <div className="relative">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${level.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <level.icon className="w-8 h-8 text-primary-foreground" />
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {level.title}
                    </h2>

                    {/* Description */}
                    <p className="text-muted-foreground mb-6">
                      {level.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-6 mb-6">
                      <div>
                        <div className="text-2xl font-bold gradient-text">{level.stats.lessons}</div>
                        <div className="text-xs text-muted-foreground">درس</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold gradient-text">{level.stats.exercises}</div>
                        <div className="text-xs text-muted-foreground">تمرين</div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center gap-2 text-primary group-hover:gap-4 transition-all">
                      <span>ابدأ التعلم</span>
                      <ArrowLeft className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
