import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Announcement, StudentLevel } from '@/lib/types';
import { Bell, Calendar, Megaphone, AlertTriangle, Info, ChevronLeft, Sparkles, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export function AnnouncementsSection() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

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

  // Subscribe to realtime updates for announcements
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

  // Show login prompt for unauthenticated users
  if (!user && !authLoading) {
    return (
      <section className="py-16 bg-gradient-to-b from-background via-secondary/10 to-background relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Bell className="w-4 h-4" />
              <span>إعلانات جديدة</span>
            </div>
            <h2 className="text-3xl font-bold gradient-text mb-4">آخر الإعلانات والأخبار</h2>
            
            <div className="max-w-md mx-auto mt-8 glass-card p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">سجّل الدخول لمشاهدة الإعلانات</h3>
              <p className="text-muted-foreground mb-6">
                الإعلانات متاحة فقط للطلبة المسجلين في المنصة
              </p>
              <Link to="/auth">
                <Button variant="hero" size="lg">
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
      <section className="py-16 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-muted-foreground text-sm">جاري تحميل الإعلانات...</span>
          </div>
        </div>
      </section>
    );
  }

  if (announcements.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-b from-background via-secondary/10 to-background">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Bell className="w-4 h-4" />
            <span>إعلانات</span>
          </div>
          <p className="text-muted-foreground">لا توجد إعلانات حالياً</p>
        </div>
      </section>
    );
  }

  const getAnnouncementIcon = (index: number) => {
    const icons = [Megaphone, AlertTriangle, Info, Bell];
    const Icon = icons[index % icons.length];
    return <Icon className="w-5 h-5" />;
  };

  const getAnnouncementColor = (index: number) => {
    const colors = [
      'from-primary/20 to-primary/5 border-primary/30',
      'from-amber-500/20 to-amber-500/5 border-amber-500/30',
      'from-blue-500/20 to-blue-500/5 border-blue-500/30',
      'from-purple-500/20 to-purple-500/5 border-purple-500/30',
    ];
    return colors[index % colors.length];
  };

  const getIconBgColor = (index: number) => {
    const colors = [
      'bg-primary text-primary-foreground',
      'bg-amber-500 text-white',
      'bg-blue-500 text-white',
      'bg-purple-500 text-white',
    ];
    return colors[index % colors.length];
  };

  const getLevelBadge = (level: string | null) => {
    if (!level) return 'للجميع';
    return level === 'second_year' ? 'ثانية ثانوي' : 'بكالوريا';
  };

  return (
    <section className="py-16 bg-gradient-to-b from-background via-secondary/10 to-background relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Bell className="w-4 h-4" />
            <span>إعلانات جديدة</span>
            <Sparkles className="w-3 h-3 animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold gradient-text mb-3">آخر الإعلانات والأخبار</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
            تابع آخر المستجدات والإعلانات المهمة من الأستاذ هزيل رفيق
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {announcements.map((announcement, index) => (
            <div
              key={announcement.id}
              className={`glass-card p-5 border-r-4 bg-gradient-to-l ${getAnnouncementColor(index)} group cursor-default relative overflow-hidden animate-fade-in`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              
              <div className="flex items-start gap-4 relative">
                <div className={`w-11 h-11 rounded-xl ${getIconBgColor(index)} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-200`}>
                  {getAnnouncementIcon(index)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-bold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200">{announcement.title}</h3>
                    <span className="text-xs bg-secondary/80 px-2.5 py-1 rounded-full text-muted-foreground whitespace-nowrap">
                      {getLevelBadge(announcement.level)}
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-2 text-sm line-clamp-2">{announcement.content}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {announcement.created_at && format(new Date(announcement.created_at), 'EEEE، d MMMM yyyy', { locale: ar })}
                      </span>
                    </div>
                    {announcement.scheduled_date && (
                      <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        <Calendar className="w-3 h-3" />
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
          <div className="text-center mt-6 animate-fade-in">
            <Link
              to="/announcements"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-all duration-200 hover:gap-3"
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