import { leaveRequestStatusArr, durationArr } from "@/constant";
import { PaginatedResponse } from "@/types";

export type LeaveStatus = (typeof leaveRequestStatusArr)[number];
export type duration = (typeof durationArr)[number];

export type LeaveApplyResponseT = {
  id: string;
  employee: string;
  employee_name: string;
  leave_type_name: string;
  reason:string;
  duration:duration;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: LeaveStatus;
};

export type DefualtLeaveResponseT = {
    id:string;
    employee_type:string;
    leave_type:string;
    leave_type_name:string;
    default_days:string;
    office:string;
    created_by:string;
    created_by_name:string;
    created_at:string;
}

export type GetLeavesResponseT = LeaveApplyResponseT;
export type GetPaginatedLeavesResponseT = PaginatedResponse<GetLeavesResponseT>;

export type LeavesFilters = {
  search?: string;
  status?: LeaveStatus;
  office?: string;
  employee_id?: string;
};

export type AddEditLeaveTypeResponseT = {
  id: string;
  name: string;
  part_time_default_days: number;
  contract_default_days: number;
  internship_default_days: number;
  full_time_default_days: number;
  is_unlimited: boolean;
  created_by: string;
  created_at: string;
  created_by_name: string;
  office: string;
};

// {
//       "id": 2,
//       "employee": 1,
//       "employee_name": "Nikhil Basrani",
//       "leave_type": 1,
//       "leave_type_name": "medical Leave",
//       "yearly_quota": 12,
//       "monthly_quota": 1,
//       "carried_over": 0,
//       "used_leaves": 0,
//       "remaining_leaves": 1
//   },

export type LeaveAllocationResponseT = {
  id: string;
  employee: string;
  employee_name: string;
  leave_type: string;
  leave_type_name: string;
  max_days: number;
  yearly_quota: number;
  monthly_quota: number;
  carried_over: number;
  used_leaves: number;
  remaining_leaves: number;
};

export type LeavesAllocationFilters = {
  search?: string;
  office?: string;
  employee_id?: string;
};

// [
//   {
//     leave_type: "medical Leave",
//     yearly_quota: 12,
//     monthly_allocation: 1,
//     carried_over: 0,
//     used_leaves: 1,
//     remaining_leaves: 0,
//   },
// ];

export type LeaveBalance = {
  leave_type: string;
  yearly_quota: number;
  monthly_allocation: number;
  carried_over: number;
  used_leaves: number;
  remaining_leaves: number;
};
