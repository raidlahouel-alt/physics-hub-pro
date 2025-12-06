import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Content, ContentType, StudentLevel } from '@/lib/types';
import { Loader2, Upload, X, FileText, Trash2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { z } from 'zod';

const contentSchema = z.object({
  title: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل').max(200, 'العنوان طويل جداً'),
  description: z.string().max(1000, 'الوصف طويل جداً').optional(),
});

const MAX_FILE_SIZE = 50 * 1024 * 1024;

interface EditContentModalProps {
  content: Content;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditContentModal({ content, open, onOpenChange, onSuccess }: EditContentModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(content.title);
  const [description, setDescription] = useState(content.description || '');
  const [contentType, setContentType] = useState<ContentType>(content.content_type);
  const [level, setLevel] = useState<StudentLevel>(content.level);
  const [difficulty, setDifficulty] = useState(content.difficulty || 1);
  const [existingFiles, setExistingFiles] = useState<string[]>(content.file_urls || (content.file_url ? [content.file_url] : []));
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

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
    
    setNewFiles(prev => [...prev, ...validFiles]);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: MAX_FILE_SIZE
  });

  const removeNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (index: number) => {
    setExistingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = contentSchema.safeParse({ title, description });
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
      // Upload new files
      const uploadedUrls: string[] = [...existingFiles];
      
      for (const file of newFiles) {
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

      const { error } = await supabase
        .from('content')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          content_type: contentType,
          level,
          difficulty,
          file_url: uploadedUrls[0] || null,
          file_urls: uploadedUrls,
          updated_at: new Date().toISOString()
        })
        .eq('id', content.id);

      if (error) throw error;

      toast({ title: 'تم تحديث المحتوى بنجاح' });
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل المحتوى</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>العنوان</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          
          <div>
            <Label>الوصف</Label>
            <textarea 
              className="w-full p-3 rounded-lg border border-border bg-secondary min-h-[80px]"
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>النوع</Label>
              <select 
                className="w-full h-10 px-3 rounded-lg border border-border bg-secondary"
                value={contentType} 
                onChange={(e) => setContentType(e.target.value as ContentType)}
              >
                <option value="lesson">درس</option>
                <option value="summary">ملخص</option>
                <option value="exercise">تمرين</option>
              </select>
            </div>
            <div>
              <Label>المستوى</Label>
              <select 
                className="w-full h-10 px-3 rounded-lg border border-border bg-secondary"
                value={level} 
                onChange={(e) => setLevel(e.target.value as StudentLevel)}
              >
                <option value="second_year">ثانية ثانوي</option>
                <option value="baccalaureate">بكالوريا</option>
              </select>
            </div>
          </div>
          
          <div>
            <Label>الصعوبة (1-3)</Label>
            <Input 
              type="number" 
              min={1} 
              max={3} 
              value={difficulty} 
              onChange={(e) => setDifficulty(+e.target.value)} 
            />
          </div>

          {/* Existing Files */}
          {existingFiles.length > 0 && (
            <div>
              <Label>الملفات الحالية ({existingFiles.length})</Label>
              <div className="mt-2 space-y-2">
                {existingFiles.map((url, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-secondary/50 rounded-lg">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">ملف {index + 1}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeExistingFile(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Files */}
          <div>
            <Label>إضافة ملفات جديدة</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">اسحب وأفلت الملفات هنا</p>
            </div>
            
            {newFiles.length > 0 && (
              <div className="mt-2 space-y-2">
                {newFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-green-500/10 rounded-lg">
                    <FileText className="w-5 h-5 text-green-500 flex-shrink-0" />
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
                      onClick={() => removeNewFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
