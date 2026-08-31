import * as XLSX from "xlsx";
import { Order } from "@/types/shop/order";
import { getColorFromOptions, formatVariantSimple } from "@/utils/shop/shopUtils";
import { getOrderKindFromItems, getOrderStatusLabelForKind } from "@/utils/shop/orderKindUtils";

function sortByMultipleFields<T>(a: T, b: T, ...fields: (keyof T)[]): number {
  for (const field of fields) {
    const aValue = String(a[field]);
    const bValue = String(b[field]);
    const orderComparison = aValue.localeCompare(bValue);
    if (orderComparison !== 0) return orderComparison;
  }
  return 0;
}

export function exportOrdersToExcel(orders: Order[]): void {
  const ordersSheet = orders.map((o) => ({
    Estado: getOrderStatusLabelForKind(getOrderKindFromItems(o.items).orderKind, o.status, o),
    Número: o.order_number,
    Data: new Date(o.created_at).toLocaleString("pt-PT"),
    Nome: o.customer_name,
    Email: o.customer_email,
    NIF: o.customer_nif || "",
    "IST ID": o.user_istid,
    Campus: o.campus,
    Telefone: o.customer_phone,
    "Método de pagamento": o.payment_method,
    "Referencia de Pagamento": o.payment_reference,
    "Total (€)": o.total_amount,
    Notas: o.notes || "",
    "Ultima modificação por": o.updated_by,
    Produtos: o.items
      .map((it) => `${it.product_name} ${it.variant_label || ""} x${it.quantity}`)
      .join("; "),
  }));

  const statsMapDetalhes: Record<
    string,
    { modelo: string; cor: string; tamanho: string; quantidade: number }
  > = {};
  const statsMapCampusInventory: Record<
    string,
    {
      campus: string;
      modelo: string;
      cor: string;
      tamanho: string;
      quantidade: number;
    }
  > = {};
  const statsMapCampusDate: Record<
    string,
    {
      campus: string;
      modelo: string;
      data: string;
      cor: string;
      tamanho: string;
      quantidade: number;
    }
  > = {};

  orders.forEach((order) =>
    order.items.forEach((item) => {
      const modelo = item.product_name;
      const colorInfo = getColorFromOptions(item.variant_options, item.variant_label);
      const cor = colorInfo.name || "";
      const tamanho =
        formatVariantSimple(item.variant_options ?? undefined, item.variant_label ?? undefined)
          .text || "";
      const key = `${modelo}|||${cor}|||${tamanho}`;
      if (!statsMapDetalhes[key]) {
        statsMapDetalhes[key] = { modelo, cor, tamanho, quantidade: 0 };
      }
      statsMapDetalhes[key].quantidade += item.quantity;
      const campus = order.campus || "Unknown";
      const ciKey = `${campus}|||${modelo}|||${cor}|||${tamanho}`;
      if (!statsMapCampusInventory[ciKey]) {
        statsMapCampusInventory[ciKey] = {
          campus,
          modelo,
          cor,
          tamanho,
          quantidade: 0,
        };
      }
      statsMapCampusInventory[ciKey].quantidade += item.quantity;
      const dateStr = new Date(order.created_at).toISOString().slice(0, 10);
      const cdKey = `${campus}|||${modelo}|||${dateStr}|||${cor}|||${tamanho}`;
      if (!statsMapCampusDate[cdKey]) {
        statsMapCampusDate[cdKey] = {
          campus,
          modelo,
          data: dateStr,
          cor,
          tamanho,
          quantidade: 0,
        };
      }
      statsMapCampusDate[cdKey].quantidade += item.quantity;
    })
  );

  const statsSheet = Object.values(statsMapDetalhes)
    .sort((a, b) => sortByMultipleFields(a, b, "modelo", "cor", "tamanho"))
    .map((itemData) => ({
      Modelo: itemData.modelo,
      Cor: itemData.cor,
      Tamanho: itemData.tamanho,
      Quantidade: itemData.quantidade,
    }));

  const statsCampusInventorySheet = Object.values(statsMapCampusInventory)
    .sort((a, b) => sortByMultipleFields(a, b, "campus", "modelo", "cor", "tamanho"))
    .map((itemData) => ({
      Campus: itemData.campus,
      Modelo: itemData.modelo,
      Cor: itemData.cor,
      Tamanho: itemData.tamanho,
      Quantidade: itemData.quantidade,
    }));

  const statsCampusDateSheet = Object.values(statsMapCampusDate)
    .sort((a, b) => sortByMultipleFields(a, b, "campus", "modelo", "data", "cor", "tamanho"))
    .map((itemData) => ({
      Campus: itemData.campus,
      Modelo: itemData.modelo,
      Data: itemData.data,
      Cor: itemData.cor,
      Tamanho: itemData.tamanho,
      Quantidade: itemData.quantidade,
    }));

  const excelWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(excelWorkbook, XLSX.utils.json_to_sheet(ordersSheet), "Encomendas");
  XLSX.utils.book_append_sheet(excelWorkbook, XLSX.utils.json_to_sheet(statsSheet), "Detalhes");
  XLSX.utils.book_append_sheet(
    excelWorkbook,
    XLSX.utils.json_to_sheet(statsCampusInventorySheet),
    "InventarioPorCampus"
  );
  XLSX.utils.book_append_sheet(
    excelWorkbook,
    XLSX.utils.json_to_sheet(statsCampusDateSheet),
    "InventarioPorCampusPorDia"
  );
  XLSX.writeFile(excelWorkbook, `encomendas_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
