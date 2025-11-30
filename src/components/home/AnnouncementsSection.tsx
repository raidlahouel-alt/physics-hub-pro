import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Announcement } from '@/lib/types';
import { Bell, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export function AnnouncementsSection() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (!error && data) {
        setAnnouncements(data as Announcement[]);
      }
      setLoading(false);
    };

    fetchAnnouncements();
  }, []);

  if (loading || announcements.length === 0) return null;

  return (
    <section className="py-16 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-3 mb-10">
          <Bell className="w-6 h-6 text-warning animate-pulse-glow" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">آخر الإعلانات</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {announcements.map((announcement, index) => (
            <div
              key={announcement.id}
              className="glass-card p-6 border-r-4 border-r-warning animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <Calendar className="w-3 h-3" />
                {format(new Date(announcement.created_at), 'dd MMMM yyyy', { locale: ar })}
                {announcement.level && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">
                    {announcement.level === 'second_year' ? 'ثانية ثانوي' : 'بكالوريا'}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-foreground mb-2">{announcement.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">{announcement.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
