export type ProcessStatus = 'idle' | 'processing' | 'done' | 'error';

export interface ProgressInfo {
  fileIndex: number;
  key: string;
  current: number;
  total: number;
}

export type ActiveTool = 'remove-bg' | 'retouch' | 'crop' | 'download';

export type BrushMode = 'restore' | 'erase';

export interface BrushOptions {
  size: number;
  hardness: number;
  mode: BrushMode;
}

export type AspectRatio = 'free' | '1:1' | '16:9' | '9:16' | '4:3';

export interface CropOptions {
  aspectRatio: AspectRatio;
  margin: number;
}
