import { Pagination, Spinner } from "@nextui-org/react";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/table";
import { useInfiniteScroll } from "@nextui-org/use-infinite-scroll";
import { useState } from "react";
import type { SortDescriptor } from "@nextui-org/table";
import type { ReactNode } from "@tanstack/react-router";

export interface Column {
  id: string;
  label: string;
  allowsSorting?: boolean;
  className?: string;
}

export interface Filter {
  page: number;
  perPage: number;
  sortKey: string | number;
  sortDir: "asc" | "desc";
}

interface FullTableProps<T, F extends Filter> {
  columns: Column[];
  items: T[];
  mapRow(props: T): ReactNode[];
  filter?: F;
  onFilterChange?(filter: F): void;
  hasMore?: boolean;
  onLoadMore?(): void;
  totalPages?: number;
}

export function FullTable<T, F extends Filter>({
  columns,
  items,
  mapRow,
  filter,
  onFilterChange,
  hasMore,
  onLoadMore,
  totalPages,
}: FullTableProps<T, F>) {
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: filter?.sortKey,
    direction: filter?.sortDir === "asc" ? "ascending" : "descending",
  });

  const [loaderRef, scrollerRef] = useInfiniteScroll({
    onLoadMore,
    hasMore,
  });

  const updateFilter = (value: Record<string, string | number | undefined>) => {
    if (onFilterChange && filter) {
      onFilterChange({ ...filter, ...value });
    }
  };

  return (
    <>
      <Table
        baseRef={scrollerRef}
        sortDescriptor={sortDescriptor ?? undefined}
        onSortChange={(sd) => {
          setSortDescriptor(sd);
          updateFilter({
            sortKey: sd.column,
            sortDir: sd.direction === "ascending" ? "asc" : "desc",
          });
        }}
        bottomContent={hasMore ? <Spinner ref={loaderRef} /> : null}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.id}
              allowsSorting={column.allowsSorting}
              className={column.className}
            >
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody>
          {items.map((item, index) => {
            const cells = mapRow(item);
            return (
              <TableRow key={index}>
                {cells.map((cell, index) => {
                  return <TableCell key={index}>{cell}</TableCell>;
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {filter && totalPages !== undefined ? (
        <div className="flex items-center gap-4 mt-4">
          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small"
              onChange={(event) => {
                const perPage = Number(event.target.value);
                updateFilter({ perPage });
              }}
              defaultValue={filter.perPage.toString()}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
            </select>
          </label>
          <Pagination
            total={totalPages}
            initialPage={filter.page}
            onChange={(page) => {
              updateFilter({ page });
            }}
          />
        </div>
      ) : null}
    </>
  );
}
