import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useUnansweredQuestions(isTeacher: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isTeacher) return;

    const fetchCount = async () => {
      // Get all parent questions
      const { data: questions } = await supabase
        .from('comments')
        .select('id')
        .eq('is_question', true)
        .is('parent_id', null);

      if (!questions?.length) {
        setCount(0);
        return;
      }

      const questionIds = questions.map(q => q.id);

      // Get all replies
      const { data: replies } = await supabase
        .from('comments')
        .select('parent_id, user_id')
        .in('parent_id', questionIds);

      // Get teacher user IDs
      const replyUserIds = [...new Set(replies?.map(r => r.user_id) || [])];
      const { data: teacherRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'teacher')
        .in('user_id', replyUserIds);

      const teacherUserIds = new Set(teacherRoles?.map(r => r.user_id) || []);

      // Count questions with no teacher replies
      const answeredIds = new Set(
        (replies || [])
          .filter(r => teacherUserIds.has(r.user_id))
          .map(r => r.parent_id)
      );

      const unanswered = questions.filter(q => !answeredIds.has(q.id)).length;
      setCount(unanswered);
    };

    fetchCount();

    // Real-time subscription
    const channel = supabase
      .channel('unanswered-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        () => fetchCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isTeacher]);

  return count;
}
