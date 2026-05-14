import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Star, Quote, MessageSquarePlus, Sparkles } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Rating {
  id: string;
  rater_name: string;
  rating: number;
  comment: string | null;
  target: string;
  created_at: string;
}

export function RatingsSection() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { ref, isVisible } = useScrollAnimation(0.1);

  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [comment, setComment] = useState('');
  const [target, setTarget] = useState<'platform' | 'teacher'>('platform');

  const fetchRatings = useCallback(async () => {
    const { data } = await supabase
      .from('platform_ratings')
      .select('id, rater_name, rating, comment, target, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setRatings(data as Rating[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRatings();
    const ch = supabase
      .channel('platform-ratings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_ratings' }, fetchRatings)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchRatings]);

  useEffect(() => {
    if (profile?.full_name && !name) setName(profile.full_name);
  }, [profile, name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stars < 1) {
      toast({ title: 'اختر عدد النجوم', variant: 'destructive' });
      return;
    }
    if (!name.trim()) {
      toast({ title: 'أدخل اسمك', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('platform_ratings').insert({
      user_id: user?.id ?? null,
      rater_name: name.trim(),
      rating: stars,
      comment: comment.trim() || null,
      target,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'تعذّر إرسال التقييم', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'شكراً لك!', description: 'تم إرسال تقييمك بنجاح' });
    setStars(0); setComment('');
    fetchRatings();
  };

  const avgPlatform = computeAvg(ratings, 'platform');
  const avgTeacher = computeAvg(ratings, 'teacher');

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 right-1/4 w-[420px] h-[420px] bg-accent/10 rounded-full blur-[140px] -translate-y-1/2" />
      <div className="absolute top-10 left-1/4 w-[320px] h-[320px] bg-primary/10 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative">
        <div className={`text-center mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-semibold mb-4 border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>آراء الطلبة والزوار</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-3">قيّم تجربتك معنا</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            رأيك يهمّنا — قيّم المنصة والأستاذ وساعدنا على التطور
          </p>
        </div>

        {/* Aggregate */}
        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-10">
          <AvgCard label="تقييم المنصة" avg={avgPlatform.avg} count={avgPlatform.count} />
          <AvgCard label="تقييم الأستاذ" avg={avgTeacher.avg} count={avgTeacher.count} />
        </div>

        <div className="grid lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 glass-card p-6 rounded-3xl space-y-4 h-fit lg:sticky lg:top-24">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquarePlus className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold">شاركنا رأيك</h3>
            </div>

            <div className="flex gap-2">
              {(['platform', 'teacher'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTarget(t)}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    target === t
                      ? 'bg-primary text-primary-foreground border-primary shadow-glow'
                      : 'bg-card/50 border-border/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t === 'platform' ? 'المنصة' : 'الأستاذ'}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-medium mb-2 block">التقييم</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHoverStars(n)}
                    onMouseLeave={() => setHoverStars(0)}
                    onClick={() => setStars(n)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        n <= (hoverStars || stars)
                          ? 'fill-warning text-warning'
                          : 'fill-transparent text-muted-foreground/40'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block">الاسم</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسمك"
                maxLength={60}
                className="rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block">تعليقك (اختياري)</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="اكتب رأيك..."
                maxLength={500}
                rows={3}
                className="rounded-xl resize-none"
              />
            </div>

            <Button
              type="submit"
              variant="hero"
              disabled={submitting}
              className="w-full rounded-xl"
            >
              {submitting ? 'جاري الإرسال...' : 'أرسل التقييم'}
            </Button>
          </form>

          {/* List */}
          <div className="lg:col-span-3 space-y-3">
            {loading ? (
              <div className="text-center text-muted-foreground text-sm py-10">جاري التحميل...</div>
            ) : ratings.length === 0 ? (
              <div className="glass-card p-10 text-center rounded-3xl">
                <Quote className="w-10 h-10 mx-auto text-primary/40 mb-3" />
                <p className="text-muted-foreground">لا توجد تقييمات بعد — كن أول من يشارك رأيه!</p>
              </div>
            ) : (
              ratings.map((r, i) => (
                <div
                  key={r.id}
                  className={`glass-card p-5 rounded-2xl border-r-[3px] border-r-primary/40 transition-all duration-500 hover:shadow-elevated ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                  style={{ transitionDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {r.rater_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{r.rater_name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {format(new Date(r.created_at), 'd MMM yyyy', { locale: ar })}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-secondary px-2 py-1 rounded-full font-medium">
                      {r.target === 'teacher' ? 'الأستاذ' : 'المنصة'}
                    </span>
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`w-3.5 h-3.5 ${n <= r.rating ? 'fill-warning text-warning' : 'fill-transparent text-muted-foreground/30'}`}
                      />
                    ))}
                  </div>
                  {r.comment && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function computeAvg(list: Rating[], target: string) {
  const filtered = list.filter((r) => r.target === target);
  if (filtered.length === 0) return { avg: 0, count: 0 };
  const avg = filtered.reduce((s, r) => s + r.rating, 0) / filtered.length;
  return { avg: Number(avg.toFixed(1)), count: filtered.length };
}

function AvgCard({ label, avg, count }: { label: string; avg: number; count: number }) {
  return (
    <div className="glass-card p-5 rounded-2xl text-center">
      <div className="text-xs text-muted-foreground mb-1.5">{label}</div>
      <div className="flex items-center justify-center gap-2 mb-1">
        <span className="text-3xl font-bold gradient-text">{avg > 0 ? avg : '—'}</span>
        <div className="flex">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={`w-4 h-4 ${n <= Math.round(avg) ? 'fill-warning text-warning' : 'fill-transparent text-muted-foreground/30'}`}
            />
          ))}
        </div>
      </div>
      <div className="text-[11px] text-muted-foreground">{count} تقييم</div>
    </div>
  );
}
