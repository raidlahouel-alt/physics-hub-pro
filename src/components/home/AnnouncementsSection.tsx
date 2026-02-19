import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Announcement, StudentLevel } from '@/lib/types';
import { Bell, Calendar, Megaphone, Info, ChevronLeft, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export function AnnouncementsSection() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const { ref, isVisible } = useScrollAnimation(0.1);

  const fetchAnnouncements = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('id, title, content, level, is_active, created_by, created_at, scheduled_date')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching announcements:', error);
        setLoading(false);
        return;
      }
      
      if (data) {
        const formattedData: Announcement[] = data.map(item => ({
          id: item.id,
          title: item.title,
          content: item.content,
          level: item.level as StudentLevel | null,
          is_active: item.is_active ?? true,
          created_by: item.created_by,
          created_at: item.created_at ?? '',
          scheduled_date: item.scheduled_date ?? null
        }));
        setAnnouncements(formattedData);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchAnnouncements();
    }
  }, [user, authLoading, fetchAnnouncements]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('announcements-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAnnouncements]);

  // Login prompt
  if (!user && !authLoading) {
    return (
      <section ref={ref} className="py-20 relative overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <div className={`text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="inline-flex items-center gap-2 bg-primary/8 text-primary px-4 py-1.5 rounded-full text-xs font-medium mb-4 border border-primary/15">
              <Bell className="w-3.5 h-3.5" />
              <span>إعلانات جديدة</span>
            </div>
            <h2 className="text-3xl font-bold gradient-text mb-4">آخر الإعلانات والأخبار</h2>
            
            <div className="max-w-sm mx-auto mt-8 glass-card p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">سجّل الدخول لمشاهدة الإعلانات</h3>
              <p className="text-muted-foreground text-sm mb-6">
                الإعلانات متاحة فقط للطلبة المسجلين في المنصة
              </p>
              <Link to="/auth">
                <Button variant="hero" className="rounded-xl">
                  تسجيل الدخول
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (loading || authLoading) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-muted-foreground text-sm">جاري تحميل الإعلانات...</span>
          </div>
        </div>
      </section>
    );
  }

  if (announcements.length === 0) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/8 text-primary px-4 py-1.5 rounded-full text-xs font-medium mb-4 border border-primary/15">
            <Bell className="w-3.5 h-3.5" />
            <span>إعلانات</span>
          </div>
          <p className="text-muted-foreground text-sm">لا توجد إعلانات حالياً</p>
        </div>
      </section>
    );
  }

  const getAnnouncementIcon = (index: number) => {
    const icons = [Megaphone, Info, Bell];
    const Icon = icons[index % icons.length];
    return <Icon className="w-4 h-4" />;
  };

  const getLevelBadge = (level: string | null) => {
    if (!level) return 'للجميع';
    return level === 'second_year' ? 'ثانية ثانوي' : 'بكالوريا';
  };

  return (
    <section ref={ref} className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 relative">
        <div className={`text-center mb-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="inline-flex items-center gap-2 bg-primary/8 text-primary px-4 py-1.5 rounded-full text-xs font-medium mb-4 border border-primary/15">
            <Bell className="w-3.5 h-3.5" />
            <span>إعلانات جديدة</span>
          </div>
          <h2 className="text-3xl font-bold gradient-text mb-2">آخر الإعلانات والأخبار</h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm">
            تابع آخر المستجدات والإعلانات المهمة من الأستاذ هزيل رفيق
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {announcements.map((announcement, index) => (
            <div
              key={announcement.id}
              className={`glass-card p-4 md:p-5 group cursor-default relative overflow-hidden transition-all duration-500 border-r-[3px] border-r-primary/40 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${index * 60}ms` }}
            >
              <div className="flex items-start gap-3 relative">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary group-hover:bg-primary/15 group-hover:scale-105 transition-all duration-300">
                  {getAnnouncementIcon(index)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h3 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200">{announcement.title}</h3>
                    <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground whitespace-nowrap">
                      {getLevelBadge(announcement.level)}
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-2 text-xs leading-relaxed line-clamp-2">{announcement.content}</p>
                  <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {announcement.created_at && format(new Date(announcement.created_at), 'EEEE، d MMMM yyyy', { locale: ar })}
                      </span>
                    </div>
                    {announcement.scheduled_date && (
                      <div className="flex items-center gap-1 bg-primary/8 text-primary px-1.5 py-0.5 rounded-full">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>موعد: {format(new Date(announcement.scheduled_date), 'd MMMM yyyy', { locale: ar })}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {announcements.length >= 5 && (
          <div className={`text-center mt-6 transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <Link
              to="/announcements"
              className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium text-sm transition-all duration-200 hover:gap-2.5"
            >
              عرض جميع الإعلانات
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
