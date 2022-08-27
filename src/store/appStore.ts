import create from 'zustand';

interface AppStore {}

const useBearStore = create<AppStore>(set => ({}));
