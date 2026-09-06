import React, { useRef } from "react";
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
  minWidth?: number | string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  enableRowSelection?: boolean;
  selectedRowIds?: Set<string>;
  onSelectionChange?: (_selectedIds: Set<string>) => void;
  getRowId: (_row: T) => string;
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

export function DataTable<T>({
  data,
  columns,
  enableRowSelection = false,
  selectedRowIds = new Set(),
  onSelectionChange,
  getRowId,
  columnOrder,
  responsive = "cards",
  onRowClick,
  emptyMessage = "No data available",
  className,
  wrapperClassName,
}: DataTableProps<T>) {
  const visibleColumns = columnOrder
    ? columnOrder
        .map((id) => columns.find((column) => column.id === id))
        .filter((column): column is ColumnDef<T> => Boolean(column))
    : columns;

  const headerColIndex = visibleColumns.findIndex((column) => column.isCardHeader);
  const cardHeaderIndex = headerColIndex !== -1 ? headerColIndex : 0;

  const isAllSelected = data.length > 0 && selectedRowIds.size === data.length;
  const isSomeSelected = selectedRowIds.size > 0 && selectedRowIds.size < data.length;

  const handleSelectAll = () => {
    if (!onSelectionChange || !getRowId) return;

    if (isAllSelected) {
      onSelectionChange(new Set());
    } else {
      const allIds = new Set(data.map((row) => getRowId(row)));
      onSelectionChange(allIds);
    }
  };

  const handleSelectRow = (rowId: string) => {
    if (!onSelectionChange) return;

    const newSet = new Set(selectedRowIds);
    if (newSet.has(rowId)) {
      newSet.delete(rowId);
    } else {
      newSet.add(rowId);
    }
    onSelectionChange(newSet);
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
                checked={isAllSelected || isSomeSelected}
                indeterminate={isSomeSelected}
                onChange={handleSelectAll}
              />
            </TableHeaderCell>
          )}

          {visibleColumns.map((column) => (
            <TableHeaderCell
              key={column.id}
              className={column.className}
              style={column.minWidth ? { minWidth: column.minWidth } : undefined}>
              {column.hasFilter ? (
                <div className={styles.headerWithFilter}>
                  {typeof column.header === "function" ? column.header({ column }) : column.header}
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
          ))}
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
            const rowId = getRowId ? getRowId(row) : String(rowIndex);
            const isSelected = selectedRowIds.has(rowId);

            return (
              <TableRow
                key={rowId}
                selected={isSelected}
                data-selectable={enableRowSelection ? "true" : undefined}
                onClick={() => onRowClick && onRowClick(row)}
                className={cn(onRowClick && styles.rowClickable, isSelected && styles.rowSelected)}>
                {enableRowSelection && (
                  <TableCell
                    className={styles.checkboxCol}
                    onClick={(event) => event.stopPropagation()}>
                    <Checkbox checked={isSelected} onChange={() => handleSelectRow(rowId)} />
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
                      className={column.className}
                      dataLabel={label}
                      isCardHeader={isHeader}
                      style={column.minWidth ? { minWidth: column.minWidth } : undefined}>
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
