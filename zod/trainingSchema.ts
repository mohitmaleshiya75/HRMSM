import { z } from "zod";

export const trainingSchema = z
  .object({
    id: z.number().optional(),
    title: z.string().min(1, "Training title is required"),
    description: z.string().min(1, "Description is required"),
    image: z.any().optional(), // will validate with refine
    image_url: z.string().optional(),
  })
  .refine(
    (data) =>
      data.image instanceof File || (typeof data.image === "string" && data.image.length > 0),
    {
      message: "Image is required",
      path: ["image"],
    }
  );


export type TrainingSchema = z.infer<typeof trainingSchema>;