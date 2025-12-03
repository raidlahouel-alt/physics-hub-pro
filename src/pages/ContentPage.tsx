import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ContentCard } from '@/components/common/ContentCard';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Content, StudentLevel, ContentType } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, BookOpen, FileText, ClipboardList, ArrowRight, Lock } from 'lucide-react';
import { QuestionBox } from '@/components/comments/QuestionBox';

const levelNames: Record<string, string> = {
  second_year: 'السنة الثانية ثانوي',
  baccalaureate: 'البكالوريا'
};

const contentTypes: { type: ContentType; label: string; icon: typeof BookOpen }[] = [
  { type: 'lesson', label: 'الدروس', icon: BookOpen },
  { type: 'summary', label: 'الملخصات', icon: FileText },
  { type: 'exercise', label: 'التمارين', icon: ClipboardList },
];

export default function ContentPage() {
  const { level } = useParams<{ level: string }>();
  const { user, loading: authLoading } = useAuth();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<ContentType | 'all'>('all');

  useEffect(() => {
    const fetchContents = async () => {
      if (!level || !user) return;
      
      let query = supabase
        .from('content')
        .select('*')
        .eq('level', level as StudentLevel)
        .order('created_at', { ascending: false });

      if (activeType !== 'all') {
        query = query.eq('content_type', activeType);
      }

      const { data, error } = await query;

      if (!error && data) {
        setContents(data as Content[]);
      }
      setLoading(false);
    };

    if (user) {
      fetchContents();
    }
  }, [level, activeType, user]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-20">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-4">يجب تسجيل الدخول</h2>
            <p className="text-muted-foreground mb-6">
              لعرض المحتوى التعليمي، يرجى تسجيل الدخول أو إنشاء حساب جديد
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
      <div className="min-h-[calc(100vh-4rem)] py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/levels" className="hover:text-foreground transition-colors">المستويات</Link>
            <ArrowRight className="w-4 h-4" />
            <span className="text-foreground">{level ? levelNames[level] : ''}</span>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="gradient-text">{level ? levelNames[level] : ''}</span>
            </h1>
          </div>

          {/* Question Box - Ask the Teacher */}
          <QuestionBox />

          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <Button variant={activeType === 'all' ? 'default' : 'outline'} onClick={() => setActiveType('all')}>الكل</Button>
            {contentTypes.map((item) => (
              <Button key={item.type} variant={activeType === item.type ? 'default' : 'outline'} onClick={() => setActiveType(item.type)}>
                <item.icon className="w-4 h-4 ml-2" />{item.label}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : contents.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4"><BookOpen className="w-10 h-10 text-muted-foreground" /></div>
              <h3 className="text-xl font-semibold text-foreground mb-2">لا يوجد محتوى بعد</h3>
              <p className="text-muted-foreground">سيتم إضافة الدروس قريباً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contents.map((content, index) => (
                <div key={content.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  <ContentCard content={content} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
