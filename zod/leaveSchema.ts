import { durationArr, leaveRequestStatusArr } from "@/constant";
import { z } from "zod";

const leaveSchemaObj = {
  leave_type: z.string().min(1, {
    message: "Please select a leave type.",
  }),
  start_date: z.date({
    required_error: "Start date is required.",
  }),
  end_date: z.date({
    required_error: "End date is required.",
  }),
  reason: z.string().min(1, {
    message: "Reason is required.",
  }),
  duration: z.enum(durationArr),
};
export const leaveSchema = z
  .object(leaveSchemaObj)
  .refine((data) => data.end_date >= data.start_date, {
    message: "End date must be after or equal to start date.",
    path: ["end_date"],
  });

export type LeaveSchemaT = z.infer<typeof leaveSchema>;

export const editLeaveSchema = z.object({
  status: z.enum(leaveRequestStatusArr),
  employee: z.string().min(1, {
    message: "Please select an employee.",
  }),
  leave_type: leaveSchemaObj.leave_type,
});

export type EditLeaveSchemaT = z.infer<typeof editLeaveSchema>;

export const leaveTypeSchema = z.object({
  name: z.string().min(1, {
    message: "Leave type name is required.",
  }),
  // max_days: z.coerce
  //   .number()
  //   .min(1, {
  //     message: "Maximum number of days is required.",
  //   })
  //   .max(365).optional(),
  // max_days: z.number().optional(),
  // default_days: z.number().optional(),
    part_time_default_days: z.number({
    required_error: "Default days is required",
  }),
  is_unlimited: z.boolean().optional(),
    contract_default_days: z.number({
    required_error: "Default days is required",
  }),
    internship_default_days: z.number({
    required_error: "Default days is required",
  }),
    full_time_default_days: z.number({
    required_error: "Default days is required",
  }),
  created_by: z.string().optional(),
  office:z.string().optional(),
  id: z.string().optional(),
});

export type LeaveTypeSchemaT = z.infer<typeof leaveTypeSchema>;

export const allocateLeaveSchema = z.object({
  employee: z.string().min(1, {
    message: "Please select an employee.",
  }),
  leave_type: z.string().min(1, {
    message: "Please select a leave type.",
  }),
  yearly_quota: z
    .number()
    .min(1, {
      message: "Yearly quota must be at least 1.",
    })
    .max(365, {
      message: "Leave should be less than days in a year",
    }),
  used_leaves: z.number().optional(),
});

export type AllocateLeaveSchemaT = z.infer<typeof allocateLeaveSchema>;
