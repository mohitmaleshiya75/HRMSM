import { PaginatedResponse } from "@/types";
import { LeaveStatus } from "../leaves/types";

// const dashboardData = {
//   employee_count: 5,
//   pending_leave_requests: 0,
//   total_unique_attendance_today: 1,
//   present_count: 1,
//   absent_count: 4,
//   employees_not_clocked_in: [
//     "New User",
//     "Nikhil Nick",
//     "New User",
//     "rahul first rahul last",
//   ],
//   latest_leave_requests: [
//     {
//       id: 1,
//       employee: "rahul User",
//       leave_type: "nl",
//       start_date: "2025-03-17",
//       end_date: "2025-03-19",
//       status: "Rejected",
//     },
//     {
//       id: 2,
//       employee: "rahul User",
//       leave_type: "nl",
//       start_date: "2025-03-17",
//       end_date: "2025-07-28",
//       status: "Approved",
//     },
//     {
//       id: 3,
//       employee: "rahul User",
//       leave_type: "nl",
//       start_date: "2025-03-17",
//       end_date: "2025-05-31",
//       status: "Pending",
//     },
//   ],
// };

/*
 */

export type DashboardStatsCardResponse = {
  employee_count: number;
  pending_leave_requests: number;
  total_unique_attendance_today: number;
  present_count: number;
  absent_count: number;
};

export type PresentAbsentResponseT = {
            id: string,
            profile_image_url: string,
            first_name: string,
            last_name: string,
            department: string,
            department_name: string,
            manager_full_name: string,
            // username: string,
            // email: string,
            // manager: string,
            // date_of_joining: string,
            // position: string,
            // role: string,
            // profile_image: string,
            // phone_number: string,
            // date_of_birth:string,
            // created_at: string,
            // updated_at: string,
            // user: string,
};

export type PresentAbsentFilterT = {
  search?: string;
  office?:string;
};

export type GetPaginatedPresentAbsentResponseT = PaginatedResponse<PresentAbsentResponseT>;

export type LatestLeaveRequests = {
  id: string;
  employee: string;
  // employee_id?: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: LeaveStatus;
};

export type DashboardStatsResponseT = DashboardStatsCardResponse & {
  employees_not_clocked_in: string[];
  latest_leave_requests: LatestLeaveRequests[];
};
