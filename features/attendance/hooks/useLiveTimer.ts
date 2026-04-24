import { useEffect, useState } from "react";

interface Time {
  hours: number;
  minutes: number;
  seconds: number;
}

export default function useLiveTimer(initialSeconds: number = 0) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getTime = (): Time => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return { hours: hrs, minutes: mins, seconds: secs };
  };

  return { time: getTime(), totalSeconds: seconds };
}