import { z } from "zod";

export const holidaySchema = z.object({
  occasion: z.string().min(1, "Name is required"),
  date: z.string().min(1, "Date is required"),
  is_paid: z.boolean().default(false),
});