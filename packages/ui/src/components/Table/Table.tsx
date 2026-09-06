import React from "react";
import styles from "./Table.module.css";
import { cn } from "../../utils/cn";

export interface TableProps extends React.ComponentPropsWithRef<"table"> {
  wrapperClassName?: string;
  responsive?: "cards" | "scroll";
}

export function TableRoot({
  children,
  className,
  wrapperClassName,
  responsive = "cards",
  ref,
  ...props
}: TableProps) {
  return (
    <div
      className={cn(
        styles.tableWrapper,
        responsive === "cards" && styles.responsiveCardsWrapper,
        wrapperClassName
      )}>
      <table
        ref={ref}
        className={cn(styles.table, responsive === "cards" && styles.responsiveCards, className)}
        {...props}>
        {children}
      </table>
    </div>
  );
}

export type TableHeadProps = React.ComponentPropsWithRef<"thead">;

export function TableHead({ children, className, ref, ...props }: TableHeadProps) {
  return (
    <thead ref={ref} className={className} {...props}>
      {children}
    </thead>
  );
}

export type TableBodyProps = React.ComponentPropsWithRef<"tbody">;

export function TableBody({ children, className, ref, ...props }: TableBodyProps) {
  return (
    <tbody ref={ref} className={className} {...props}>
      {children}
    </tbody>
  );
}

export interface TableRowProps extends React.ComponentPropsWithRef<"tr"> {
  selected?: boolean;
}

export function TableRow({ children, className, selected, ref, ...props }: TableRowProps) {
  return (
    <tr
      ref={ref}
      className={cn(styles.tr, selected && styles.selected, className)}
      data-selected={selected ? "true" : undefined}
      {...props}>
      {children}
    </tr>
  );
}

export interface TableCellProps extends React.ComponentPropsWithRef<"td"> {
  dataLabel?: string;
  isCardHeader?: boolean;
}

export function TableCell({
  children,
  className,
  dataLabel,
  isCardHeader,
  ref,
  ...props
}: TableCellProps) {
  return (
    <td
      ref={ref}
      className={cn(styles.td, isCardHeader && styles.cardHeaderCell, className)}
      data-label={dataLabel}
      {...props}>
      {children}
    </td>
  );
}

export type TableHeaderCellProps = React.ComponentPropsWithRef<"th">;

export function TableHeaderCell({ children, className, ref, ...props }: TableHeaderCellProps) {
  return (
    <th ref={ref} className={cn(styles.th, className)} {...props}>
      {children}
    </th>
  );
}

export const Table = Object.assign(TableRoot, {
  Head: TableHead,
  Body: TableBody,
  Row: TableRow,
  Cell: TableCell,
  HeaderCell: TableHeaderCell,
});
