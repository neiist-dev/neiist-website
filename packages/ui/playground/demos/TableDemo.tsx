import React, { useState } from "react";
import { DemoCard } from "../components/DemoCard";
import {
  DataTable,
  ColumnDef,
  TableFilterDate,
  TableFilterMultiSelect,
  TableFilterCascade,
  CascadeFilterOption,
  TableFiltersDrawer,
  TableActiveFilters,
  Badge,
  Stack,
  Button,
  Heading,
} from "@neiist/ui";
import { FiFilter } from "react-icons/fi";
import { pt } from "date-fns/locale";
import styles from "./TableDemo.module.css";

interface DemoRow {
  id: string;
  name: string;
  email: string;
  role: string;
  product: string;
  date: string;
  campus: string;
  total: string;
  lastActive: string;
  status: "active" | "pending" | "cancelled";
}

const productCascadeOptions: CascadeFilterOption[] = [
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

export const TableDemo = () => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [multiFilterOpen, setMultiFilterOpen] = useState(false);
  const [cascadeFilterOpen, setCascadeFilterOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: new Date(2026, 8, 4),
  });
  const [selectedCampus, setSelectedCampus] = useState<string[]>(["Alameda"]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Custom Column Ordering state
  const [columnOrder, setColumnOrder] = useState<string[]>([
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
  ]);

  const campusOptions = ["Alameda", "Taguspark"];
  const statusOptions = [
    { label: "Ativo", value: "active" },
    { label: "Pendente", value: "pending" },
    { label: "Cancelado", value: "cancelled" },
  ];

  // Desktop column filter button anchors
  const [dateBtnRef, setDateBtnRef] = useState<React.RefObject<HTMLButtonElement | null> | null>(
    null
  );
  const [campusBtnRef, setCampusBtnRef] =
    useState<React.RefObject<HTMLButtonElement | null> | null>(null);
  const [cascadeBtnRef, setCascadeBtnRef] =
    useState<React.RefObject<HTMLButtonElement | null> | null>(null);

  const data: DemoRow[] = [
    {
      id: "1024",
      name: "Alice Smith",
      email: "alice.smith@tecnico.ulisboa.pt",
      role: "Presidente",
      product: "Jantar de Curso (Carne)",
      date: "2026-05-18",
      campus: "Alameda",
      total: "45.00 €",
      lastActive: "Há 1 hora",
      status: "active",
    },
    {
      id: "1025",
      name: "Bob Jones",
      email: "bob.jones@tecnico.ulisboa.pt",
      role: "Coordenador",
      product: "Jantar de Curso - Externos (Peixe)",
      date: "2026-05-19",
      campus: "Taguspark",
      total: "12.50 €",
      lastActive: "Ontem",
      status: "pending",
    },
    {
      id: "1026",
      name: "Charlie Brown",
      email: "charlie.b@tecnico.ulisboa.pt",
      role: "Colaborador",
      product: "Sweat de Curso (Tamanho M)",
      date: "2026-05-20",
      campus: "Alameda",
      total: "80.00 €",
      lastActive: "Há 3 dias",
      status: "cancelled",
    },
    {
      id: "1027",
      name: "Diana Prince",
      email: "diana.prince@tecnico.ulisboa.pt",
      role: "Sócio Efetivo",
      product: "Sweat Especial 2026 (Tamanho S)",
      date: "2026-05-21",
      campus: "Taguspark",
      total: "0.00 €",
      lastActive: "15 Mai 2026",
      status: "active",
    },
  ];

  const columns: ColumnDef<DemoRow>[] = [
    {
      id: "id",
      header: "ID",
      minWidth: 90,
      cell: (row: DemoRow) => <strong>#{row.id}</strong>,
    },
    {
      id: "name",
      header: "Nome",
      minWidth: 150,
      cell: (row: DemoRow) => row.name,
    },
    {
      id: "email",
      header: "Email",
      minWidth: 220,
      cell: (row: DemoRow) => <span className={styles.subtleCell}>{row.email}</span>,
    },
    {
      id: "role",
      header: "Função",
      minWidth: 140,
      cell: (row: DemoRow) => (
        <Badge variant={row.role === "Presidente" ? "primary" : "secondary"}>{row.role}</Badge>
      ),
    },
    {
      id: "product",
      header: "Produtos",
      hasFilter: true,
      minWidth: 200,
      onFilterClick: (_event, ref) => {
        setCascadeBtnRef(ref);
        setCascadeFilterOpen(true);
      },
      cell: (row: DemoRow) => <span className={styles.productCell}>{row.product}</span>,
    },
    {
      id: "date",
      header: "Data",
      hasFilter: true,
      minWidth: 130,
      onFilterClick: (_event, ref) => {
        setDateBtnRef(ref);
        setDateFilterOpen(true);
      },
      cell: (row: DemoRow) => row.date,
    },
    {
      id: "campus",
      header: "Campus",
      hasFilter: true,
      minWidth: 130,
      onFilterClick: (_event, ref) => {
        setCampusBtnRef(ref);
        setMultiFilterOpen(true);
      },
      cell: (row: DemoRow) => row.campus,
    },
    {
      id: "total",
      header: "Total",
      minWidth: 100,
      cell: (row: DemoRow) => <strong>{row.total}</strong>,
    },
    {
      id: "lastActive",
      header: "Última Atividade",
      minWidth: 140,
      cell: (row: DemoRow) => <span className={styles.subtleCell}>{row.lastActive}</span>,
    },
    {
      id: "status",
      header: "Estado",
      minWidth: 120,
      cell: (row: DemoRow) => {
        const variants: Record<string, "primary" | "secondary" | "danger"> = {
          active: "primary",
          pending: "secondary",
          cancelled: "danger",
        };
        return <Badge variant={variants[row.status]}>{row.status}</Badge>;
      },
    },
  ];

  const columnViewPresets = [
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
    {
      label: "Visão Compacta",
      columns: ["id", "name", "product", "status"],
    },
    {
      label: "Estado & Membro",
      columns: ["id", "name", "role", "campus", "status"],
    },
  ] as const;

  // Handlers for reordering
  const reorderCols = (newOrder: string[]) => setColumnOrder(newOrder);

  const activeFiltersCount =
    (dateRange.start || dateRange.end ? 1 : 0) +
    selectedCampus.length +
    selectedStatus.length +
    selectedProducts.length;

  return (
    <>
      <DemoCard
        title="Highly Customizable DataTable"
        description="Responsive multi-column data table with selection, modular filters, and combined mobile drawer.">
        <Stack gap="md" direction="column">
          <div className={styles.controlsHeader}>
            <div>
              <Heading level={4} className={styles.controlsTitle}>
                Controlos & Filtros
              </Heading>
              <Stack gap="sm" direction="row" wrap>
                {columnViewPresets.map((preset) => (
                  <Button
                    key={preset.label}
                    size="sm"
                    variant="outline"
                    onClick={() => reorderCols([...preset.columns])}>
                    {preset.label}
                  </Button>
                ))}
              </Stack>
            </div>

            {/* Combined Mobile Filters Trigger Button */}
            <Button
              size="sm"
              variant={activeFiltersCount > 0 ? "solid" : "outline"}
              color="primary"
              onClick={() => setMobileFiltersOpen(true)}>
              <FiFilter className={styles.filterIcon} />
              Filtros
            </Button>
          </div>

          <div className={styles.selectedRowsSection}>
            <p className={styles.selectedRowsText}>
              Linhas selecionadas:{" "}
              {selectedRowIds.size > 0 ? Array.from(selectedRowIds).join(", ") : "Nenhuma"}
            </p>
          </div>

          <TableActiveFilters
            dateRange={dateRange}
            locale="pt-PT"
            onRemoveDateRange={() => setDateRange({ start: null, end: null })}
            filterGroups={[
              {
                id: "campus",
                label: "Campus",
                values: selectedCampus,
              },
              {
                id: "status",
                label: "Estado",
                values: selectedStatus,
                getDisplayValue: (val) => statusOptions.find((s) => s.value === val)?.label || val,
              },
              {
                id: "product",
                label: "Produtos",
                values: selectedProducts,
              },
            ]}
            onRemoveValue={(groupId, value) => {
              if (groupId === "campus") {
                setSelectedCampus((prev) => prev.filter((v) => v !== value));
              } else if (groupId === "status") {
                setSelectedStatus((prev) => prev.filter((v) => v !== value));
              } else if (groupId === "product") {
                setSelectedProducts((prev) => prev.filter((v) => v !== value));
              }
            }}
            onClearAll={() => {
              setDateRange({ start: null, end: null });
              setSelectedCampus([]);
              setSelectedStatus([]);
              setSelectedProducts([]);
            }}
          />

          <DataTable
            data={data}
            columns={columns}
            columnOrder={columnOrder}
            enableRowSelection={true}
            selectedRowIds={selectedRowIds}
            onSelectionChange={setSelectedRowIds}
            getRowId={(row: DemoRow) => row.id}
          />
        </Stack>

        {/* Combined Mobile Filters Drawer (Matches app's MobileFiltersDrawer) */}
        <TableFiltersDrawer
          isOpen={mobileFiltersOpen}
          onClose={() => setMobileFiltersOpen(false)}
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
              cascadeOptions: productCascadeOptions,
              selected: selectedProducts,
            },
            {
              id: "campus",
              title: "Campus",
              options: campusOptions,
              selected: selectedCampus,
            },
            {
              id: "status",
              title: "Estado",
              options: statusOptions,
              selected: selectedStatus,
            },
          ]}
          onApply={({ dateRange: newRange, categories }) => {
            setDateRange(newRange);
            setSelectedProducts(categories.product || []);
            setSelectedCampus(categories.campus || []);
            setSelectedStatus(categories.status || []);
          }}
        />

        {/* Desktop Single-Column Filter Anchors */}
        {dateFilterOpen && dateBtnRef && (
          <TableFilterDate
            isOpen={dateFilterOpen}
            onClose={() => setDateFilterOpen(false)}
            dateRange={dateRange}
            onChange={setDateRange}
            buttonRef={dateBtnRef}
            locale={pt}
            titleLabel="Data"
            untilDateLabel="Até data"
            rangeLabel="Intervalo"
            clearLabel="Limpar"
            applyLabel="Aplicar"
            drawerTitle="Filtrar por Data"
          />
        )}
        {cascadeFilterOpen && cascadeBtnRef && (
          <TableFilterCascade
            isOpen={cascadeFilterOpen}
            onClose={() => setCascadeFilterOpen(false)}
            title="Produtos"
            options={productCascadeOptions}
            selected={selectedProducts}
            onChange={setSelectedProducts}
            buttonRef={cascadeBtnRef}
          />
        )}
        {multiFilterOpen && campusBtnRef && (
          <TableFilterMultiSelect
            isOpen={multiFilterOpen}
            onClose={() => setMultiFilterOpen(false)}
            options={campusOptions}
            selected={selectedCampus}
            onChange={setSelectedCampus}
            buttonRef={campusBtnRef}
            title="Campus"
            clearLabel="Limpar Tudo"
            applyLabel="Aplicar"
          />
        )}
      </DemoCard>
    </>
  );
};
