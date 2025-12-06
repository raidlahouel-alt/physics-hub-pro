import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Comment as CommentType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { HelpCircle, Send, Trash2, MessageSquare, Reply, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface CommentWithExtras {
  id: string;
  user_id: string;
  content_id: string | null;
  parent_id: string | null;
  message: string;
  is_question: boolean;
  created_at: string;
  updated_at: string;
  profile?: { full_name: string; user_id: string };
  isTeacherComment?: boolean;
  replies?: CommentWithExtras[];
}

export function QuestionBox() {
  const { user, isTeacher, profile } = useAuth();
  const [questions, setQuestions] = useState<CommentWithExtras[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    
    // Fetch questions (parent comments)
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

    // Fetch replies
    const { data: repliesData } = await supabase
      .from('comments')
      .select('*')
      .eq('is_question', true)
      .is('content_id', null)
      .not('parent_id', 'is', null)
      .order('created_at', { ascending: true });

    // Fetch profiles for all users
    const allUserIds = [...new Set([
      ...(questionsData || []).map(q => q.user_id),
      ...(repliesData || []).map(r => r.user_id)
    ])];

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
    const questionsWithReplies: CommentWithExtras[] = (questionsData || []).map(question => {
      const questionReplies = (repliesData || [])
        .filter(r => r.parent_id === question.id)
        .map(reply => ({
          ...reply,
          profile: profileMap.get(reply.user_id),
          isTeacherComment: teacherUserIds.has(reply.user_id)
        }));

      return {
        ...question,
        profile: profileMap.get(question.user_id),
        isTeacherComment: teacherUserIds.has(question.user_id),
        replies: questionReplies
      };
    });

    setQuestions(questionsWithReplies);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user || !newQuestion.trim()) return;
    
    if (newQuestion.length > 1000) {
      toast.error('السؤال طويل جداً (الحد الأقصى 1000 حرف)');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        message: newQuestion.trim(),
        is_question: true,
        content_id: null,
        parent_id: null
      });

    if (error) {
      console.error('Error adding question:', error);
      toast.error('حدث خطأ أثناء إرسال السؤال');
    } else {
      toast.success('تم إرسال السؤال بنجاح');
      setNewQuestion('');
      fetchQuestions();
    }
    setSubmitting(false);
  };

  const handleReply = async (questionId: string) => {
    if (!user || !replyText.trim()) return;

    if (replyText.length > 1000) {
      toast.error('الرد طويل جداً (الحد الأقصى 1000 حرف)');
      return;
    }

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
      console.error('Error adding reply:', error);
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
      console.error('Error deleting:', error);
      toast.error('حدث خطأ أثناء الحذف');
    } else {
      toast.success('تم الحذف بنجاح');
      fetchQuestions();
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '؟';
  };

  if (!user) return null;

  return (
    <Card className="mb-8">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          اسأل الأستاذ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Question input - mobile optimized */}
        <div className="space-y-2 sm:space-y-0 sm:flex sm:gap-3">
          <Textarea
            placeholder="اكتب سؤالك هنا..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="resize-none min-h-[80px]"
            rows={3}
            maxLength={1000}
          />
          <Button 
            onClick={handleSubmit} 
            disabled={!newQuestion.trim() || submitting}
            className="w-full sm:w-auto sm:shrink-0"
          >
            <Send className="h-4 w-4 ml-2" />
            إرسال
          </Button>
        </div>

        {/* Questions list */}
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 font-semibold text-muted-foreground text-sm">
            <MessageSquare className="h-4 w-4" />
            الأسئلة السابقة ({questions.length})
          </h4>
          
          {loading ? (
            <div className="text-center py-4 text-muted-foreground text-sm">جاري التحميل...</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">لا توجد أسئلة بعد</div>
          ) : (
            <div className="space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
              {questions.map((question: any) => (
                <div key={question.id} className="rounded-lg border border-border overflow-hidden">
                  {/* Question */}
                  <div className="p-3 sm:p-4 bg-muted/30">
                    <div className="flex gap-2 sm:gap-3">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                        <AvatarFallback className="text-xs sm:text-sm">
                          {getInitials(question.profile?.full_name || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">
                                {question.profile?.full_name || 'طالب'}
                              </span>
                              {question.isTeacherComment && (
                                <Badge variant="secondary" className="text-xs py-0">
                                  <GraduationCap className="h-3 w-3 ml-1" />
                                  أستاذ
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(question.created_at), { 
                                addSuffix: true, 
                                locale: ar 
                              })}
                            </span>
                          </div>
                          {(user?.id === question.user_id || isTeacher) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0 h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(question.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm mt-2 break-words">{question.message}</p>
                        
                        {/* Reply button - for everyone */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-primary h-8 px-2 text-xs"
                          onClick={() => setReplyingTo(replyingTo === question.id ? null : question.id)}
                        >
                          <Reply className="h-3.5 w-3.5 ml-1" />
                          رد
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Reply input */}
                  {replyingTo === question.id && (
                    <div className="p-3 bg-primary/5 border-t border-border">
                      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                        <span>الرد باسم:</span>
                        <span className="font-medium text-foreground">{profile?.full_name || 'مستخدم'}</span>
                        {isTeacher && (
                          <Badge variant="secondary" className="text-xs py-0">أستاذ</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="اكتب ردك..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="resize-none min-h-[60px]"
                          rows={2}
                          maxLength={1000}
                        />
                        <Button
                          onClick={() => handleReply(question.id)}
                          disabled={!replyText.trim() || submitting}
                          size="icon"
                          className="shrink-0"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {question.replies && question.replies.length > 0 && (
                    <div className="border-t border-border">
                      {question.replies.map((reply: any) => (
                        <div key={reply.id} className="flex gap-2 sm:gap-3 p-3 pr-6 sm:pr-12 bg-background border-b border-border/50 last:border-b-0">
                          <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                            <AvatarFallback className="text-xs">
                              {getInitials(reply.profile?.full_name || '')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">
                                    {reply.profile?.full_name || 'مستخدم'}
                                  </span>
                                  {reply.isTeacherComment && (
                                    <Badge variant="default" className="text-xs bg-primary py-0">
                                      <GraduationCap className="h-3 w-3 ml-1" />
                                      أستاذ
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(reply.created_at), { 
                                    addSuffix: true, 
                                    locale: ar 
                                  })}
                                </span>
                              </div>
                              {(user?.id === reply.user_id || isTeacher) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0 h-6 w-6 text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(reply.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            <p className="text-sm mt-1 break-words">{reply.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
