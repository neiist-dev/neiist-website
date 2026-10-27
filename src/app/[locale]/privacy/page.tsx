import { Suspense } from "react";
import LegalDocument from "@/components/legal/LegalDocument";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, locales, LocaleParams } from "@/i18n/i18n-config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface PageProps {
  params: LocaleParams;
}

async function PrivacyPolicyContent({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const content = getDictionary(locale).privacy_policy_page;

  return <LegalDocument content={content} />;
}

export default function PrivacyPolicyPage(props: PageProps) {
  return (
    <Suspense fallback={null}>
      <PrivacyPolicyContent {...props} />
    </Suspense>
  );
}
