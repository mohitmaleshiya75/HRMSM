import { LeaveTypeSchemaT } from "@/zod/leaveSchema";
import { create } from "zustand";

export type AddEditLeaveType =
  | {
      type: "create";
    }
  | {
      type: "edit";
      leaveInfo: LeaveTypeSchemaT;
      id: string;
    };

type UseAddEditLeaveTypeDialogT = {
  onOpen: (leaveInfo: AddEditLeaveType) => void;
  onClose: () => void;
  leaveInfo?: AddEditLeaveType;
  isOpen: boolean;
};

export const useAddEditLeaveTypeDialog = create<UseAddEditLeaveTypeDialogT>(
  (set) => ({
    isOpen: false,
    onClose: () => set({ isOpen: false, leaveInfo: undefined }),
    onOpen: (leaveInfo) => {
      set({ isOpen: true, leaveInfo });
    },
  }),
);
