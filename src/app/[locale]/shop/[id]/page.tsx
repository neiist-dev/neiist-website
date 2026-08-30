import ProductDetail from "@/components/shop/ProductDetail";
import styles from "@/styles/pages/ProductDetail.module.css";
import { getAllProducts, getProduct } from "@/lib/db/repositories/shop.repository";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ id: String(p.id) }));
}

export default async function ProductDetailPage({ params }: PageProps) {
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
