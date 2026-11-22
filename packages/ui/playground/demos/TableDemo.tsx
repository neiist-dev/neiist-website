import React, { useMemo, useState } from "react";
import { DemoCard } from "../components/DemoCard";
import { PageHeader } from "../components/PageHeader";
import {
  DataTable,
  ColumnDef,
  TableFilterDate,
  TableFilterMultiSelect,
  TableFilterCascade,
  CascadeFilterOption,
  getCascadeLeafIds,
  TableFiltersDrawer,
  TableToolbar,
  DropdownMenu,
  Badge,
  Stack,
  Button,
} from "@neiist/ui";
import { FiChevronDown, FiEdit2, FiEye, FiFilter, FiMail, FiTrash2 } from "react-icons/fi";
import { pt } from "date-fns/locale";
import styles from "./TableDemo.module.css";

interface DemoRow {
  id: string;
  name: string;
  email: string;
  role: string;
  product: string;
  productId: string;
  date: string;
  campus: string;
  total: number;
  lastActive: string;
  status: "active" | "pending" | "cancelled";
}

const PRODUCT_OPTIONS: CascadeFilterOption[] = [
  {
    id: "jantar-curso",
    label: "Jantar de Curso",
    price: 0,
    levelLabel: "PRATO",
    children: [
      { id: "jantar-carne", label: "Carne" },
      { id: "jantar-peixe", label: "Peixe" },
      { id: "jantar-veggie", label: "Veggie" },
    ],
  },
  {
    id: "jantar-externos",
    label: "Jantar de Curso - Externos",
    price: 20,
    levelLabel: "PRATO",
    children: [
      { id: "externos-carne", label: "Carne" },
      { id: "externos-peixe", label: "Peixe" },
      { id: "externos-veggie", label: "Veggie" },
    ],
  },
  {
    id: "sweat-curso",
    label: "Sweat de Curso",
    price: 23,
    levelLabel: "TAMANHO",
    children: [
      { id: "sweat-s", label: "Tamanho S" },
      { id: "sweat-m", label: "Tamanho M" },
      { id: "sweat-l", label: "Tamanho L" },
    ],
  },
  {
    id: "sweat-especial-2026",
    label: "Sweat Especial 2026",
    price: 25,
    levelLabel: "TAMANHO",
    children: [
      { id: "sweat26-s", label: "Tamanho S" },
      { id: "sweat26-m", label: "Tamanho M" },
      { id: "sweat26-l", label: "Tamanho L" },
    ],
  },
];

const CAMPUS_OPTIONS = ["Alameda", "Taguspark"];

const STATUS_OPTIONS = [
  { label: "Ativo", value: "active" },
  { label: "Pendente", value: "pending" },
  { label: "Cancelado", value: "cancelled" },
];

const STATUS_VARIANTS: Record<DemoRow["status"], "primary" | "secondary" | "danger"> = {
  active: "primary",
  pending: "secondary",
  cancelled: "danger",
};

const ROWS: DemoRow[] = [
  {
    id: "1024",
    name: "Alice Smith",
    email: "alice.smith@tecnico.ulisboa.pt",
    role: "Presidente",
    product: "Jantar de Curso (Carne)",
    productId: "jantar-carne",
    date: "2026-05-18",
    campus: "Alameda",
    total: 45,
    lastActive: "Há 1 hora",
    status: "active",
  },
  {
    id: "1025",
    name: "Bob Jones",
    email: "bob.jones@tecnico.ulisboa.pt",
    role: "Coordenador",
    product: "Jantar de Curso - Externos (Peixe)",
    productId: "externos-peixe",
    date: "2026-05-19",
    campus: "Taguspark",
    total: 12.5,
    lastActive: "Ontem",
    status: "pending",
  },
  {
    id: "1026",
    name: "Charlie Brown",
    email: "charlie.b@tecnico.ulisboa.pt",
    role: "Colaborador",
    product: "Sweat de Curso (Tamanho M)",
    productId: "sweat-m",
    date: "2026-05-20",
    campus: "Alameda",
    total: 80,
    lastActive: "Há 3 dias",
    status: "cancelled",
  },
  {
    id: "1027",
    name: "Diana Prince",
    email: "diana.prince@tecnico.ulisboa.pt",
    role: "Sócio Efetivo",
    product: "Sweat Especial 2026 (Tamanho S)",
    productId: "sweat26-s",
    date: "2026-05-21",
    campus: "Taguspark",
    total: 0,
    lastActive: "15 Mai 2026",
    status: "active",
  },
];

