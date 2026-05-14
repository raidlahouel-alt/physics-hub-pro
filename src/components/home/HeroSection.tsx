import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  GraduationCap,
  ArrowLeft,
  Atom,
  FlaskConical,
  Play,
  Rocket,
  Star,
  Headphones,
  BookOpen,
  Users,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Video,
} from 'lucide-react';
import teacherPhoto from '@/assets/teacher-rafiq.png';

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

const stats = [
  { icon: Headphones, value: '24/7', label: 'دعم دائم', sub: 'نحن هنا لمساعدتك دائماً' },
  { icon: BookOpen, value: '+100', label: 'درس وتجربة', sub: 'دروس شاملة ومبسّطة' },
  { icon: Users, value: '+500', label: 'طالب', sub: 'من مختلف الولايات' },
  { icon: ShieldCheck, value: '98%', label: 'معدل رضا', sub: 'جودة موثوقة ونتائج مضمونة' },
];

export function HeroSection() {
  const { user } = useAuth();

  return (
    <section className="relative pt-10 pb-20 overflow-hidden">
      {/* Cosmic background */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute top-20 right-[15%] w-[480px] h-[480px] bg-primary/10 rounded-full blur-[140px] animate-float" />
      <div className="absolute bottom-10 left-[10%] w-[420px] h-[420px] bg-accent/8 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-4s' }} />
      <div className="absolute top-1/3 left-1/2 w-[340px] h-[340px] rounded-full blur-[120px] animate-float" style={{ animationDelay: '-2s', background: 'hsl(280 75% 65% / 0.08)' }} />

      {/* Atom orbits decoration */}
      <div className="atom-orbit w-[260px] h-[260px] top-[10%] left-[5%] hidden lg:block" style={{ transform: 'rotateX(60deg)' }} />
      <div className="atom-orbit atom-orbit-2 w-[200px] h-[200px] bottom-[25%] right-[8%] hidden lg:block" style={{ transform: 'rotateX(70deg) rotateZ(30deg)' }} />

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
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* RIGHT (in RTL = first column): Teacher portrait */}
          <div className="lg:col-span-3 order-2 lg:order-1 animate-slide-up">
            <div className="relative glass-card p-4 rounded-3xl overflow-hidden group">
              {/* decorative icons */}
              <span className="absolute top-3 right-3 text-primary/40 font-english text-xs">F = ma</span>
              <span className="absolute bottom-20 left-3 text-accent/40 font-english text-xs">E = mc²</span>
              <Atom className="absolute top-1/2 right-3 w-6 h-6 text-primary/30 animate-spin-slow" />
              <FlaskConical className="absolute top-12 left-3 w-6 h-6 text-accent/40" />

              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/10 aspect-[3/4]">
                <img
                  src={teacherPhoto}
                  alt="الأستاذ هزيل رفيق - أستاذ الفيزياء والكيمياء"
                  className="w-full h-full object-cover object-top"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
              </div>

              {/* card footer */}
              <div className="mt-3 flex items-center gap-3 p-3 rounded-2xl bg-card/60 border border-border/40">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">الأستاذ هزيل رفيق</div>
                  <div className="text-[11px] text-muted-foreground">أستاذ الفيزياء والكيمياء</div>
                  <div className="text-[11px] text-primary mt-0.5">خبرة لأكثر من 8 سنوات</div>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER: Hero text */}
          <div className="lg:col-span-6 order-1 lg:order-2 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border-primary/20 mb-6 animate-bounce-in">
              <FlaskConical className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-medium">منصة الفيزياء والكيمياء</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-[64px] font-bold mb-5 leading-[1.15] animate-slide-up">
              <span className="text-foreground">تعلّم الفيزياء والكيمياء</span>
              <br />
              <span className="gradient-text">مع الأستاذ رفيق</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed animate-slide-up" style={{ animationDelay: '0.15s' }}>
              دروس مبسّطة، ملخصات مركّزة، وتمارين محلولة خطوة بخطوة لطلاب السنة الثانية ثانوي والبكالوريا.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 animate-slide-up" style={{ animationDelay: '0.25s' }}>
              {user ? (
                <Button variant="hero" size="xl" asChild className="rounded-2xl group">
                  <Link to="/levels">
                    <Rocket className="w-5 h-5 ml-2" />
                    ابدأ التعلم الآن
                    <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                  </Link>
                </Button>
              ) : (
                <Button variant="hero" size="xl" asChild className="rounded-2xl group">
                  <Link to="/auth?mode=signup">
                    <Rocket className="w-5 h-5 ml-2" />
                    ابدأ أول درس مجاناً
                    <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="xl" asChild className="rounded-2xl border-border/60">
                <Link to={user ? '/levels' : '/auth'}>
                  <Play className="w-4 h-4 ml-2 fill-current" />
                  شاهد الدروس
                </Link>
              </Button>
            </div>

            {/* Rating row */}
            <div className="flex items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.35s' }}>
              <div className="flex -space-x-2 space-x-reverse">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-background bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center text-[10px] font-bold text-foreground"
                  >
                    {['أ', 'م', 'ي', 'س'][i]}
                  </div>
                ))}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <Star className="w-4 h-4 fill-warning text-warning" />
                  تقييم 4.9/5
                </div>
                <div className="text-xs text-muted-foreground">+500 طالب راضٍ</div>
              </div>
            </div>
          </div>

          {/* LEFT: Lesson preview card */}
          <div className="lg:col-span-3 order-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="glass-card p-5 rounded-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-semibold text-primary">درس جديد</span>
              </div>

              <h3 className="text-lg font-bold mb-1">الحركة والقوى</h3>
              <p className="text-xs text-muted-foreground mb-4">في بُعد واحد</p>

              {/* Mini physics illustration */}
              <div className="relative h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border/40 mb-4 overflow-hidden">
                <div className="absolute top-1/2 right-4 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg" />
                <div className="absolute top-1/2 right-12 -translate-y-1/2 left-4 h-px bg-gradient-to-l from-primary to-transparent" />
                <span className="absolute top-1/2 left-4 -translate-y-1/2 text-primary font-english text-sm font-bold">F →</span>
                <button className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-card/80 backdrop-blur flex items-center justify-center border border-border/60">
                  <Play className="w-3 h-3 fill-primary text-primary" />
                </button>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {[
                  { icon: CheckCircle2, label: 'تمارين محلولة' },
                  { icon: FileText, label: 'ملخص' },
                  { icon: Video, label: 'فيديو' },
                ].map((t, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/60 text-[10px] text-muted-foreground border border-border/40">
                    <t.icon className="w-3 h-3" />
                    {t.label}
                  </span>
                ))}
              </div>

              <Button variant="outline" size="sm" asChild className="w-full rounded-xl bg-card/40">
                <Link to={user ? '/levels' : '/auth'}>
                  شاهد الآن
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-14 glass-card p-5 md:p-6 rounded-3xl animate-slide-up" style={{ animationDelay: '0.45s' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {stats.map((s, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
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
