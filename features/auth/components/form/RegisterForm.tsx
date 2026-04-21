// "use client";
// import PasswordEyeButton from "@/components/button/PasswordEyeButton";
// import { AutoComplete } from "@/components/ui/autocomplete-input";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Button } from "@/components/ui/button";
// import { DateTimePicker } from "@/components/ui/datetime-picker";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import useGetAllDepartments from "@/features/departments/hooks/useGetAllDepartments";
// import useGetEmployees from "@/features/employee/hooks/useGetEmployees";
// import { useDebounce } from "@/hooks/useDebounce";
// import useUpdateSearchParams from "@/hooks/useUpdateSearchParams";
// import { cn } from "@/lib/utils";
// import { convertToOnlyDate } from "@/lib/utils/dateUtils";
// import { Camera, ChevronsUpDown, X } from "lucide-react";
// import type React from "react";
// import { useEffect, useMemo, useRef, useState } from "react";
// import useSignupForm from "../../hooks/useSignupForm";
// import useCurrentUser from "../../hooks/useCurrentUser";
// import { Checkbox } from "@/components/ui/checkbox";

// const RegisterForm = () => {
//   const { data: user } = useCurrentUser();
//   const { form, isLoading, onSubmit } = useSignupForm();
//   const [previewImage, setPreviewImage] = useState<string | null>(null);
//   const { data: department } = useGetAllDepartments();
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       form.setValue("profile_image", file);

//       // Create preview image
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setPreviewImage(reader.result as string);
//       };
//       reader.readAsDataURL(file);
//     }
//   };
//   const [openPopovers, setOpenPopovers] = useState({
//     leaveType: false,
//     employee: false,
//   });
//   const { updateSearchParams } = useUpdateSearchParams();
//   const [searchQuery, setSearchQuery] = useState("");
//   const debounceParams = useDebounce(updateSearchParams, 600);
//   const { employees } = useGetEmployees();
//   const empOption = useMemo(
//     () =>
//       (employees || []).map((emp) => ({
//         value: String(emp.id),
//         label: `${emp.first_name} ${emp.last_name}`,
//       })),
//     [employees],
//   );

//   const findEmp = (value: string) => {
//     return empOption.find((emp) => String(emp.value) === String(value));
//   };
//   useEffect(() => {
//     if (searchQuery) {
//       debounceParams({ search: searchQuery, page: "1" });
//     }
//     return () => {};
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [searchQuery]);

//   const triggerFileInput = () => {
//     fileInputRef.current?.click();
//   };

//   return (
//     <Form {...form}>
//       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//         {/* Profile Image at the top center */}
//         <div className="mb-6 flex justify-center">
//           <div className="relative">
//             <Avatar
//               className="h-32 w-32 cursor-pointer border-2 border-gray-200"
//               onClick={triggerFileInput}
//             >
//               <AvatarImage src={previewImage || ""} alt="Profile" />
//               <AvatarFallback className="bg-muted text-muted-foreground">
//                 <Camera className="h-8 w-8" />
//               </AvatarFallback>
//             </Avatar>
//             <Input
//               ref={fileInputRef}
//               id="profile_image"
//               type="file"
//               accept=".jpg, .png, .jpeg, .svg"
//               className="hidden"
//               onChange={handleImageChange}
//             />
//             <div className="mt-2 text-center text-sm text-muted-foreground">
//               Click to upload profile image
//             </div>
//           </div>
//         </div>

