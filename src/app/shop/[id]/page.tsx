import ProductDetail from "@/components/shop/ProductDetail";
import { getProduct } from "@/utils/dbUtils";
import styles from "@/styles/pages/ProductDetail.module.css";
import { getLocale, getDictionary } from "@/lib/i18n";

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const productId = Number(id);
  const product = await getProduct(productId);

  const locale = await getLocale();
  const dict = await getDictionary(locale);

  if (!product) {
    return (
      <div className={styles.container}>
        <h1>{dict.shop.not_found}</h1>
      </div>
    );
  }

  return <ProductDetail product={product} dict={dict.shop} />;
}
