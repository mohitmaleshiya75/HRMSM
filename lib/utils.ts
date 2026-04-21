import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatEmployeeId(id: number): string {
  // Calculate the number of digits in the ID
  const idDigits = id.toString().length;
  
  // Calculate how many zeros we need
  // For 1 digit: 3 zeros
  // For 2 digits: 2 zeros
  // For 3 digits: 1 zero
  // For 4+ digits: no zeros
  const zerosNeeded = Math.max(0, 4 - idDigits);
  
  // Create the padded number with zeros
  const paddedNumber = '0'.repeat(zerosNeeded) + id;
  
  // Return the formatted ID
  return `#HRMSM${paddedNumber}`;
}
