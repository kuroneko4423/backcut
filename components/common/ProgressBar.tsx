import { cn } from '@/lib/utils';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ current, total, label, className }: ProgressBarProps) {
  const ratio = total > 0 ? Math.min(1, Math.max(0, current / total)) : 0;
  const percent = Math.round(ratio * 100);

  return (
    <div className={cn('w-full space-y-1', className)}>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label ?? '処理中'}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-150"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
