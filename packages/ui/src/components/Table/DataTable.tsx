"use client";

import React, { useMemo, useRef } from "react";
import styles from "./DataTable.module.css";
import { cn } from "../../utils/cn";
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell } from "./Table";
import { Checkbox } from "../Checkbox/Checkbox";
import { FiFilter } from "react-icons/fi";

export interface ColumnDef<T> {
  id: string;
  header: React.ReactNode | ((_props: { column: ColumnDef<T> }) => React.ReactNode);
  cell: (_row: T) => React.ReactNode;
  dataLabel?: string;
  isCardHeader?: boolean;
  hasFilter?: boolean;
  filterButtonAriaLabel?: string;
  onFilterClick?: (
    _event: React.MouseEvent<HTMLButtonElement>,
    _buttonRef: React.RefObject<HTMLButtonElement | null>
  ) => void;
  className?: string;
  width?: number | string;
  minWidth?: number | string;
  align?: "start" | "center" | "end";
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  enableRowSelection?: boolean;
  selectedRowIds?: Set<string>;
  onSelectionChange?: (_selectedIds: Set<string>) => void;
  getRowId?: (_row: T) => string;
  columnOrder?: string[];
  responsive?: "cards" | "scroll";
  onRowClick?: (_row: T) => void;
  emptyMessage?: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
}

export interface FilterButtonProps {
  onClick: (
    _event: React.MouseEvent<HTMLButtonElement>,
    _ref: React.RefObject<HTMLButtonElement | null>
  ) => void;
  ariaLabel?: string;
}

function FilterButton({ onClick, ariaLabel = "Filter" }: FilterButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      className={styles.headerFilterBtn}
      onClick={(event) => {
        event.stopPropagation();
        onClick(event, ref);
      }}>
      <FiFilter size={14} />
    </button>
  );
}

const EMPTY_SET = new Set<string>();

export function DataTable<T>({
  data,
  columns,
  enableRowSelection = false,
  selectedRowIds = EMPTY_SET,
  onSelectionChange,
  getRowId,
  columnOrder,
  responsive = "cards",
  onRowClick,
  emptyMessage = "No data available",
  className,
  wrapperClassName,
}: DataTableProps<T>) {
  const visibleColumns = useMemo(() => {
    if (!columnOrder) return columns;
    const colMap = new Map(columns.map((col) => [col.id, col]));
    return columnOrder
      .map((id) => colMap.get(id))
      .filter((col): col is ColumnDef<T> => col !== undefined);
  }, [columns, columnOrder]);

  const cardHeaderIndex = useMemo(() => {
    const idx = visibleColumns.findIndex((column) => column.isCardHeader);
    return idx !== -1 ? idx : 0;
  }, [visibleColumns]);

  const rowIds = useMemo(
    () => data.map((row, index) => (getRowId ? getRowId(row) : String(index))),
    [data, getRowId]
  );

  const isAllSelected = rowIds.length > 0 && rowIds.every((id) => selectedRowIds.has(id));
  const isSomeSelected = selectedRowIds.size > 0 && !isAllSelected;

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(isAllSelected ? new Set() : new Set(rowIds));
  };

  const handleSelectRow = (rowId: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedRowIds);
    if (next.has(rowId)) {
      next.delete(rowId);
    } else {
      next.add(rowId);
    }
    onSelectionChange(next);
  };

  return (
    <Table className={className} wrapperClassName={wrapperClassName} responsive={responsive}>
      <TableHead>
        <TableRow>
          {enableRowSelection && (
            <TableHeaderCell
              className={styles.checkboxCol}
              onClick={(event) => event.stopPropagation()}>
              <Checkbox
                aria-label="Select all rows"
                checked={isAllSelected || isSomeSelected}
                indeterminate={isSomeSelected}
                onChange={handleSelectAll}
              />
            </TableHeaderCell>
          )}

          {visibleColumns.map((column) => {
            const colWidth = column.width ?? column.minWidth;
            return (
              <TableHeaderCell
                key={column.id}
                className={column.className}
                data-align={column.align}
                style={colWidth ? { width: colWidth } : undefined}>
                {column.hasFilter ? (
                  <div className={styles.headerWithFilter} data-align={column.align}>
                    {typeof column.header === "function"
                      ? column.header({ column })
                      : column.header}
                    {column.onFilterClick && (
                      <FilterButton
                        onClick={column.onFilterClick}
                        ariaLabel={column.filterButtonAriaLabel}
                      />
                    )}
                  </div>
                ) : typeof column.header === "function" ? (
                  column.header({ column })
                ) : (
                  column.header
                )}
              </TableHeaderCell>
            );
          })}
        </TableRow>
      </TableHead>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell
              className={styles.emptyStateCell}
              colSpan={visibleColumns.length + (enableRowSelection ? 1 : 0)}>
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          data.map((row, rowIndex) => {
            const rowId = rowIds[rowIndex];
            const isSelected = selectedRowIds.has(rowId);

            return (
              <TableRow
                key={rowId}
                selected={isSelected}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  onRowClick && styles.rowClickable,
                  enableRowSelection && styles.rowSelectable
                )}>
                {enableRowSelection && (
                  <TableCell
                    className={styles.checkboxCol}
                    onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      aria-label={`Select row ${rowId}`}
                      checked={isSelected}
                      onChange={() => handleSelectRow(rowId)}
                    />
                  </TableCell>
                )}

                {visibleColumns.map((column, colIndex) => {
                  const label =
                    column.dataLabel ??
                    (typeof column.header === "string" ? column.header : undefined);
                  const isHeader = colIndex === cardHeaderIndex;

                  return (
                    <TableCell
                      key={column.id}
                      className={cn(column.className, column.id === "actions" && styles.actionsCol)}
                      data-actions={column.id === "actions" || undefined}
                      dataLabel={label}
                      isCardHeader={isHeader}
                      data-align={column.align}>
                      {column.cell(row)}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
