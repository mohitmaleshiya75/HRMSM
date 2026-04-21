import { attendanceStatusArr } from "./components/form/attendanceForm/content";

export type GetAttendanceResponseT = {
  id: string;
  employee: string;
  employee_name: string;
  date: string;
  clock_in_time?: string;
  clock_out_time?: string;
};

export type AttendanceFilters = {
  // "startDate"?: string
  // "endDate"?: string
  search?: string;
  date?: string;
  employee_id?: string;
  showAllAttendance?: boolean;
  office?:string;
};

export type AttendanceFilteredEmployee = {
  employee_id?: string;
};

export type MarkAttendanceResponseT = {
  details: string;
};

export type TotalWorkingHours = {
  total_hours: string;
};

export type AttendanceStatus = (typeof attendanceStatusArr)[number];

export type AttendanceRecordsT = {
  date: string;
  total_hours_worked: string;
  attendance_status: AttendanceStatus;
};

export type AttendanceStatusResponseT = {
  employee_id: string;
  employee_name: string;
  attendance_records: AttendanceRecordsT[];
};

export type AttendanceStatusRequestT = {
  employee_id?: string;
  start_date: string;
  end_date: string;
};