//         {/* Form fields in two columns */}
//         <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//           {/* Left Column */}
//           <div className="space-y-4">
//             <FormField
//               control={form.control}
//               name="username"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel isRequiredField>Username </FormLabel>
//                   <FormControl>
//                     <Input
//                       className="border border-green-500"
//                       placeholder="jondoe"
//                       disabled={isLoading}
//                       {...field}
//                     />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <FormField
//               control={form.control}
//               name="first_name"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel isRequiredField>First Name</FormLabel>
//                   <FormControl>
//                     <Input
//                       placeholder="John"
//                       className="border border-green-500"
//                       disabled={isLoading}
//                       {...field}
//                     />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             <FormField
//               control={form.control}
//               name="date_of_joining"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Date of Joining</FormLabel>
//                   <FormControl>
//                     <DateTimePicker
//                       value={field.value ? new Date(field.value) : undefined}
//                       onChange={(date) => {
//                         const onlyDate = convertToOnlyDate(date || new Date());
//                         field.onChange(onlyDate);
//                       }}
//                       disableFuture
//                       yearRange={100}
//                       granularity="day"
//                       placeholder={`${convertToOnlyDate(field.value || new Date())}`}
//                       showTime={false}
//                     />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             <FormField
//               control={form.control}
//               name="gender"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Gender</FormLabel>
//                   <FormControl>
//                     <Select
//                       value={field.value}
//                       onValueChange={(value) => field.onChange(value)}
//                     >
//                       <SelectTrigger className="border border-green-500">
//                         <SelectValue placeholder="Select Gender" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value={"Male"}>Male</SelectItem>
//                         <SelectItem value={"Female"}>Female</SelectItem>
//                         <SelectItem value={"Other"}>Other</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             <FormField
//               control={form.control}
//               name="role"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Role</FormLabel>
//                   <FormControl>
//                     <Select
//                       value={field.value}
//                       onValueChange={(value) => field.onChange(value)}
//                     >
//                       <SelectTrigger className="border border-green-500">
//                         <SelectValue placeholder="Select Role" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {user?.role === "SuperAdmin" && (
//                           <SelectItem value="Admin">Admin</SelectItem>
//                         )}
//                         <SelectItem value={"Admin"}>Admin</SelectItem>
//                         <SelectItem value={"HR"}>HR</SelectItem>
//                         <SelectItem value={"Employee"}>Employee</SelectItem>
//                         <SelectItem value={"Finance"}>Finance</SelectItem>
//                         <SelectItem value={"Manager"}>Manager</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             <FormField
//               control={form.control}
//               name="address"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Address</FormLabel>
//                   <FormControl>
//                     <Input
//                       className="border border-green-500"
//                       placeholder="Street, Area, City, State, Country"
//                       disabled={isLoading}
//                       {...field}
//                     />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             <FormField
//               control={form.control}
//               name="phone_number"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Phone No.</FormLabel>
//                   <FormControl>
//                     <Input
//                       className="border border-green-500"
//                       placeholder="9876543210"
//                       disabled={isLoading}
//                       {...field}
//                     />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <FormField
//               control={form.control}
//               name="password"
//               render={({ field }) => (
//                 <FormItem className="relative">
//                   <FormLabel isRequiredField>Password</FormLabel>
//                   <FormControl>
//                     <Input
//                       className="border border-green-500"
//                       type="password"
//                       id="password"
//                       disabled={isLoading}
//                       {...field}
//                     />
//                   </FormControl>
//                   <PasswordEyeButton passInpId="password" />
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//           </div>

