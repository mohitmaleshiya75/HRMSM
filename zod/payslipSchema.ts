import * as z from "zod";

// export const payslipSchema = z.object({
//   id: z.number(),
//   employee: z.number(),
//   employee_name: z.number(),
//   month: z.number().min(1).max(12),
//   month_name: z.number(),
//   year: z.number().min(2020).max(2030),
//   base_salary: z.number(),
//   hra: z.number(),
//   medical_allowance: z.number(),
//   transport_allowance: z.number(),
//   special_allowance: z.number(),
//   gross_salary: z.number(),
//   total_earnings: z.number(),
//   tds_deduction: z.number(),
//   epf_employee: z.number(),
//   epf_employer: z.number(),
//   esi_employee: z.number(),
//   esi_employer: z.number(),
//   professional_tax: z.number(),
//   lwf_deduction: z.number(),
//   other_deductions: z.number(),
//   attendance_deduction: z.number(),
//   total_deductions: z.number(),
//   adjustment: z.number(),
//   adjustment_note: z.number().optional(),
//   net_salary: z.number(),
//   employer_epf_contribution: z.number(),
//   employer_esi_contribution: z.number(),
//   ctc: z.number(),
//   tax_regime: z.enum(["NEW", "OLD"]),
//   status: z.enum(["UNPAID", "PAID"]),
//   generated_at: z.number(),
//   finalized_at: z.number().nullable(),
// });

// Schema for creating/updating a payslip
// export const payslipFormSchema = z.object({
//   employee: z.number().min(1, "Employee ID is required"),
//   month: z.number().min(1, "Month is required").max(12, "Invalid month"),
//   year: z.number().min(2020, "Year must be at least 2020").max(2030, "Year must be at most 2030"),
//   base_salary: z.number().min(1, "Base salary is required").regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   hra: z.number().min(1, "HRA is required").regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   medical_allowance: z.number().min(1, "Medical allowance is required").regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   transport_allowance: z.number().min(1, "Transport allowance is required").regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   special_allowance: z.number().min(1, "Special allowance is required").regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   gross_salary: z.number().min(1, "Gross salary is required").regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   tds_deduction: z.number().min(1, "TDS deduction is required").regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   tax_regime: z.enum(["NEW", "OLD"], { required_error: "Tax regime is required" }),
//   epf_employee: z.number().min(1, "EPF employee is required").regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   epf_employer: z.number().min(1, "EPF employer is required").regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   esi_employee: z.number().min(1, "ESI employee is required").regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   esi_employer: z.number().min(1, "ESI employer is required").regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   professional_tax: z.number().min(1, "Professional tax is required").regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   lwf_deduction: z.number().min(1, "LWF deduction is required").regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   other_deductions: z.number().min(1, "Other deductions is required").regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   attendance_deduction: z.number().min(1, "Attendance deduction is required").regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   adjustment: z.number().min(1, "Adjustment is required").regex(/^-?\d*\.?\d{0,2}$/, "Invalid amount format"),
//   adjustment_note: z.number().optional(),
//   total_earnings: z.number().min(1, "Total earnings is required").regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   total_deductions: z.number().min(1, "Total deductions is required").regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   net_salary: z.number().min(1, "Net salary is required").regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   employer_epf_contribution: z.number().min(1, "Employer EPF contribution is required").regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   employer_esi_contribution: z.number().min(1, "Employer ESI contribution is required").regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   ctc: z.number().min(1, "CTC is required").regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   status: z.enum(["DRAFT", "FINAL"], { required_error: "Status is required" })
// });

// export const payslipFormSchema = z.object({
//   employee: z.number({
//     required_error: "Employee ID is required",
//     invalid_type_error: "Employee ID must be a number"
//   }).min(1, "Employee ID is required"),
  
//   month: z.number({
//     required_error: "Month is required",
//     invalid_type_error: "Month must be a number"
//   }).min(1, "Month is required").max(12, "Month must be between 1 and 12"),
  
//   year: z.number({
//     required_error: "Year is required",
//     invalid_type_error: "Year must be a number"
//   }).min(2020, "Year must be 2020 or later").max(2030, "Year must be 2030 or earlier"),
  
//   base_salary: z.number({
//     required_error: "Base salary is required"
//   }).min(1, "Base salary is required").regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
  
//   tax_regime: z.enum(["NEW", "OLD"], {
//     required_error: "Tax regime is required",
//     invalid_type_error: "Please select a valid tax regime"
//   }),

//   // Rest of the fields with their existing validation
//   hra: z.number().regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   medical_allowance: z.number().regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   transport_allowance: z.number().regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   special_allowance: z.number().regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   gross_salary: z.number().regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   tds_deduction: z.number().regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   epf_employee: z.number().regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   epf_employer: z.number().regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   esi_employee: z.number().regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   esi_employer: z.number().regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   professional_tax: z.number().regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   lwf_deduction: z.number().regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   other_deductions: z.number().regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   attendance_deduction: z.number().regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   adjustment: z.number().regex(/^-?\d*\.?\d{0,2}$/, "Invalid amount format"),
//   adjustment_note: z.number().optional(),
//   total_earnings: z.number().regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   total_deductions: z.number().regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   net_salary: z.number().regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   employer_epf_contribution: z.number().regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   employer_esi_contribution: z.number().regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   ctc: z.number().regex(/^\d*\.?\d{0,2}$/, "Invalid amount format"),
//   status: z.enum(["DRAFT", "FINAL"])
// });

export const payslipFormSchema = z.object({
  employee: z.number().min(1, { message: "Employee ID is required." }),
  month: z.number().min(1, { message: "Month is required." }),
  year: z.number().min(2000, { message: "Year is required." }),
  base_salary: z.number().min(1, { message: "Base salary is required." }),
  hra: z.number(),
  medical_allowance: z.number(),
  transport_allowance: z.number(),
  special_allowance: z.number(),
  gross_salary: z.number(),
  tds_deduction: z.number(),
  tax_regime: z.enum(["NEW", "OLD"]),
  epf_employee: z.number(),
  epf_employer: z.number(),
  esi_employee: z.number(),
  esi_employer: z.number(),
  professional_tax: z.number(),
  lwf_deduction: z.number(),
  other_deductions: z.number(),
  attendance_deduction: z.number(),
  adjustment: z.number(),
  adjustment_note: z.string(),
  total_earnings: z.number(),
  total_deductions: z.number(),
  net_salary: z.number(),
  employer_epf_contribution: z.number().optional(),
  employer_esi_contribution: z.number().optional(),
  ctc: z.number(),
  status: z.enum(["UNPAID", "PAID"]),
})


// Type inference
// export type PayslipSchemaType = z.infer<typeof payslipSchema>;
export type PayslipFormSchemaType = z.infer<typeof payslipFormSchema>;

// Custom validation messages
export const payslipValidationMessages = {
  amount: "Please enter a valid amount (up to 2 decimal places)",
  required: "This field is required",
  month: "Month must be between 1 and 12",
  year: "Year must be between 2020 and 2030",
  adjustment: "Please enter a valid amount (can be negative, up to 2 decimal places)",
} as const;

// Helper function to validate amount format
export const isValidAmount = (value: string) => {
  return /^\d*\.?\d{0,2}$/.test(value);
};

// Helper function to format amount to 2 decimal places
export const formatAmount = (value: string) => {
  const number = parseFloat(value);
  return isNaN(number) ? "0.00" : number.toFixed(2);
}; 

// employee id,
// mounth,
// base salary,
// tax ragime,
// year,