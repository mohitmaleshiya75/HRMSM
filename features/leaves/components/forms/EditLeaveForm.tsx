import { useState } from "react";
import useUpdateLeaveStatus from "../../hooks/useEditLeaveForm";
import { LeaveApplyResponseT, LeaveStatus } from "../../type";

interface EditLeaveFormProps {
  leaveInfo: LeaveApplyResponseT;
}

const EditLeaveForm = ({ leaveInfo }: EditLeaveFormProps) => {
  const { updateStatus, isPending } = useUpdateLeaveStatus();

  // const [confirmDialog, setConfirmDialog] = useState<{
  //   open: boolean;
  //   action: "Approved" | "Rejected" | "Cancelled" | null;
  // }>({ open: false, action: null });

  const handleStatusUpdate = (status: LeaveStatus) => {
    updateStatus({
      leaveId: Number(leaveInfo.id),
      status,
    });
    // setConfirmDialog({ open: false, action: null });
  };

  if (leaveInfo.status !== "Pending") {
    handleStatusUpdate(leaveInfo.status as LeaveStatus);
  }
};

export default EditLeaveForm;