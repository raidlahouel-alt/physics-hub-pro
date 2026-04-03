import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { GraduationCap, ArrowLeft, Atom, FlaskConical } from 'lucide-react';

const equations = [
  'E = mc²',
  'F = ma',
  'PV = nRT',
  'ΔG = ΔH - TΔS',
  'λ = h/p',
  'V = IR',
  'E = hν',
  'W = F·d',
];

export function HeroSection() {
  const { user } = useAuth();

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
      {/* Cosmic background */}
      <div className="absolute inset-0 hero-gradient" />
      
      {/* Animated blobs */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px] animate-float" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-accent/6 rounded-full blur-[100px] animate-float" style={{ animationDelay: '-4s' }} />
      <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full blur-[100px] animate-float" style={{ animationDelay: '-2s', background: 'hsl(280 75% 65% / 0.05)' }} />

      {/* Atom orbits */}
      <div className="atom-orbit w-[280px] h-[280px] top-[15%] right-[8%] hidden md:block" style={{ transform: 'rotateX(60deg)' }} />
      <div className="atom-orbit atom-orbit-2 w-[220px] h-[220px] bottom-[20%] left-[10%] hidden md:block" style={{ transform: 'rotateX(70deg) rotateZ(30deg)' }} />
      <div className="atom-orbit atom-orbit-3 w-[160px] h-[160px] top-[30%] left-[15%] hidden lg:block" style={{ transform: 'rotateX(50deg) rotateZ(-20deg)' }} />

      {/* Floating equations */}
      {equations.map((eq, i) => (
        <span
          key={i}
          className="floating-equation hidden md:block"
          style={{
            top: `${12 + (i * 10) % 70}%`,
            [i % 2 === 0 ? 'left' : 'right']: `${5 + (i * 7) % 15}%`,
            animationDelay: `${i * -2.5}s`,
            fontSize: `${10 + (i % 3) * 2}px`,
          }}
        >
          {eq}
        </span>
      ))}

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-8 animate-bounce-in">
            <Atom className="w-3.5 h-3.5 text-primary animate-spin-slow" />
            <span className="text-xs font-medium text-primary">منصة الفيزياء والكيمياء</span>
            <FlaskConical className="w-3.5 h-3.5 text-accent" />
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up leading-tight">
            <span className="text-foreground">تعلّم الفيزياء مع</span>
            <br />
            <span className="gradient-text">الأستاذ هزيل رفيق</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-10 animate-slide-up leading-relaxed" style={{ animationDelay: '0.15s' }}>
            دروس شاملة، ملخصات مركزة، وتمارين متنوعة لطلاب السنة الثانية ثانوي والبكالوريا
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            {user ? (
              <Button variant="hero" size="xl" asChild className="rounded-2xl">
                <Link to="/levels">
                  <GraduationCap className="w-5 h-5 ml-2" />
                  ابدأ التعلم
                  <ArrowLeft className="w-4 h-4 mr-1" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="hero" size="xl" asChild className="rounded-2xl group">
                  <Link to="/auth?mode=signup">
                    <Atom className="w-5 h-5 ml-2" />
                    سجّل الآن مجاناً
                    <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="rounded-2xl hover:border-primary/30 hover:bg-primary/5">
                  <Link to="/auth">
                    تسجيل الدخول
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 md:gap-14 mt-16 animate-slide-up" style={{ animationDelay: '0.45s' }}>
            {[
              { value: '24/7', label: 'متاح دائماً' },
              { value: '+100', label: 'دروس وتمارين' },
              { value: '2', label: 'مستويات' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-4xl font-bold gradient-text">{stat.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-5 h-9 rounded-full border-2 border-primary/20 flex items-start justify-center p-1.5">
          <div className="w-1 h-2.5 bg-primary/50 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
