// import { tableLimitArr } from "@/constant";
// import {
//   ColumnDef,
//   ColumnFiltersState,
//   getCoreRowModel,
//   getFilteredRowModel,
//   getPaginationRowModel,
//   getSortedRowModel,
//   SortingState,
//   useReactTable,
// } from "@tanstack/react-table";
// import { useSearchParams } from "next/navigation";
// import { useState } from "react";

// interface UseTableProps<T> {
//   columns: ColumnDef<T>[];
//   results: T[];
//   count: number;
//   next?: string;
//   previous?: string;
// }

// const useTable = <T,>({ columns, results, count }: UseTableProps<T>) => {
//   const searchParams = useSearchParams();
//   const [sorting, setSorting] = useState<SortingState>([]);
//   const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
//   const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

//   const currentPage = Number(searchParams.get("page")) || 1;
//   const pageSize = Number(searchParams.get("limit")) || tableLimitArr[0];

//   const table = useReactTable<T>({
//     data: results || [],
//     columns,
//     getCoreRowModel: getCoreRowModel(),
//     getPaginationRowModel: getPaginationRowModel(),
//     onSortingChange: setSorting,
//     getSortedRowModel: getSortedRowModel(),
//     onColumnFiltersChange: setColumnFilters,
//     getFilteredRowModel: getFilteredRowModel(),
//     onRowSelectionChange: setRowSelection,
//     state: {
//       sorting,
//       columnFilters,
//       rowSelection,
//       pagination: {
//         pageIndex: currentPage - 1,
//         pageSize,
//       },
//     },
//     manualPagination: true,
//     pageCount: Math.ceil(count / pageSize),
//   });

//   return {
//     table,
//     sorting,
//     setSorting,
//     columnFilters,
//     setColumnFilters,
//     rowSelection,
//     setRowSelection,
//     currentPage,
//     pageSize,
//   };
// };

// export default useTable;
