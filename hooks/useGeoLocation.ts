// import { useState, useCallback, useRef, useEffect, useMemo } from "react";

// interface GeolocationCoordinates {
//   latitude: number;
//   longitude: number;
//   accuracy: number;
// }

// interface GeolocationOptions {
//   enableHighAccuracy?: boolean;
//   timeout?: number;
//   maximumAge?: number;
// }

// interface GeolocationHookResult {
//   loading: boolean;
//   coordinates: GeolocationCoordinates | null;
//   error: Error | null;
//   getLocation: () => Promise<GeolocationCoordinates | null>;
// }

// export function useGeoLocation(
//   onMountGetLocation = true,
//   options: GeolocationOptions = {},
// ): GeolocationHookResult {
//   const [loading, setLoading] = useState<boolean>(false);
//   const [coordinates, setCoordinates] = useState<GeolocationCoordinates | null>(
//     null,
//   );
//   const [error, setError] = useState<Error | null>(null);
//   const hasInteracted = useRef<boolean>(false);

//   const memoizedOptions = useMemo(
//     () => ({
//       enableHighAccuracy: options.enableHighAccuracy ?? false,
//       timeout: options.timeout ?? 30000,
//       maximumAge: options.maximumAge ?? 0,
//     }),
//     [options.enableHighAccuracy, options.timeout, options.maximumAge],
//   );

//   const getLocation =
//     useCallback(async (): Promise<GeolocationCoordinates | null> => {
//       if (!navigator.geolocation) {
//         const err = new Error("Geolocation is not supported by your browser.");
//         setError(err);
//         return null;
//       }

//       setLoading(true);
//       setError(null);

//       return new Promise((resolve) => {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newCoords: GeolocationCoordinates = {
//               latitude: position.coords.latitude,
//               longitude: position.coords.longitude,
//               accuracy: position.coords.accuracy,
//             };

//             setCoordinates(newCoords);
//             setLoading(false);
//             resolve(newCoords);
//           },
//           (geoError) => {
//             let errorMessage = "Unable to get your location.";
//             switch (geoError?.code) {
//               case 1: // PERMISSION_DENIED
//                 errorMessage =
//                   "Location permission denied. Please enable location services.";
//                 break;
//               case 2: // POSITION_UNAVAILABLE
//                 errorMessage = "Location information is unavailable.";
//                 break;
//               case 3: // TIMEOUT
//                 errorMessage = "Location request timed out.";
//                 break;
//             }
//             const err = new Error(errorMessage);
//             setError(err);
//             setLoading(false);
//             resolve(null);
//           },
//           memoizedOptions,
//         );
//       });
//     }, [memoizedOptions]);

//   const interactionHandlerRef = useRef<() => void>(null);

//   useEffect(() => {
//     if (!onMountGetLocation) return; // Skip effect if auto-fetch is disabled

//     interactionHandlerRef.current = () => {
//       if (!hasInteracted.current) {
//         hasInteracted.current = true;
//         getLocation();
//       }
//     };

//     const handler = interactionHandlerRef.current!;
//     window.addEventListener("mousemove", handler, { once: true });
//     window.addEventListener("keydown", handler, { once: true });
//     window.addEventListener("touchstart", handler, { once: true });

//     return () => {
//       window.removeEventListener("mousemove", handler);
//       window.removeEventListener("keydown", handler);
//       window.removeEventListener("touchstart", handler);
//     };
//   }, [onMountGetLocation, getLocation]);

//   return { loading, coordinates, error, getLocation };
// }
