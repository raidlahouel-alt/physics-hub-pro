import { useState } from 'react';
import { Content } from '@/lib/types';
import { DifficultyStars } from './DifficultyStars';
import { FileText, BookOpen, ClipboardList, Download, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommentSection } from '@/components/comments/CommentSection';

interface ContentCardProps {
  content: Content;
}

const contentTypeConfig = {
  lesson: {
    icon: BookOpen,
    label: 'درس',
    color: 'text-primary'
  },
  summary: {
    icon: FileText,
    label: 'ملخص',
    color: 'text-accent'
  },
  exercise: {
    icon: ClipboardList,
    label: 'تمرين',
    color: 'text-success'
  }
};

export function ContentCard({ content }: ContentCardProps) {
  const [showComments, setShowComments] = useState(false);
  const config = contentTypeConfig[content.content_type];
  const Icon = config.icon;

  return (
    <div className="glass-card p-5 hover:border-primary/50 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center ${config.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {content.difficulty && (
          <DifficultyStars difficulty={content.difficulty} />
        )}
      </div>

      <div className="mb-3">
        <span className={`text-xs px-2 py-1 rounded-full bg-secondary ${config.color}`}>
          {config.label}
        </span>
      </div>

      <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
        {content.title}
      </h3>
      
      {content.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {content.description}
        </p>
      )}

      <div className="flex gap-2">
        {content.file_url && (
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <a 
              href={content.file_url} 
              target="_blank" 
              rel="noopener noreferrer"
              download
            >
              <Download className="w-4 h-4 ml-2" />
              تحميل الملف
            </a>
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="shrink-0"
        >
          <MessageCircle className="w-4 h-4 ml-1" />
          {showComments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {showComments && <CommentSection contentId={content.id} />}
    </div>
  );
}
