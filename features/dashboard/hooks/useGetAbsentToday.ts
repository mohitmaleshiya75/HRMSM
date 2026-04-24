import usePaginatedQuery from "@/hooks/usePaginatedQuery";
// import { useSearchParams } from "next/navigation";
import { GetPaginatedPresentAbsentResponseT, PresentAbsentFilterT } from "../type";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
// import useGetOfficeId from "@/hooks/useGetOfficeId";


const useGetAbsentToday = () => {
  // const searchParams = useSearchParams();
  // const officeId = useGetOfficeId();
  const { data: user } = useCurrentUser();
  const filters: PresentAbsentFilterT = {
    // search: searchParams.get("search") || undefined,
    office:user?.office||"0",
  };

  const { data, isLoading, ...rest } = usePaginatedQuery<
  GetPaginatedPresentAbsentResponseT,
  PresentAbsentFilterT
  >({
    queryKey: "absent-today",
    endpoint: "/accounts/attendance/absent-today/",
    filters,
    transformData: (response) => ({
      results: response.results || [],
      count: response.count || 0,
      next: response.next,
      previous: response.previous,
    }),
  });

  return {
    absentEmployees: data?.results || [],
    totalCount: data?.count || 0,
    nextPage: data?.next,
    previousPage: data?.previous,
    isLoading,
    ...rest,
  };
};

export default useGetAbsentToday;