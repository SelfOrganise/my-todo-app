import create from 'zustand';
import type { Todo } from '@prisma/client';

interface AppStore {
  taskUnderEdit?: Todo;
  setTaskUnderEdit: (task?: Todo) => void;
}

export const useAppStore = create<AppStore>(set => ({
  setTaskUnderEdit: (task?: Todo) => set({ taskUnderEdit: task }),
}));