//           {/* Right Column */}
//           <div className="space-y-4">
//             <FormField
//               control={form.control}
//               name="email"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel isRequiredField>Email</FormLabel>
//                   <FormControl>
//                     <Input
//                       className="border border-green-500"
//                       type="email"
//                       placeholder="name@example.com"
//                       disabled={isLoading}
//                       {...field}
//                     />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             <FormField
//               control={form.control}
//               name="last_name"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel isRequiredField>Last Name</FormLabel>
//                   <FormControl>
//                     <Input
//                       placeholder="Doe"
//                       className="border border-green-500"
//                       disabled={isLoading}
//                       {...field}
//                     />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             <FormField
//               control={form.control}
//               name="date_of_birth"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Date of Birth</FormLabel>
//                   <FormControl>
//                     <DateTimePicker
//                       value={field.value ? new Date(field.value) : undefined}
//                       onChange={(date) => {
//                         const onlyDate = convertToOnlyDate(date || new Date());
//                         field.onChange(onlyDate);
//                       }}
//                       disableFuture
//                       yearRange={100}
//                       granularity="day"
//                       placeholder={`${convertToOnlyDate(field.value || new Date())}`}
//                       showTime={false}
//                     />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             <FormField
//               control={form.control}
//               name="department"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Department</FormLabel>
//                   <FormControl>
//                     <Select
//                       value={field.value ? String(field.value) : ""}
//                       onValueChange={(value) => field.onChange(value)}
//                     >
//                       <SelectTrigger className="border border-green-500">
//                         <SelectValue placeholder="Select Department" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {department?.map((dept) => (
//                           <SelectItem
//                             key={`department_${dept.id}`}
//                             value={String(dept.id)}
//                           >
//                             {dept.name}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             <FormField
//               control={form.control}
//               name="manager"
//               render={({ field }) => (
//                 <FormItem className="flex flex-col">
//                   <FormLabel className="py-1">Manager</FormLabel>
//                   <Popover
//                     onOpenChange={(e) =>
//                       setOpenPopovers((pre) => ({ ...pre, employee: e }))
//                     }
//                     open={openPopovers.employee}
//                   >
//                     <PopoverTrigger asChild>
//                       <FormControl>
//                         <Button
//                           variant="outline"
//                           role="combobox"
//                           className={cn(
//                             "200px] justify-between",
//                             !field.value && "text-muted-foreground",
//                           )}
//                           disabled={isLoading}
//                         >
//                           {field.value
//                             ? findEmp(String(field.value))?.label
//                             : "Select employee"}
//                           <span>
//                             {field.value ? (
//                               <X
//                                 className="opacity-50"
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   // clearManager();
//                                   field.onChange("");
//                                 }}
//                               />
//                             ) : (
//                               <ChevronsUpDown className="opacity-50" />
//                             )}
//                           </span>
//                         </Button>
//                       </FormControl>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-full p-0">
//                       <AutoComplete
//                         options={empOption}
//                         emptyMessage="No results."
//                         placeholder="Find something"
//                         isLoading={isLoading}
//                         onValueChange={(e) => {
//                           form.setValue("manager", e.value);
//                           setOpenPopovers((pre) => ({
//                             ...pre,
//                             employee: false,
//                           }));
//                         }}
//                         onInputChange={(e) => setSearchQuery(e)}
//                         disabled={isLoading}
//                       />
//                     </PopoverContent>
//                   </Popover>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             <FormField
//               control={form.control}
//               name="position"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Designation</FormLabel>
//                   <FormControl>
//                     <Input
//                       placeholder="New Hire"
//                       disabled={isLoading}
//                       {...field}
//                       value={field.value || ""}
//                     />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <FormField
//               control={form.control}
//               name="emergency_number"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Emergency No.</FormLabel>
//                   <FormControl>
//                     <Input
//                       className="border border-green-500"
//                       placeholder="1234567890"
//                       disabled={isLoading}
//                       {...field}
//                     />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             <FormField
//               control={form.control}
//               name="confirm_password"
//               render={({ field }) => (
//                 <FormItem className="relative">
//                   <FormLabel isRequiredField>Confirm Password</FormLabel>
//                   <FormControl>
//                     <Input
//                       type="password"
//                       id="confirm_password"
//                       disabled={isLoading}
//                       {...field}
//                       value={typeof field.value === "string" ? field.value : ""}
//                     />
//                   </FormControl>
//                   <PasswordEyeButton passInpId="confirm_password" />
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//           </div>
//         </div>
//         <div className="flex gap-4">
//           {/* Active use Checkbox */}
//           <FormField
//             control={form.control}
//             name="is_active"
//             render={({ field }) => (
//               <FormItem className="flex w-full flex-row items-start space-x-3 space-y-0 rounded-md border border-green-600 p-4">
//                 <FormControl>
//                   <Checkbox
//                     checked={field.value}
//                     onCheckedChange={(checked) =>
//                       field.onChange(checked as boolean)
//                     }
//                   />
//                 </FormControl>
//                 <div className="w-full space-y-1 leading-none">
//                   <FormLabel>Active user</FormLabel>
//                   <FormMessage />
//                 </div>
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="marital_status"
//             render={({ field }) => (
//               <FormItem className="flex w-full flex-row items-start space-x-3 space-y-0 rounded-md border border-green-600 p-4">
//                 <FormControl>
//                   <Checkbox
//                     checked={field.value === "True"}
//                     onCheckedChange={(checked) =>
//                       field.onChange(
//                         checked === false
//                           ? "False"
//                           : checked === true
//                             ? "True"
//                             : "",
//                       )
//                     }
//                   />
//                 </FormControl>

