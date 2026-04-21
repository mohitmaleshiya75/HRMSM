import axios, { AxiosError } from "axios";

export const api = axios.create({
  baseURL: `${process.env.EXPO_PUBLIC_SERVER_BACKEND_URL}`,
  headers: {
    "Content-Type": "application/json",
  },
});

// export function getReadableErrorMessage(error: unknown): string {
//   if (error instanceof AxiosError) {
//     if (error.response) {
//       const { status, data } = error.response;

//       // If the backend returns validation errors (e.g., { "username": ["A user with that username already exists."] })
//       if (typeof data === "object" && data !== null) {
//         const messages: string[] = [];

//         for (const key in data) {
//           if (Array.isArray(data[key])) {
//             messages.push(...data[key]); // Extract messages from arrays
//           } else if (typeof data[key] === "string") {
//             messages.push(data[key]); // Extract single string messages
//           }
//         }

//         if (messages.length > 0) {
//           return messages.join(" ");
//         }
//       }

//       // Fallback error messages based on HTTP status codes
//       switch (status) {
//         case 400:
//           return "Bad request. Please check your input.";
//         case 401:
//           return "Unauthorized. Please log in.";
//         case 403:
//           return "Forbidden. You don't have permission to access this resource.";
//         case 404:
//           return "Not found. The requested resource does not exist.";
//         case 500:
//           return "Server error. Please try again later.";
//         default:
//           return `Unexpected error (Status: ${status}). Please try again.`;
//       }
//     } else if (error.request) {
//       return "No response from the server. Please check your network.";
//     } else {
//       return `Request error: ${error.message}`;
//     }
//   }

//   return "An unknown error occurred.";
// }

export function getReadableErrorMessage(error: unknown): string {
  // Handle Axios errors
  if (error instanceof AxiosError) {
    if (error.response) {
      const { status, data } = error.response;

      if (typeof data === "object" && data !== null) {
        if (typeof data.details === "string") {
          return data.details; // Specific error message
        }

        const messages: string[] = [];
        for (const key in data) {
          if (Array.isArray(data[key])) {
            messages.push(...data[key]); // Extract messages from arrays
          } else if (typeof data[key] === "string") {
            messages.push(data[key]); // Extract single string messages
          }
        }

        if (messages.length > 0) {
          return messages.join(" ");
        }
      }

      // Handle common HTTP errors
      switch (status) {
        case 400:
          return "Bad request. Please check your input.";
        case 401:
          return "Unauthorized. Please log in.";
        case 403:
          return "Forbidden. You don't have permission to access this resource.";
        case 404:
          return "Not found. The requested resource does not exist.";
        case 500:
          return "Server error. Please try again later.";
        default:
          return `Unexpected error (Status: ${status}). Please try again.`;
      }
    } else if (error.request) {
      // console.error("98: Invalid request",error)
      return "No response from the server. Please check your network.";
    } else {
      // console.error("101: Request error",error)
      return `Request error: ${error.message}`;
    }
  }

  // Handle plain Error instances
  if (error instanceof Error) {
    return error.message;
  }

  // Handle errors wrapped inside an object, like { error: Error }
  if (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    error.error instanceof Error
  ) {
    return error.error.message;
  }

  // Handle errors with a "details" field
  if (
    typeof error === "object" &&
    error !== null &&
    "details" in error &&
    typeof error.details === "string"
  ) {
    return error.details;
  }

  // Fallback for unknown errors
  // console.error("Unhandled error:", error); // Log it for debugging
  return "An unknown error occurred. Please try again.";
}