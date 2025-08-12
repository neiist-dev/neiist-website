import ProductDetail from "@/components/shop/ProductDetail";
import styles from "@/styles/pages/ProductDetail.module.css";
import { getTempProducts, Product } from "@/types/shop";

const getProduct = async (id: string): Promise<Product | null> => {
  const products = getTempProducts();
  const product = products.find((p) => p.id === parseInt(id));
  return product || null;
};

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return (
      <div className={styles.container}>
        <h1>Produto não encontrado</h1>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <ProductDetail product={product} />
    </div>
  );
}
