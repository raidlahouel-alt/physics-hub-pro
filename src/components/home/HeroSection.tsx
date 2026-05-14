import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  GraduationCap,
  ArrowLeft,
  Atom,
  FlaskConical,
  Sparkles,
  Rocket,
  Star,
  Headphones,
  BookOpen,
  Users,
  ShieldCheck,
} from 'lucide-react';

const equations = [
  'E = mc²',
  'F = ma',
  'PV = nRT',
  'ΔG = ΔH - TΔS',
  'λ = h/p',
  'V = IR',
  'E = hν',
  'W = F·d',
  'a = Δv/Δt',
  'P = W/t',
  'Q = mcΔT',
  'pH = -log[H⁺]',
];

const stats = [
  { icon: Headphones, value: '24/7', label: 'دعم دائم', sub: 'نحن هنا لمساعدتك دائماً' },
  { icon: BookOpen, value: '+100', label: 'درس وتجربة', sub: 'دروس شاملة ومبسّطة' },
  { icon: Users, value: '+500', label: 'طالب', sub: 'من مختلف الولايات' },
  { icon: ShieldCheck, value: '98%', label: 'معدل رضا', sub: 'جودة موثوقة ونتائج مضمونة' },
];

export function HeroSection() {
  const { user } = useAuth();
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('platform_ratings').select('rating');
      if (data && data.length > 0) {
        const avg = data.reduce((s, r) => s + (r.rating || 0), 0) / data.length;
        setAvgRating(Number(avg.toFixed(1)));
        setRatingCount(data.length);
      }
    })();
  }, []);

  return (
    <section className="relative pt-16 pb-24 overflow-hidden">
      {/* Cosmic background */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute top-10 right-[10%] w-[560px] h-[560px] bg-primary/15 rounded-full blur-[160px] animate-float" />
      <div className="absolute bottom-0 left-[5%] w-[520px] h-[520px] bg-accent/12 rounded-full blur-[140px] animate-float" style={{ animationDelay: '-4s' }} />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full blur-[140px] animate-float" style={{ animationDelay: '-2s', background: 'hsl(280 75% 65% / 0.12)' }} />
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(hsl(var(--foreground))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground))_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

      {/* Atom orbits decoration - bigger and more dramatic */}
      <div className="atom-orbit w-[420px] h-[420px] top-[8%] left-[2%] hidden lg:block opacity-60" style={{ transform: 'rotateX(65deg)' }} />
      <div className="atom-orbit atom-orbit-2 w-[320px] h-[320px] bottom-[15%] right-[3%] hidden lg:block opacity-50" style={{ transform: 'rotateX(70deg) rotateZ(30deg)' }} />
      <div className="atom-orbit w-[200px] h-[200px] top-[55%] left-[40%] hidden lg:block opacity-30" style={{ transform: 'rotateX(75deg) rotateZ(60deg)', animationDuration: '25s' }} />

      {/* Floating equations */}
      {equations.map((eq, i) => (
        <span
          key={i}
          className="floating-equation hidden md:block"
          style={{
            top: `${12 + (i * 9) % 70}%`,
            [i % 2 === 0 ? 'left' : 'right']: `${4 + (i * 6) % 14}%`,
            animationDelay: `${i * -2.5}s`,
            fontSize: `${11 + (i % 3) * 2}px`,
          }}
        >
          {eq}
        </span>
      ))}

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge with live pulse */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-primary/30 mb-8 animate-bounce-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <FlaskConical className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-semibold">منصة الفيزياء والكيمياء — الأستاذ هزيل رفيق</span>
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[88px] font-bold mb-6 leading-[1.05] tracking-tight animate-slide-up">
            <span className="text-foreground">تعلّم</span>{' '}
            <span className="gradient-text">الفيزياء</span>
            <br />
            <span className="text-foreground">و</span>
            <span className="gradient-text">الكيمياء</span>
            <br />
            <span className="text-foreground/80 text-3xl md:text-5xl lg:text-6xl">بطريقة عصرية</span>
          </h1>

          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.15s' }}>
            دروس مبسّطة، ملخصات مركّزة، وتمارين محلولة خطوة بخطوة لطلاب السنة الثانية ثانوي والبكالوريا.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12 animate-slide-up" style={{ animationDelay: '0.25s' }}>
            {user ? (
              <Button variant="hero" size="xl" asChild className="rounded-2xl group min-w-[220px] shadow-glow">
                <Link to="/levels">
                  <Rocket className="w-5 h-5 ml-2" />
                  ابدأ التعلم الآن
                  <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                </Link>
              </Button>
            ) : (
              <Button variant="hero" size="xl" asChild className="rounded-2xl group min-w-[220px] shadow-glow">
                <Link to="/auth?mode=signup">
                  <Rocket className="w-5 h-5 ml-2" />
                  ابدأ مجاناً الآن
                  <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                </Link>
              </Button>
            )}
            <Button variant="outline" size="xl" asChild className="rounded-2xl border-primary/30 backdrop-blur-md bg-card/40 min-w-[180px]">
              <Link to={user ? '/levels' : '/auth'}>
                <BookOpen className="w-4 h-4 ml-2" />
                شاهد الدروس
              </Link>
            </Button>
          </div>

          {/* Rating row from real data */}
          <div className="flex items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.35s' }}>
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    avgRating && i < Math.round(avgRating)
                      ? 'fill-warning text-warning'
                      : 'fill-muted text-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                {avgRating !== null ? `${avgRating}/5 · ` : ''}
                <span className="text-muted-foreground font-normal">
                  {ratingCount > 0 ? `${ratingCount} تقييم` : 'كن أول من يقيّم المنصة'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-16 max-w-5xl mx-auto glass-card p-5 md:p-7 rounded-3xl animate-slide-up shadow-elevated" style={{ animationDelay: '0.45s' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {stats.map((s, i) => (
              <div key={i} className="flex items-center gap-3 group p-2 rounded-2xl hover:bg-primary/5 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border border-primary/10">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl md:text-2xl font-bold gradient-text">{s.value}</span>
                    <span className="text-xs md:text-sm font-semibold text-foreground">{s.label}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
