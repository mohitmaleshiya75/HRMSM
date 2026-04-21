import { z } from "zod";

export const faceEncodingSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  image: z.string().min(1, "Image is required"),
});
