import { z } from "zod";

export const officeSchema = z.object({
    name: z.string().min(1, {
      message: "Office name is required.",
    }),
    address: z.string().min(1, {
      message: "Office address is required.",
    }),
    latitude: z.number().min(1, {
      message: "Office latitude is required.",
    }),
    longitude: z.number().min(1, {
      message: "Office longitude is required.",
    }),
});