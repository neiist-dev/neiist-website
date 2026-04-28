import OrdersTable from "@/components/shop/OrdersTable";
import OrderDetailOverlay from "@/components/shop/OrderDetailsOverlay";
import { getAllOrders, getAllProducts } from "@/utils/dbUtils";
import { serverCheckRoles } from "@/utils/permissionUtils";
import { UserRole } from "@/types/user";
import { getLocale, getDictionary } from "@/lib/i18n";

interface PageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function OrdersManagementPage({ searchParams }: PageProps) {
  const { orderId } = await searchParams;
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const [orders, products] = await Promise.all([getAllOrders(), getAllProducts()]);
  const roles = (await serverCheckRoles([]))?.roles ?? [UserRole._GUEST];

  const canManage =
    roles.includes(UserRole._COORDINATOR) ||
    roles.includes(UserRole._ADMIN) ||
    roles.includes(UserRole._SHOP_MANAGER);

  const canEditOrder = roles.includes(UserRole._ADMIN) || roles.includes(UserRole._COORDINATOR);

  return (
    <>
      <OrdersTable orders={orders} products={products} locale={locale} dict={{mobile_filters_drawer: dict.mobile_filters_drawer, date_filter: dict.date_filter, active_filters: dict.active_filters, orders_table: dict.orders_table, confirm_dialog: dict.confirm_dialog, input_date_dialog: dict.input_date_dialog, new_order_modal: dict.new_order_modal, create_user_modal: dict.create_user_modal, pos_payment: dict.pos_payment}} />
      {orderId && (
        <OrderDetailOverlay
          orderId={Number(orderId)}
          orders={orders}
          canManage={canManage}
          basePath="/orders"
          canEditNotes={canEditOrder}
          canEditItems={canEditOrder}
          products={products}
          dict={{
            order_details: dict.order_details,
            confirm_dialog: dict.confirm_dialog,
            new_order_modal: dict.new_order_modal,
            create_user_modal: dict.create_user_modal,
            pos_payment: dict.pos_payment,
          }}
        />
      )}
    </>
  );
}
