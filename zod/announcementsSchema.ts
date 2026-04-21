import { z } from "zod";

export const announcementsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  status: z.enum(["active", "inactive"]).default("active"),
});