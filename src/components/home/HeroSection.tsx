import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Atom, Sparkles, GraduationCap, Zap, Star } from 'lucide-react';

export function HeroSection() {
  const { user } = useAuth();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-success/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-5s' }} />
      
      {/* Floating Elements */}
      <Atom className="absolute top-20 right-20 w-12 h-12 text-primary/30 animate-spin-slow" />
      <Atom className="absolute bottom-32 left-32 w-8 h-8 text-accent/30 animate-float" style={{ animationDelay: '-2s' }} />
      <Atom className="absolute top-1/3 left-20 w-10 h-10 text-primary/20 animate-float" style={{ animationDelay: '-4s' }} />
      <Star className="absolute top-40 left-1/4 w-6 h-6 text-warning/40 animate-pulse" />
      <Zap className="absolute bottom-40 right-1/4 w-8 h-8 text-accent/30 animate-bounce-soft" />
      
      {/* Particle effect */}
      <div className="absolute inset-0 particles opacity-30" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-bounce-in hover:bg-primary/20 transition-colors cursor-default">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm text-primary font-medium">منصة تعليمية متكاملة</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up">
            <span className="text-foreground">تعلّم الفيزياء مع</span>
            <br />
            <span className="gradient-text animate-gradient bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto]">الأستاذ هزيل رفيق</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            دروس شاملة، ملخصات مركزة، وتمارين متنوعة لطلاب السنة الثانية ثانوي والبكالوريا
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            {user ? (
              <Button variant="hero" size="xl" asChild>
                <Link to="/levels">
                  <GraduationCap className="w-5 h-5 ml-2" />
                  ابدأ التعلم
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="hero" size="xl" asChild className="group">
                  <Link to="/auth?mode=signup">
                    <GraduationCap className="w-5 h-5 ml-2 group-hover:animate-bounce" />
                    سجّل الآن مجاناً
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild className="hover:border-primary/50 hover:bg-primary/5 transition-all duration-300">
                  <Link to="/auth">
                    تسجيل الدخول
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 md:gap-12 max-w-2xl mx-auto mt-16 animate-slide-up" style={{ animationDelay: '0.6s' }}>
            {[
              { value: '24/7', label: 'متاح دائماً', hasIcon: false },
              { value: '∞', label: 'دروس وتمارين', hasIcon: true },
              { value: '2', label: 'مستويات', hasIcon: false }
            ].map((stat, index) => (
              <div 
                key={index} 
                className="text-center group cursor-default"
              >
                <div className="relative inline-flex flex-col items-center">
                  {/* Glow effect behind */}
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Icon for middle stat */}
                  {stat.hasIcon && (
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent p-[2px] mb-3 group-hover:scale-110 transition-transform duration-300">
                      <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                        <Atom className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  )}
                  
                  {/* Value */}
                  <div className="text-3xl md:text-5xl font-bold text-primary group-hover:scale-110 transition-transform duration-300">
                    {stat.value}
                  </div>
                  
                  {/* Label */}
                  <div className="text-sm md:text-base text-muted-foreground mt-1 group-hover:text-foreground transition-colors duration-300">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
              <div className="w-1.5 h-3 bg-primary/60 rounded-full animate-fade-in" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}