const COLUMN_PRESETS = [
  {
    label: "Todas as 10 Colunas",
    columns: [
      "id",
      "name",
      "email",
      "role",
      "product",
      "date",
      "campus",
      "total",
      "lastActive",
      "status",
    ],
  },
  { label: "Visão Compacta", columns: ["id", "name", "product", "status"] },
  { label: "Estado & Membro", columns: ["id", "name", "role", "campus", "status"] },
];

type ActivePopover = {
  type: "date" | "campus" | "product";
  ref: React.RefObject<HTMLButtonElement | null>;
} | null;

export const TableDemo = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePopover, setActivePopover] = useState<ActivePopover>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>(() => ({
    start: null,
    end: new Date(2026, 8, 4),
  }));
  const [selectedCampus, setSelectedCampus] = useState<string[]>(["Alameda"]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(() => new Set(["1024"]));
  const [columnOrder, setColumnOrder] = useState<string[]>(COLUMN_PRESETS[0].columns);
  const [sortField, setSortField] = useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const productFilterSummaries = useMemo(
    () =>
      PRODUCT_OPTIONS.flatMap((product) => {
        const leafIds = getCascadeLeafIds(product);
        if (leafIds.every((id) => selectedProducts.includes(id)))
          return [{ id: product.id, label: product.label, leafIds }];

        return (product.children ?? [])
          .filter((child) => selectedProducts.includes(child.id))
          .map((child) => ({
            id: child.id,
            label: `${product.label} (${child.label})`,
            leafIds: [child.id],
          }));
      }),
    [selectedProducts]
  );

  const visibleRows = useMemo(() => {
    const filtered = ROWS.filter((row) => {
      if (selectedCampus.length && !selectedCampus.includes(row.campus)) return false;
      if (selectedStatus.length && !selectedStatus.includes(row.status)) return false;
      if (selectedProducts.length && !selectedProducts.includes(row.productId)) return false;
      const rowDate = new Date(row.date);
      if (dateRange.start && rowDate < dateRange.start) return false;
      return !(dateRange.end && rowDate > dateRange.end);
    });

    if (!sortField) return filtered;

    return [...filtered].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      if (sortField === "total") return (a.total - b.total) * dir;
      if (sortField === "name") return a.name.localeCompare(b.name) * dir;
      if (sortField === "date") return a.date.localeCompare(b.date) * dir;
      return 0;
    });
  }, [selectedCampus, selectedStatus, selectedProducts, dateRange, sortField, sortDirection]);

  const activeFiltersCount =
    (dateRange.start || dateRange.end ? 1 : 0) +
    selectedCampus.length +
    selectedStatus.length +
    productFilterSummaries.length;

  const columns: ColumnDef<DemoRow>[] = [
    { id: "id", header: "ID", minWidth: 90, cell: (row) => <strong>#{row.id}</strong> },
    { id: "name", header: "Nome", minWidth: 150, sortable: true, cell: (row) => row.name },
    {
      id: "email",
      header: "Email",
      minWidth: 220,
      cell: (row) => <span className={styles.subtleCell}>{row.email}</span>,
    },
    {
      id: "role",
      header: "Função",
      minWidth: 140,
      cell: (row) => (
        <Badge variant={row.role === "Presidente" ? "primary" : "secondary"}>{row.role}</Badge>
      ),
    },
    {
      id: "product",
      header: "Produtos",
      minWidth: 200,
      hasFilter: true,
      onFilterClick: (_e, ref) => setActivePopover({ type: "product", ref }),
      cell: (row) => row.product,
    },
    {
      id: "date",
      header: "Data",
      minWidth: 130,
      sortable: true,
      hasFilter: true,
      onFilterClick: (_e, ref) => setActivePopover({ type: "date", ref }),
      cell: (row) => row.date,
    },
    {
      id: "campus",
      header: "Campus",
      minWidth: 130,
      hasFilter: true,
      onFilterClick: (_e, ref) => setActivePopover({ type: "campus", ref }),
      cell: (row) => row.campus,
    },
    {
      id: "total",
      header: "Total",
      minWidth: 100,
      sortable: true,
      align: "end",
      cell: (row) => <strong>{row.total.toFixed(2)} €</strong>,
    },
    {
      id: "lastActive",
      header: "Última Atividade",
      minWidth: 140,
      cell: (row) => <span className={styles.subtleCell}>{row.lastActive}</span>,
    },
    {
      id: "status",
      header: "Estado",
      minWidth: 120,
      cell: (row) => <Badge variant={STATUS_VARIANTS[row.status]}>{row.status}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        title="DataTable"
        description="Responsive multi-column data table with sorting, selection, unified toolbar, row actions, and modular filters."
      />

      <DemoCard
        title="Interactive DataTable"
        description="Try sorting columns, toggling column presets, selecting rows, right-clicking a row, or adding 3+ filters to see toolbar collapse.">
        <Stack gap="md" direction="column">
          <div className={styles.controlsHeader}>
            <Stack gap="sm" direction="row" wrap>
              {COLUMN_PRESETS.map((preset) => {
                const isActive = columnOrder.length === preset.columns.length;
                return (
                  <Button
                    key={preset.label}
                    size="sm"
                    variant={isActive ? "solid" : "outline"}
                    onClick={() => setColumnOrder(preset.columns)}>
                    {preset.label}
                  </Button>
                );
              })}
            </Stack>

            <Button
              size="sm"
              variant={activeFiltersCount > 0 ? "solid" : "outline"}
              color="primary"
              onClick={() => setDrawerOpen(true)}>
              <FiFilter size={14} />
              Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ""}
            </Button>
          </div>

          <TableToolbar
            filters={{
              dateFilter: {
                ...dateRange,
                locale: "pt-PT",
                fromPrefix: "Desde",
                untilPrefix: "Até",
                onRemove: () => setDateRange({ start: null, end: null }),
              },
              filterGroups: [
                { id: "campus", label: "Campus", values: selectedCampus },
                {
                  id: "status",
                  label: "Estado",
                  values: selectedStatus,
                  getDisplayValue: (val) =>
                    STATUS_OPTIONS.find((s) => s.value === val)?.label || val,
                },
              ],
              customTags: productFilterSummaries.map((item) => ({
                id: item.id,
                label: item.label,
                onRemove: () =>
                  setSelectedProducts((prev) => prev.filter((id) => !item.leafIds.includes(id))),
              })),
              onRemoveValue: (groupId, value) => {
                if (groupId === "campus") {
                  setSelectedCampus((prev) => prev.filter((v) => v !== value));
                } else if (groupId === "status") {
                  setSelectedStatus((prev) => prev.filter((v) => v !== value));
                }
              },
              onClearAll: () => {
                setDateRange({ start: null, end: null });
                setSelectedCampus([]);
                setSelectedStatus([]);
                setSelectedProducts([]);
              },
              label: "Filtros:",
              clearLabel: "Limpar tudo",
              collapsedLabel: (count) => `${count} filtros`,
            }}
            selection={{
              count: selectedRowIds.size,
              label: selectedRowIds.size === 1 ? "linha selecionada" : "linhas selecionadas",
              onClear: () => setSelectedRowIds(new Set()),
              clearLabel: "Limpar",
              actions: (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    color="primary"
                    onClick={() => setSelectedRowIds(new Set())}>
                    <FiMail size={14} /> Enviar Email
                  </Button>
                  <DropdownMenu align="end">
                    <DropdownMenu.Trigger>
                      <Button size="sm" variant="solid" color="primary">
                        Alterar Estado <FiChevronDown size={14} />
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end" mobileTitle="Alterar Estado">
                      <DropdownMenu.Item onClick={() => setSelectedRowIds(new Set())}>
                        Marcar como Ativo
                      </DropdownMenu.Item>
                      <DropdownMenu.Item onClick={() => setSelectedRowIds(new Set())}>
                        Marcar como Pendente
                      </DropdownMenu.Item>
                      <DropdownMenu.Divider />
                      <DropdownMenu.Item
                        destructive
                        icon={<FiTrash2 size={14} />}
                        onClick={() => setSelectedRowIds(new Set())}>
                        Cancelar
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu>
                </>
              ),
            }}
          />

          <DataTable
            data={visibleRows}
            columns={columns}
            columnOrder={columnOrder}
            enableRowSelection
            selectedRowIds={selectedRowIds}
            onSelectionChange={setSelectedRowIds}
            getRowId={(row) => row.id}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={(field, direction) => {
              setSortField(field);
              setSortDirection(direction);
            }}
            actionsTitle="Ações"
            rowActions={() => (
              <>
                <DropdownMenu.Item icon={<FiEye size={14} />}>Ver detalhes</DropdownMenu.Item>
                <DropdownMenu.Item icon={<FiEdit2 size={14} />}>Editar</DropdownMenu.Item>
                <DropdownMenu.Divider />
                <DropdownMenu.Item destructive icon={<FiTrash2 size={14} />}>
                  Eliminar
                </DropdownMenu.Item>
              </>
            )}
            emptyMessage="Nenhum resultado encontrado para os filtros atuais."
          />
        </Stack>

        <TableFiltersDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Filtros"
          closeAriaLabel="Fechar filtros"
          clearLabel="Limpar Tudo"
          applyLabel="Aplicar"
          locale={pt}
          dateRange={dateRange}
          dateFilterTitle="Data"
          untilDateLabel="Até data"
          rangeLabel="Intervalo"
          categories={[
            {
              id: "product",
              title: "Produtos",
              cascadeOptions: PRODUCT_OPTIONS,
              selected: selectedProducts,
            },
            { id: "campus", title: "Campus", options: CAMPUS_OPTIONS, selected: selectedCampus },
            { id: "status", title: "Estado", options: STATUS_OPTIONS, selected: selectedStatus },
          ]}
          onApply={({ dateRange: nextRange, categories }) => {
            setDateRange(nextRange);
            setSelectedProducts(categories.product || []);
            setSelectedCampus(categories.campus || []);
            setSelectedStatus(categories.status || []);
          }}
        />

        {activePopover?.type === "date" && (
          <TableFilterDate
            isOpen
            onClose={() => setActivePopover(null)}
            dateRange={dateRange}
            onChange={setDateRange}
            buttonRef={activePopover.ref}
            locale={pt}
            titleLabel="Data"
            untilDateLabel="Até data"
            rangeLabel="Intervalo"
            clearLabel="Limpar"
            applyLabel="Aplicar"
            drawerTitle="Filtrar por Data"
          />
        )}

        {activePopover?.type === "product" && (
          <TableFilterCascade
            isOpen
            onClose={() => setActivePopover(null)}
            title="Produtos"
            options={PRODUCT_OPTIONS}
            selected={selectedProducts}
            onChange={setSelectedProducts}
            buttonRef={activePopover.ref}
          />
        )}

        {activePopover?.type === "campus" && (
          <TableFilterMultiSelect
            isOpen
            onClose={() => setActivePopover(null)}
            options={CAMPUS_OPTIONS}
            selected={selectedCampus}
            onChange={setSelectedCampus}
            buttonRef={activePopover.ref}
            title="Campus"
            clearLabel="Limpar Tudo"
            applyLabel="Aplicar"
          />
        )}
      </DemoCard>
    </>
  );
};
