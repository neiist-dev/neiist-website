import ProductDetail from "@/components/shop/ProductDetail";
import { getAllProducts, getProduct } from "@/lib/db/repositories/shop.repository";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, locales } from "@/i18n/i18n-config";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateStaticParams() {
  try {
    const products = await getAllProducts();
    if (products && products.length > 0)
      return locales.flatMap((locale) => products.map((p) => ({ locale, id: String(p.id) })));
  } catch (error) {
    console.warn("[generateStaticParams] Could not fetch products during build:", error);
  }

  return locales.map((locale) => ({ locale, id: "0" }));
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale).shop;

  const productId = Number(id);
  if (isNaN(productId) || productId <= 0) notFound();

  const product = await getProduct(productId);

  if (!product || product.active === false) notFound();

  return <ProductDetail product={product} dict={dict} basePath={`/${locale}`} />;
}
