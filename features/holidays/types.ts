import { PaginatedResponse } from "@/types";

export type HolidayResponseT = {
  id: string;
  occasion: string;
  date: string;
  is_paid: boolean;
  created_by: string;
  created_by_name: string;
  created_at: string;
};

export type GetPaginatedHolidaysResponseT = PaginatedResponse<HolidayResponseT>;

export type HolidaysFilters = {
  search?: string;
};

export type AddEditHolidayRequestT = {
  date: string;
  occasion: string;
  is_paid: boolean;
  created_by: number;
}; 