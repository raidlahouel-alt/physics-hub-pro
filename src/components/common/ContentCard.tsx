import { useState } from 'react';
import { Content } from '@/lib/types';
import { DifficultyStars } from './DifficultyStars';
import { FileText, BookOpen, ClipboardList, MessageCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommentSection } from '@/components/comments/CommentSection';
import { ContentViewer } from '@/components/content/ContentViewer';

interface ContentCardProps {
  content: Content;
}

const contentTypeConfig = {
  lesson: {
    icon: BookOpen,
    label: 'درس',
    color: 'text-primary',
    bgGradient: 'from-primary/20 to-primary/5',
    borderColor: 'border-primary/30'
  },
  summary: {
    icon: FileText,
    label: 'ملخص',
    color: 'text-accent',
    bgGradient: 'from-accent/20 to-accent/5',
    borderColor: 'border-accent/30'
  },
  exercise: {
    icon: ClipboardList,
    label: 'تمرين',
    color: 'text-success',
    bgGradient: 'from-success/20 to-success/5',
    borderColor: 'border-success/30'
  }
};

export function ContentCard({ content }: ContentCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const config = contentTypeConfig[content.content_type];
  const Icon = config.icon;

  return (
    <div 
      className={`glass-card p-5 group relative overflow-hidden transition-all duration-500 ${
        isHovered ? `${config.borderColor} shadow-lg` : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Sparkle effect on hover */}
      <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:rotate-12">
        <Sparkles className={`w-4 h-4 ${config.color} animate-pulse`} />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.bgGradient} flex items-center justify-center ${config.color} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
            <Icon className="w-6 h-6" />
          </div>
          {content.difficulty && (
            <div className="transform group-hover:scale-110 transition-transform duration-300">
              <DifficultyStars difficulty={content.difficulty} />
            </div>
          )}
        </div>

        <div className="mb-3">
          <span className={`text-xs px-3 py-1.5 rounded-full bg-secondary/80 ${config.color} font-medium inline-flex items-center gap-1 group-hover:bg-secondary transition-colors`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        </div>

        <h3 className={`font-semibold text-foreground mb-2 group-hover:${config.color} transition-colors duration-300 text-lg`}>
          {content.title}
        </h3>
        
        {content.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 group-hover:text-foreground/70 transition-colors">
            {content.description}
          </p>
        )}

        <div className="flex gap-2 mb-2">
          <div className="flex-1 transform group-hover:scale-[1.02] transition-transform duration-300">
            <ContentViewer content={content} />
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className={`shrink-0 hover:bg-secondary/80 ${showComments ? config.color : ''} transition-all duration-300`}
          >
            <MessageCircle className={`w-4 h-4 ml-1 ${showComments ? 'animate-bounce-soft' : ''}`} />
            {showComments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Animated comments section */}
        <div className={`overflow-hidden transition-all duration-500 ${showComments ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="pt-4 border-t border-border/50">
            <CommentSection contentId={content.id} />
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${config.bgGradient.replace('/20', '').replace('/5', '')} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-right`} />
    </div>
  );
}