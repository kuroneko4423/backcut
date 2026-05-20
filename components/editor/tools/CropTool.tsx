'use client';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AspectRatio } from '@/types';

interface CropToolProps {
  aspectRatio: AspectRatio;
  margin: number;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  onMarginChange: (margin: number) => void;
  onAutoTrim: () => void;
  onApply: () => void;
  onCancel: () => void;
  canApply: boolean;
}

const ASPECT_OPTIONS: AspectRatio[] = ['free', '1:1', '16:9', '9:16', '4:3'];

const ASPECT_LABEL: Record<AspectRatio, string> = {
  free: '自由',
  '1:1': '1:1',
  '16:9': '16:9',
  '9:16': '9:16',
  '4:3': '4:3',
};

export function CropTool({
  aspectRatio,
  margin,
  onAspectRatioChange,
  onMarginChange,
  onAutoTrim,
  onApply,
  onCancel,
  canApply,
}: CropToolProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">自動トリミング</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">余白</span>
          <span className="text-xs tabular-nums">{margin}px</span>
        </div>
        <Slider
          className="mb-2"
          value={[margin]}
          min={0}
          max={50}
          step={1}
          onValueChange={(values) => {
            const v = Array.isArray(values) ? values[0] : values;
            if (typeof v === 'number') onMarginChange(v);
          }}
        />
        <Button type="button" className="w-full" onClick={onAutoTrim}>
          自動トリミングを実行
        </Button>
      </div>

      <div className="border-t pt-4">
        <p className="mb-2 text-xs font-medium text-muted-foreground">手動トリミング</p>
        <div className="mb-2">
          <span className="text-xs text-muted-foreground">アスペクト比</span>
          <Select
            value={aspectRatio}
            onValueChange={(value) => {
              if (typeof value === 'string') onAspectRatioChange(value as AspectRatio);
            }}
          >
            <SelectTrigger className="mt-1 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASPECT_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {ASPECT_LABEL[opt]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="mb-2 text-xs text-muted-foreground">
          Canvas 上でドラッグして範囲を選択してください。
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={!canApply}>
            キャンセル
          </Button>
          <Button type="button" onClick={onApply} disabled={!canApply}>
            適用
          </Button>
        </div>
      </div>
    </div>
  );
}
