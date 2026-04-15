import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { GraduationCap, BookOpen, ArrowLeft, Lock, Loader2, Atom, FlaskConical } from 'lucide-react';

const levels = [
  {
    id: 'second_year',
    title: 'السنة الثانية ثانوي',
    description: 'دروس وتمارين الفيزياء للسنة الثانية ثانوي - جميع الشعب',
    icon: BookOpen,
    color: 'from-primary to-accent',
    bgGlow: 'bg-primary/8',
    stats: { lessons: '∞', exercises: '∞' }
  },
  {
    id: 'baccalaureate',
    title: 'البكالوريا',
    description: 'دروس وتمارين الفيزياء لطلاب البكالوريا - التحضير للامتحان',
    icon: GraduationCap,
    color: 'from-accent to-primary',
    bgGlow: 'bg-accent/8',
    stats: { lessons: '∞', exercises: '∞' }
  }
];

export default function Levels() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-20">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-20 h-20 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-primary/60" />
            </div>
            <h2 className="text-2xl font-bold mb-4">يجب تسجيل الدخول</h2>
            <p className="text-muted-foreground mb-6">
              لعرض المستويات الدراسية والمحتوى التعليمي، يرجى تسجيل الدخول أو إنشاء حساب جديد
            </p>
            <Button variant="hero" asChild>
              <Link to="/auth">تسجيل الدخول</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] py-20 relative overflow-hidden">
        {/* Cosmic background elements */}
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] animate-float pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full blur-[100px] animate-float pointer-events-none" style={{ animationDelay: '-3s', background: 'hsl(280 75% 65% / 0.04)' }} />

        {/* Floating equations */}
        {['E = mc²', 'F = ma', 'PV = nRT', 'λ = h/p'].map((eq, i) => (
          <span
            key={i}
            className="floating-equation hidden md:block"
            style={{
              top: `${15 + i * 18}%`,
              [i % 2 === 0 ? 'left' : 'right']: `${4 + i * 5}%`,
              animationDelay: `${i * -3}s`,
            }}
          >
            {eq}
          </span>
        ))}

        <div className="container mx-auto px-4 relative z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-5 animate-bounce-in">
              <Atom className="w-3.5 h-3.5 text-primary animate-spin-slow" />
              <span className="text-xs font-medium text-primary">اختر مستواك</span>
              <FlaskConical className="w-3.5 h-3.5 text-accent" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-slide-up">
              <span className="gradient-text">اختر مستواك الدراسي</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              محتوى تعليمي مخصص لكل مستوى مع دروس شاملة وتمارين متنوعة
            </p>
          </div>

          {/* Level Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {levels.map((level, index) => (
              <Link
                key={level.id}
                to={`/content/${level.id}`}
                className="group animate-slide-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="glass-card p-8 h-full relative overflow-hidden">
                  {/* Background Glow */}
                  <div className={`absolute -top-20 -right-20 w-40 h-40 ${level.bgGlow} rounded-full blur-3xl group-hover:opacity-70 opacity-40 transition-opacity duration-500`} />
                  
                  {/* Atom orbit decoration */}
                  <div className="atom-orbit w-[100px] h-[100px] -top-6 -left-6 opacity-30 group-hover:opacity-60 transition-opacity" style={{ transform: 'rotateX(60deg)' }} />

                  <div className="relative">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${level.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}>
                      <level.icon className="w-8 h-8 text-primary-foreground" />
                    </div>

                    <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                      {level.title}
                    </h2>

                    <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                      {level.description}
                    </p>

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

                    <div className="flex items-center gap-2 text-primary group-hover:gap-4 transition-all duration-300">
                      <span className="text-sm font-medium">ابدأ التعلم</span>
                      <ArrowLeft className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Bottom gradient line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${level.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-right`} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
