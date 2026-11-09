"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { FiPlus, FiTrash2, FiToggleLeft, FiToggleRight, FiCopy } from "react-icons/fi";
import { TbFilter } from "react-icons/tb";
import { DiscountCode } from "@/types/shop/discountCode";
import { Product } from "@/types/shop/product";
import { User } from "@/types/user";
import { useRouter } from "next/navigation";
import {
  Alert,
  DataTable,
  ColumnDef,
  Button,
  Badge,
  SearchInput,
  ColorfulText,
  TableSelectionBar,
  TableFilterMultiSelect,
  TableFilterDate,
  TableFiltersDrawer,
  TableActiveFilters,
  DropdownMenu,
  ConfirmDialog,
} from "@neiist/ui";
import { pt } from "date-fns/locale";
import { useSearch } from "@/hooks/useSearch";
import type { Dictionary } from "@/i18n/dictionaries";
import { updateDiscountAction, deleteDiscountAction } from "@/actions/shop/discounts";
import styles from "@/styles/components/shop/manage/DiscountCodeManagement.module.css";

interface DiscountCodesDashboardProps {
  users: User[];
  products: Product[];
  discountCodes: DiscountCode[];
  basePath?: string;
  dict: Dictionary["discount_codes"];
}

type DiscountStatusCode = "active" | "inactive" | "expired" | "exhausted";

function getStatusCode(code: DiscountCode): DiscountStatusCode {
  const now = Date.now();
  const expiresAt = code.expires_at ? new Date(code.expires_at).getTime() : null;
  if (!code.active) return "inactive";
  if (expiresAt != null && !Number.isNaN(expiresAt) && expiresAt < now) return "expired";

  if (code.max_uses != null && code.current_uses >= code.max_uses) return "exhausted";
  return "active";
}

function getStatus(
  code: DiscountCode,
  dict: Dictionary["discount_codes"]
): { label: string; variant: "primary" | "secondary" | "tertiary" | "outline" | "danger" } {
  const statusCode = getStatusCode(code);
  switch (statusCode) {
    case "inactive":
      return { label: dict.status_inactive, variant: "outline" };
    case "expired":
      return { label: dict.status_expired, variant: "danger" };
    case "exhausted":
      return { label: dict.status_exhausted, variant: "secondary" };
    case "active":
    default:
      return { label: dict.status_active, variant: "primary" };
  }
}

function formatUsers(
  code: DiscountCode,
  usersByIstid: Map<string, User>,
  dict: Dictionary["discount_codes"]
): string {
  return code.valid_istids.length === 0
    ? dict.all_users
    : code.valid_istids
        .map((istid) => {
          const u = usersByIstid.get(istid);
          return u ? `${u.name} (${u.istid})` : istid;
        })
        .join(", ");
}

function formatProducts(
  code: DiscountCode,
  productNamesById: Map<number, string>,
  dict: Dictionary["discount_codes"]
): string {
  return code.valid_product_ids.length === 0
    ? dict.all_products
    : code.valid_product_ids.map((id) => productNamesById.get(id) ?? String(id)).join(", ");
}

interface FilterState {
  type: string[];
  restrictions: string[];
  dateRange: { start: Date | null; end: Date | null };
  status: string[];
}

