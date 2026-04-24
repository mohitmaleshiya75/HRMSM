import { ColumnDef } from "@tanstack/react-table";
import ViewEditDeleteButton from "@/components/button/ViewEditDeleteButton";
import { Row } from "@tanstack/react-table";
import { useAddEditLeaveTypeDialog } from "./useAddEditLeaveTypeDialog";
import { AddEditLeaveTypeResponseT } from "../types";
import useDeleteLeaveType from "./useDeleteLeaveType";
import { whoCanAccessSpecialFields } from "@/constant";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";

const useViewLeaveTypeColumns = () => {
  const { data: user } = useCurrentUser();
  const { onDelete } = useDeleteLeaveType();
  const onEditLeaveType = useAddEditLeaveTypeDialog((s) => s.onOpen);

  const columns: ColumnDef<AddEditLeaveTypeResponseT>[] = [
    // {
    //   accessorKey: "id",
    //   header: "Id",
    // },

    //     {
    //     id: string;
    //     name: string;
    //     part_time_default_days: number;
    //     contract_default_days: number;
    //     internship_default_days: number;
    //     full_time_default_days: number;
    //     created_by: string;
    //     created_at: string;
    //     created_by_name: string;
    //     office: string;
    // }
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "part_time_default_days",
      header: "part time employee",
      cell: ({ row }) => {
        return (
          <span className="flex justify-center">{`${row.original.part_time_default_days}`}</span>
        );
      },
    },
    {
      accessorKey: "contract_default_days",
      header: "contractual employee",
      cell: ({ row }) => {
        return (
          <span className="flex justify-center">{`${row.original.contract_default_days}`}</span>
        );
      },
    },
    {
      accessorKey: "internship_default_days",
      header: "internship employee",
      cell: ({ row }) => {
        return (
          <span className="flex justify-center">{`${row.original.internship_default_days}`}</span>
        );
      },
    },
    {
      accessorKey: "full_time_default_days",
      header: "full time employee",
      cell: ({ row }) => {
        return (
          <span className="flex justify-center">{`${row.original.full_time_default_days}`}</span>
        );
      },
    },
    {
      accessorKey: "created_by_name",
      header: "created by",
    },
    // {
    //   accessorKey: "max_days",
    //   header: "Max Days",
    // },
    ...((whoCanAccessSpecialFields.includes(user?.role))
      ? [
        {
          id: "actions",
          header: "Action",
          cell: ({ row }: { row: Row<AddEditLeaveTypeResponseT> }) => {
            return (
              <ViewEditDeleteButton
                onDelete={() => onDelete(row.original.id)}
                onEdit={() =>
                  onEditLeaveType({
                    type: "edit",
                    leaveInfo: row.original,
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
