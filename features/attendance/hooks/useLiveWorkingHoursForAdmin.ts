import { useRoute } from "@react-navigation/native";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import usePaginatedQuery from "@/hooks/usePaginatedQuery";
// import useGetOfficeId from "@/hooks/useGetOfficeId";
import { AttendanceFilters, GetAttendanceResponseT } from "../type";
import { PaginatedResponse } from "@/types";

const useLiveWorkingHoursForAdmin = (
  filtersProps: AttendanceFilters = {}
) => {
  const route = useRoute();
  const params = (route.params as Record<string, any>) || {};

//   const officeId = useGetOfficeId();
  const { data: user } = useCurrentUser();

  const filters: AttendanceFilters = {
    search: params.search || filtersProps?.search || undefined,
    date: params.date || filtersProps?.date || undefined,
    employee_id: user?.id,
    office: user?.office||"0",
  };

  const { data, isLoading, ...rest } = usePaginatedQuery<
    PaginatedResponse<GetAttendanceResponseT>,
    AttendanceFilters
  >({
    queryKey: "LiveWorkingHoursForAdmin",
    endpoint: `/accounts/attendances/`,
    filters,
    transformData: (response) => ({
      results: response.results || [],
      count: response.count || 0,
      next: response.next,
      previous: response.previous,
    }),
  });

  return {
    attendance: data?.results || [],
    totalCount: data?.count || 0,
    nextPage: data?.next,
    previousPage: data?.previous,
    isLoading,
    ...rest,
  };
};

export default useLiveWorkingHoursForAdmin;