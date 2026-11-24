import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { FiArrowRight, FiExternalLink } from "react-icons/fi";
import {
  Badge,
  Button,
  Carousel,
  ColorfulText,
  FeatureCard,
  type FeatureCardProps,
  Text,
} from "@neiist/ui";
import NewsCard, { type NewsCardProps } from "@/components/news/NewsCard";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, locales, type LocaleParams } from "@/i18n/i18n-config";
import sweats from "@/assets/news/all_sweats.png";
import colorsFound from "@/assets/news/colours_found.png";
import designFound from "@/assets/news/design_found.png";
import googleDeepMind from "@/assets/news/google_deepmind.png";
import recrutamento from "@/assets/news/recrutamento_2627.png";
import styles from "@/styles/components/news/News.module.css";

const FEATURE_IMAGE_SIZES = "(min-width: 768px) 42vw, 100vw";
const CARD_IMAGE_SIZES = "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

async function NewsPageContent({ params }: { params: LocaleParams }) {
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);
  const { actions, featured, older } = dict.news;

  const featuredItems: (FeatureCardProps & { id: string })[] = [
    {
      id: "sweats_preorder",
      badge: <Badge variant="primary">{featured.sweats_preorder.badge}</Badge>,
      subtitle: featured.sweats_preorder.subtitle,
      title: featured.sweats_preorder.title,
      description: (
        <>
          <Text variant="muted">{featured.sweats_preorder.lead}</Text>
          <ul>
            <li>
              <strong>{featured.sweats_preorder.layout_label}</strong>{" "}
              {featured.sweats_preorder.layout_value}
            </li>
            <li>
              <strong>{featured.sweats_preorder.colors_label}</strong>{" "}
              {featured.sweats_preorder.colors_value}
            </li>
          </ul>
          <Text variant="muted">
            {featured.sweats_preorder.footer_prefix}{" "}
            <Link href={`/${locale}/shop`}>{featured.sweats_preorder.shop_link}</Link>{" "}
            {featured.sweats_preorder.footer_mid}{" "}
            <a href="https://www.instagram.com/neiist/" target="_blank" rel="noopener noreferrer">
              {featured.sweats_preorder.instagram_link}
            </a>
            .
          </Text>
        </>
      ),
      image: (
        <Image src={sweats} alt={featured.sweats_preorder.title} fill sizes={FEATURE_IMAGE_SIZES} />
      ),
      actions: (
        <Link href={`/${locale}/shop`} className={styles.actionLink}>
          <Button size="sm" variant="solid">
            {actions.go_to_shop} <FiArrowRight />
          </Button>
        </Link>
      ),
    },
    {
      id: "colors_found",
      title: featured.colors_found.title,
      description: (
        <>
          <Text variant="muted">{featured.colors_found.lead}</Text>
          <ul>
            <li>
              <strong>{featured.colors_found.first_label}</strong>{" "}
              {featured.colors_found.first_value}
            </li>
            <li>
              <strong>{featured.colors_found.second_label}</strong>{" "}
              {featured.colors_found.second_value}
            </li>
            <li>
              <strong>{featured.colors_found.third_label}</strong>{" "}
              {featured.colors_found.third_value}
            </li>
          </ul>
        </>
      ),
      image: (
        <Image
          src={colorsFound}
          alt={featured.colors_found.title}
          fill
          sizes={FEATURE_IMAGE_SIZES}
        />
      ),
      actions: (
        <>
          <Link href={`/${locale}/shop`} className={styles.actionLink}>
            <Button size="sm" variant="solid">
              {actions.view_in_shop} <FiArrowRight />
            </Button>
          </Link>
          <a
            href="https://www.instagram.com/p/DfCGL_oMvin/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.actionLink}>
            <Button size="sm" variant="outline">
              {actions.view_on_instagram} <FiExternalLink />
            </Button>
          </a>
        </>
      ),
    },
  ];

  const olderItems: (NewsCardProps & { id: string })[] = [
    {
      id: "design_found",
      badge: (
        <Badge size="sm" variant="secondary">
          {older.design_found.badge}
        </Badge>
      ),
      subtitle: older.design_found.subtitle,
      title: older.design_found.title,
      description: (
        <>
          <Text size="sm" variant="muted">
            {older.design_found.lead}
          </Text>
          <ul>
            <li>
              <strong>{older.design_found.winner_label}</strong> {older.design_found.winner_value}
            </li>
            <li>
              <strong>{older.design_found.design_label}</strong> {older.design_found.design_value}
            </li>
          </ul>
        </>
      ),
      image: (
        <Image src={designFound} alt={older.design_found.title} fill sizes={CARD_IMAGE_SIZES} />
      ),
      actions: (
        <>
          <Link href={`/${locale}/shop`} className={styles.actionLink}>
            <Button size="sm" variant="solid">
              {actions.view_in_shop} <FiArrowRight />
            </Button>
          </Link>
          <a
            href="https://www.instagram.com/p/Dew1Z1Ls5Tf/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.actionLink}>
            <Button size="sm" variant="outline">
              {actions.view_on_instagram} <FiExternalLink />
            </Button>
          </a>
        </>
      ),
    },
    {
      id: "google_deepmind",
      badge: (
        <Badge size="sm" variant="primary">
          {older.google_deepmind.badge}
        </Badge>
      ),
      subtitle: older.google_deepmind.subtitle,
      title: older.google_deepmind.title,
      description: (
        <>
          <Text size="sm" variant="muted">
            {older.google_deepmind.lead}
          </Text>
          <ul>
            <li>
              <strong>{older.google_deepmind.date_label}</strong> {older.google_deepmind.date_value}
            </li>
            <li>
              <strong>{older.google_deepmind.location_label}</strong>{" "}
              {older.google_deepmind.location_value}
            </li>
            <li>
              <strong>{older.google_deepmind.entry_label}</strong>{" "}
              {older.google_deepmind.entry_value}
            </li>
          </ul>
        </>
      ),
      image: (
        <Image
          src={googleDeepMind}
          alt={older.google_deepmind.title}
          fill
          sizes={CARD_IMAGE_SIZES}
        />
      ),
      actions: (
        <>
          <Link
            href={`/${locale}/activities?eventId=3f14ecf9-fdeb-80fa-abe2-e63e776a4e04`}
            className={styles.actionLink}>
            <Button size="sm" variant="solid">
              {actions.view_activities} <FiArrowRight />
            </Button>
          </Link>
          <a
            href="https://www.instagram.com/p/DeKCTVesoae/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.actionLink}>
            <Button size="sm" variant="outline">
              {actions.view_on_instagram} <FiExternalLink />
            </Button>
          </a>
        </>
      ),
    },
    {
      id: "recrutamento",
      badge: (
        <Badge size="sm" variant="primary">
          {older.recrutamento.badge}
        </Badge>
      ),
      subtitle: older.recrutamento.subtitle,
      title: older.recrutamento.title,
      description: (
        <>
          <Text size="sm" variant="muted">
            {older.recrutamento.lead}
          </Text>
          <ul>
            <li>
              <strong>{older.recrutamento.teams_label}</strong> {older.recrutamento.teams_value}
            </li>
            <li>
              <strong>{older.recrutamento.deadline_label}</strong>{" "}
              {older.recrutamento.deadline_value}
            </li>
          </ul>
        </>
      ),
      image: (
        <Image src={recrutamento} alt={older.recrutamento.title} fill sizes={CARD_IMAGE_SIZES} />
      ),
      actions: (
        <>
          <Link href={`/${locale}/about-us`} className={styles.actionLink}>
            <Button size="sm" variant="solid">
              {actions.about_neiist} <FiArrowRight />
            </Button>
          </Link>
          <a
            href="https://www.instagram.com/p/DcyGE2MMVxq/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.actionLink}>
            <Button size="sm" variant="outline">
              {actions.view_on_instagram} <FiExternalLink />
            </Button>
          </a>
        </>
      ),
    },
  ];

  return (
    <section className={styles.container}>
      <ColorfulText as="h1" className={styles.title} text={dict.navbar.news} />

      <Carousel
        slidesPerView={1}
        autoplay={false}
        prevLabel={dict.activities.prev_label}
        nextLabel={dict.activities.next_label}>
        {featuredItems.map(({ id, ...item }) => (
          <FeatureCard key={id} {...item} />
        ))}
      </Carousel>

      <div className={styles.grid}>
        {olderItems.map(({ id, ...item }) => (
          <NewsCard key={id} {...item} />
        ))}
      </div>
    </section>
  );
}

export default function NewsPage(props: { params: LocaleParams }) {
  return (
    <Suspense fallback={null}>
      <NewsPageContent {...props} />
    </Suspense>
  );
}
