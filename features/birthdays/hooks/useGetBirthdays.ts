import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { api } from "@/lib/utils/apiUtils";
import { useQuery } from "@tanstack/react-query";
import { BirthdayResponseT } from "../types";
// import useGetOfficeId from "@/hooks/useGetOfficeId";

const useGetBirthday = () => {
  const { data: user } = useCurrentUser();
  const officeId = user?.office;


  const { data, isLoading, ...rest } = useQuery({
    queryKey: ["birthdays"],
    queryFn: async () => {
      const response = await api.get<BirthdayResponseT[]>(`/accounts/upcoming-birthdays/?office=${officeId}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      return response.data;
    },
    enabled: !!user?.token,
  });

  return {
    birthdays: data || [],
    isLoading,
    ...rest,
  };
};

export default useGetBirthday; 