import ShopManagement from "@/components/shop/ShopManagement";
import { getAllProducts, getAllCategories } from "@/utils/dbUtils";
import { getLocale, getDictionary } from "@/lib/i18n";

export default async function ShopManagePage() {
  const [products, categories] = await Promise.all([getAllProducts(), getAllCategories()]);
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  return (
    <ShopManagement
      products={products}
      categories={categories}
      locale={locale}
      dict={{ shop: {product_form: dict.shop.product_form }, shop_management: dict.shop_management, confirm_dialog: dict.confirm_dialog, categories: dict.shop.categories } }
    />
  );
}
