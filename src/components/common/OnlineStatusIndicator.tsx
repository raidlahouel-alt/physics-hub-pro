import { cn } from '@/lib/utils';

interface OnlineStatusIndicatorProps {
  isOnline: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function OnlineStatusIndicator({ 
  isOnline, 
  showLabel = true,
  size = 'md' 
}: OnlineStatusIndicatorProps) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  return (
    <div className="flex items-center gap-2">
      <span 
        className={cn(
          'rounded-full shrink-0',
          sizeClasses[size],
          isOnline 
            ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' 
            : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
        )} 
      />
      {showLabel && (
        <span className={cn(
          'text-sm',
          isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        )}>
          {isOnline ? 'متصل' : 'غير متصل'}
        </span>
      )}
    </div>
  );
}
