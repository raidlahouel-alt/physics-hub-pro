import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Profile, Payment, ContentType, StudentLevel } from '@/lib/types';
import { Users, CreditCard, Plus, Loader2, CheckCircle, XCircle, Upload, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'students' | 'payments' | 'content' | 'announcements'>('students');
  const [students, setStudents] = useState<Profile[]>([]);
  const [payments, setPayments] = useState<(Payment & { profile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  // Content form
  const [contentTitle, setContentTitle] = useState('');
  const [contentDesc, setContentDesc] = useState('');
  const [contentType, setContentType] = useState<ContentType>('lesson');
  const [contentLevel, setContentLevel] = useState<StudentLevel>('second_year');
  const [contentDifficulty, setContentDifficulty] = useState(1);
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Announcement form
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annLevel, setAnnLevel] = useState<StudentLevel | ''>('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    if (activeTab === 'students') {
      const { data } = await supabase.from('profiles').select('*').eq('is_teacher', false);
      if (data) setStudents(data as Profile[]);
    } else if (activeTab === 'payments') {
      const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
      if (data) {
        const paymentsWithProfiles = await Promise.all(
          (data as Payment[]).map(async (p) => {
            const { data: prof } = await supabase.from('profiles').select('*').eq('user_id', p.user_id).single();
            return { ...p, profile: prof as Profile };
          })
        );
        setPayments(paymentsWithProfiles);
      }
    }
    setLoading(false);
  };

  const updatePaymentStatus = async (id: string, status: 'confirmed' | 'rejected') => {
    const { error } = await supabase.from('payments').update({ status, confirmed_at: new Date().toISOString() }).eq('id', id);
    if (!error) {
      toast({ title: status === 'confirmed' ? 'تم تأكيد الدفع' : 'تم رفض الدفع' });
      fetchData();
    }
  };

  const handleAddContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    let fileUrl = null;
    if (contentFile) {
      const fileName = `${Date.now()}-${contentFile.name}`;
      const { error } = await supabase.storage.from('content-files').upload(fileName, contentFile);
      if (!error) {
        const { data } = supabase.storage.from('content-files').getPublicUrl(fileName);
        fileUrl = data.publicUrl;
      }
    }
    const { error } = await supabase.from('content').insert({
      title: contentTitle, 
      description: contentDesc, 
      content_type: contentType,
      level: contentLevel, 
      difficulty: contentDifficulty, 
      file_url: fileUrl,
      created_by: profile?.user_id
    });
    if (!error) {
      toast({ title: 'تمت الإضافة بنجاح' });
      setContentTitle(''); setContentDesc(''); setContentFile(null);
    }
    setSubmitting(false);
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from('announcements').insert({
      title: annTitle, 
      content: annContent, 
      level: annLevel || null,
      created_by: profile?.user_id
    });
    if (!error) {
      toast({ title: 'تم نشر الإعلان' });
      setAnnTitle(''); setAnnContent(''); setAnnLevel('');
    }
    setSubmitting(false);
  };

  if (!profile?.is_teacher) {
    return <Layout><div className="min-h-screen flex items-center justify-center"><p>غير مصرح لك بالوصول</p></div></Layout>;
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold gradient-text mb-8">لوحة تحكم الأستاذ</h1>

          <div className="flex flex-wrap gap-3 mb-8">
            {[{ id: 'students', label: 'الطلاب', icon: Users }, { id: 'payments', label: 'المدفوعات', icon: CreditCard },
              { id: 'content', label: 'إضافة محتوى', icon: Plus }, { id: 'announcements', label: 'الإعلانات', icon: Bell }].map((tab) => (
              <Button key={tab.id} variant={activeTab === tab.id ? 'default' : 'outline'} onClick={() => setActiveTab(tab.id as typeof activeTab)}>
                <tab.icon className="w-4 h-4 ml-2" />{tab.label}
              </Button>
            ))}
          </div>

          {activeTab === 'students' && (
            <div className="glass-card p-6">
              <h2 className="font-semibold mb-4">الطلاب المسجلين ({students.length})</h2>
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                <div className="space-y-3">
                  {students.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div>
                        <div className="font-medium">{s.full_name}</div>
                        <div className="text-xs text-muted-foreground">{s.level === 'second_year' ? 'ثانية ثانوي' : s.level === 'baccalaureate' ? 'بكالوريا' : 'غير محدد'}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">{s.phone || '-'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="glass-card p-6">
              <h2 className="font-semibold mb-4">طلبات الدفع</h2>
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                <div className="space-y-3">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div>
                        <div className="font-medium">{p.profile?.full_name || 'غير معروف'}</div>
                        <div className="text-xs text-muted-foreground">{p.month_paid_for} - {format(new Date(p.created_at), 'dd/MM/yyyy', { locale: ar })}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{p.amount} دج</span>
                        {p.status === 'pending' ? (
                          <>
                            <Button size="sm" variant="success" onClick={() => updatePaymentStatus(p.id, 'confirmed')}><CheckCircle className="w-4 h-4" /></Button>
                            <Button size="sm" variant="destructive" onClick={() => updatePaymentStatus(p.id, 'rejected')}><XCircle className="w-4 h-4" /></Button>
                          </>
                        ) : <span className={p.status === 'confirmed' ? 'text-success' : 'text-destructive'}>{p.status === 'confirmed' ? 'مؤكد' : 'مرفوض'}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'content' && (
            <div className="glass-card p-6 max-w-xl">
              <h2 className="font-semibold mb-4">إضافة محتوى جديد</h2>
              <form onSubmit={handleAddContent} className="space-y-4">
                <div><Label>العنوان</Label><Input value={contentTitle} onChange={(e) => setContentTitle(e.target.value)} required /></div>
                <div><Label>الوصف</Label><Input value={contentDesc} onChange={(e) => setContentDesc(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>النوع</Label>
                    <select className="w-full h-10 px-3 rounded-lg border border-border bg-secondary" value={contentType} onChange={(e) => setContentType(e.target.value as ContentType)}>
                      <option value="lesson">درس</option><option value="summary">ملخص</option><option value="exercise">تمرين</option>
                    </select>
                  </div>
                  <div><Label>المستوى</Label>
                    <select className="w-full h-10 px-3 rounded-lg border border-border bg-secondary" value={contentLevel} onChange={(e) => setContentLevel(e.target.value as StudentLevel)}>
                      <option value="second_year">ثانية ثانوي</option><option value="baccalaureate">بكالوريا</option>
                    </select>
                  </div>
                </div>
                <div><Label>الصعوبة (1-3)</Label><Input type="number" min={1} max={3} value={contentDifficulty} onChange={(e) => setContentDifficulty(+e.target.value)} /></div>
                <div><Label>الملف PDF</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <input type="file" accept=".pdf" className="hidden" id="file" onChange={(e) => setContentFile(e.target.files?.[0] || null)} />
                    <label htmlFor="file" className="cursor-pointer flex items-center justify-center gap-2 text-muted-foreground">
                      <Upload className="w-5 h-5" />{contentFile ? contentFile.name : 'اختر ملف'}
                    </label>
                  </div>
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={submitting}>{submitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}إضافة</Button>
              </form>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="glass-card p-6 max-w-xl">
              <h2 className="font-semibold mb-4">نشر إعلان جديد</h2>
              <form onSubmit={handleAddAnnouncement} className="space-y-4">
                <div><Label>العنوان</Label><Input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} required /></div>
                <div><Label>المحتوى</Label><textarea className="w-full p-3 rounded-lg border border-border bg-secondary min-h-[100px]" value={annContent} onChange={(e) => setAnnContent(e.target.value)} required /></div>
                <div><Label>المستوى (اختياري)</Label>
                  <select className="w-full h-10 px-3 rounded-lg border border-border bg-secondary" value={annLevel} onChange={(e) => setAnnLevel(e.target.value as StudentLevel)}>
                    <option value="">الكل</option><option value="second_year">ثانية ثانوي</option><option value="baccalaureate">بكالوريا</option>
                  </select>
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={submitting}>{submitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}نشر الإعلان</Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
