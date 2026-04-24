
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { AttendanceFilters, GetAttendanceResponseT } from "../type";
import usePaginatedQuery from "@/hooks/usePaginatedQuery";
import { PaginatedResponse } from "@/types";


const useViewAttendance = (filtersProps: AttendanceFilters={}) => {
  const { data:user } = useCurrentUser()
  const showAll = filtersProps?.showAllAttendance;
  // const searchParams = useSearchParams();
  // const { data: user } = useCurrentUser();
  const filters: AttendanceFilters = {
    // search: searchParams.get("search") || filtersProps?.search || undefined,
    // date: filtersProps?.date || searchParams.get("date") || undefined,
    office:user?.office||"0",
    employee_id:user?.id
    // employee_id: showAll
    //   ? undefined
    //   :  searchParams.get("employee_id") || filtersProps?.employee_id ||
    //     undefined,
  };

  const { data, isLoading, ...rest } = usePaginatedQuery<
    PaginatedResponse<GetAttendanceResponseT>,
    AttendanceFilters
  >({
    queryKey: "attendance",
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

export default useViewAttendance;
