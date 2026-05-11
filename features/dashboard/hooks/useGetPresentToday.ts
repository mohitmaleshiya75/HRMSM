import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import usePaginatedQuery from "@/hooks/usePaginatedQuery";
import { GetPaginatedPresentAbsentResponseT, PresentAbsentFilterT } from "../type";
// import { useSearchParams } from "next/navigation";
// import useGetOfficeId from "@/hooks/useGetOfficeId";

// interface JobOpeningsResponse {
//   results: AddEditJobOpeningResponseT[];
//   count: number;
//   next: string | null;
//   previous: string | null;
// }

const useGetPresentToday = () => {
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
    queryKey: "present-today",
    endpoint: "/accounts/attendance/present-today/",
    filters,
    transformData: (response) => ({
      results: response.results || [],
      count: response.count || 0,
      next: response.next,
      previous: response.previous,
    }),
  });
  return {
    presentEmployees: data?.results || [],
    totalCount: data?.count || 0,
    nextPage: data?.next,
    previousPage: data?.previous,
    isLoading,
    ...rest,
  };
};

export default useGetPresentToday;