export default function DiscountCodeManagement({
  users,
  products,
  discountCodes,
  basePath,
  dict,
}: DiscountCodesDashboardProps) {
  const router = useRouter();
  const [codes, setCodes] = useState(discountCodes);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<DiscountCode | null>(null);
  const [isConfirmingBulkDelete, setIsConfirmingBulkDelete] = useState(false);
  const [typeFilterOpen, setTypeFilterOpen] = useState(false);
  const typeFilterRef = useRef<HTMLButtonElement | null>(null);

  const [restrictionsFilterOpen, setRestrictionsFilterOpen] = useState(false);
  const restrictionsFilterRef = useRef<HTMLButtonElement | null>(null);

  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const dateFilterRef = useRef<HTMLButtonElement | null>(null);

  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const statusFilterRef = useRef<HTMLButtonElement | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    type: [],
    restrictions: [],
    dateRange: { start: null, end: null },
    status: [],
  });

  const usersByIstid = useMemo(() => new Map(users.map((u) => [u.istid, u])), [users]);
  const productNamesById = useMemo(() => new Map(products.map((p) => [p.id, p.name])), [products]);

  const availableProductOptions = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.name))).sort();
  }, [products]);

  const {
    results: searchedCodes,
    query: search,
    setQuery: setSearch,
  } = useSearch<DiscountCode>({
    data: codes,
    fields: [{ field: "code", boost: 4 }, "discount_type", "usersText", "productsText"],
    extractField: (code, field) => {
      if (field === "usersText") return formatUsers(code, usersByIstid, dict);
      if (field === "productsText") return formatProducts(code, productNamesById, dict);
      return undefined;
    },
    returnAllWhenEmpty: true,
  });

  const filteredCodes = useMemo(() => {
    let list = searchedCodes;

    if (filters.type.length > 0) list = list.filter((c) => filters.type.includes(c.discount_type));

    if (filters.status.length > 0)
      list = list.filter((c) => filters.status.includes(getStatusCode(c)));

    if (filters.restrictions.length > 0) {
      list = list.filter((c) => {
        if (c.valid_product_ids.length === 0) return true;
        const pNames = c.valid_product_ids.map((id) => productNamesById.get(id) || String(id));
        return pNames.some((name) => filters.restrictions.includes(name));
      });
    }

    const { start, end } = filters.dateRange;
    if (start) list = list.filter((c) => c.expires_at && new Date(c.expires_at) >= new Date(start));

    if (end) list = list.filter((c) => c.expires_at && new Date(c.expires_at) <= new Date(end));

    return list;
  }, [searchedCodes, filters, productNamesById]);

  const allSelectedActive = useMemo(() => {
    return Array.from(selected).every((id) => codes.find((c) => c.id === Number(id))?.active);
  }, [selected, codes]);

  const handleClearAll = useCallback((): void => {
    setFilters({
      type: [],
      restrictions: [],
      dateRange: { start: null, end: null },
      status: [],
    });
  }, []);

  const handleCopyCode = useCallback(async (codeText: string) => {
    try {
      await navigator.clipboard.writeText(codeText);
      Alert.success(`Código "${codeText}" copiado!`);
    } catch {
      Alert.error("Erro ao copiar código");
    }
  }, []);

  const handleToggleSingleActive = useCallback(
    async (code: DiscountCode) => {
      try {
        const updated = await updateDiscountAction(code.id, { active: !code.active });
        setCodes((c) => c.map((x) => (x.id === code.id ? updated : x)));
        Alert.success(
          dict.toast_updated.replace(
            "{status}",
            !code.active ? dict.toast_activated : dict.toast_deactivated
          )
        );
      } catch {
        Alert.error("Erro ao atualizar estado do código");
      }
    },
    [dict]
  );

  const renderCodeMenuItems = useCallback(
    (code: DiscountCode) => (
      <>
        <DropdownMenu.Item
          icon={code.active ? <FiToggleLeft size={14} /> : <FiToggleRight size={14} />}
          onClick={() => handleToggleSingleActive(code)}>
          {code.active ? dict.deactivate : dict.activate}
        </DropdownMenu.Item>
        <DropdownMenu.Item icon={<FiCopy size={14} />} onClick={() => handleCopyCode(code.code)}>
          Copiar Código
        </DropdownMenu.Item>
        <DropdownMenu.Divider />
        <DropdownMenu.Item
          icon={<FiTrash2 size={14} />}
          destructive={true}
          onClick={() => setCodeToDelete(code)}>
          {dict.delete}
        </DropdownMenu.Item>
      </>
    ),
    [dict, handleToggleSingleActive, handleCopyCode]
  );

  const confirmDelete = async () => {
    setIsBulkProcessing(true);
    try {
      if (codeToDelete) {
        await deleteDiscountAction(codeToDelete.id);
        setCodes((c) => c.filter((x) => x.id !== codeToDelete.id));
        setSelected((s) => {
          const next = new Set(s);
          next.delete(String(codeToDelete.id));
          return next;
        });
        Alert.success(dict.toast_deleted);
        setCodeToDelete(null);
      } else if (isConfirmingBulkDelete) {
        let failures = 0;
        const selectedIds = Array.from(selected).map(Number);

        for (const id of selectedIds) {
          try {
            await deleteDiscountAction(id);
            setCodes((c) => c.filter((x) => x.id !== id));
          } catch {
            failures++;
          }
        }

        if (failures === 0) {
          Alert.success(dict.toast_deleted);
        } else {
          Alert.error(dict.toast_error.replace("{count}", String(failures)));
        }
        setSelected(new Set());
        setIsConfirmingBulkDelete(false);
      }
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const bulkUpdate = async (active: boolean) => {
    setIsBulkProcessing(true);
    let failures = 0;
    const selectedIds = Array.from(selected).map(Number);

    for (const id of selectedIds) {
      try {
        const updated = await updateDiscountAction(id, { active });
        setCodes((c) => c.map((x) => (x.id === id ? updated : x)));
      } catch {
        failures++;
      }
    }

    if (failures === 0) {
      Alert.success(
        dict.toast_updated.replace(
          "{status}",
          active ? dict.toast_activated : dict.toast_deactivated
        )
      );
    } else {
      Alert.error(dict.toast_error.replace("{count}", String(failures)));
    }
    setSelected(new Set());
    setIsBulkProcessing(false);
  };

  const columns = useMemo<ColumnDef<DiscountCode>[]>(
    () => [
      {
        id: "code",
        header: dict.col_code,
        isCardHeader: true,
        dataLabel: dict.col_code,
        cell: (code) => <strong>{code.code}</strong>,
      },
      {
        id: "users",
        header: dict.col_user,
        dataLabel: dict.col_user,
        cell: (code) => formatUsers(code, usersByIstid, dict),
      },
      {
        id: "type",
        header: dict.col_type,
        dataLabel: dict.col_type,
        hasFilter: true,
        onFilterClick: (_e, ref) => {
          typeFilterRef.current = ref.current;
          setTypeFilterOpen((prev) => !prev);
        },
        cell: (code) =>
          code.discount_type === "percentage" ? dict.type_percentage : dict.type_fixed,
      },
      {
        id: "value",
        header: dict.col_value,
        dataLabel: dict.col_value,
        cell: (code) =>
          code.discount_type === "percentage"
            ? `${code.discount_value}%`
            : `€${code.discount_value.toFixed(2)}`,
      },
      {
        id: "uses",
        header: dict.col_uses,
        dataLabel: dict.col_uses,
        cell: (code) => `${code.current_uses}${code.max_uses != null ? ` / ${code.max_uses}` : ""}`,
      },
      {
        id: "restrictions",
        header: dict.col_restrictions,
        dataLabel: dict.col_restrictions,
        hasFilter: true,
        onFilterClick: (_e, ref) => {
          restrictionsFilterRef.current = ref.current;
          setRestrictionsFilterOpen((prev) => !prev);
        },
        cell: (code) => formatProducts(code, productNamesById, dict),
      },
      {
        id: "expires",
        header: dict.col_expires,
        dataLabel: dict.col_expires,
        hasFilter: true,
        onFilterClick: (_e, ref) => {
          dateFilterRef.current = ref.current;
          setDateFilterOpen((prev) => !prev);
        },
        cell: (code) =>
          code.expires_at ? new Date(code.expires_at).toLocaleString("pt-PT") : dict.no_limit,
      },
      {
        id: "status",
        header: dict.col_status,
        dataLabel: dict.col_status,
        hasFilter: true,
        onFilterClick: (_e, ref) => {
          statusFilterRef.current = ref.current;
          setStatusFilterOpen((prev) => !prev);
        },
        cell: (code) => {
          const status = getStatus(code, dict);
          return <Badge variant={status.variant}>{status.label}</Badge>;
        },
      },
    ],
    [dict, usersByIstid, productNamesById]
  );

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <ColorfulText as="h1" className={styles.title} text={dict.title} />
        <div className={styles.headerActions}>
          <Button
            variant="primary"
            onClick={() => router.push(`${basePath || ""}/shop/manage/discounts/new`)}>
            <FiPlus className={styles.btnIcon} /> {dict.new_code}
          </Button>
        </div>
      </header>

      <div className={styles.listControls}>
        <div className={styles.searchWrapper}>
          <SearchInput
            placeholder={dict.search_placeholder}
            value={search}
            onChange={setSearch}
            action={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileFilters(true)}
                title="Filtros"
                aria-label="Filtros">
                <TbFilter size={18} />
              </Button>
            }
          />
        </div>
      </div>

      <div className={styles.desktopOnly}>
        <TableActiveFilters
          dateRange={filters.dateRange}
          onRemoveDateRange={() =>
            setFilters((p) => ({ ...p, dateRange: { start: null, end: null } }))
          }
          filterGroups={[
            {
              id: "type",
              label: dict.col_type,
              values: filters.type,
              getDisplayValue: (t) => (t === "percentage" ? dict.type_percentage : dict.type_fixed),
            },
            {
              id: "restrictions",
              label: dict.col_restrictions,
              values: filters.restrictions,
            },
            {
              id: "status",
              label: dict.col_status,
              values: filters.status,
              getDisplayValue: (s) => {
                switch (s) {
                  case "active":
                    return dict.status_active;
                  case "inactive":
                    return dict.status_inactive;
                  case "expired":
                    return dict.status_expired;
                  case "exhausted":
                    return dict.status_exhausted;
                  default:
                    return s;
                }
              },
            },
          ]}
          onRemoveValue={(groupId, value) => {
            setFilters((prev) => ({
              ...prev,
              [groupId]: (prev[groupId as keyof FilterState] as string[]).filter(
                (x) => x !== value
              ),
            }));
          }}
          onClearAll={handleClearAll}
          clearLabel="Limpar filtros"
        />
      </div>

      {selected.size > 0 && (
        <TableSelectionBar
          count={selected.size}
          label={`${selected.size !== 1 ? dict.selected_plural : dict.selected_singular}`}
          onClear={() => setSelected(new Set())}
          clearLabel="Limpar">
          <Button
            size="sm"
            variant="solid"
            color="primary"
            disabled={isBulkProcessing}
            onClick={() => bulkUpdate(!allSelectedActive)}>
            {allSelectedActive ? (
              <>
                <FiToggleLeft className={styles.btnIcon} /> {dict.deactivate}
              </>
            ) : (
              <>
                <FiToggleRight className={styles.btnIcon} /> {dict.activate}
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="solid"
            color="danger"
            disabled={isBulkProcessing}
            onClick={() => setIsConfirmingBulkDelete(true)}>
            <FiTrash2 className={styles.btnIcon} /> {dict.delete}
          </Button>
        </TableSelectionBar>
      )}

      <div className={styles.tableWrap}>
        <DataTable
          data={filteredCodes}
          columns={columns}
          getRowId={(code) => String(code.id)}
          enableRowSelection={true}
          selectedRowIds={selected}
          onSelectionChange={setSelected}
          onRowClick={(code) => handleCopyCode(code.code)}
          rowActions={renderCodeMenuItems}
          actionsTitle={dict.actions_title}
          emptyMessage={dict.empty}
          responsive="cards"
        />
      </div>

      <TableFilterMultiSelect
        isOpen={typeFilterOpen}
        onClose={() => setTypeFilterOpen(false)}
        options={["percentage", "fixed"]}
        selected={filters.type}
        onChange={(type) => setFilters((p) => ({ ...p, type }))}
        buttonRef={typeFilterRef}
        title={dict.col_type}
        getLabel={(t) => (t === "percentage" ? dict.type_percentage : dict.type_fixed)}
        clearLabel="Limpar"
        applyLabel="Aplicar"
      />

      <TableFilterMultiSelect
        isOpen={restrictionsFilterOpen}
        onClose={() => setRestrictionsFilterOpen(false)}
        options={availableProductOptions}
        selected={filters.restrictions}
        onChange={(restrictions) => setFilters((p) => ({ ...p, restrictions }))}
        buttonRef={restrictionsFilterRef}
        title={dict.col_restrictions}
        clearLabel="Limpar"
        applyLabel="Aplicar"
      />

      <TableFilterDate
        isOpen={dateFilterOpen}
        onClose={() => setDateFilterOpen(false)}
        dateRange={filters.dateRange}
        onChange={(range) => setFilters((p) => ({ ...p, dateRange: range }))}
        buttonRef={dateFilterRef}
        titleLabel={dict.col_expires}
        untilDateLabel="Até"
        rangeLabel="Intervalo"
        clearLabel="Limpar"
        applyLabel="Aplicar"
        drawerTitle={dict.col_expires}
        locale={pt}
      />

      <TableFilterMultiSelect
        isOpen={statusFilterOpen}
        onClose={() => setStatusFilterOpen(false)}
        options={["active", "inactive", "expired", "exhausted"]}
        selected={filters.status}
        onChange={(status) => setFilters((p) => ({ ...p, status }))}
        buttonRef={statusFilterRef}
        title={dict.col_status}
        getLabel={(s) => {
          switch (s) {
            case "active":
              return dict.status_active;
            case "inactive":
              return dict.status_inactive;
            case "expired":
              return dict.status_expired;
            case "exhausted":
              return dict.status_exhausted;
            default:
              return s;
          }
        }}
        clearLabel="Limpar"
        applyLabel="Aplicar"
      />

      <TableFiltersDrawer
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        title="Filtros"
        closeAriaLabel="Fechar filtros"
        dateRange={filters.dateRange}
        dateFilterTitle={dict.col_expires}
        untilDateLabel="Até"
        rangeLabel="Intervalo"
        clearLabel="Limpar"
        applyLabel="Aplicar"
        locale={pt}
        categories={[
          {
            id: "type",
            title: dict.col_type,
            options: [
              { label: dict.type_percentage, value: "percentage" },
              { label: dict.type_fixed, value: "fixed" },
            ],
            selected: filters.type,
          },
          {
            id: "restrictions",
            title: dict.col_restrictions,
            options: availableProductOptions.map((name) => ({ label: name, value: name })),
            selected: filters.restrictions,
          },
          {
            id: "status",
            title: dict.col_status,
            options: [
              { label: dict.status_active, value: "active" },
              { label: dict.status_inactive, value: "inactive" },
              { label: dict.status_expired, value: "expired" },
              { label: dict.status_exhausted, value: "exhausted" },
            ],
            selected: filters.status,
          },
        ]}
        onApply={({ dateRange, categories }) => {
          setFilters({
            dateRange,
            type: categories["type"] || [],
            restrictions: categories["restrictions"] || [],
            status: categories["status"] || [],
          });
          setShowMobileFilters(false);
        }}
      />

      <ConfirmDialog
        open={Boolean(codeToDelete || isConfirmingBulkDelete)}
        title={dict.delete}
        message={
          codeToDelete
            ? `Eliminar o código "${codeToDelete.code}"? Tem a certeza?`
            : dict.delete_confirm.replace("{count}", String(selected.size))
        }
        confirmLabel={dict.delete}
        cancelLabel={dict.cancel}
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => {
          setCodeToDelete(null);
          setIsConfirmingBulkDelete(false);
        }}
      />
    </main>
  );
}
