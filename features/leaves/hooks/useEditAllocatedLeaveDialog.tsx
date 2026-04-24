import { create } from "zustand";
import { LeaveAllocationResponseT } from "../types";
import { clearSearchParams } from "@/lib/utils/clearSearchParams";

type AddEditAllocateLeave =
  | {
      type: "create";
    }
  | {
      type: "edit";
      allocateLeaveInfo: LeaveAllocationResponseT;
      id: string;
    };
type UseEditAllocatedLeaveDialogT = {
  onOpen: (allocateLeaveInfo: AddEditAllocateLeave) => void;
  onClose: () => void;
  allocateLeaveInfo?: AddEditAllocateLeave;
  isOpen: boolean;
};

const useEditAllocatedLeaveDialog = create<UseEditAllocatedLeaveDialogT>(
  (set) => ({
    isOpen: false,
    onClose: () => {
      set({ isOpen: false, allocateLeaveInfo: undefined });
      clearSearchParams();
    },
    onOpen: (allocateLeaveInfo) => {
      set({ isOpen: true, allocateLeaveInfo });
    },
  }),
);

export default useEditAllocatedLeaveDialog;
