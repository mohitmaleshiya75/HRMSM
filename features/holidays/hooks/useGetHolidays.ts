import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { api } from "@/lib/utils/apiUtils";
import { useQuery } from "@tanstack/react-query";
import { HolidayResponseT } from "../types";
// import useGetOfficeId from "@/hooks/useGetOfficeId";

const useGetHolidays = () => {
  const { data: user } = useCurrentUser();
  // const officeId = useGetOfficeId();


  const { data, isLoading, ...rest } = useQuery({
    queryKey: ["holidays"],
    queryFn: async () => {
      const response = await api.get<HolidayResponseT[]>(`/accounts/holidays/upcoming_holidays/?office=${user?.office}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      return response.data;
    },
    // 🔁 refetch every 10 seconds
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    // 🚫 don’t run until token exists
    enabled: !!user?.token,
  });

  return {
    holidays: data || [],
    isLoading,
    ...rest,
  };
};

export default useGetHolidays; 