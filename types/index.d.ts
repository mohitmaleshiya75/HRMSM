import { alertVariants } from "@/components/ui/alert";
import { VariantProps } from "class-variance-authority";


export type ResponseError = {
  [key: string]: string[];
};

export type PaginatedResponse<T> = {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
};



export type PageProps = {
  params: { _id: string };
  searchParams: SearchParams;
};

export type SearchParamsPromise = Promise<{ [key: string]: string }>;
export type ParamsPromise = Promise<{ [key: string]: string }>;

export type SearchParams = {
  [key: string]: string | number | boolean;
};

export type PagePropsPromise = {
  params: ParamsPromise;
  searchParams: SearchParamsPromise;
};

export type Children = {
  children: React.ReactNode;
};


export type AlertVarientT = VariantProps<typeof alertVariants>["variant"];

export type OfficeFilters = {
  office?:string;
};