//                 <div className="w-full space-y-1 leading-none">
//                   <FormLabel>
//                     {field.value === "True" ? "Married" : "Unmarried"}
//                   </FormLabel>
//                   <FormMessage />
//                 </div>
//               </FormItem>
//             )}
//           />
//         </div>
//         <Button type="submit" className="w-full" disabled={isLoading}>
//           {isLoading ? "Adding Employee..." : "Add Employee"}
//         </Button>
//       </form>
//     </Form>
//   );
// };

// export default RegisterForm;
"use client";
import PasswordEyeButton from "@/components/button/PasswordEyeButton";
import { AutoComplete } from "@/components/ui/autocomplete-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useGetAllDepartments from "@/features/departments/hooks/useGetAllDepartments";
import useGetEmployees from "@/features/employee/hooks/useGetEmployees";
import { useDebounce } from "@/hooks/useDebounce";
import useUpdateSearchParams from "@/hooks/useUpdateSearchParams";
import { cn } from "@/lib/utils";
import { convertToOnlyDate } from "@/lib/utils/dateUtils";
import { Camera, ChevronsUpDown, X } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import useSignupForm from "../../hooks/useSignupForm";
import useCurrentUser from "../../hooks/useCurrentUser";
import { Checkbox } from "@/components/ui/checkbox";
import { useFieldArray } from "react-hook-form";

