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
import { serverCheckRoles } from "@/lib/auth";

const handelsonTwo = localFont({
  src: "../../assets/fonts/handelson-two.otf",
  display: "swap",
});

const teaserItems = [
  {
    icon: <FaBug />,
    title: "Desafios",
    text: "No início do jantar, desafios vão estar disponíveis no nosso website. Cumpre o desafio, mostra ao staff e ganha uma senha extra!",
    accentClass: styles.teaserRed,
  },
  {
    icon: <FaTrophy />,
    title: "Concursos",
    text: "Depois do jantar, mostra o que vales nos nossos concursos e habilita-te a ganhar senhas ou prémios variados!",
    accentClass: styles.teaserYellow,
  },
  {
    icon: <FaVoteYea />,
    title: "Títulos",
    text: "Vota nos teus colegas! Durante o jantar, elege o teu amigo para receber um título.",
    accentClass: styles.teaserBlue,
  },
  {
    icon: <FaMicrophone />,
    title: "Karaoke",
    text: "Mostra os teus dotes no microfone! Sozinho ou em grupo, os corajosos do karaoke recebem senhas ;)",
    accentClass: styles.teaserPurple,
  },
] as const;

type TeaserItem = (typeof teaserItems)[number];

function DinnerTeasers() {
  return (
    <section className={styles.teaserSection} aria-label="Atividades em destaque">
      <div className={styles.teaserGrid}>
        {teaserItems.map((item: TeaserItem) => (
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

function DinnerInfoList() {
  return (
    <ul className={`${styles.infoList} ${handelsonTwo.className}`}>
      <InfoListItem
        icon={<FaMapMarkerAlt />}
        label="Local"
        value="MADSpot"
        url="https://www.instagram.com/mad_spot_fa/"
      />
      <InfoListItem icon={<FaCalendarAlt />} label="Data" value="21 de maio" />
      <InfoListItem icon={<FaClock />} label="Hora" value="20h00 - 04h00" />
    </ul>
  );
}

export default async function DinnerPage() {
  const userRoles = await serverCheckRoles([]);
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
        <p>Produto de Jantar de Curso não encontrado</p>
      </div>
    );
  const isSaleOpen = !dinnerProduct.order_deadline || new Date(dinnerProduct.order_deadline) > now;

  const hasDinnerOrder =
    userRoles.isAuthorized && userRoles.user
      ? Object.values(
          await getUserOrderedProductsInCategory(
            userRoles.user.istid,
            dinnerProduct.category ?? "jantar de curso"
          )
        ).some((q) => q > 0)
      : false;

  if (hasDinnerOrder && isUnlocked) {
    return <UnlockedDinnerPage />;
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
              O teu lugar no jantar de curso está garantido! Prepara-te, temos surpresas à tua
              espera.
            </p>
          ) : (
            <p className={`${styles.description} ${handelsonTwo.className}`}>
              Junta-te a nós para um jantar inesquecível!
            </p>
          )}

          <DinnerInfoList />

          {showCountdown && (
            <div className={styles.lockedSection}>
              <p className={`${styles.unlockTimeMessage} ${handelsonTwo.className}`}>
                O conteúdo será desbloqueado às{" "}
                <span className={styles.highlight}>20h do dia 21 de maio</span>
              </p>

              <Countdown />
            </div>
          )}

          {showBuyButton && (
            <Link
              href={`/shop/${dinnerProduct.id}`}
              className={`${styles.button} ${handelsonTwo.className}`}>
              Comprar Já
            </Link>
          )}
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.imageWrapper}>
            <Image
              src={penguinImg}
              alt="Poster do Jantar de Curso"
              className={styles.image}
              priority
            />
          </div>

          <DinnerTeasers />
        </div>
      </div>
    </div>
  );
}
