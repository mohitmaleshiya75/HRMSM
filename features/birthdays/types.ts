import { PaginatedResponse } from "@/types";
import { User } from "../auth/types";

export type BirthdayResponseT = User;

export type GetPaginatedHolidaysResponseT = PaginatedResponse<BirthdayResponseT>;
export type HolidaysFilters = {
  search?: string;
};

export type AddEditHolidayRequestT = {
  date: string;
  occasion: string;
  is_paid: boolean;
  created_by: number;
}; 