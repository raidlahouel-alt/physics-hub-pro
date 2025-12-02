import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Atom, Sparkles, GraduationCap } from 'lucide-react';

export function HeroSection() {
  const { user } = useAuth();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
      
      {/* Floating Atoms */}
      <Atom className="absolute top-20 right-20 w-12 h-12 text-primary/30 animate-float" />
      <Atom className="absolute bottom-32 left-32 w-8 h-8 text-accent/30 animate-float" style={{ animationDelay: '-2s' }} />
      <Atom className="absolute top-1/3 left-20 w-10 h-10 text-primary/20 animate-float" style={{ animationDelay: '-4s' }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary">منصة تعليمية متكاملة</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up">
            <span className="text-foreground">تعلّم الفيزياء مع</span>
            <br />
            <span className="gradient-text">الأستاذ هزيل رفيق</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            دروس شاملة، ملخصات مركزة، وتمارين متنوعة لطلاب السنة الثانية ثانوي والبكالوريا
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            {user ? (
              <>
                <Button variant="hero" size="xl" asChild>
                  <Link to="/levels">
                    <GraduationCap className="w-5 h-5 ml-2" />
                    ابدأ التعلم
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <Link to="/chat">
                    <Sparkles className="w-5 h-5 ml-2" />
                    المساعد الذكي
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="hero" size="xl" asChild>
                  <Link to="/auth?mode=signup">
                    <GraduationCap className="w-5 h-5 ml-2" />
                    سجّل الآن مجاناً
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <Link to="/auth">
                    تسجيل الدخول
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mt-16 animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text">2</div>
              <div className="text-sm text-muted-foreground">مستويات</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text">∞</div>
              <div className="text-sm text-muted-foreground">دروس وتمارين</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text">24/7</div>
              <div className="text-sm text-muted-foreground">متاح دائماً</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
