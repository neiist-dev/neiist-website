import ProductDetail from "@/components/shop/ProductDetail";
import { getProduct } from "@/utils/dbUtils";
import styles from "@/styles/pages/ProductDetail.module.css";

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
