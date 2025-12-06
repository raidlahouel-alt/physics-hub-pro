import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Announcement, StudentLevel } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

const announcementSchema = z.object({
  title: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل').max(200, 'العنوان طويل جداً'),
  content: z.string().min(10, 'المحتوى يجب أن يكون 10 أحرف على الأقل').max(2000, 'المحتوى طويل جداً'),
});

interface EditAnnouncementModalProps {
  announcement: Announcement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditAnnouncementModal({ announcement, open, onOpenChange, onSuccess }: EditAnnouncementModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(announcement.title);
  const [content, setContent] = useState(announcement.content);
  const [level, setLevel] = useState<StudentLevel | ''>(announcement.level || '');
  const [isActive, setIsActive] = useState(announcement.is_active);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = announcementSchema.safeParse({ title, content });
    if (!validation.success) {
      toast({ 
        title: 'خطأ في البيانات', 
        description: validation.error.errors[0].message,
        variant: 'destructive' 
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('announcements')
        .update({
          title: title.trim(),
          content: content.trim(),
          level: level || null,
          is_active: isActive
        })
        .eq('id', announcement.id);

      if (error) throw error;

      toast({ title: 'تم تحديث الإعلان بنجاح' });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'خطأ في التحديث',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>تعديل الإعلان</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>العنوان</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          
          <div>
            <Label>المحتوى</Label>
            <textarea 
              className="w-full p-3 rounded-lg border border-border bg-secondary min-h-[120px]"
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              required
            />
          </div>
          
          <div>
            <Label>المستوى (اختياري)</Label>
            <select 
              className="w-full h-10 px-3 rounded-lg border border-border bg-secondary"
              value={level} 
              onChange={(e) => setLevel(e.target.value as StudentLevel)}
            >
              <option value="">الكل</option>
              <option value="second_year">ثانية ثانوي</option>
              <option value="baccalaureate">بكالوريا</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-border"
            />
            <Label htmlFor="isActive" className="cursor-pointer">الإعلان نشط</Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="hero" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              حفظ التغييرات
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
