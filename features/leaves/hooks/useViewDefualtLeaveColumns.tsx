import { ColumnDef } from "@tanstack/react-table";
import ViewEditDeleteButton from "@/components/button/ViewEditDeleteButton";
import { Row } from "@tanstack/react-table";
import { DefualtLeaveResponseT } from "../types";
import useDeleteLeaveType from "./useDeleteLeaveType";
import { whoCanAccessSpecialFields } from "@/constant";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { useAddEditDefualtLeaveDialog } from "./useAddEditDefualtLeaveDialog";
import { EmployeeTypeArr } from "@/constant";

const useViewLeaveTypeColumns = () => {
  const { data: user } = useCurrentUser();
  const { onDelete } = useDeleteLeaveType();
  const onEdit = useAddEditDefualtLeaveDialog((s) => s.onOpen);

  const columns: ColumnDef<DefualtLeaveResponseT>[] = [
    {
      accessorKey: "id",
      header: "Id",
    },
        {
      accessorKey: "employee_type",
      header: "employee_type",
    },
        {
      accessorKey: "leave_type_name",
      header: "leave_type_name",
    },
        {
      accessorKey: "default_days",
      header: "default_days",
    },
        {
      accessorKey: "created_by_name",
      header: "created_by_name",
    },
    ...((whoCanAccessSpecialFields.includes(user?.role))
      ? [
          {
            id: "actions",
            header: "Action",
            cell: ({ row }: { row: Row<DefualtLeaveResponseT> }) => {
              return (
                <ViewEditDeleteButton
            onDelete={() => onDelete(row.original.id)}
            onEdit={() =>
              onEdit({
                type: "edit",
                leaveInfo: {
                  employee_type: row.original.employee_type as typeof EmployeeTypeArr[number],
                  leave_type: Number(row.original.leave_type),
                  default_days: Number(row.original.default_days),
                  created_by: Number(row.original.created_by),
                },
                id: row.original.id,
              })
            }
            showViewLink={false}
            // viewLink={`${homeUrl}/${officeId}/dashboard/employee/${row.original.id}`}
          />
              );
            },
          },
        ]
      : []),
  ];
  return { columns };
};

export default useViewLeaveTypeColumns;
