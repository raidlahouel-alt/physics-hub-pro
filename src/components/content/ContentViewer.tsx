import { useState } from 'react';
import { Content } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Download, X, FileText, Image, Video, FileAudio, File } from 'lucide-react';

interface ContentViewerProps {
  content: Content;
}

const getFileType = (url: string): 'pdf' | 'image' | 'video' | 'audio' | 'drive' | 'other' => {
  const lowercaseUrl = url.toLowerCase();
  // Check if it's a Google Drive URL
  if (lowercaseUrl.includes('drive.google.com')) return 'drive';
  if (lowercaseUrl.includes('.pdf')) return 'pdf';
  if (lowercaseUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)/)) return 'image';
  if (lowercaseUrl.match(/\.(mp4|webm|ogg|mov)/)) return 'video';
  if (lowercaseUrl.match(/\.(mp3|wav|ogg|m4a)/)) return 'audio';
  return 'other';
};

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'pdf': return FileText;
    case 'image': return Image;
    case 'video': return Video;
    case 'audio': return FileAudio;
    case 'drive': return FileText;
    default: return File;
  }
};

export function ContentViewer({ content }: ContentViewerProps) {
  const [open, setOpen] = useState(false);
  
  if (!content.file_url) return null;
  
  const fileType = getFileType(content.file_url);
  const FileIcon = getFileIcon(fileType);
  
  const renderContent = () => {
    switch (fileType) {
      case 'pdf':
        return (
          <iframe
            src={`${content.file_url}#toolbar=1`}
            className="w-full h-[70vh] rounded-lg border border-border"
            title={content.title}
          />
        );
      case 'image':
        return (
          <img
            src={content.file_url}
            alt={content.title}
            className="max-w-full max-h-[70vh] mx-auto rounded-lg"
          />
        );
      case 'video':
        return (
          <video
            src={content.file_url}
            controls
            className="w-full max-h-[70vh] rounded-lg"
          >
            متصفحك لا يدعم تشغيل الفيديو
          </video>
        );
      case 'audio':
        return (
          <div className="flex flex-col items-center gap-4 p-8">
            <FileAudio className="w-24 h-24 text-primary" />
            <audio src={content.file_url} controls className="w-full max-w-md">
              متصفحك لا يدعم تشغيل الصوت
            </audio>
          </div>
        );
      case 'drive':
        return (
          <iframe
            src={content.file_url}
            className="w-full h-[70vh] rounded-lg border border-border"
            title={content.title}
            allow="autoplay"
            allowFullScreen
          />
        );
      default:
        return (
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <File className="w-24 h-24 text-muted-foreground" />
            <p className="text-muted-foreground">
              هذا النوع من الملفات لا يمكن عرضه مباشرة
            </p>
            <Button asChild>
              <a href={content.file_url} target="_blank" rel="noopener noreferrer" download>
                <Download className="w-4 h-4 ml-2" />
                تحميل الملف
              </a>
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="flex gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="default" size="sm" className="flex-1">
            <Eye className="w-4 h-4 ml-2" />
            عرض
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileIcon className="w-5 h-5" />
              {content.title}
            </DialogTitle>
          </DialogHeader>
          {renderContent()}
        </DialogContent>
      </Dialog>
      
      <Button variant="outline" size="sm" asChild>
        <a href={content.file_url} target="_blank" rel="noopener noreferrer" download>
          <Download className="w-4 h-4" />
        </a>
      </Button>
    </div>
  );
}
