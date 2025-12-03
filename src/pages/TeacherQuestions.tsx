import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  HelpCircle, Send, Trash2, Reply, GraduationCap, 
  CheckCircle2, Clock, MessageSquare, Filter, Search,
  Volume2, VolumeX, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface QuestionData {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profile?: { full_name: string; user_id: string };
  replies: ReplyData[];
  isAnswered: boolean;
}

interface ReplyData {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profile?: { full_name: string; user_id: string };
  isTeacher: boolean;
}

export default function TeacherQuestions() {
  const { user, isTeacher } = useAuth();
  const { playNotificationSound } = useNotificationSound();
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'answered' | 'unanswered'>('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const questionsCountRef = useRef(0);

  useEffect(() => {
    if (isTeacher) {
      fetchQuestions();
    }
  }, [isTeacher]);

  // Real-time subscription for new questions
  useEffect(() => {
    if (!isTeacher) return;

    const channel = supabase
      .channel('teacher-questions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: 'is_question=eq.true'
        },
        (payload) => {
          // Only notify for new parent questions (not replies)
          if (!payload.new.parent_id && !payload.new.content_id) {
            if (soundEnabled) {
              playNotificationSound();
            }
            toast.info('سؤال جديد!', {
              description: 'تم استلام سؤال جديد من طالب',
              action: {
                label: 'عرض',
                onClick: () => fetchQuestions()
              }
            });
            fetchQuestions();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isTeacher, soundEnabled, playNotificationSound]);

  const fetchQuestions = async () => {
    setLoading(true);

    // Fetch parent questions
    const { data: questionsData, error } = await supabase
      .from('comments')
      .select('*')
      .eq('is_question', true)
      .is('content_id', null)
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching questions:', error);
      setLoading(false);
      return;
    }

    // Fetch all replies
    const { data: repliesData } = await supabase
      .from('comments')
      .select('*')
      .eq('is_question', true)
      .is('content_id', null)
      .not('parent_id', 'is', null);

    // Get all user IDs
    const allUserIds = [...new Set([
      ...(questionsData || []).map(q => q.user_id),
      ...(repliesData || []).map(r => r.user_id)
    ])];

    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', allUserIds);

    // Fetch teacher roles
    const { data: teacherRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'teacher')
      .in('user_id', allUserIds);

    const teacherUserIds = new Set(teacherRoles?.map(r => r.user_id) || []);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Build questions with replies
    const processedQuestions: QuestionData[] = (questionsData || []).map(question => {
      const questionReplies = (repliesData || [])
        .filter(r => r.parent_id === question.id)
        .map(reply => ({
          id: reply.id,
          user_id: reply.user_id,
          message: reply.message,
          created_at: reply.created_at,
          profile: profileMap.get(reply.user_id),
          isTeacher: teacherUserIds.has(reply.user_id)
        }));

      // Question is answered if it has at least one teacher reply
      const isAnswered = questionReplies.some(r => r.isTeacher);

      return {
        id: question.id,
        user_id: question.user_id,
        message: question.message,
        created_at: question.created_at,
        profile: profileMap.get(question.user_id),
        replies: questionReplies,
        isAnswered
      };
    });

    setQuestions(processedQuestions);
    setLoading(false);
  };

  const handleReply = async (questionId: string) => {
    if (!user || !replyText.trim()) return;

    setSubmitting(true);
    const { error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        message: replyText.trim(),
        is_question: true,
        content_id: null,
        parent_id: questionId
      });

    if (error) {
      toast.error('حدث خطأ أثناء إرسال الرد');
    } else {
      toast.success('تم إرسال الرد بنجاح');
      setReplyText('');
      setReplyingTo(null);
      fetchQuestions();
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا؟')) return;

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      toast.error('حدث خطأ أثناء الحذف');
    } else {
      toast.success('تم الحذف بنجاح');
      fetchQuestions();
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '؟';
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchQuestions();
    setRefreshing(false);
    toast.success('تم تحديث الأسئلة');
  };

  const filteredQuestions = questions.filter(q => {
    // Apply status filter
    if (filter === 'answered' && !q.isAnswered) return false;
    if (filter === 'unanswered' && q.isAnswered) return false;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesMessage = q.message.toLowerCase().includes(query);
      const matchesName = q.profile?.full_name?.toLowerCase().includes(query);
      if (!matchesMessage && !matchesName) return false;
    }
    
    return true;
  });

  const stats = {
    total: questions.length,
    answered: questions.filter(q => q.isAnswered).length,
    unanswered: questions.filter(q => !q.isAnswered).length
  };

  if (!isTeacher) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-destructive">غير مصرح</h1>
          <p className="text-muted-foreground mt-2">هذه الصفحة للأساتذة فقط</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <HelpCircle className="h-8 w-8 text-primary" />
            إدارة أسئلة الطلاب
          </h1>
          <p className="text-muted-foreground">عرض وإدارة جميع أسئلة الطلاب والرد عليها</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">إجمالي الأسئلة</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.answered}</p>
                <p className="text-sm text-muted-foreground">تمت الإجابة</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/10">
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.unanswered}</p>
                <p className="text-sm text-muted-foreground">في انتظار الرد</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن سؤال أو اسم طالب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'إيقاف صوت الإشعارات' : 'تفعيل صوت الإشعارات'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              title="تحديث الأسئلة"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="all" className="gap-2">
                <Filter className="h-4 w-4" />
                الكل ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="unanswered" className="gap-2">
                <Clock className="h-4 w-4" />
                لم يُجب ({stats.unanswered})
              </TabsTrigger>
              <TabsTrigger value="answered" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                مُجاب ({stats.answered})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : filteredQuestions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد أسئلة {filter === 'unanswered' ? 'في انتظار الرد' : filter === 'answered' ? 'تمت الإجابة عليها' : ''}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <Card key={question.id} className={!question.isAnswered ? 'border-orange-500/50' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {getInitials(question.profile?.full_name || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {question.profile?.full_name || 'طالب'}
                          </span>
                          <Badge variant={question.isAnswered ? 'default' : 'secondary'} className={question.isAnswered ? 'bg-green-500' : 'bg-orange-500'}>
                            {question.isAnswered ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 ml-1" />
                                تمت الإجابة
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3 ml-1" />
                                في انتظار الرد
                              </>
                            )}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(question.created_at), { 
                            addSuffix: true, 
                            locale: ar 
                          })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(question.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground mb-4 p-3 bg-muted/50 rounded-lg">
                    {question.message}
                  </p>

                  {/* Replies */}
                  {question.replies.length > 0 && (
                    <div className="space-y-3 mb-4 pr-4 border-r-2 border-primary/30">
                      {question.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3 p-3 rounded-lg bg-background border border-border">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(reply.profile?.full_name || '')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {reply.profile?.full_name || 'مستخدم'}
                              </span>
                              {reply.isTeacher && (
                                <Badge variant="default" className="text-xs bg-primary">
                                  <GraduationCap className="h-3 w-3 ml-1" />
                                  أستاذ
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(reply.created_at), { 
                                  addSuffix: true, 
                                  locale: ar 
                                })}
                              </span>
                            </div>
                            <p className="text-sm">{reply.message}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(reply.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Input */}
                  {replyingTo === question.id ? (
                    <div className="flex gap-2 mt-4">
                      <Textarea
                        placeholder="اكتب ردك..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="resize-none"
                        rows={2}
                      />
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleReply(question.id)}
                          disabled={!replyText.trim() || submitting}
                          size="icon"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => { setReplyingTo(null); setReplyText(''); }}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => setReplyingTo(question.id)}
                    >
                      <Reply className="h-4 w-4 ml-2" />
                      الرد على السؤال
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
