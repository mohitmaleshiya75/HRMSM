import usePaginatedQuery from "@/hooks/usePaginatedQuery";
import { useSearchParams } from "next/navigation";
import { LeaveAllocationResponseT, LeavesAllocationFilters } from "../types";
import useGetOfficeId from "@/hooks/useGetOfficeId";

const useGetLeaveAllocations = () => {
  const searchParams = useSearchParams();
  const officeId = useGetOfficeId();

  const filters: LeavesAllocationFilters = {
    // "startDate": searchParams.get("startDate") || undefined,
    // "endDate": searchParams.get("endDate") || undefined,
    search: searchParams.get("search") || undefined,
    office: officeId,
  };

  const { data, isLoading, ...rest } = usePaginatedQuery<
    LeaveAllocationResponseT[],
    LeavesAllocationFilters
  >({
    queryKey: "leaves-allocations",
    endpoint: "/accounts/leave-allocations/",
    filters,
  });

  return {
    leaveAllocation: data,
    // totalCount: data?.count || 0,
    // nextPage: data?.next,
    // previousPage: data?.previous,
    isLoading,
    ...rest,
  };
};

export default useGetLeaveAllocations;
interface LeaveAllocationViewByIdprops {
  emp_id: string;
}
export const useRetriveGetLeaveAllocations = ({emp_id}:LeaveAllocationViewByIdprops) => {
  const searchParams = useSearchParams();
  const officeId = useGetOfficeId();

  const filters: LeavesAllocationFilters = {
    // "startDate": searchParams.get("startDate") || undefined,
    // "endDate": searchParams.get("endDate") || undefined,
    search: searchParams.get("search") || undefined,
    employee_id: emp_id || undefined,
    office: officeId,
  };

  const { data, isLoading, ...rest } = usePaginatedQuery<
    LeaveAllocationResponseT[],
    LeavesAllocationFilters
  >({
    queryKey: "leaves-allocations-by-id",
    endpoint: `/accounts/leave-allocations/`,
    filters,
  });

  return {
    leaveAllocation: data,
    // totalCount: data?.count || 0,
    // nextPage: data?.next,
    // previousPage: data?.previous,
    isLoading,
    ...rest,
  };
};
