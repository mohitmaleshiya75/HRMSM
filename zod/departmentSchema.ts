import { z } from "zod";

export const departmentSchema = z.object({
  name: z.string().min(1, {
    message: "Department name is required.",
  }),
  manager: z.string().optional(),
  manager_full_name:z.string().optional(),
  parent_department: z.string().optional(),
  description: z.string().optional(),
  id: z.coerce.string().optional(),
});

export type DepartmentSchemaT = z.infer<typeof departmentSchema>;