import ProductDetail from "@/components/shop/ProductDetail";
import styles from "@/styles/pages/ProductDetail.module.css";
import { getAllProducts, getProduct } from "@/lib/db/repositories/shop.repository";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, locales } from "@/i18n/i18n-config";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateStaticParams() {
  const products = await getAllProducts();
  return locales.flatMap((locale) => products.map((p) => ({ locale, id: String(p.id) })));
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale).shop;

  const product = await getProduct(Number(id));

  if (!product) {
    return (
      <div className={styles.container}>
        <h1>{dict.not_found}</h1>
      </div>
    );
  }

  return <ProductDetail product={product} dict={dict} basePath={`/${locale}`} />;
}
