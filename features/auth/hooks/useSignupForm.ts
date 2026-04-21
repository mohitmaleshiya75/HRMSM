// import { SignupFormValues, signupSchema } from "@/zod/authSchema";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { useForm } from "react-hook-form";
// import { RegisterResponse201 } from "../types";
// import { api, getReadableErrorMessage } from "@/lib/utils/apiUtils";
// import { toast } from "sonner";
// import useCurrentUser from "./useCurrentUser";
// import { useAddUserDialog } from "./useAddUserDialog";
// import useGetOfficeId from "@/hooks/useGetOfficeId";

// const useSignupForm = () => {
//   const id = "signup";
//   const queryClient = useQueryClient();
//   const form = useForm<SignupFormValues>({
//     resolver: zodResolver(signupSchema),
//     defaultValues: {
//       dependents: [],
//       permanent_address: "",
//       address: "",
//       blood_group: "",
//       nationality: "",
//       pan_number: "",
//       uid_number: "",
//       esic_number: "",
//       emergency_name: "",
//       emergency_relation: "",
//       bank_account_number: "",
//       marital_status: false,
//       ifsc_code: "",
//       bank_name: "",
//       employee_type: undefined,
//       username: "",
//       email: "",
//       password: "",
//       first_name: "",
//       last_name: "",
//       phone_number: undefined,
//       position: undefined,
//       department: undefined,
//       role: "Employee",
//       gender: "",
//       date_of_birth: undefined,
//       manager: "",
//       profile_image: undefined,
//       confirm_password: "",
//       is_active: true,
//     },
//   });

//   const onClose = useAddUserDialog((s) => s.onClose);

//   const { data: user } = useCurrentUser();
//   const officeId = useGetOfficeId();
//   const { mutate, isPending } = useMutation<
//     RegisterResponse201,
//     unknown,
//     SignupFormValues
//   >({
//     mutationFn: async (values) => {
//       const formData = new FormData();
//       if (values.profile_image instanceof File) {
//         formData.append("profile_image", values.profile_image as Blob);
//       }
//       formData.append("first_name", values.first_name || "");
//       formData.append("last_name", values.last_name || "");
//       formData.append("phone_number", values.phone_number || "");
//       formData.append("position", values.position || "");
//       formData.append("role", values.role || "");
//       formData.append("date_of_birth", values.date_of_birth || "");
//       formData.append("date_of_joining", values.date_of_joining || "");
//       formData.append("gender", values.gender || "");
//       formData.append("emergency_name", values.emergency_name || "");
//       formData.append("emergency_relation", values.emergency_relation || "");
//       formData.append("dependents", JSON.stringify(values.dependents || ""));
//       formData.append("permanent_address", values.permanent_address || "");
//       formData.append("blood_group", values.blood_group || "");
//       formData.append("nationality", values.nationality || "");
//       formData.append("pan_number", values.pan_number || "");
//       formData.append("uid_number", values.uid_number || "");
//       formData.append("esic_number", values.esic_number || "");
//       formData.append("bank_account_number", values.bank_account_number || "");
//       formData.append("ifsc_code", values.ifsc_code || "");
//       formData.append("bank_name", values.bank_name || "");
//       formData.append("employee_type", values.employee_type);
//       formData.append(
//         "marital_status",
//         values.marital_status ? "True" : "False",
//       );
//       formData.append("address", values.address || "");
//       formData.append("emergency_number", values.emergency_number || "");
//       formData.append("department", values.department || "");
//       formData.append("manager", values?.manager as string);
//       formData.append("username", values?.username as string);
//       formData.append("email", values?.email as string);
//       formData.append("password", values?.password as string);
//       formData.append("is_active", values.is_active ? "True" : "False");

//       formData.append("office", officeId);
//       // console.log(formData)
//       const { data } = await api.post<RegisterResponse201>(
//         "/accounts/register/",
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${user?.token}`,
//             "Content-Type": "multipart/form-data",
//           },
//         },
//       );
//       return data;
//     },
//     onSuccess: () => {
//       toast.success("Account created successfully!", { id });
//       queryClient.invalidateQueries({ queryKey: ["employees"] });
//       onClose();
//     },
//     onError: (error) => {
//       const err = getReadableErrorMessage(error);
//       toast.error(err, { id });
//     },
//   });

//   async function onSubmit(data: SignupFormValues) {
//     mutate(data);
//   }

//   const isLoading = isPending;

//   return {
//     isLoading,
//     form,
//     onSubmit,
//   };
// };

// export default useSignupForm;
