import { EmployeeTypeArr } from "@/constant";
import * as z from "zod";
// import { phoneSchema } from ".";

const email = z.string().email({
  message: "Please enter a valid email address.",
});
const today = new Date();
const minDOB = new Date(
  today.getFullYear() - 18,
  today.getMonth(),
  today.getDate(),
);

export const loginSchema = z.object({
  username: z.string().min(1, {
    message: "Username is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
});

const minDOJ = new Date(
  today.getFullYear(),
  today.getMonth(),
  today.getDate() + 1,
);
export const signupSchema = z
  .object({
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
    email,
    is_active: z.boolean().default(true),
    password: z.string().min(8, {
      message: "Password must be at least 8 characters long.",
    }),
    first_name: z
      .string()
      .min(2, {
        message: "First name is required",
      })
      .max(30, {
        message: "First name must be less than 30 characters.",
      }),
    last_name: z
      .string()
      .min(2, {
        message: "Last name is required",
      })
      .max(30, {
        message: "Last name must be less than 30 characters.",
      }),
    // phone_number: phoneSchema,
    phone_number: z.string().length(10, {
      message: "Phone Number must be exactly 10 digits long",
    }),
    // .optional()
    // .or(z.literal("")), // allow empty string as valid
    position: z
      .string()
      .min(1, {
        message: "Designation is required",
      })
      .optional(),
    department: z.string().optional(),
    role: z
      .string()
      .min(1, {
        message: "Role is required",
      })
      .optional(),
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
    .max(6, { message: "Maximum 6 dependents allowed" })
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

    gender: z.string().optional(),
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
        z
          .string()
          .url()
          .min(1, {
            message: "Profile image is required",
          })
          .optional(),
      ])
      .optional(),
    confirm_password: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
  })
  .superRefine((data, ctx) => {
  const isMarried:boolean = data.marital_status===true ? true :false;

  if (isMarried) {
    const hasSpouse =
    data.dependents?.some(
      (dep) =>
        dep.relation?.toLowerCase() === "spouse" &&
      dep.name &&
      dep.name.trim() !== ""
      ) ?? false;
      
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
        message: "Please add spouse details in dependents if married.",
        path: ["dependents"],
      });
    }
    if (hasSpouse && !isMarried) {
    // Error on marital_status
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please remove spouse from dependent or mark as married",
      path: ["marital_status"],
    });
    }
  }
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

export const passwordFormSchema = z
  .object({
    old_password: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    new_password: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
  })
  .refine((data) => data.new_password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type PasswordFormValues = z.infer<typeof passwordFormSchema>;
