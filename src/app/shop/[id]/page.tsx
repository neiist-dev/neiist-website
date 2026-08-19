import ProductDetail from "@/components/shop/ProductDetail";
import styles from "@/styles/pages/ProductDetail.module.css";
import { getProduct } from "@/lib/db/repositories/shop.repository";

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const productId = Number(id);
  const product = await getProduct(productId);

  if (!product) {
    return (
      <div className={styles.container}>
        <h1>Produto não encontrado</h1>
      </div>
    );
  }

  return <ProductDetail product={product} />;
}
