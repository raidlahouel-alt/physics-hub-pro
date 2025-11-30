import { Star } from 'lucide-react';

interface DifficultyStarsProps {
  difficulty: number;
  size?: 'sm' | 'md' | 'lg';
}

export function DifficultyStars({ difficulty, size = 'md' }: DifficultyStarsProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= difficulty
              ? 'text-warning fill-warning'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
}
