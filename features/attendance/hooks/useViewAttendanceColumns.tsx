  import { ColumnDef } from "@tanstack/react-table";
  import { GetAttendanceResponseT } from "../type";
  import { CalendarIcon, ClockIcon } from "lucide-react";
  import { Badge } from "@/components/ui/badge";
  import { getInitials } from "@/lib/utils/stringUtils";
  import { formateTime } from "@/lib/utils/dateUtils";
  import Link from "next/link";
  import { whoCanAccessSpecialFields } from "@/constant";
  import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
  import { homeUrl } from "@/config/routesConfig";
  import { useParams } from "next/navigation";

  const useViewAttendanceColumns = () => {
    const { data:user } = useCurrentUser();
    const officeId  = useParams().office_id;
    // const onOpen = useDeleteEmployee((s) => s.onOpen);
    // const onEditEmployee = useEditEmployeeDialog((s) => s.onOpen);

    const columns: ColumnDef<GetAttendanceResponseT>[] = [
      {
        accessorKey: "employee_name",
        header: "Name",
        cell: ({ row }) => (
          <>
            {whoCanAccessSpecialFields.includes(user?.role)&&(<Link href={`${homeUrl}/${officeId}/dashboard/employee/e/${row.original.employee}`}/>)}
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-medium text-primary">
                {getInitials(row.original.employee_name)}
              </span>
            </div>
            <span className="font-medium">{row.original.employee_name}</span>
          </div>
          </>
        ),
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => (
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(row.original.date).toLocaleDateString()}</span>
          </div>
        ),
      },
      {
        accessorKey: "clock_in_time",
        header: "clock In",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono">
            <ClockIcon className="mr-1 h-3 w-3" />
            {row.original.clock_in_time
              ? formateTime(row.original.clock_in_time)
              : "N/A"}
          </Badge>
        ),
      },
      {
        accessorKey: "clock_out_time",
        header: "clock Out",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono">
            <ClockIcon className="mr-1 h-3 w-3" />
            {row.original.clock_out_time
              ? formateTime(row.original.clock_out_time)
              : "N/A"}
          </Badge>
        ),
      },
      // {
      //   id: "actions",
      //   header: "Action",
      //   cell: ({ row }) => {
      //     return (
      //       <ViewEditDeleteButton
      //         // onDelete={() => onOpen(row.original)}
      //         // onEdit={() => onEditEmployee(row.original)}
      //         onDelete={() => {}}
      //         onEdit={() => {}}
      //         viewLink={`${homeUrl}/${officeId}/dashboard/employee/${row.original.id}`}
      //       />
      //     );
      //   },
      // },
    ];
    return { columns };
  };

  export default useViewAttendanceColumns;
