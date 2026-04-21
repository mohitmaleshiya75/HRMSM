// import { Dependents } from '@/features/auth/types';
// import {create} from 'zustand'

// interface DetailDialogState {
//   isOpen: boolean;
//   config: DetailDialogConfig | null;
//   openDialog: (config: DetailDialogConfig) => void;
//   closeDialog: () => void;
// }

// export interface DetailDialogConfig {
//   detail: string|null;
//   title:string|null;
// }

// export const useDetailDialog = create<DetailDialogState>((set) => ({
//   isOpen: false,
//   isLoading: false,
//   config: null,
//   openDialog: (config) => set({ isOpen: true, config }),
//   closeDialog: () => set({ isOpen: false, config: null}),
// }));


// interface DependentDialogState {
//   isOpen: boolean;
//   config: DependentDialogConfig | null;
//   openDialog: (config: DependentDialogConfig) => void;
//   closeDialog: () => void;
// }

// export interface DependentDialogConfig {
//   detail: Dependents[]|null;
//   title:string|null;
// }

// export const useDependentDialog = create<DependentDialogState>((set) => ({
//   isOpen: false,
//   isLoading: false,
//   config: null,
//   openDialog: (config) => set({ isOpen: true, config }),
//   closeDialog: () => set({ isOpen: false, config: null}),
// }));