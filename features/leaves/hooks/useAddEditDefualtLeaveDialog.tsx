import { DefualtLeaveSchemaT } from "@/zod/defualtLeaveSchema";
import { create } from "zustand";

export type AddEditDefualtLeave =
  | {
      type: "create";
    }
  | {
      type: "edit";
      leaveInfo: DefualtLeaveSchemaT;
      id: string;
    };

type UseAddEditDefualtLeaveDialogT = {
  onOpen: (leaveInfo: AddEditDefualtLeave) => void;
  onClose: () => void;
  leaveInfo?: AddEditDefualtLeave;
  isOpen: boolean;
};

export const useAddEditDefualtLeaveDialog = create<UseAddEditDefualtLeaveDialogT>(
  (set) => ({
    isOpen: false,
    onClose: () => set({ isOpen: false, leaveInfo: undefined }),
    onOpen: (leaveInfo) => {
      set({ isOpen: true, leaveInfo:leaveInfo });
    },
  }),
);
