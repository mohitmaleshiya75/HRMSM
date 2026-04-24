import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import usePaginatedQuery from "@/hooks/usePaginatedQuery";
import { GetPaginatedLeavesResponseT, LeavesFilters } from "../type";

export const useGetLeaves = () => {

  const { data: user } = useCurrentUser();

  const filters: LeavesFilters = {
    // status: searchParams.get("status") as LeaveStatus || undefined,
    // search: searchParams.get("search") || undefined,
    // employee_id: (params.empId as string) || user?.id || undefined,
    office: user?.office||"0",
  };

  const { data, isLoading, ...rest } = usePaginatedQuery<
    GetPaginatedLeavesResponseT,
    LeavesFilters
  >({
    queryKey: "user_leaves",
    endpoint: `/accounts/leave-requests/`,
    filters,
    transformData: (response) => ({
      results: response.results || [],
      count: response.count || 0,
      next: response.next,
      previous: response.previous,
    }),
  });

  return {
    leaves: data?.results || [],
    totalCount: data?.count || 0,
    nextPage: data?.next,
    previousPage: data?.previous,
    isLoading,
    ...rest,
  };
};