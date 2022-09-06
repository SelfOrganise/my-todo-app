import create from 'zustand';
import type { Todo } from '@prisma/client';
import produce from 'immer';

export interface AppStore {
  showAddTodo?: boolean;
  setShowAddTodo: (showAddTodo?: boolean) => void;

  taskUnderEdit?: Todo;
  setTaskUnderEdit: (task?: Todo) => void;

  currentCategoryId?: string;
  setCurrentCategoryId: (categoryId?: string) => void;

  taskToFocus?: Todo;
  setTaskToFocus: (todo?: Todo) => void;

  showAddCategory?: boolean;
  setShowAddCategory: (showAddCategories: boolean) => void;
  toggleAddCategory: () => void;
}

export const useAppStore = create<AppStore>(set => ({
  setTaskUnderEdit: (task?: Todo) =>
    set(
      produce(state => {
        state.taskUnderEdit = task;
      })
    ),
  setShowAddCategory: (showAddCategory: boolean) =>
    set(
      produce(state => {
        state.showAddCategory = showAddCategory;
      })
    ),
  toggleAddCategory: () =>
    set(
      produce(state => {
        state.showAddCategory = !state.showAddCategory;
      })
    ),
  setCurrentCategoryId: (categoryId?: string) =>
    set(
      produce(state => {
        state.currentCategoryId = categoryId;
      })
    ),
  setTaskToFocus: (todo?: Todo) =>
    set(
      produce(state => {
        state.taskToFocus = todo;
      })
    ),
  setShowAddTodo: (showAddTodo?: boolean) =>
    set(
      produce(state => {
        state.showAddTodo = showAddTodo;
      })
    ),
}));
