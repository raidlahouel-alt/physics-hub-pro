import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Profile, ContentType, StudentLevel, Content, Announcement } from '@/lib/types';
import { Users, Plus, Loader2, Upload, Bell, FileText, X, Trash2, BookOpen, ClipboardList, Search, Megaphone, FileStack, Edit } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { z } from 'zod';
import { EditContentModal } from '@/components/teacher/EditContentModal';
import { EditAnnouncementModal } from '@/components/teacher/EditAnnouncementModal';

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

export default function TeacherDashboard() {
  const { profile, isTeacher } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'students' | 'content' | 'announcements' | 'manage-content' | 'manage-announcements'>('students');
  const [students, setStudents] = useState<Profile[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [annLevel, setAnnLevel] = useState<StudentLevel | ''>('');

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
      
      // Create preview for images
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

  const removeFile = (index: number) => {
    setContentFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: MAX_FILE_SIZE
  });

  // Track online users with Supabase Presence
  useEffect(() => {
    const channel = supabase.channel('online-users');
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const userIds = Object.values(state).flat().map((p: any) => p.user_id);
        setOnlineUsers(userIds);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const newUserIds = newPresences.map((p: any) => p.user_id);
        setOnlineUsers(prev => [...new Set([...prev, ...newUserIds])]);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const leftUserIds = leftPresences.map((p: any) => p.user_id);
        setOnlineUsers(prev => prev.filter(id => !leftUserIds.includes(id)));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && profile?.user_id) {
          await channel.track({
            user_id: profile.user_id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.user_id]);

  useEffect(() => {
    fetchData();
    fetchStats();
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

  // Filter students by search
  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.phone && s.phone.includes(searchQuery))
  );

  const fetchData = async () => {
    setLoading(true);
    if (activeTab === 'students') {
      // Get all profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Get all teacher user_ids
      const { data: teacherRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'teacher');
      
      const teacherIds = teacherRoles?.map(r => r.user_id) || [];
      
      // Filter out teachers from profiles
      if (profilesData) {
        const studentsOnly = profilesData.filter(p => !teacherIds.includes(p.user_id));
        setStudents(studentsOnly as Profile[]);
      }
    } else if (activeTab === 'manage-content') {
      const { data } = await supabase.from('content').select('*').order('created_at', { ascending: false });
      if (data) setContents(data as Content[]);
    } else if (activeTab === 'manage-announcements') {
      const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      if (data) setAnnouncements(data as Announcement[]);
    }
    setLoading(false);
  };

  const handleAddContent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const validation = contentSchema.safeParse({ title: contentTitle, description: contentDesc });
    if (!validation.success) {
      toast({ 
        title: 'خطأ في البيانات', 
        description: validation.error.errors[0].message,
        variant: 'destructive' 
      });
      return;
    }

    // Validate files
    for (const file of contentFiles) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ 
          title: 'ملف كبير جداً', 
          description: `${file.name} - الحد الأقصى 50 ميجابايت`,
          variant: 'destructive' 
        });
        return;
      }
    }

    setSubmitting(true);
    
    if (uploadMethod === 'drive' && driveUrl) {
      // Convert Google Drive share URL to direct embed URL
      const driveMatch = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      let fileUrl = driveUrl;
      if (driveMatch) {
        fileUrl = `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
      }
      
      const { error } = await supabase.from('content').insert({
        title: contentTitle.trim(), 
        description: contentDesc.trim() || null, 
        content_type: contentType,
        level: contentLevel, 
        difficulty: contentDifficulty, 
        file_url: fileUrl,
        created_by: profile?.user_id
      });
      
      if (error) {
        toast({ 
          title: 'خطأ في الإضافة', 
          description: error.message,
          variant: 'destructive' 
        });
      } else {
        toast({ title: 'تمت الإضافة بنجاح' });
      }
    } else if (contentFiles.length > 0) {
      // Upload all files and store URLs in file_urls array (single content with multiple files)
      const uploadedUrls: string[] = [];
      
      for (const file of contentFiles) {
        const fileExt = file.name.split('.').pop() || '';
        const sanitizedName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('content-files').upload(sanitizedName, file);
        
        if (!uploadError) {
          const { data } = await supabase.storage.from('content-files').createSignedUrl(sanitizedName, 60 * 60 * 24 * 365);
          if (data?.signedUrl) {
            uploadedUrls.push(data.signedUrl);
          }
        } else {
          toast({
            title: 'خطأ في رفع الملف',
            description: `فشل رفع ${file.name}`,
            variant: 'destructive'
          });
        }
      }
      
      if (uploadedUrls.length > 0) {
        // Create single content with all files
        const { error } = await supabase.from('content').insert({
          title: contentTitle.trim(), 
          description: contentDesc.trim() || null, 
          content_type: contentType,
          level: contentLevel, 
          difficulty: contentDifficulty, 
          file_url: uploadedUrls[0], // Keep first URL for backward compatibility
          file_urls: uploadedUrls,
          created_by: profile?.user_id
        });
        
        if (!error) {
          toast({ 
            title: 'تمت الإضافة بنجاح', 
            description: `تم رفع ${uploadedUrls.length} ملف في الدرس` 
          });
        } else {
          toast({ 
            title: 'خطأ في الإضافة', 
            description: error.message,
            variant: 'destructive' 
          });
        }
      }
    } else {
      // No file, just add content entry
      const { error } = await supabase.from('content').insert({
        title: contentTitle.trim(), 
        description: contentDesc.trim() || null, 
        content_type: contentType,
        level: contentLevel, 
        difficulty: contentDifficulty, 
        file_url: null,
        file_urls: [],
        created_by: profile?.user_id
      });
      
      if (!error) {
        toast({ title: 'تمت الإضافة بنجاح' });
      } else {
        toast({ 
          title: 'خطأ في الإضافة', 
          description: error.message,
          variant: 'destructive' 
        });
      }
    }
    
    setContentTitle(''); 
    setContentDesc(''); 
    setContentFiles([]);
    setFilePreviews([]);
    setDriveUrl('');
    setSubmitting(false);
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const validation = announcementSchema.safeParse({ title: annTitle, content: annContent });
    if (!validation.success) {
      toast({ 
        title: 'خطأ في البيانات', 
        description: validation.error.errors[0].message,
        variant: 'destructive' 
      });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('announcements').insert({
      title: annTitle.trim(), 
      content: annContent.trim(), 
      level: annLevel || null,
      created_by: profile?.user_id
    });
    if (!error) {
      toast({ title: 'تم نشر الإعلان' });
      setAnnTitle(''); 
      setAnnContent(''); 
      setAnnLevel('');
    } else {
      toast({ 
        title: 'خطأ في النشر', 
        description: error.message,
        variant: 'destructive' 
      });
    }
    setSubmitting(false);
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
    
    const { error } = await supabase.from('profiles').delete().eq('id', studentId);
    
    if (!error) {
      toast({ title: 'تم حذف الطالب بنجاح' });
      fetchData();
    } else {
      toast({ 
        title: 'خطأ في الحذف', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المحتوى؟')) return;
    
    const { error } = await supabase.from('content').delete().eq('id', contentId);
    
    if (!error) {
      toast({ title: 'تم حذف المحتوى بنجاح' });
      fetchData();
      fetchStats();
    } else {
      toast({ 
        title: 'خطأ في الحذف', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    
    const { error } = await supabase.from('announcements').delete().eq('id', announcementId);
    
    if (!error) {
      toast({ title: 'تم حذف الإعلان بنجاح' });
      fetchData();
      fetchStats();
    } else {
      toast({ 
        title: 'خطأ في الحذف', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  };

  const getContentTypeLabel = (type: ContentType) => {
    switch (type) {
      case 'lesson': return 'درس';
      case 'summary': return 'ملخص';
      case 'exercise': return 'تمرين';
      default: return type;
    }
  };

  const getContentTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'lesson': return BookOpen;
      case 'summary': return FileText;
      case 'exercise': return ClipboardList;
      default: return FileText;
    }
  };

  const getLevelLabel = (level: StudentLevel | null) => {
    switch (level) {
      case 'second_year': return 'ثانية ثانوي';
      case 'baccalaureate': return 'بكالوريا';
      default: return 'الكل';
    }
  };

  if (!isTeacher) {
    return <Layout><div className="min-h-screen flex items-center justify-center"><p>غير مصرح لك بالوصول</p></div></Layout>;
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold gradient-text mb-6">لوحة تحكم الأستاذ</h1>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.lessons}</p>
                <p className="text-xs text-muted-foreground">الدروس</p>
              </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <FileStack className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.summaries}</p>
                <p className="text-xs text-muted-foreground">الملخصات</p>
              </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <ClipboardList className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.exercises}</p>
                <p className="text-xs text-muted-foreground">التمارين</p>
              </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Megaphone className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.announcements}</p>
                <p className="text-xs text-muted-foreground">الإعلانات</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { id: 'students', label: 'الطلاب', icon: Users }, 
              { id: 'content', label: 'إضافة محتوى', icon: Plus }, 
              { id: 'announcements', label: 'إضافة إعلان', icon: Bell },
              { id: 'manage-content', label: 'إدارة المحتوى', icon: BookOpen },
              { id: 'manage-announcements', label: 'إدارة الإعلانات', icon: Bell },
            ].map((tab) => (
              <Button key={tab.id} variant={activeTab === tab.id ? 'default' : 'outline'} onClick={() => setActiveTab(tab.id as typeof activeTab)}>
                <tab.icon className="w-4 h-4 ml-2" />{tab.label}
              </Button>
            ))}
          </div>

          {activeTab === 'students' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="font-semibold text-lg">الطلاب المسجلين ({students.length})</h2>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث بالاسم أو الهاتف..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-9 w-48"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                    <span>متصل: {students.filter(s => onlineUsers.includes(s.user_id)).length}</span>
                  </div>
                </div>
              </div>
              
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* قسم البكالوريا */}
                  <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      <h3 className="font-semibold text-primary">طلاب البكالوريا</h3>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        {filteredStudents.filter(s => s.level === 'baccalaureate').length}
                      </span>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {filteredStudents.filter(s => s.level === 'baccalaureate').length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">لا يوجد طلاب</p>
                      ) : (
                        filteredStudents.filter(s => s.level === 'baccalaureate').map((s) => {
                          const isOnline = onlineUsers.includes(s.user_id);
                          return (
                            <div key={s.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="relative">
                                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                                    {s.full_name.charAt(0)}
                                  </div>
                                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-secondary ${
                                    isOnline ? 'bg-green-500' : 'bg-red-500'
                                  }`}></span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{s.full_name}</div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {s.phone || 'بدون هاتف'}
                                  </div>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteStudent(s.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* قسم الثانية ثانوي */}
                  <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                      <div className="w-3 h-3 rounded-full bg-accent"></div>
                      <h3 className="font-semibold text-accent">طلاب الثانية ثانوي</h3>
                      <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                        {filteredStudents.filter(s => s.level === 'second_year').length}
                      </span>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {filteredStudents.filter(s => s.level === 'second_year').length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">لا يوجد طلاب</p>
                      ) : (
                        filteredStudents.filter(s => s.level === 'second_year').map((s) => {
                          const isOnline = onlineUsers.includes(s.user_id);
                          return (
                            <div key={s.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="relative">
                                  <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-sm">
                                    {s.full_name.charAt(0)}
                                  </div>
                                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-secondary ${
                                    isOnline ? 'bg-green-500' : 'bg-red-500'
                                  }`}></span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{s.full_name}</div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {s.phone || 'بدون هاتف'}
                                  </div>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteStudent(s.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
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
                
                {/* Upload Method Selection */}
                <div>
                  <Label>طريقة الرفع</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant={uploadMethod === 'file' ? 'default' : 'outline'}
                      onClick={() => setUploadMethod('file')}
                      className="flex-1"
                    >
                      <Upload className="w-4 h-4 ml-2" />
                      رفع ملف
                    </Button>
                    <Button
                      type="button"
                      variant={uploadMethod === 'drive' ? 'default' : 'outline'}
                      onClick={() => setUploadMethod('drive')}
                      className="flex-1"
                    >
                      <FileText className="w-4 h-4 ml-2" />
                      رابط Drive
                    </Button>
                  </div>
                </div>

                {uploadMethod === 'file' ? (
                  <div>
                    <Label>الملفات (PDF, صور, فيديو, صوت... - يمكنك رفع عدة ملفات)</Label>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        isDragActive 
                          ? 'border-primary bg-primary/10' 
                          : contentFiles.length > 0 
                          ? 'border-success bg-success/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      {isDragActive ? (
                        <p className="text-primary">أفلت الملفات هنا...</p>
                      ) : (
                        <>
                          <p className="text-foreground font-medium mb-1">اسحب وأفلت الملفات هنا</p>
                          <p className="text-sm text-muted-foreground">PDF, صور, فيديو, صوت... (الحد الأقصى 50MB لكل ملف)</p>
                        </>
                      )}
                    </div>
                    
                    {/* Files List */}
                    {contentFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm text-muted-foreground">{contentFiles.length} ملف محدد</p>
                        {contentFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 bg-secondary/50 rounded-lg">
                            <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            {filePreviews[index] && (
                              <img src={filePreviews[index]} alt="معاينة" className="w-10 h-10 rounded object-cover" />
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(index);
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <Label>رابط Google Drive</Label>
                    <Input 
                      value={driveUrl} 
                      onChange={(e) => setDriveUrl(e.target.value)} 
                      placeholder="https://drive.google.com/file/d/..."
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      الصق رابط المشاركة من Google Drive (تأكد من أن الملف مشارك للعموم)
                    </p>
                  </div>
                )}

                <Button type="submit" variant="hero" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}إضافة
                </Button>
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
                <Button type="submit" variant="hero" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}نشر الإعلان
                </Button>
              </form>
            </div>
          )}

          {activeTab === 'manage-content' && (
            <div className="glass-card p-6">
              <h2 className="font-semibold mb-4">إدارة المحتوى ({contents.length})</h2>
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : contents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا يوجد محتوى</p>
              ) : (
                <div className="space-y-3">
                  {contents.map((c) => {
                    const Icon = getContentTypeIcon(c.content_type);
                    const filesCount = c.file_urls?.length || (c.file_url ? 1 : 0);
                    return (
                      <div key={c.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{c.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {getContentTypeLabel(c.content_type)} • {getLevelLabel(c.level)} • صعوبة: {c.difficulty}/3
                              {filesCount > 0 && ` • ${filesCount} ملف`}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              تاريخ الإضافة: {new Date(c.created_at).toLocaleDateString('ar-DZ')}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setEditingContent(c)}
                            className="text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteContent(c.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'manage-announcements' && (
            <div className="glass-card p-6">
              <h2 className="font-semibold mb-4">إدارة الإعلانات ({announcements.length})</h2>
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : announcements.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا يوجد إعلانات</p>
              ) : (
                <div className="space-y-3">
                  {announcements.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                          <Bell className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{a.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">{a.content}</div>
                          <div className="text-xs text-muted-foreground">
                            المستوى: {getLevelLabel(a.level)} • {a.is_active ? 'نشط' : 'غير نشط'}
                            {' • '}
                            تاريخ النشر: {new Date(a.created_at).toLocaleDateString('ar-DZ')}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setEditingAnnouncement(a)}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteAnnouncement(a.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
      {editingContent && (
        <EditContentModal
          content={editingContent}
          open={!!editingContent}
          onOpenChange={(open) => !open && setEditingContent(null)}
          onSuccess={() => {
            fetchData();
            fetchStats();
          }}
        />
      )}

      {editingAnnouncement && (
        <EditAnnouncementModal
          announcement={editingAnnouncement}
          open={!!editingAnnouncement}
          onOpenChange={(open) => !open && setEditingAnnouncement(null)}
          onSuccess={() => {
            fetchData();
            fetchStats();
          }}
        />
      )}
    </Layout>
  );
}
