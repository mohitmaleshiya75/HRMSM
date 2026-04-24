import { ColumnDef } from "@tanstack/react-table";
// import { useDeleteEmployee } from "@/features/employee/hooks/useDeleteEmployee";
import ViewEditDeleteButton from "@/components/button/ViewEditDeleteButton";
import { LeaveAllocationResponseT } from "../types";
import useEditAllocatedLeaveDialog from "./useEditAllocatedLeaveDialog";
import { useDeleteAllocatedLeave } from "./useDeleteAllocatedLeave";
import Link from "next/link";
import { Row } from "@tanstack/react-table";
import { whoCanAccessSpecialFieldsWithManager } from "@/constant";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { homeUrl } from "@/config/routesConfig";
import { useParams } from "next/navigation";

const useLeaveAllocationColumns = () => {
  const { data: user } = useCurrentUser();
  const { onDelete } = useDeleteAllocatedLeave();
  const officeId = useParams().office_id;
  const onEditAllocatedLeave = useEditAllocatedLeaveDialog((s) => s.onOpen);

  const columns: ColumnDef<LeaveAllocationResponseT>[] = [
    // {
    //   accessorKey: "id",
    //   header: "Id",
    // },
    {
      accessorKey: "employee_name",
      header: "Name",
      cell: ({ row }) => {
        return (
          <>
            {whoCanAccessSpecialFieldsWithManager.includes(user?.role) && (
              <Link href={`${homeUrl}/${officeId}/dashboard/employee/e/${row.original.employee}`} />
            )}
            <span>{`${row.original.employee_name}`}</span>
          </>
        );
      },
    },
    {
      accessorKey: "leave_type_name",
      header: "Leave Type",
    },
    {
      accessorKey: "yearly_quota",
      header: "Yearly Quota",
    },

    {
      accessorKey: "monthly_quota",
      header: "Monthly Quota",
      cell: ({ row }) => (
        <>
          {row.original.monthly_quota
            ? row.original.monthly_quota.toFixed(2)
            : "N/A"}
        </>
      ),
    },

    {
      accessorKey: "used_leaves",
      header: "Used Leaves",
    },
    {
      accessorKey: "remaining_leaves",
      header: "Remaining Leaves",
      cell: ({ row }) => (
        <>
          {row.original.remaining_leaves
            ? row.original.remaining_leaves.toFixed(2)
            : "N/A"}
        </>
      ),
    },
    ...(whoCanAccessSpecialFieldsWithManager.includes(user?.role)
      ? [
          {
            id: "actions",
            header: "Action",
            cell: ({ row }: { row: Row<LeaveAllocationResponseT> }) => {
              return (
                <ViewEditDeleteButton
                
                  onDelete={() => onDelete(row.original)}
                  onEdit={() =>
                    onEditAllocatedLeave({
                      type: "edit",
                      allocateLeaveInfo: row.original,
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

export default useLeaveAllocationColumns;
