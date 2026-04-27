import { api } from "@/lib/utils/apiUtils";
import { useQuery } from "@tanstack/react-query";
import { AnnouncementResponseT } from "../types";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";

const useGetActiveAnnouncements = () => {
  const { data: userSession } = useCurrentUser();
  const office = userSession?.office;
  return useQuery({
    queryKey: ["active-announcements"],
    queryFn: async () => {
      const { data } = await api.get<AnnouncementResponseT[]>(
        `/accounts/announcements/active/?office=${office}`,
        {
          headers: {
            Authorization: `Bearer ${userSession?.token}`,
          },
        },
      );
      return data;
    },
    // 🔁 refetch every 10 seconds
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    // 🚫 don’t run until token exists
    enabled: !!userSession?.token,
  });
};

export default useGetActiveAnnouncements;
