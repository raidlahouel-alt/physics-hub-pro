import { useState } from 'react';
import { Content } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Download, FileText, Image, Video, FileAudio, File, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  
  // Get all file URLs - combine file_url and file_urls
  const getAllFileUrls = (): string[] => {
    const urls: string[] = [];
    
    // Check file_urls array first
    if (content.file_urls && Array.isArray(content.file_urls) && content.file_urls.length > 0) {
      urls.push(...content.file_urls.filter(url => url && typeof url === 'string'));
    }
    
    // If no file_urls, use file_url
    if (urls.length === 0 && content.file_url) {
      urls.push(content.file_url);
    }
    
    return urls;
  };
  
  const fileUrls = getAllFileUrls();
  
  if (fileUrls.length === 0) return null;
  
  const currentUrl = fileUrls[currentFileIndex];
  const fileType = getFileType(currentUrl);
  const FileIcon = getFileIcon(fileType);
  const hasMultipleFiles = fileUrls.length > 1;
  
  const goToNextFile = () => {
    setCurrentFileIndex((prev) => (prev + 1) % fileUrls.length);
  };
  
  const goToPrevFile = () => {
    setCurrentFileIndex((prev) => (prev - 1 + fileUrls.length) % fileUrls.length);
  };
  
  const renderContent = (url: string) => {
    const type = getFileType(url);
    
    switch (type) {
      case 'pdf':
        return (
          <iframe
            src={`${url}#toolbar=1`}
            className="w-full h-[70vh] rounded-lg border border-border"
            title={content.title}
          />
        );
      case 'image':
        return (
          <img
            src={url}
            alt={content.title}
            className="max-w-full max-h-[70vh] mx-auto rounded-lg"
          />
        );
      case 'video':
        return (
          <video
            src={url}
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
            <audio src={url} controls className="w-full max-w-md">
              متصفحك لا يدعم تشغيل الصوت
            </audio>
          </div>
        );
      case 'drive':
        return (
          <iframe
            src={url}
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
              <a href={url} target="_blank" rel="noopener noreferrer" download>
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
            عرض {hasMultipleFiles && `(${fileUrls.length})`}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileIcon className="w-5 h-5" />
              {content.title}
              {hasMultipleFiles && (
                <span className="text-sm text-muted-foreground mr-2">
                  ({currentFileIndex + 1} / {fileUrls.length})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {/* Navigation for multiple files */}
          {hasMultipleFiles && (
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToPrevFile}
                className="gap-2"
              >
                <ChevronRight className="w-4 h-4" />
                السابق
              </Button>
              
              <div className="flex gap-2">
                {fileUrls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentFileIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentFileIndex 
                        ? 'bg-primary scale-110' 
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                  />
                ))}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToNextFile}
                className="gap-2"
              >
                التالي
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          {renderContent(currentUrl)}
          
          {/* Download current file */}
          <div className="flex justify-center mt-4">
            <Button variant="outline" asChild>
              <a href={currentUrl} target="_blank" rel="noopener noreferrer" download>
                <Download className="w-4 h-4 ml-2" />
                تحميل هذا الملف
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Button variant="outline" size="sm" asChild>
        <a href={fileUrls[0]} target="_blank" rel="noopener noreferrer" download>
          <Download className="w-4 h-4" />
        </a>
      </Button>
    </div>
  );
}