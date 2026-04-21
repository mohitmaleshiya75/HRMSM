import { taskStatusArr } from "@/constant";
import { z } from "zod";

export const dailyTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(2, "Description is required"),
  status: z.enum(taskStatusArr),
  assigned_to : z.number().optional(),
  assigned_by : z.number().optional(),
  date : z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format."),
});
export type DailyTaskSchemaT = z.infer<typeof dailyTaskSchema>;