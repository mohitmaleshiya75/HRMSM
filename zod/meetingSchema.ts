import { z } from "zod";

export const meetingSchema = z.object({
  title: z.string().min(1, "Title is required."),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format."),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}$/, "Time must be in HH:MM:SS format."),
    link: z
    .string()
    .optional()
    .refine((val) => !val || val === "" || /^https?:\/\/.+/.test(val), {
      message: "Link must be a valid URL.",
    }),
});


export type MeetingSchemaT = z.infer<typeof meetingSchema>;

