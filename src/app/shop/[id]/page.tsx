import ProductDetail from "@/components/shop/ProductDetail";
import { getProduct } from "@/utils/dbUtils";
import styles from "@/styles/pages/ProductDetail.module.css";

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Promise<{ from?: string }>;
}) {
  const [{ id }, resolvedSearch] = await Promise.all([params, searchParams]);
  const productId = Number(id);
  const product = await getProduct(productId);

  if (!product) {
    return (
      <div className={styles.container}>
        <h1>Produto não encontrado</h1>
      </div>
    );
  }

  return <ProductDetail product={product} fromEdit={resolvedSearch.from === "edit"} />;
}
