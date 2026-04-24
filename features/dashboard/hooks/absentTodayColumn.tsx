// import { formatEmployeeId } from "@/lib/utils";
// import { ColumnDef } from "@tanstack/react-table";
// import Image from "next/image";
// import { PresentAbsentResponseT } from "../type";

// export const AbsentTodayColumns: ColumnDef<PresentAbsentResponseT>[] = [
//   {
//     accessorKey: "profile_image",
//     header: "Employee",
//     cell: ({ row }) => {
//       return (
//         <div className="flex items-center gap-4">
//           <Image
//             className="rounded-full"
//             width={40}
//             height={40}
//             src={row.original.profile_image_url || "/images/avatar.jpg"}
//             alt="User avatar"
//           />
//           <span>{`${row.original.first_name} ${row.original.last_name}`}</span>
//         </div>
//       );
//     },
//   },
//   {
//     accessorKey: "id",
//     header: "Employee ID",
//     cell: ({ row }) => {
//       const id = row.getValue("id") as number;
//       return formatEmployeeId(id);
//     },
//   },
//   {
//     accessorKey: "position",
//     header: "Designation",
//   },
//   {
//     accessorKey: "department_name",
//     header: "Department",
//     cell: ({ row }) => {
//       return (
//           ((row.original.department_name)?(<span>{`${row.original.department_name}`}</span>):("N/A"))
//       );
//     },
//   },
// ]; 