import { z } from "zod";
import { signupSchema } from "./authSchema";
import { phoneSchema } from ".";
import { EmployeeTypeArr } from "@/constant";

//TODO: DO it later
// export const userProfileSchema = z.object({
//   username: z.string().min(2).max(50),
// });
const today = new Date();
const minDOB = new Date(
  today.getFullYear() - 18,
  today.getMonth(),
  today.getDate(),
);
const minDOJ = new Date(
  today.getFullYear(),
  today.getMonth(),
  today.getDate() + 1,
);

export const editEmployeeSchema = z.object({
  first_name: z
    .string()
    .min(2, {
      message: "First name is required",
    })
    .max(30, {
      message: "First name must be less than 30 characters.",
    }),
  username: z
    .string()
    .min(2, {
      message: "Username must be at least 2 characters long.",
    })
    .max(30, {
      message: "Username must be less than 30 characters.",
    })
    .regex(/^\S+$/, {
      message: "Username must not contain spaces.",
    }),
  permanent_address: z
    .string()
    .min(5, { message: "Permanent address is required" })
    .max(255, { message: "Address must be less than 255 characters" }),

  blood_group: z
    .string()
    .regex(/^(A|B|AB|O)[+-]$/, {
      message: "Invalid blood group (Example: A+, O-, AB+)",
    })
    .optional()
    .or(z.literal("")),

  nationality: z
    .string()
    .min(2, { message: "Nationality is required" })
    .max(50, { message: "Nationality must be less than 50 characters" })
    .optional()
    .or(z.literal("")),

  dependents: z
    .array(
      z.object({
        name: z.string().optional(),
        relation: z.string().optional(),
        dob: z.string().optional(),
      })
    )
    .max(3, { message: "Maximum 6 dependents allowed" })
    .optional(),

  pan_number: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
      message: "Invalid PAN number format (Example: ABCDE1234F)",
    })
    .optional()
    .or(z.literal("")),

  uid_number: z
    .string()
    .optional()
    .or(z.literal("")),

  esic_number: z
    .string()
    .min(5, { message: "Invalid ESIC number" })
    .max(20, { message: "Invalid ESIC number" })
    .optional()
    .or(z.literal("")),

  bank_account_number: z
    .string()
    .min(8, { message: "Invalid bank account number" })
    .max(20, { message: "Invalid bank account number" })
    .optional()
    .or(z.literal("")),

  ifsc_code: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, {
      message: "Invalid IFSC code (Example: SBIN0001234)",
    })
    .optional()
    .or(z.literal("")),

  bank_name: z
    .string()
    .min(2, { message: "Bank name is required" })
    .max(100, { message: "Bank name too long" })
    .optional()
    .or(z.literal("")),

  employee_type: z.enum(EmployeeTypeArr, {
    required_error: "Employee type is required",
  }),

  emergency_relation:z
        .string()
        .min(2, {
          message: "Relation name must be at least 2 characters long.",
        })
        .max(30, {
          message: "Relation name must be less than 30 characters.",
        }),
        emergency_name:z
        .string()
        .min(2, {
          message: "Name must be at least 2 characters long.",
        })
        .max(30, {
          message: "Name must be less than 30 characters.",
        }),
      emergency_number: z.string().length(10, {
        message: "Phone Number must be exactly 10 digits long",
      }),
  address: z.string().min(2, {
    message: "Address is required",
  }),
  marital_status: z.boolean().optional(),
  is_active: z.boolean().default(true),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  last_name: z
    .string()
    .min(2, {
      message: "Last name is required",
    })
    .max(30, {
      message: "Last name must be less than 30 characters.",
    }),
  phone_number: phoneSchema,
  position: z
    .string()
    .min(1, {
      message: "Designation is required",
    })
    .optional(),
  department: z.string().optional(),
  gender: z.string().optional(),
  role: z
    .string()
    .min(1, {
      message: "Role is required",
    })
    .optional(),
  // date_of_birth: z.string().min(1, {
  //   message: "Date of birth is required",
  // }).optional(),
  date_of_joining: z.string().refine((value) => {
    const doj = new Date(value);
    return doj <= minDOJ;
  }, "Employee Date of joining must not be future dated"),
  date_of_birth: z.string().refine((value) => {
    const dob = new Date(value);
    return dob <= minDOB;
  }, "Employee must be at least 18 years old"),
  manager: z.string().optional(),
  profile_image: z
    .union([
      z.instanceof(File),
      z.string().url().min(1, {
        message: "Profile image is required",
      }),
    ])
    .optional(),
})
  .superRefine((data, ctx) => {
  const isMarried:boolean = data.marital_status===true ? true :false;
  const hasSpouse =
    data.dependents?.some(
      (dep) =>
        dep.relation?.toLowerCase() === "spouse" &&
      dep.name &&
      dep.name.trim() !== ""
      ) ?? false;

  if (hasSpouse && !isMarried) {
        // Error on marital_status
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please remove spouse from dependent or mark as married",
          path: ["marital_status"],
        });
        }
  if (isMarried) {
    const hasSpouse =
    data.dependents?.some(
      (dep) =>
        dep.relation?.toLowerCase() === "spouse" &&
      dep.name &&
      dep.name.trim() !== ""
      ) ?? false;
      console.log(hasSpouse,isMarried)
    if (!hasSpouse && isMarried) {
      // Error on marital_status
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Spouse must be added in dependents if married.",
        path: ["marital_status"],
      });

      // Error on dependents field
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please add spouse details in dependents.",
        path: ["dependents"],
      });
    }
  }
  });

export type EditEmployeeT = z.infer<typeof signupSchema>;
