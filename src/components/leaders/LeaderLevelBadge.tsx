import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface LeaderLevel {
  name: string;
  min: number;
  max: number;
  icon: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

const LEADER_LEVELS: LeaderLevel[] = [
  { 
    name: 'Bronze', 
    min: 0, 
    max: 10, 
    icon: '🥉', 
    colorClass: 'text-amber-700',
    bgClass: 'bg-amber-100',
    borderClass: 'border-amber-300'
  },
  { 
    name: 'Prata', 
    min: 11, 
    max: 30, 
    icon: '🥈', 
    colorClass: 'text-gray-600',
    bgClass: 'bg-gray-100',
    borderClass: 'border-gray-300'
  },
  { 
    name: 'Ouro', 
    min: 31, 
    max: 50, 
    icon: '🥇', 
    colorClass: 'text-yellow-700',
    bgClass: 'bg-yellow-100',
    borderClass: 'border-yellow-400'
  },
  { 
    name: 'Diamante', 
    min: 51, 
    max: Infinity, 
    icon: '💎', 
    colorClass: 'text-blue-700',
    bgClass: 'bg-blue-100',
    borderClass: 'border-blue-400'
  },
];

export function getLeaderLevel(points: number): LeaderLevel {
  return LEADER_LEVELS.find(l => points >= l.min && points <= l.max) || LEADER_LEVELS[0];
}

export function getNextLevel(points: number): LeaderLevel | null {
  const currentLevel = getLeaderLevel(points);
  const currentIndex = LEADER_LEVELS.findIndex(l => l.name === currentLevel.name);
  if (currentIndex < LEADER_LEVELS.length - 1) {
    return LEADER_LEVELS[currentIndex + 1];
  }
  return null;
}

export function getProgressToNextLevel(points: number): number {
  const currentLevel = getLeaderLevel(points);
  const nextLevel = getNextLevel(points);
  
  if (!nextLevel) return 100; // Já está no nível máximo
  
  const progressInLevel = points - currentLevel.min;
  const levelRange = currentLevel.max - currentLevel.min + 1;
  
  return Math.min(100, Math.round((progressInLevel / levelRange) * 100));
}

export function getPointsToNextLevel(points: number): number {
  const nextLevel = getNextLevel(points);
  if (!nextLevel) return 0;
  return nextLevel.min - points;
}

interface LeaderLevelBadgeProps {
  points: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LeaderLevelBadge({ 
  points, 
  showIcon = true, 
  size = 'md',
  className 
}: LeaderLevelBadgeProps) {
  const level = getLeaderLevel(points);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };
  
  return (
    <Badge 
      className={cn(
        level.bgClass,
        level.colorClass,
        'border',
        level.borderClass,
        sizeClasses[size],
        'font-semibold',
        className
      )}
      variant="outline"
    >
      {showIcon && <span className="mr-1">{level.icon}</span>}
      {level.name}
    </Badge>
  );
}

interface LeaderLevelProgressProps {
  points: number;
  showLabel?: boolean;
  className?: string;
}

export function LeaderLevelProgress({ 
  points, 
  showLabel = true,
  className 
}: LeaderLevelProgressProps) {
  const level = getLeaderLevel(points);
  const nextLevel = getNextLevel(points);
  const progress = getProgressToNextLevel(points);
  const pointsNeeded = getPointsToNextLevel(points);
  
  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className={level.colorClass}>{level.icon} {level.name}</span>
          {nextLevel && (
            <span className="text-muted-foreground">
              {pointsNeeded} pts para {nextLevel.icon} {nextLevel.name}
            </span>
          )}
        </div>
      )}
      <Progress 
        value={progress} 
        className="h-2"
      />
    </div>
  );
}

interface LeaderLevelCardColorProps {
  points: number;
}

export function getLeaderCardColorClass(points: number): string {
  const level = getLeaderLevel(points);
  return `border-l-4 ${level.borderClass} ${level.bgClass.replace('100', '50')}/50`;
}

export { LEADER_LEVELS };
