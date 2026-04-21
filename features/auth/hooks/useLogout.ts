// import { getReadableErrorMessage } from "@/lib/utils/apiUtils";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import axios from "axios";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";

// export const useLogout = () => {
//   const { replace } = useRouter();
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async () => {
//       try {
//         const { data } = await axios.get("/b/api/auth/logout");
//         if (data.message) {
//           toast.success(data.message);
//           queryClient.setQueryData(["session"], () => {
//             return null;
//           });
//           replace("/auth/login");
//           window.location.reload();
//         } else {
//           toast.error("Failed to logout");
//         }
//       } catch (error) {
//         const err = getReadableErrorMessage(error);
//         toast.error(err);
//       }
//     },
//   });
// };
