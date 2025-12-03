import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Comment as CommentType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { HelpCircle, Send, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export function QuestionBox() {
  const { user, isTeacher } = useAuth();
  const [questions, setQuestions] = useState<CommentType[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('is_question', true)
      .is('content_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching questions:', error);
    } else {
      // Manually join profiles
      const questionsWithProfiles = await Promise.all(
        (data || []).map(async (question) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, user_id')
            .eq('user_id', question.user_id)
            .single();
          return { ...question, profile: profileData };
        })
      );
      setQuestions(questionsWithProfiles as CommentType[]);
    }
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
        content_id: null
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

  const handleDelete = async (questionId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', questionId);

    if (error) {
      console.error('Error deleting question:', error);
      toast.error('حدث خطأ أثناء حذف السؤال');
    } else {
      toast.success('تم حذف السؤال');
      fetchQuestions();
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '؟';
  };

  if (!user) return null;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <HelpCircle className="h-6 w-6 text-primary" />
          اسأل الأستاذ
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Question input */}
        <div className="flex gap-3 mb-6">
          <Textarea
            placeholder="اكتب سؤالك هنا..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="resize-none"
            rows={3}
            maxLength={1000}
          />
          <Button 
            onClick={handleSubmit} 
            disabled={!newQuestion.trim() || submitting}
            className="shrink-0"
          >
            <Send className="h-4 w-4 ml-2" />
            إرسال
          </Button>
        </div>

        {/* Questions list */}
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 font-semibold text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            الأسئلة السابقة ({questions.length})
          </h4>
          
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">جاري التحميل...</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">لا توجد أسئلة بعد</div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {questions.map((question) => (
                <div key={question.id} className="flex gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback>
                      {getInitials(question.profile?.full_name || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium">
                        {question.profile?.full_name || 'طالب'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(question.created_at), { 
                          addSuffix: true, 
                          locale: ar 
                        })}
                      </span>
                    </div>
                    <p className="text-sm break-words">{question.message}</p>
                  </div>
                  {(user?.id === question.user_id || isTeacher) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(question.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
