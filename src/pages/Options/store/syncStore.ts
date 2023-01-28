import { create } from 'zustand'
export const useSyncStore = create((set) => ({
    sync: false,
    loaded: false,
    setSyncFolderIdAction: (sync: boolean) => set({ sync }),
}));