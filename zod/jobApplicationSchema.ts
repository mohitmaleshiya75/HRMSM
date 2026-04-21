import { z } from "zod";

export const jobApplicationSchema = z.object({
  id: z.string().optional(),
  job_opening: z.string().min(1, "Job ID is required"),
  candidate_name: z.string().min(1, "Name is required"),
  candidate_email: z.string().email("Invalid email address"),
  candidate_phone:  z.string()
  .min(10, {
    message: "Phone Number must be exactly 10 digits long",
  }).max(10, {
    message: "Phone Number must be exactly 10 digits long",
  }).optional(),
  resume: z.union([z.instanceof(File, { message: "Resume is required" }), z.string().min(1,"resume is required")]),
  cover_letter: z.union([z.instanceof(File), z.string()]).optional(),
  additional_documents: z.union([z.instanceof(File), z.string()]).optional(),
  
  referral_notes: z.string().optional(),
});
export const editJobApplicationSchema = z.object({
  id: z.string().optional(),
  job_opening: z.string().min(1, "Job ID is required"),
  candidate_name: z.string().min(1, "Name is required"),
  candidate_email: z.string().email("Invalid email address"),
  candidate_phone:  z.string()
  .length(10, {
    message: "Phone Number must be exactly 10 digits long",
  }).optional(),
  resume: z.union([z.instanceof(File, { message: "Resume is required" }), z.string().min(1,"resume is required")]),
  cover_letter: z.union([z.instanceof(File), z.string()]).optional(),
  additional_documents: z.union([z.instanceof(File), z.string()]).optional(), 
  resume_url: z.string().optional(),
  cover_letter_url: z.string().optional(),
  additional_documents_url: z.string().optional(), 
  referral_notes: z.string().optional().optional(),
});

export type EditJobApplicationSchema = z.infer<typeof editJobApplicationSchema>; 

export type JobApplicationSchema = z.infer<typeof jobApplicationSchema>; 