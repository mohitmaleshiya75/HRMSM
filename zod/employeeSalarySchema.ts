import { z } from "zod";

export const employeeSalarySchema = z.object({
  id: z.string().optional(),

  // Required by backend
  employee: z
    .number({ required_error: "Employee is required" })
    .min(1, "Employee is required"),

  tax_regime: z.enum(["NEW", "OLD"]).default("NEW"),

  employee_ctc: z
    .string({ required_error: "Gross salary is required" })
    .min(1, "Gross salary is required")
    .refine((val) => !isNaN(Number(val)), {
      message: "Gross salary must be a number",
    })
    .refine((val) => Number(val) > 0, {
      message: "Gross salary must be greater than 0",
    }),

  // Optional meta
  created_at: z.string().optional(),
  updated_at: z.string().optional(),

  // ===== TAX DETAILS (UNCHANGED as requested) =====
  tds_amount: z.string().optional(),
  rent_paid_monthly: z.string().optional(),
  is_metro_city: z.boolean().optional(),
  additional_80c_investment: z.string().optional(),
  tax_detail_id: z.string().optional(),
});