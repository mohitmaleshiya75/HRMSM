// import { normalizePhoneNumber } from "@/lib/utils/numberUtils";
import { z } from "zod";

export const 
phoneSchema = z
  .string().min(10, {
    message: "Phone Number is manimum 10 characters long",
  }).max(10, {
    message: "Phone Number is maximum 10 characters long",
  });
  // .refine(
  //   (value) => {
  //     const normalizedNumber = normalizePhoneNumber(value);
  //     return normalizedNumber !== null; // Ensure the number is valid
  //   },
  //   {
  //     message:
  //       "Please enter a valid phone number with the correct country code.",
  //   },
  // )
  // .transform((value) => {
  //   const normalizedNumber = normalizePhoneNumber(value);
  //   if (normalizedNumber) {
  //     return normalizedNumber; // Transform to E.164 format
  //   }
  //   throw new Error("Invalid phone number format.");
  // });