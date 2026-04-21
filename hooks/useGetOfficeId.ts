// import { useParams } from 'next/navigation';

// const useGetOfficeId = ():string => {
//  const officeId = useParams().office_id;
//  if (!officeId) return "";
//  return String(decodeOfficeId(String(officeId)));
// }

// export default useGetOfficeId



// export const decodeOfficeId = (encodedOfficeId: string): number => {
//   try {
//     // Restore base64 padding
//     const padded =
//       encodedOfficeId + "=".repeat((4 - (encodedOfficeId.length % 4)) % 4);

//     // Convert URL-safe base64 back to standard base64
//     const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");

//     const decoded = atob(base64);
//     const officeId = Number(decoded);

//     return Number.isInteger(officeId) ? officeId : 0;
//   } catch (error) {
//     console.log(error)
//     return 0;
//   }
// };

