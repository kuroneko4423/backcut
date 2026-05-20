export type ProcessStatus = 'idle' | 'processing' | 'done' | 'error';

export interface ProgressInfo {
  fileIndex: number;
  key: string;
  current: number;
  total: number;
}
