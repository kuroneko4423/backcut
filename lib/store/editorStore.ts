import { create } from 'zustand';
import type { ProcessStatus, ProgressInfo } from '@/types';

interface EditorState {
  files: File[];
  processed: Map<number, Blob>;
  pristine: Map<number, Blob>;
  currentIndex: number;
  status: ProcessStatus;
  progress: ProgressInfo | null;
  error: string | null;

  setFiles: (files: File[]) => void;
  setCurrentIndex: (index: number) => void;
  setProcessed: (index: number, blob: Blob) => void;
  setPristine: (index: number, blob: Blob) => void;
  setStatus: (status: ProcessStatus) => void;
  setProgress: (progress: ProgressInfo | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  files: [] as File[],
  processed: new Map<number, Blob>(),
  pristine: new Map<number, Blob>(),
  currentIndex: 0,
  status: 'idle' as ProcessStatus,
  progress: null as ProgressInfo | null,
  error: null as string | null,
};

export const useEditorStore = create<EditorState>((set) => ({
  ...initialState,

  setFiles: (files) =>
    set({
      files,
      processed: new Map(),
      pristine: new Map(),
      currentIndex: 0,
      status: 'idle',
      progress: null,
      error: null,
    }),

  setCurrentIndex: (index) => set({ currentIndex: index }),

  setProcessed: (index, blob) =>
    set((state) => {
      const next = new Map(state.processed);
      next.set(index, blob);
      return { processed: next };
    }),

  setPristine: (index, blob) =>
    set((state) => {
      const next = new Map(state.pristine);
      next.set(index, blob);
      return { pristine: next };
    }),

  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error }),

  reset: () => set({ ...initialState, processed: new Map(), pristine: new Map() }),
}));
