import Link from "next/link";
import Image from "next/image";
import localFont from "next/font/local";
import {
  FaBug,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaMicrophone,
  FaTrophy,
  FaVoteYea,
} from "react-icons/fa";
import Countdown from "@/components/dinner/Countdown";
import InfoListItem from "@/components/dinner/InfoListItem";
import UnlockedDinnerPage from "@/components/dinner/UnlockedDinnerPage";
import { isJantarDeCursoCategory } from "@/utils/shop/orderKindUtils";
import penguinImg from "@/assets/events/DinnerPenguin.png";
import styles from "@/styles/pages/DinnerPage.module.css";
import {
  getAllProducts,
  getUserOrderedProductsInCategory,
} from "@/lib/db/repositories/shop.repository";
import { getAuthenticatedUser } from "@/lib/auth";
import { getDictionary, Dictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";

const handelsonTwo = localFont({
  src: "../../../assets/fonts/handelson-two.otf",
  display: "swap",
});

function DinnerTeasers({ dict }: { dict: Dictionary["dinner"]["teasers"] }) {
  const teaserItems = [
    {
      icon: <FaBug />,
      title: dict.challenges_title,
      text: dict.challenges_text,
      accentClass: styles.teaserRed,
    },
    {
      icon: <FaTrophy />,
      title: dict.contests_title,
      text: dict.contests_text,
      accentClass: styles.teaserYellow,
    },
    {
      icon: <FaVoteYea />,
      title: dict.titles_title,
      text: dict.titles_text,
      accentClass: styles.teaserBlue,
    },
    {
      icon: <FaMicrophone />,
      title: dict.karaoke_title,
      text: dict.karaoke_text,
      accentClass: styles.teaserPurple,
    },
  ];

  return (
    <section className={styles.teaserSection} aria-label="Atividades em destaque">
      <div className={styles.teaserGrid}>
        {teaserItems.map((item) => (
          <article key={item.title} className={styles.teaserCard}>
            <div className={`${styles.teaserIcon} ${item.accentClass}`}>{item.icon}</div>
            <h2 className={`${styles.teaserTitle} ${handelsonTwo.className}`}>{item.title}</h2>
            <p className={`${styles.teaserText} ${handelsonTwo.className}`}>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function DinnerInfoList({ dict }: { dict: Dictionary["dinner"] }) {
  return (
    <ul className={`${styles.infoList} ${handelsonTwo.className}`}>
      <InfoListItem
        icon={<FaMapMarkerAlt />}
        label={dict.location_label}
        value={dict.location_value}
        url={dict.location_url}
      />
      <InfoListItem icon={<FaCalendarAlt />} label={dict.date_label} value={dict.date_value} />
      <InfoListItem icon={<FaClock />} label={dict.time_label} value={dict.time_value} />
    </ul>
  );
}

export default async function DinnerPage({ params }: { params: LocaleParams }) {
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale).dinner;

  const session = await getAuthenticatedUser();
  const products = await getAllProducts(true);
  const unlockDate = new Date("2026-05-21T20:00:00+01:00");
  const now = new Date();
  const isUnlocked = now >= unlockDate;

  const dinnerProduct = Array.from(products.values()).find((product) =>
    isJantarDeCursoCategory(product.category)
  );

  if (!dinnerProduct)
    return (
      <div className={styles.container}>
        <p>{dict.not_found}</p>
      </div>
    );
  const isSaleOpen = !dinnerProduct.order_deadline || new Date(dinnerProduct.order_deadline) > now;

  const hasDinnerOrder = session?.user
    ? Object.values(
        await getUserOrderedProductsInCategory(
          session.user.istid,
          dinnerProduct.category ?? "jantar de curso"
        )
      ).some((q) => q > 0)
    : false;

  if (hasDinnerOrder && isUnlocked) {
    return <UnlockedDinnerPage dict={dict.surprises} basePath={`/${locale}`} />;
  }

  const showCountdown = hasDinnerOrder;
  const showBuyButton = !hasDinnerOrder && isSaleOpen;

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <div className={styles.leftColumn}>
          <h1 className={`${styles.mainTitle} ${handelsonTwo.className}`}>
            <span className={styles.jantar}>JANTAR</span>
            <span className={styles.de}>de</span>
            <span className={styles.curso}>CURSO</span>
          </h1>

          {showCountdown ? (
            <p className={`${styles.signedUpMessage} ${handelsonTwo.className}`}>
              {dict.signed_up_message}
            </p>
          ) : (
            <p className={`${styles.description} ${handelsonTwo.className}`}>{dict.description}</p>
          )}

          <DinnerInfoList dict={dict} />

          {showCountdown && (
            <div className={styles.lockedSection}>
              <p className={`${styles.unlockTimeMessage} ${handelsonTwo.className}`}>
                {dict.unlock_time_message}{" "}
                <span className={styles.highlight}>{dict.unlock_highlight}</span>
              </p>

              <Countdown />
            </div>
          )}

          {showBuyButton && (
            <Link
              href={`/${locale}/shop/${dinnerProduct.id}`}
              className={`${styles.button} ${handelsonTwo.className}`}>
              {dict.buy_button}
            </Link>
          )}
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.imageWrapper}>
            <Image src={penguinImg} alt={dict.poster_alt} className={styles.image} priority />
          </div>

          <DinnerTeasers dict={dict.teasers} />
        </div>
      </div>
    </div>
  );
}
