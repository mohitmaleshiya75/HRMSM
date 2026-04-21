import { JobStatusArr } from "@/constant";
import { z } from "zod";

export const jobOpeningSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  department: z.string().min(1, "Department is required"),
  location: z.string().min(1, "Location is required"),
  job_type: z.string().min(1, "Type of job is required"),
  job_level: z.string().min(1, "Level of job is required"),
  status: z.nativeEnum(JobStatusArr).optional(),
  is_published: z.boolean().optional(),
  positions_count: z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true; // allow empty (optional)
      const num = Number(val);
      return Number.isInteger(num) && num > 0;
    },
    { message: "Must be a whole number greater than 0" }
  ),

  min_experience: z.string().optional(),
  max_experience: z.string().optional(),
  min_salary: z.string().optional(),
  max_salary: z.string().optional(),
  description: z.string().min(1, "Description is too short"),
  requirements: z.string().min(1, "Requirements are too short"),
  responsibilities: z.string().min(1, "Responsibilities are too short"),
  benefits: z.string().optional(),
  application_deadline: z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), {
    message: "Please select a date",
  }),

});

export type JobOpeningSchema = z.infer<typeof jobOpeningSchema>;