const RegisterForm = () => {
  const { data: user } = useCurrentUser();
  const { form, isLoading, onSubmit } = useSignupForm();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { data: department } = useGetAllDepartments();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("profile_image", file);

      // Create preview image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const [openPopovers, setOpenPopovers] = useState({
    leaveType: false,
    employee: false,
  });
  const { updateSearchParams } = useUpdateSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const debounceParams = useDebounce(updateSearchParams, 600);
  const { employees } = useGetEmployees();
  const empOption = useMemo(
    () =>
      (employees || []).map((emp) => ({
        value: String(emp.id),
        label: `${emp.first_name} ${emp.last_name}`,
      })),
    [employees],
  );

  const findEmp = (value: string) => {
    return empOption.find((emp) => String(emp.value) === String(value));
  };
  useEffect(() => {
    if (searchQuery) {
      debounceParams({ search: searchQuery, page: "1" });
    }
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "dependents",
  });

  console.log(form.formState.errors);

  const errors = form.formState.errors;

  const personalTabHasError =
    errors.first_name ||
    errors.last_name ||
    errors.username ||
    errors.email ||
    errors.phone_number ||
    errors.address ||
    errors.emergency_name ||
    errors.emergency_relation ||
    errors.permanent_address ||
    errors.gender ||
    errors.date_of_birth ||
    errors.marital_status ||
    errors.dependents ||
    errors.emergency_number;

  const employmentTabHasError =
    errors.date_of_joining ||
    errors.employee_type ||
    errors.role ||
    errors.manager ||
    errors.department ||
    errors.position;

  const documentsTabHasError =
    errors.uid_number ||
    errors.pan_number ||
    errors.esic_number ||
    errors.nationality ||
    errors.blood_group ||
    errors.bank_name ||
    errors.ifsc_code ||
    errors.bank_account_number;

  const accountsTabHasError = errors.confirm_password || errors.password;
  const nationality = form.watch("nationality");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 overflow-y-auto md:max-h-screen md:overflow-y-visible"
      >
        {/* Profile Image at the top center */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <Avatar
              className="h-32 w-32 cursor-pointer border-2 border-gray-200"
              onClick={triggerFileInput}
            >
              <AvatarImage src={previewImage || ""} alt="Profile" />
              <AvatarFallback className="bg-muted text-muted-foreground">
                <Camera className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <Input
              ref={fileInputRef}
              id="profile_image"
              type="file"
              accept=".jpg, .png, .jpeg, .svg"
              className="hidden"
              onChange={handleImageChange}
            />
            <div className="mt-2 text-center text-sm text-muted-foreground">
              Click to upload profile image
            </div>
          </div>
        </div>

        {/* Tab Navigation for Desktop, Stacked for Mobile */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-2 items-center gap-2 rounded-lg bg-accent md:grid-cols-4">
            <TabsTrigger
              value="personal"
              className={`text-sm ${personalTabHasError ? "!text-red-500" : ""}`}
            >
              Personal
            </TabsTrigger>
            <TabsTrigger
              value="employment"
              className={`text-sm ${employmentTabHasError ? "!text-red-500" : ""}`}
            >
              Employment
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className={`text-sm ${documentsTabHasError ? "!text-red-500" : ""}`}
            >
              Documents
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className={`text-sm ${accountsTabHasError ? "!text-red-500" : ""}`}
            >
              Account
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel isRequiredField>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John"
                          className="border border-green-500"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel isRequiredField>Username</FormLabel>
                      <FormControl>
                        <Input
                          className="border border-green-500"
                          placeholder="jondoe"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          value={
                            field.value ? new Date(field.value) : undefined
                          }
                          onChange={(date) => {
                            const onlyDate = convertToOnlyDate(
                              date || new Date(),
                            );
                            field.onChange(onlyDate);
                          }}
                          disableFuture
                          yearRange={100}
                          granularity="day"
                          placeholder={`${convertToOnlyDate(field.value || new Date())}`}
                          showTime={false}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value) => field.onChange(value)}
                        >
                          <SelectTrigger className="border border-green-500">
                            <SelectValue placeholder="Select Gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={"Male"}>Male</SelectItem>
                            <SelectItem value={"Female"}>Female</SelectItem>
                            <SelectItem value={"Other"}>Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergency_relation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Person Relation</FormLabel>
                      <FormControl>
                        <Input
                          className="border border-green-500"
                          placeholder="Father"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Address</FormLabel>
                      <FormControl>
                        <Input
                          className="border border-green-500"
                          placeholder="Street, Area, City, State, Country"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel isRequiredField>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Doe"
                          className="border border-green-500"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel isRequiredField>Email</FormLabel>
                      <FormControl>
                        <Input
                          className="border border-green-500"
                          type="email"
                          placeholder="name@example.com"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone No.</FormLabel>
                      <FormControl>
                        <Input
                          className="border border-green-500"
                          placeholder="9876543210"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergency_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Person Contact</FormLabel>
                      <FormControl>
                        <Input
                          className="border border-green-500"
                          placeholder="0987654321"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergency_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Person Name</FormLabel>
                      <FormControl>
                        <Input
                          className="border border-green-500"
                          placeholder="Sam Doe"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="permanent_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permanent Address</FormLabel>

                      <FormControl>
                        <Input
                          className="border border-green-500"
                          placeholder="Street, Area, City, State, Country"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      {/* Checkbox instead of button */}
                      <div className="justify-center p-1 rounded-sm flex items-center space-x-2">
                        <Checkbox
                        className=""
                          id="sameAddress"
                          onCheckedChange={(checked) => {
                            if (checked) {
                              const currentAddress = form.getValues("address");
                              form.setValue("permanent_address", currentAddress);
                            } else {
                              form.setValue("permanent_address", "");
                            }
                          }}
                        />
                        <label
                          htmlFor="sameAddress"
                          className="text-sm cursor-pointer"
                        >
                          Same as Current Address
                        </label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div>
              <h1 className="pb-2 pt-2 text-sm font-medium">Marital Status</h1>

              <FormField
                control={form.control}
                name="marital_status"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select
                        value={field.value === true ? "married" : "unmarried"}
                        onValueChange={(value) => field.onChange(value === "married")}
                      >
                        <SelectTrigger className="border border-green-600">
                          <SelectValue placeholder="Select marital status" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="unmarried">Unmarried</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Dependents</h3>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      name: "",
                      relation: "",
                      dob: "",
                    })
                  }
                >
                  + Add More
                </Button>
              </div>

              {fields.map((item, index) => (
                <div
                  key={item.id}
                  className="relative grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-2"
                >
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name={`dependents.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Dependent name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Relation */}
                  <FormField
                    control={form.control}
                    name={`dependents.${index}.relation`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relation</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger className="border border-green-500">
                              <SelectValue placeholder="Select relation" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Mother">Mother</SelectItem>
                            <SelectItem value="Father">Father</SelectItem>
                            <SelectItem value="Chilrend">Children</SelectItem>
                            <SelectItem value="Spouse">Spouse</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* DOB */}
                  <FormField
                    control={form.control}
                    name={`dependents.${index}.dob`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DOB</FormLabel>
                        <FormControl>
                          <DateTimePicker
                            value={
                              field.value ? new Date(field.value) : undefined
                            }
                            onChange={(date) => {
                              const onlyDate = convertToOnlyDate(
                                date || new Date(),
                              );
                              field.onChange(onlyDate);
                            }}
                            disableFuture
                            yearRange={100}
                            granularity="day"
                            placeholder={`${convertToOnlyDate(field.value || new Date())}`}
                            showTime={false}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Remove Button */}
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Employment Information Tab */}
          <TabsContent value="employment" className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="date_of_joining"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Joining</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          value={
                            field.value ? new Date(field.value) : undefined
                          }
                          onChange={(date) => {
                            const onlyDate = convertToOnlyDate(
                              date || new Date(),
                            );
                            field.onChange(onlyDate);
                          }}
                          disableFuture
                          yearRange={100}
                          granularity="day"
                          placeholder={`${convertToOnlyDate(field.value || new Date())}`}
                          showTime={false}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employee_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="border border-green-500">
                            <SelectValue placeholder="Select employee type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FULL_TIME">Full Time</SelectItem>
                          <SelectItem value="PART_TIME">Part Time</SelectItem>
                          <SelectItem value="CONTRACT">Contract</SelectItem>
                          <SelectItem value="INTERNSHIP">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value) => field.onChange(value)}
                        >
                          <SelectTrigger className="border border-green-500">
                            <SelectValue placeholder="Select Role" />
                          </SelectTrigger>
                          <SelectContent>
                            {user?.role === "SuperAdmin" && (
                              <SelectItem value="Admin">SuperAdmin</SelectItem>
                            )}
                            <SelectItem value={"Admin"}>Admin</SelectItem>
                            <SelectItem value={"HR"}>HR</SelectItem>
                            <SelectItem value={"Employee"}>Employee</SelectItem>
                            <SelectItem value={"Finance"}>Finance</SelectItem>
                            <SelectItem value={"Manager"}>Manager</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designation</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="New Hire"
                          disabled={isLoading}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="manager"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="py-1">Manager</FormLabel>
                      <Popover
                        onOpenChange={(e) =>
                          setOpenPopovers((pre) => ({ ...pre, employee: e }))
                        }
                        open={openPopovers.employee}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "justify-between",
                                !field.value && "text-muted-foreground",
                              )}
                              disabled={isLoading}
                            >
                              {field.value
                                ? findEmp(String(field.value))?.label
                                : "Select employee"}
                              <span>
                                {field.value ? (
                                  <X
                                    className="opacity-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      field.onChange("");
                                    }}
                                  />
                                ) : (
                                  <ChevronsUpDown className="opacity-50" />
                                )}
                              </span>
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <AutoComplete
                            options={empOption}
                            emptyMessage="No results."
                            placeholder="Find something"
                            isLoading={isLoading}
                            onValueChange={(e) => {
                              form.setValue("manager", e.value);
                              setOpenPopovers((pre) => ({
                                ...pre,
                                employee: false,
                              }));
                            }}
                            onInputChange={(e) => setSearchQuery(e)}
                            disabled={isLoading}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ? String(field.value) : ""}
                          onValueChange={(value) => field.onChange(value)}
                        >
                          <SelectTrigger className="border border-green-500">
                            <SelectValue placeholder="Select Department" />
                          </SelectTrigger>
                          <SelectContent>
                            {department?.map((dept) => (
                              <SelectItem
                                key={`department_${dept.id}`}
                                value={String(dept.id)}
                              >
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div>
              <h1 className="pb-2 pt-2 text-sm font-medium">Account Status</h1>
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-1 flex-row items-start space-x-3 space-y-0 rounded-md border border-green-600 p-[11px]">
                    <FormControl>
                      <Checkbox
                        disabled={isLoading}
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(checked as boolean)
                        }
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active user</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationality</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => field.onChange(value)}
                      >
                        <SelectTrigger className="border border-green-500">
                          <SelectValue placeholder="Select Nationality" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="INDIAN">Indian</SelectItem>
                          <SelectItem value="NRI">
                            NRI / Foreign National
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pan_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN Number</FormLabel>
                      <FormControl>
                        <Input
                          className="border border-green-500 uppercase"
                          placeholder="ABCDE1234F"
                          disabled={isLoading}
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value.toUpperCase())
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="esic_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ESIC Number</FormLabel>
                      <FormControl>
                        <Input
                          className="border border-green-500"
                          placeholder="Enter ESIC number"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="uid_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{nationality === "INDIAN" ? "Aadhaar Number" : "UID Number"}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="border border-green-500"
                          placeholder="123456789012"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="blood_group"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Group</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value) => field.onChange(value)}
                        >
                          <SelectTrigger className="border border-green-500">
                            <SelectValue placeholder="Select Blood Group" />
                          </SelectTrigger>
                          <SelectContent>
                            {bloodGroups.map((group) => (
                              <SelectItem key={group} value={group}>
                                {group}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bank_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input
                          className="border border-green-500"
                          placeholder="State Bank of India"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ifsc_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IFSC Code</FormLabel>
                      <FormControl>
                        <Input
                          className="border border-green-500 uppercase"
                          placeholder="SBIN0001234"
                          disabled={isLoading}
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value.toUpperCase())
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bank_account_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Account Number</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="border border-green-500"
                          placeholder="Enter account number"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>

          {/* Account/Password Tab - ONLY FOR REGISTRATION */}
          <TabsContent value="account" className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel isRequiredField>Password</FormLabel>
                      <FormControl>
                        <Input
                          className="border border-green-500"
                          type="password"
                          id="password"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <PasswordEyeButton passInpId="password" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel isRequiredField>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          id="confirm_password"
                          disabled={isLoading}
                          {...field}
                          value={
                            typeof field.value === "string" ? field.value : ""
                          }
                        />
                      </FormControl>
                      <PasswordEyeButton passInpId="confirm_password" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        <Button type="submit" className="mt-6 w-full" disabled={isLoading}>
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>
    </Form>
  );
};

export default RegisterForm;
