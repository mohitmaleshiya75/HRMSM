import { maximumAllowDistanceAttendanceMarkInMeters } from "@/constant";
// Function to calculate distance using Haversine formula
const getDistanceInMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371000; // Radius of Earth in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
// export const isLocationWithinRange = ({
//   userLat,
//   userLng,
//   accuracy,
// }: {
//   userLat: number;
//   userLng: number;
//   accuracy: number;
// }) => {
//   const officeLat = +(process.env.NEXT_PUBLIC_IT_SOFTLABS_LATITUDE || "0");
//   const officeLng = +(process.env.NEXT_PUBLIC_IT_SOFTLABS_LONGITUDE || "0");

//   if (!officeLat || !officeLng) {
//     return { inRange: false, distance: null };
//   }

//   const distance = getDistanceInMeters(userLat, userLng, officeLat, officeLng);
//   return {
//     inRange:
//       distance <= maximumAllowDistanceAttendanceMarkInMeters ||
//       process.env.NEXT_PUBLIC_IS_VERIFY_LOCATION !== "true",
//     distance: Math.round(distance), // Rounding distance to nearest meter
//   };
// };

export const isLocationWithinRange = ({
  officeLat,
  officeLng,
  userLat,
  userLng,
  accuracy,
}: {
  officeLat:number;
  officeLng:number;
  userLat: number;
  userLng: number;
  accuracy: number;
}) => {
  console.log(officeLat,userLat,officeLng,userLng,accuracy)
  if (!officeLat || !officeLng) {
    return { inRange: false, distance: null, accuracyStatus: "unknown" };
  }

  const distance = getDistanceInMeters(userLat, userLng, officeLat, officeLng);

  // Base threshold
  const baseDistance =
    Number(maximumAllowDistanceAttendanceMarkInMeters) || 100; // Default: 100m

  // Adjust max distance dynamically based on accuracy
  const adjustedMaxDistance = baseDistance + Math.min(accuracy * 0.5, 200);
  // If accuracy = 300m, extra buffer = 150m (300 * 0.5), max 200m extra

  // Determine accuracy status
  let accuracyStatus: "high" | "medium" | "low" | "poor";
  if (accuracy <= 20)
    accuracyStatus = "high"; // Very precise
  else if (accuracy <= 100)
    accuracyStatus = "medium"; // Decent accuracy
  else if (accuracy <= 300)
    accuracyStatus = "low"; // Less accurate
  else accuracyStatus = "poor"; // Very inaccurate

  return {
    inRange:
      distance <= adjustedMaxDistance ||
      process.env.NEXT_PUBLIC_IS_VERIFY_LOCATION !== "true",
    distance: Math.round(distance), // Rounding distance to nearest meter
    adjustedMaxDistance, // For debugging/logging
    accuracyStatus, // New field for accuracy level
  };
};
