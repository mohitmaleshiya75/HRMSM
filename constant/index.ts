import { UserRole } from "@/features/auth/types";

export const webName = process.env.NEXT_PUBLIC_WEB_NAME || "HRMSM";

export const authAccessTokenCookieName = "P1";
export const authRefreshTokenCookieName = "P2";

export const userRoleArr = ["Employee", "HR", "Admin", "SuperAdmin", "Manager", "Finance"] as const;

export const leaveRequestStatusArr = [
  "Pending",
  "Approved",
  "Rejected",
  "Canceled",
] as const;

export const genderArr = [
  "Male",
  "Female",
  "Other",
] as const;

export const MaritalStatusArr = [
  "True",
  "False",
] as const;

export const EmployeeTypeArr = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
] as const;

export const maximumAllowDistanceAttendanceMarkInMeters = 150;

export const tableLimitArr = [10, 20, 30, 40, 50] as const;

export const whoCanAccessSpecialFields: Partial<UserRole[]> = ["Admin", "HR", "SuperAdmin"];
export const whoCanAccessSpecialFieldsWithFinance: Partial<UserRole[]> = ["Admin", "HR", "SuperAdmin", "Finance"];
export const whoCanAccessSpecialFieldsWithManager: Partial<UserRole[]> = ["Admin", "HR", "SuperAdmin", "Manager"];

export const weekDays = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

export const jobIsActiveArr = [true, false] as const;
export enum JobStatusArr {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  DRAFT = "ON_HOLD", // Assuming Draft maps to "ON_HOLD"
}

export enum JobLevelArr {
  INTERN = "INTERN",
  ENTRY = "ENTRY",
  MID = "MID",
  SENIOR = "SENIOR",
  MANAGER = "MANAGER",
  DIRECTOR = "DIRECTOR",
  EXECUTIVE = "EXECUTIVE",
} 

export enum JobTypeArr {
  FULL_TIME = "FULL_TIME",
  PART_TIME = "PART_TIME",
  CONTRACT = "CONTRACT",
  INTERNSHIP = "INTERNSHIP", // Frontend label: Intern
}

export const durationname = {
  HALF_AM: "First Half",
  HALF_PM: "Second Half",
  FULL: "Full Day",
} as const;
export const durationArr = ["HALF_AM", "HALF_PM", "FULL"] as const;
export const taskStatusArr = ["Assigned", "Planning", "Execution", "Completed"] as const;
export type TaskStatus = typeof taskStatusArr[number];

// export enum taskStatusArr {
//   Assigned = "Assigned",
//   Planning = "Planning",
//   Execution = "Execution",
//   Completed = "Completed",
// } 
// export const durationArr = ["HALF_AM", "HALF_PM", "FULL"] as const
