import { z } from "zod";

export const salaryComponentSchema = z.object({
  // ===== Earnings =====
  id : z.string().nullable().optional(),
  basic_salary: z.number().nonnegative("Basic salary must be ≥ 0"),

  hra_percentage: z.number()
    .min(0, "HRA % must be ≥ 0")
    .max(100, "HRA % cannot exceed 100"),

  special_allowance: z.number().nonnegative().default(0),
  medical_allowance: z.number().nonnegative().default(0),
  lta_amount: z.number().nonnegative().default(0),

  // ===== Deductions =====
  epf_applicable: z.boolean(),

  epf_employee_percentage: z.number()
    .min(0, "EPF employee % must be ≥ 0")
    .max(100, "EPF employee % cannot exceed 100")
    .default(12),

  epf_employer_percentage: z.number()
    .min(0)
    .max(100)
    .default(12),

  esi_applicable: z.boolean(),

  esi_employee_percentage: z.number()
    .min(0)
    .max(100)
    .nullable()
    .optional(),

  esi_employer_percentage: z.number()
    .min(0)
    .max(100)
    .nullable()
    .optional(),

  professional_tax_amount: z.number().nonnegative().default(0),
  // tds_amount: z.number().nonnegative().default(0),

  lwf_applicable: z.boolean(),
  lwf_amount: z.number().nonnegative().default(0),

  // ===== Employer Contributions =====
  gratuity_percentage: z.number()
    .min(0)
    .max(100)
    .default(4.81),

  insurance_amount: z.number().nonnegative().default(0),

  // ===== Other =====
  is_metro_city: z.boolean(),

  office: z.string().nullable().optional(),
}).superRefine((data, ctx) => {
  const total =
    data.basic_salary +
    data.hra_percentage +
    data.special_allowance +
    data.medical_allowance +
    data.lta_amount;

  if (total !== 100) {
    const message = "Total of earning fields must equal 100%";

    ctx.addIssue({ code: "custom", message, path: ["basic_salary"] });
    ctx.addIssue({ code: "custom", message, path: ["hra_percentage"] });
    ctx.addIssue({ code: "custom", message, path: ["special_allowance"] });
    ctx.addIssue({ code: "custom", message, path: ["medical_allowance"] });
    ctx.addIssue({ code: "custom", message, path: ["lta_amount"] });
  }});