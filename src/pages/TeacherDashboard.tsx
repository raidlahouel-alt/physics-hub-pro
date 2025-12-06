import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Profile, ContentType, StudentLevel, Content, Announcement } from '@/lib/types';
import { Users, Plus, Loader2, Upload, Bell, FileText, X, Trash2, BookOpen, ClipboardList, Search, Megaphone, FileStack, Edit, BarChart3 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { z } from 'zod';

// Lazy load heavy components
const EditContentModal = lazy(() => import('@/components/teacher/EditContentModal').then(m => ({ default: m.EditContentModal })));
const EditAnnouncementModal = lazy(() => import('@/components/teacher/EditAnnouncementModal').then(m => ({ default: m.EditAnnouncementModal })));
const StatsCharts = lazy(() => import('@/components/teacher/StatsCharts').then(m => ({ default: m.StatsCharts })));

// Validation schemas
const contentSchema = z.object({
  title: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل').max(200, 'العنوان طويل جداً'),
  description: z.string().max(1000, 'الوصف طويل جداً').optional(),
});

const announcementSchema = z.object({
  title: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل').max(200, 'العنوان طويل جداً'),
  content: z.string().min(10, 'المحتوى يجب أن يكون 10 أحرف على الأقل').max(2000, 'المحتوى طويل جداً'),
});

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

type TabType = 'students' | 'content' | 'announcements' | 'manage-content' | 'manage-announcements' | 'stats';

export default function TeacherDashboard() {
  const { profile, isTeacher } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [students, setStudents] = useState<Profile[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ lessons: 0, summaries: 0, exercises: 0, announcements: 0 });

  // Edit modals
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // Content form
  const [contentTitle, setContentTitle] = useState('');
  const [contentDesc, setContentDesc] = useState('');
  const [contentType, setContentType] = useState<ContentType>('lesson');
  const [contentLevel, setContentLevel] = useState<StudentLevel>('second_year');
  const [contentDifficulty, setContentDifficulty] = useState(1);
  const [contentFiles, setContentFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [driveUrl, setDriveUrl] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'file' | 'drive'>('file');
  const [submitting, setSubmitting] = useState(false);

  // Announcement form
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annScheduledDate, setAnnScheduledDate] = useState('');
  const [annLevel, setAnnLevel] = useState<StudentLevel | ''>('');

  // Memoized student counts by level
  const studentsByLevel = useMemo(() => ({
    baccalaureate: students.filter(s => s.level === 'baccalaureate').length,
    second_year: students.filter(s => s.level === 'second_year').length,
  }), [students]);

  // Dropzone for multiple file upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles: File[] = [];
    
    acceptedFiles.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'ملف كبير جداً',
          description: `${file.name} - الحد الأقصى 50 ميجابايت`,
          variant: 'destructive',
        });
        return;
      }
      validFiles.push(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
    
    setContentFiles(prev => [...prev, ...validFiles]);
  }, [toast]);

  const removeFile = useCallback((index: number) => {
    setContentFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: MAX_FILE_SIZE
  });

  // Track online users - only when on students tab
  useEffect(() => {
    if (activeTab !== 'students' || !profile?.user_id) return;
    
    const channel = supabase.channel('online-users');
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const userIds = Object.values(state).flat().map((p: any) => p.user_id);
        setOnlineUsers(userIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: profile.user_id, online_at: new Date().toISOString() });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [activeTab, profile?.user_id]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
    fetchStudents(); // Pre-fetch students for stats
  }, []);

  // Fetch data based on tab
  useEffect(() => {
    if (activeTab === 'students') {
      if (students.length === 0) fetchStudents();
    } else if (activeTab === 'manage-content') {
      fetchContents();
    } else if (activeTab === 'manage-announcements') {
      fetchAnnouncements();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    const [lessonsRes, summariesRes, exercisesRes, announcementsRes] = await Promise.all([
      supabase.from('content').select('id', { count: 'exact', head: true }).eq('content_type', 'lesson'),
      supabase.from('content').select('id', { count: 'exact', head: true }).eq('content_type', 'summary'),
      supabase.from('content').select('id', { count: 'exact', head: true }).eq('content_type', 'exercise'),
      supabase.from('announcements').select('id', { count: 'exact', head: true }),
    ]);
    setStats({
      lessons: lessonsRes.count || 0,
      summaries: summariesRes.count || 0,
      exercises: exercisesRes.count || 0,
      announcements: announcementsRes.count || 0,
    });
  };

  const fetchStudents = async () => {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('user_id').eq('role', 'teacher'),
    ]);
    
    const teacherIds = rolesRes.data?.map(r => r.user_id) || [];
    if (profilesRes.data) {
      setStudents(profilesRes.data.filter(p => !teacherIds.includes(p.user_id)) as Profile[]);
    }
    setLoading(false);
  };

  const fetchContents = async () => {
    setLoading(true);
    const { data } = await supabase.from('content').select('*').order('created_at', { ascending: false });
    if (data) setContents(data as Content[]);
    setLoading(false);
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (data) setAnnouncements(data as Announcement[]);
    setLoading(false);
  };

  // Filter students by search - memoized
  const filteredStudents = useMemo(() => 
    students.filter(s => 
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone && s.phone.includes(searchQuery))
    ), [students, searchQuery]);

  const handleAddContent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = contentSchema.safeParse({ title: contentTitle, description: contentDesc });
    if (!validation.success) {
      toast({ title: 'خطأ في البيانات', description: validation.error.errors[0].message, variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    
    if (uploadMethod === 'drive' && driveUrl) {
      const driveMatch = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      let fileUrl = driveUrl;
      if (driveMatch) fileUrl = `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
      
      const { error } = await supabase.from('content').insert({
        title: contentTitle.trim(), description: contentDesc.trim() || null, content_type: contentType,
        level: contentLevel, difficulty: contentDifficulty, file_url: fileUrl, created_by: profile?.user_id
      });
      
      if (error) toast({ title: 'خطأ في الإضافة', description: error.message, variant: 'destructive' });
      else toast({ title: 'تمت الإضافة بنجاح' });
    } else if (contentFiles.length > 0) {
      const uploadedUrls: string[] = [];
      
      for (const file of contentFiles) {
        const fileExt = file.name.split('.').pop() || '';
        const sanitizedName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('content-files').upload(sanitizedName, file);
        
        if (!uploadError) {
          const { data } = await supabase.storage.from('content-files').createSignedUrl(sanitizedName, 60 * 60 * 24 * 365);
          if (data?.signedUrl) uploadedUrls.push(data.signedUrl);
        }
      }
      
      if (uploadedUrls.length > 0) {
        const { error } = await supabase.from('content').insert({
          title: contentTitle.trim(), description: contentDesc.trim() || null, content_type: contentType,
          level: contentLevel, difficulty: contentDifficulty, file_url: uploadedUrls[0],
          file_urls: uploadedUrls, created_by: profile?.user_id
        });
        
        if (!error) toast({ title: 'تمت الإضافة بنجاح', description: `تم رفع ${uploadedUrls.length} ملف` });
        else toast({ title: 'خطأ في الإضافة', description: error.message, variant: 'destructive' });
      }
    } else {
      const { error } = await supabase.from('content').insert({
        title: contentTitle.trim(), description: contentDesc.trim() || null, content_type: contentType,
        level: contentLevel, difficulty: contentDifficulty, file_url: null, file_urls: [], created_by: profile?.user_id
      });
      
      if (!error) toast({ title: 'تمت الإضافة بنجاح' });
      else toast({ title: 'خطأ في الإضافة', description: error.message, variant: 'destructive' });
    }
    
    setContentTitle(''); setContentDesc(''); setContentFiles([]); setFilePreviews([]); setDriveUrl('');
    setSubmitting(false);
    fetchStats();
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = announcementSchema.safeParse({ title: annTitle, content: annContent });
    if (!validation.success) {
      toast({ title: 'خطأ في البيانات', description: validation.error.errors[0].message, variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('announcements').insert({
      title: annTitle.trim(), 
      content: annContent.trim(), 
      level: annLevel || null, 
      scheduled_date: annScheduledDate || null,
      created_by: profile?.user_id
    });
    
    if (!error) {
      toast({ title: 'تم نشر الإعلان' });
      setAnnTitle(''); setAnnContent(''); setAnnLevel(''); setAnnScheduledDate('');
      fetchStats();
    } else {
      toast({ title: 'خطأ في النشر', description: error.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
    const { error } = await supabase.from('profiles').delete().eq('id', studentId);
    if (!error) { toast({ title: 'تم حذف الطالب' }); fetchStudents(); }
    else toast({ title: 'خطأ في الحذف', description: error.message, variant: 'destructive' });
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المحتوى؟')) return;
    const { error } = await supabase.from('content').delete().eq('id', contentId);
    if (!error) { toast({ title: 'تم حذف المحتوى' }); fetchContents(); fetchStats(); }
    else toast({ title: 'خطأ في الحذف', description: error.message, variant: 'destructive' });
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    const { error } = await supabase.from('announcements').delete().eq('id', announcementId);
    if (!error) { toast({ title: 'تم حذف الإعلان' }); fetchAnnouncements(); fetchStats(); }
    else toast({ title: 'خطأ في الحذف', description: error.message, variant: 'destructive' });
  };

  const getContentTypeLabel = (type: ContentType) => {
    const labels = { lesson: 'درس', summary: 'ملخص', exercise: 'تمرين' };
    return labels[type] || type;
  };

  const getContentTypeIcon = (type: ContentType) => {
    const icons = { lesson: BookOpen, summary: FileText, exercise: ClipboardList };
    return icons[type] || FileText;
  };

  const getLevelLabel = (level: StudentLevel | null) => {
    if (!level) return 'الكل';
    return level === 'second_year' ? 'ثانية ثانوي' : 'بكالوريا';
  };

  if (!isTeacher) {
    return <Layout><div className="min-h-screen flex items-center justify-center"><p>غير مصرح لك بالوصول</p></div></Layout>;
  }

  const tabs = [
    { id: 'stats' as const, label: 'الإحصائيات', icon: BarChart3 },
    { id: 'students' as const, label: 'الطلاب', icon: Users }, 
    { id: 'content' as const, label: 'إضافة محتوى', icon: Plus }, 
    { id: 'announcements' as const, label: 'إضافة إعلان', icon: Bell },
    { id: 'manage-content' as const, label: 'إدارة المحتوى', icon: BookOpen },
    { id: 'manage-announcements' as const, label: 'إدارة الإعلانات', icon: Megaphone },
  ];

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] py-6 md:py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold gradient-text mb-4">لوحة تحكم الأستاذ</h1>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="glass-card p-3 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/20"><BookOpen className="w-4 h-4 text-blue-500" /></div>
              <div><p className="text-xl font-bold">{stats.lessons}</p><p className="text-xs text-muted-foreground">الدروس</p></div>
            </div>
            <div className="glass-card p-3 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-green-500/20"><FileStack className="w-4 h-4 text-green-500" /></div>
              <div><p className="text-xl font-bold">{stats.summaries}</p><p className="text-xs text-muted-foreground">الملخصات</p></div>
            </div>
            <div className="glass-card p-3 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-500/20"><ClipboardList className="w-4 h-4 text-orange-500" /></div>
              <div><p className="text-xl font-bold">{stats.exercises}</p><p className="text-xs text-muted-foreground">التمارين</p></div>
            </div>
            <div className="glass-card p-3 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/20"><Megaphone className="w-4 h-4 text-purple-500" /></div>
              <div><p className="text-xl font-bold">{stats.announcements}</p><p className="text-xs text-muted-foreground">الإعلانات</p></div>
            </div>
          </div>

          {/* Tabs - Scrollable on mobile */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => (
              <Button 
                key={tab.id} 
                variant={activeTab === tab.id ? 'default' : 'outline'} 
                onClick={() => setActiveTab(tab.id)}
                className="whitespace-nowrap flex-shrink-0 text-sm"
                size="sm"
              >
                <tab.icon className="w-3.5 h-3.5 ml-1.5" />{tab.label}
              </Button>
            ))}
          </div>

          {/* Stats Tab with Charts */}
          {activeTab === 'stats' && (
            <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin mx-auto" />}>
              <StatsCharts stats={stats} studentsByLevel={studentsByLevel} />
              <div className="glass-card p-4">
                <h3 className="font-semibold mb-3 text-sm">ملخص سريع</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">إجمالي الطلاب</p>
                    <p className="text-2xl font-bold text-primary">{students.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">إجمالي المحتوى</p>
                    <p className="text-2xl font-bold text-primary">{stats.lessons + stats.summaries + stats.exercises}</p>
                  </div>
                </div>
              </div>
            </Suspense>
          )}

          {activeTab === 'students' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h2 className="font-semibold text-base">الطلاب المسجلين ({students.length})</h2>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-9 w-full sm:w-40 h-9 text-sm" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>{students.filter(s => onlineUsers.includes(s.user_id)).length}</span>
                  </div>
                </div>
              </div>
              
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                <div className="grid md:grid-cols-2 gap-4">
                  {/* بكالوريا */}
                  <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                      <h3 className="font-semibold text-sm text-primary">البكالوريا</h3>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{studentsByLevel.baccalaureate}</span>
                    </div>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {filteredStudents.filter(s => s.level === 'baccalaureate').length === 0 ? (
                        <p className="text-center text-muted-foreground py-4 text-sm">لا يوجد طلاب</p>
                      ) : (
                        filteredStudents.filter(s => s.level === 'baccalaureate').map((s) => (
                          <StudentCard key={s.id} student={s} isOnline={onlineUsers.includes(s.user_id)} onDelete={handleDeleteStudent} />
                        ))
                      )}
                    </div>
                  </div>

                  {/* ثانية ثانوي */}
                  <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                      <div className="w-2.5 h-2.5 rounded-full bg-accent"></div>
                      <h3 className="font-semibold text-sm text-accent">الثانية ثانوي</h3>
                      <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">{studentsByLevel.second_year}</span>
                    </div>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {filteredStudents.filter(s => s.level === 'second_year').length === 0 ? (
                        <p className="text-center text-muted-foreground py-4 text-sm">لا يوجد طلاب</p>
                      ) : (
                        filteredStudents.filter(s => s.level === 'second_year').map((s) => (
                          <StudentCard key={s.id} student={s} isOnline={onlineUsers.includes(s.user_id)} onDelete={handleDeleteStudent} color="accent" />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'content' && (
            <div className="glass-card p-4 max-w-xl">
              <h2 className="font-semibold mb-4 text-base">إضافة محتوى جديد</h2>
              <form onSubmit={handleAddContent} className="space-y-3">
                <div><Label className="text-sm">العنوان</Label><Input value={contentTitle} onChange={(e) => setContentTitle(e.target.value)} required className="h-9" /></div>
                <div><Label className="text-sm">الوصف</Label><Input value={contentDesc} onChange={(e) => setContentDesc(e.target.value)} className="h-9" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-sm">النوع</Label>
                    <select className="w-full h-9 px-3 rounded-lg border border-border bg-secondary text-sm" value={contentType} onChange={(e) => setContentType(e.target.value as ContentType)}>
                      <option value="lesson">درس</option><option value="summary">ملخص</option><option value="exercise">تمرين</option>
                    </select>
                  </div>
                  <div><Label className="text-sm">المستوى</Label>
                    <select className="w-full h-9 px-3 rounded-lg border border-border bg-secondary text-sm" value={contentLevel} onChange={(e) => setContentLevel(e.target.value as StudentLevel)}>
                      <option value="second_year">ثانية ثانوي</option><option value="baccalaureate">بكالوريا</option>
                    </select>
                  </div>
                </div>
                <div><Label className="text-sm">الصعوبة (1-3)</Label><Input type="number" min={1} max={3} value={contentDifficulty} onChange={(e) => setContentDifficulty(+e.target.value)} className="h-9" /></div>
                
                <div>
                  <Label className="text-sm">طريقة الرفع</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Button type="button" variant={uploadMethod === 'file' ? 'default' : 'outline'} onClick={() => setUploadMethod('file')} className="flex-1" size="sm">
                      <Upload className="w-3.5 h-3.5 ml-1.5" />رفع ملف
                    </Button>
                    <Button type="button" variant={uploadMethod === 'drive' ? 'default' : 'outline'} onClick={() => setUploadMethod('drive')} className="flex-1" size="sm">
                      <FileText className="w-3.5 h-3.5 ml-1.5" />رابط Drive
                    </Button>
                  </div>
                </div>

                {uploadMethod === 'file' ? (
                  <div>
                    <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : contentFiles.length > 0 ? 'border-green-500 bg-green-500/10' : 'border-border hover:border-primary/50'}`}>
                      <input {...getInputProps()} />
                      <Upload className="w-6 h-6 mx-auto mb-1.5 text-muted-foreground" />
                      <p className="text-sm font-medium">اسحب الملفات هنا</p>
                      <p className="text-xs text-muted-foreground">الحد الأقصى 50MB</p>
                    </div>
                    
                    {contentFiles.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {contentFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg text-sm">
                            <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="flex-1 truncate">{file.name}</span>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(index)}><X className="w-3 h-3" /></Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <Input value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)} placeholder="https://drive.google.com/file/d/..." className="h-9" />
                    <p className="text-xs text-muted-foreground mt-1">الصق رابط المشاركة من Google Drive</p>
                  </div>
                )}

                <Button type="submit" variant="hero" className="w-full" disabled={submitting} size="sm">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}إضافة
                </Button>
              </form>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="glass-card p-4 max-w-xl">
              <h2 className="font-semibold mb-4 text-base">نشر إعلان جديد</h2>
              <form onSubmit={handleAddAnnouncement} className="space-y-3">
                <div><Label className="text-sm">العنوان</Label><Input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} required className="h-9" /></div>
                <div><Label className="text-sm">المحتوى</Label><textarea className="w-full p-3 rounded-lg border border-border bg-secondary min-h-[80px] text-sm" value={annContent} onChange={(e) => setAnnContent(e.target.value)} required /></div>
                <div><Label className="text-sm">المستوى (اختياري)</Label>
                  <select className="w-full h-9 px-3 rounded-lg border border-border bg-secondary text-sm" value={annLevel} onChange={(e) => setAnnLevel(e.target.value as StudentLevel)}>
                    <option value="">الكل</option><option value="second_year">ثانية ثانوي</option><option value="baccalaureate">بكالوريا</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm">تاريخ الإعلان (اختياري)</Label>
                  <Input 
                    type="date" 
                    value={annScheduledDate} 
                    onChange={(e) => setAnnScheduledDate(e.target.value)} 
                    className="h-9"
                  />
                  <p className="text-xs text-muted-foreground mt-1">حدد تاريخ معين للإعلان (مثل موعد حصة أو اختبار)</p>
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={submitting} size="sm">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}نشر الإعلان
                </Button>
              </form>
            </div>
          )}

          {activeTab === 'manage-content' && (
            <div className="glass-card p-4">
              <h2 className="font-semibold mb-4 text-base">إدارة المحتوى ({contents.length})</h2>
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : contents.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">لا يوجد محتوى</p>
              ) : (
                <div className="space-y-2">
                  {contents.map((c) => {
                    const Icon = getContentTypeIcon(c.content_type);
                    return (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{c.title}</div>
                            <div className="text-xs text-muted-foreground">{getContentTypeLabel(c.content_type)} • {getLevelLabel(c.level)}</div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setEditingContent(c)} className="text-primary hover:bg-primary/10 h-8 w-8"><Edit className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteContent(c.id)} className="text-destructive hover:bg-destructive/10 h-8 w-8"><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'manage-announcements' && (
            <div className="glass-card p-4">
              <h2 className="font-semibold mb-4 text-base">إدارة الإعلانات ({announcements.length})</h2>
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : announcements.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">لا يوجد إعلانات</p>
              ) : (
                <div className="space-y-2">
                  {announcements.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <Bell className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{a.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{a.content}</div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditingAnnouncement(a)} className="text-primary hover:bg-primary/10 h-8 w-8"><Edit className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteAnnouncement(a.id)} className="text-destructive hover:bg-destructive/10 h-8 w-8"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modals */}
      <Suspense fallback={null}>
        {editingContent && (
          <EditContentModal content={editingContent} open={!!editingContent} onOpenChange={(open) => !open && setEditingContent(null)} onSuccess={() => { fetchContents(); fetchStats(); }} />
        )}
        {editingAnnouncement && (
          <EditAnnouncementModal announcement={editingAnnouncement} open={!!editingAnnouncement} onOpenChange={(open) => !open && setEditingAnnouncement(null)} onSuccess={() => { fetchAnnouncements(); fetchStats(); }} />
        )}
      </Suspense>
    </Layout>
  );
}

// Extracted StudentCard component for better performance
function StudentCard({ student, isOnline, onDelete, color = 'primary' }: { student: Profile; isOnline: boolean; onDelete: (id: string) => void; color?: 'primary' | 'accent' }) {
  return (
    <div className="flex items-center justify-between p-2.5 bg-secondary/50 rounded-lg">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className="relative">
          <div className={`w-8 h-8 rounded-full ${color === 'primary' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'} flex items-center justify-center font-semibold text-sm`}>
            {student.full_name.charAt(0)}
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-secondary ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{student.full_name}</div>
          <div className="text-xs text-muted-foreground truncate">{student.phone || 'بدون هاتف'}</div>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={() => onDelete(student.id)} className="text-destructive hover:bg-destructive/10 h-7 w-7">
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}