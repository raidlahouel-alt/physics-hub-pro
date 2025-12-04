import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Profile, ContentType, StudentLevel, Content, Announcement } from '@/lib/types';
import { Users, Plus, Loader2, Upload, Bell, FileText, X, Trash2, BookOpen, ClipboardList, MessageSquare } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { OnlineStatusIndicator } from '@/components/common/OnlineStatusIndicator';
import { z } from 'zod';

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

  // Content form
  const [contentTitle, setContentTitle] = useState('');
  const [contentDesc, setContentDesc] = useState('');
  const [contentType, setContentType] = useState<ContentType>('lesson');
  const [contentLevel, setContentLevel] = useState<StudentLevel>('second_year');
  const [contentDifficulty, setContentDifficulty] = useState(1);
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [driveUrl, setDriveUrl] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'file' | 'drive'>('file');
  const [submitting, setSubmitting] = useState(false);

  // Announcement form
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annLevel, setAnnLevel] = useState<StudentLevel | ''>('');

  // Dropzone for any file upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'الملف كبير جداً',
          description: 'الحد الأقصى لحجم الملف هو 50 ميجابايت',
          variant: 'destructive',
        });
        return;
      }
      setContentFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    multiple: false,
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
  }, [activeTab]);

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

    if (contentFile && contentFile.size > MAX_FILE_SIZE) {
      toast({ 
        title: 'الملف كبير جداً', 
        description: 'الحد الأقصى لحجم الملف هو 50 ميجابايت',
        variant: 'destructive' 
      });
      return;
    }

    setSubmitting(true);
    let fileUrl = null;
    
    if (uploadMethod === 'drive' && driveUrl) {
      // Convert Google Drive share URL to direct embed URL
      const driveMatch = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (driveMatch) {
        fileUrl = `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
      } else {
        fileUrl = driveUrl;
      }
    } else if (contentFile) {
      // Sanitize filename - remove Arabic and special characters
      const fileExt = contentFile.name.split('.').pop() || '';
      const sanitizedName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { error } = await supabase.storage.from('content-files').upload(sanitizedName, contentFile);
      if (!error) {
        // Generate signed URL for private bucket
        const { data } = await supabase.storage.from('content-files').createSignedUrl(sanitizedName, 60 * 60 * 24 * 365); // 1 year
        fileUrl = data?.signedUrl || null;
      }
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
    if (!error) {
      toast({ title: 'تمت الإضافة بنجاح' });
      setContentTitle(''); 
      setContentDesc(''); 
      setContentFile(null);
      setFilePreview(null);
      setDriveUrl('');
    } else {
      toast({ 
        title: 'خطأ في الإضافة', 
        description: error.message,
        variant: 'destructive' 
      });
    }
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
          <h1 className="text-3xl font-bold gradient-text mb-8">لوحة تحكم الأستاذ</h1>

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
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">الطلاب المسجلين ({students.length})</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                  <span>متصل الآن: {students.filter(s => onlineUsers.includes(s.user_id)).length}</span>
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
                        {students.filter(s => s.level === 'baccalaureate').length}
                      </span>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {students.filter(s => s.level === 'baccalaureate').length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">لا يوجد طلاب</p>
                      ) : (
                        students.filter(s => s.level === 'baccalaureate').map((s) => {
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
                        {students.filter(s => s.level === 'second_year').length}
                      </span>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {students.filter(s => s.level === 'second_year').length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">لا يوجد طلاب</p>
                      ) : (
                        students.filter(s => s.level === 'second_year').map((s) => {
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
                    <Label>الملف (PDF, صور, فيديو, صوت...)</Label>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        isDragActive 
                          ? 'border-primary bg-primary/10' 
                          : contentFile 
                          ? 'border-success bg-success/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <input {...getInputProps()} />
                      {contentFile ? (
                        <div className="space-y-3">
                          {/* Image Preview */}
                          {filePreview && (
                            <div className="flex justify-center">
                              <img 
                                src={filePreview} 
                                alt="معاينة" 
                                className="max-h-40 rounded-lg border border-border object-contain"
                              />
                            </div>
                          )}
                          <div className="flex items-center justify-center gap-3">
                            <FileText className="w-8 h-8 text-success" />
                            <div className="flex-1 text-right">
                              <p className="font-medium text-foreground">{contentFile.name}</p>
                              <p className="text-xs text-muted-foreground">{(contentFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setContentFile(null);
                                setFilePreview(null);
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                          {isDragActive ? (
                            <p className="text-primary">أفلت الملف هنا...</p>
                          ) : (
                            <>
                              <p className="text-foreground font-medium mb-1">اسحب وأفلت أي ملف هنا</p>
                              <p className="text-sm text-muted-foreground">PDF, صور, فيديو, صوت... (الحد الأقصى 50MB)</p>
                            </>
                          )}
                        </>
                      )}
                    </div>
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
                            </div>
                            <div className="text-xs text-muted-foreground">
                              تاريخ الإضافة: {new Date(c.created_at).toLocaleDateString('ar-DZ')}
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteContent(c.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteAnnouncement(a.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
