import { useRoute } from "@react-navigation/native";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { api } from "@/lib/utils/apiUtils";
import { tableLimitArr } from "@/constant";
import { format, isValid, startOfDay } from "date-fns";

interface UsePaginatedQueryProps<
  TData,
  TTransformed,
  TFilters extends Record<string, string | number | boolean | undefined>,
> {
  queryKey: string;
  endpoint: string;
  filters?: TFilters;
  transformData?: (data: TData) => TTransformed;
}

const usePaginatedQuery = <
  TData,
  TFilters extends Record<string, string | number | boolean | undefined>,
  TTransformed = TData,
>({
  queryKey,
  endpoint,
  filters = {} as TFilters,
  transformData,
}: UsePaginatedQueryProps<TData, TTransformed, TFilters>) => {
  
  const { data: user, isLoading: isUserLoading } = useCurrentUser();

  // ✅ React Native way
  const route = useRoute();
  const params = route.params as Record<string, any> || {};

  const startDate = params.startDate;
  const endDate = params.endDate;

  const paginationFilters: TFilters = {
    limit: Number(params.limit) || tableLimitArr[0],
    page: Number(params.page) || 1,
    "start-date":
      startDate && isValid(new Date(startDate))
        ? format(startOfDay(new Date(startDate)), "yyyy-MM-dd")
        : undefined,
    "end-date":
      endDate && isValid(new Date(endDate))
        ? format(startOfDay(new Date(endDate)), "yyyy-MM-dd")
        : undefined,
    ...filters,
  };

  const queryString = new URLSearchParams(
    Object.entries(paginationFilters).reduce(
      (acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      },
      {} as Record<string, string>,
    ),
  ).toString();

  const { data, isLoading, ...rest } = useQuery({
    queryKey: [queryKey, paginationFilters],
    queryFn: async () => {
      const { data } = await api.get<TData>(`${endpoint}?${queryString}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      return transformData ? transformData(data) : data;
    },
    refetchInterval: 60_000,
    enabled: !!user?.token,
    placeholderData: keepPreviousData,
  });

  return {
    data,
    isLoading: isUserLoading || isLoading,
    ...rest,
  };
};

export default usePaginatedQuery;