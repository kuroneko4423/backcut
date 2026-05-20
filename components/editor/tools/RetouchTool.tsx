'use client';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { BrushOptions, BrushMode } from '@/types';

interface RetouchToolProps {
  options: BrushOptions;
  onChange: (options: BrushOptions) => void;
  onRevert?: () => void;
  canRevert?: boolean;
}

export function RetouchTool({ options, onChange, onRevert, canRevert }: RetouchToolProps) {
  const setMode = (mode: BrushMode) => onChange({ ...options, mode });
  const setSize = (size: number) => onChange({ ...options, size });
  const setHardness = (hardness: number) => onChange({ ...options, hardness });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">モード</p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={options.mode === 'restore' ? 'default' : 'outline'}
            onClick={() => setMode('restore')}
          >
            戻す
          </Button>
          <Button
            type="button"
            variant={options.mode === 'erase' ? 'default' : 'outline'}
            onClick={() => setMode('erase')}
          >
            消す
          </Button>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">ブラシサイズ</p>
          <span className="text-xs tabular-nums">{options.size}px</span>
        </div>
        <Slider
          value={[options.size]}
          min={1}
          max={200}
          step={1}
          onValueChange={(values) => {
            const v = Array.isArray(values) ? values[0] : values;
            if (typeof v === 'number') setSize(v);
          }}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">硬さ</p>
          <span className="text-xs tabular-nums">{Math.round(options.hardness * 100)}%</span>
        </div>
        <Slider
          value={[Math.round(options.hardness * 100)]}
          min={0}
          max={100}
          step={1}
          onValueChange={(values) => {
            const v = Array.isArray(values) ? values[0] : values;
            if (typeof v === 'number') setHardness(v / 100);
          }}
        />
      </div>

      <p className={cn('text-xs text-muted-foreground')}>
        画像をドラッグして
        {options.mode === 'restore' ? '消えた部分を復元' : '残った部分を消去'}
        します。
      </p>

      {onRevert && (
        <Button type="button" variant="outline" onClick={onRevert} disabled={!canRevert}>
          透過直後に戻す
        </Button>
      )}
    </div>
  );
}
