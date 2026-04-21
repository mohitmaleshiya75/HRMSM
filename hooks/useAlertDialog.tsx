// import { type ReactNode, useCallback } from "react";
// import { create } from "zustand";

// type AlertDialogStore = {
//   isOpen: boolean;
//   title: string;
//   description?: string | ReactNode;
//   confirmLabel: string;
//   cancelLabel: string;
//   isLoading: boolean;
//   onConfirm: () => void;
//   onCancel: () => void;
//   openDialog: (
//     params: Omit<
//       AlertDialogStore,
//       "isOpen" | "isLoading" | "openDialog" | "closeDialog" | "setLoading"
//     >,
//   ) => void;
//   closeDialog: () => void;
//   setLoading: (isLoading: boolean) => void;
// };

// export const useAlertDialogStore = create<AlertDialogStore>((set) => ({
//   isOpen: false,
//   title: "",
//   description: "",
//   confirmLabel: "Confirm",
//   cancelLabel: "Cancel",
//   isLoading: false,
//   onConfirm: () => {},
//   onCancel: () => {},
//   openDialog: (params) => set({ isOpen: true, ...params }),
//   closeDialog: () =>
//     set({
//       isOpen: false,
//       isLoading: false,
//       title: "",
//       description: "",
//       confirmLabel: "",
//       cancelLabel: "",
//     }),
//   setLoading: (isLoading) => set({ isLoading }),
// }));

// type UseAlertDialogParams = {
//   title: string;
//   description: string | ReactNode;
//   confirmLabel?: string;
//   cancelLabel?: string;
// };

// export const useAlertDialog = () => {
//   const { openDialog, closeDialog, setLoading } = useAlertDialogStore();

//   const showAlertDialog = useCallback(
//     ({
//       title,
//       description,
//       confirmLabel = "Confirm",
//       cancelLabel = "Cancel",
//     }: UseAlertDialogParams) => {
//       return new Promise<boolean>((resolve) => {
//         openDialog({
//           title,
//           description,
//           confirmLabel,
//           cancelLabel,
//           onConfirm: () => {
//             setLoading(false);
//             resolve(true);
//           },
//           onCancel: () => {
//             setLoading(false);
//             resolve(false);
//           },
//         });
//       });
//     },
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//     [openDialog],
//   );

//   return {
//     showAlertDialog,
//     closeAlertDialog: closeDialog,
//     setAlertDialogLoading: setLoading,
//   };
// };
