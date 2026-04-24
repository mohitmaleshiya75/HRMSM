import { create } from "zustand";

type UseViewClockInClockOutT = {
  onOpen: (data: Date) => void;
  onClose: () => void;
  isOpen: boolean;
  date?: Date;
};

const useViewClockInClockOut = create<UseViewClockInClockOutT>((set) => ({
  isOpen: false,
  onClose: () => set({ isOpen: false }),
  onOpen: (date) => {
    set({ isOpen: true, date });
  },
}));

export default useViewClockInClockOut;
