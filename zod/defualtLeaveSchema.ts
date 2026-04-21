import { EmployeeTypeArr } from "@/constant";
import { z } from "zod";

export const defualtLeaveSchema = z.object({
  employee_type: z.enum(EmployeeTypeArr,{
    required_error: "Employee type is required",
  }),
  leave_type: z.number({
    required_error: "Leave type is required",
  }),
  default_days: z.number({
    required_error: "Default days is required",
  }),
  created_by: z.number({
    required_error: "Created by is required",
  }),
});

export type DefualtLeaveSchemaT = z.infer<typeof defualtLeaveSchema>;