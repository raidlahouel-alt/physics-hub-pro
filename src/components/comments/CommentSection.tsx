import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Comment as CommentType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface CommentSectionProps {
  contentId: string;
}

export function CommentSection({ contentId }: CommentSectionProps) {
  const { user, isTeacher } = useAuth();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [contentId]);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profile:profiles!comments_user_id_fkey(full_name, user_id)
      `)
      .eq('content_id', contentId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      // Manually join profiles since the foreign key doesn't exist
      const commentsWithProfiles = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, user_id')
            .eq('user_id', comment.user_id)
            .single();
          return { ...comment, profile: profileData };
        })
      );
      setComments(commentsWithProfiles as CommentType[]);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user || !newComment.trim()) return;
    
    if (newComment.length > 1000) {
      toast.error('التعليق طويل جداً (الحد الأقصى 1000 حرف)');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        content_id: contentId,
        message: newComment.trim(),
        is_question: false
      });

    if (error) {
      console.error('Error adding comment:', error);
      toast.error('حدث خطأ أثناء إضافة التعليق');
    } else {
      toast.success('تم إضافة التعليق بنجاح');
      setNewComment('');
      fetchComments();
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      toast.error('حدث خطأ أثناء حذف التعليق');
    } else {
      toast.success('تم حذف التعليق');
      fetchComments();
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '؟';
  };

  return (
    <div className="mt-6 border-t border-border pt-4">
      <h4 className="flex items-center gap-2 text-lg font-semibold mb-4">
        <MessageCircle className="h-5 w-5" />
        التعليقات ({comments.length})
      </h4>

      {/* Comment input */}
      {user && (
        <div className="flex gap-3 mb-4">
          <Textarea
            placeholder="أضف تعليقاً..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="resize-none"
            rows={2}
            maxLength={1000}
          />
          <Button 
            onClick={handleSubmit} 
            disabled={!newComment.trim() || submitting}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="text-center py-4 text-muted-foreground">جاري التحميل...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">لا توجد تعليقات بعد</div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">
                  {getInitials(comment.profile?.full_name || '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">
                    {comment.profile?.full_name || 'مستخدم'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { 
                      addSuffix: true, 
                      locale: ar 
                    })}
                  </span>
                </div>
                <p className="text-sm mt-1 break-words">{comment.message}</p>
              </div>
              {(user?.id === comment.user_id || isTeacher) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(comment.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
