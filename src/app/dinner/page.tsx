import Link from "next/link";
import { getAllProducts, getAllOrders } from "@/utils/dbUtils";
import { isJantarDeCursoCategory } from "@/utils/shop/orderKindUtils";
import { serverCheckRoles } from "@/utils/permissionUtils";
import styles from "@/styles/pages/DinnerPage.module.css";
import FullScreenWrapper from "@/components/FullScreenWrapper";
import InfoListItem from "@/components/jantar-de-curso/InfoListItem";
import penguinImg from "@/assets/events/DinnerPenguin.png";
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
} from "react-icons/fa";
import localFont from "next/font/local";
import Countdown from "@/components/jantar-de-curso/Countdown";

const handelsonTwo = localFont({
  src: "../../assets/fonts/handelson-two.otf",
  display: "swap",
});

export default async function DinnerPage() {
  const userRoles = await serverCheckRoles([]);
  const products = await getAllProducts(true);
  const productById = new Map(products.map((product) => [product.id, product]));
  const jantarProduct = products.find((product) => isJantarDeCursoCategory(product.category));

  const unlockDate = new Date("2026-05-21T20:00:00+01:00");
  const now = new Date();
  const isUnlocked = now >= unlockDate;

  if (!jantarProduct) {
    return (
      <div className={styles.container}>
        <p>Produto de Jantar de Curso não encontrado</p>
      </div>
    );
  }

  if (userRoles.isAuthorized && userRoles.user) {
    const allOrders = await getAllOrders();
    const userOrders = allOrders.filter((order) => order.user_istid === userRoles.user?.istid);
    const hasJantarOrder = userOrders.some(
      (order) =>
        order.status === "paid" &&
        order.items.some((item) =>
          isJantarDeCursoCategory(productById.get(item.product_id)?.category)
        )
    );
    if (hasJantarOrder) {
      return (
        <FullScreenWrapper>
        <div className={styles.container}>
          <div className={styles.contentWrapper}>  
            <div className={styles.leftColumn}>
              <h1 className={`${styles.mainTitle} ${handelsonTwo.className}`}>
                <span className={styles.jantar}>JANTAR</span>
                  <span className={styles.de}>de</span>
                <span className={styles.curso}>CURSO</span>
              </h1>
              
              <p className={`${styles.signedUpMessage} ${handelsonTwo.className}`}>
                O teu lugar no jantar de curso está garantido! Prepara-te, temos surpresas à tua espera.
              </p>

              <ul className={`${styles.infoList} ${handelsonTwo.className}`}>
                <InfoListItem icon={<FaMapMarkerAlt />} label="Local" value="MADSpot" />
                <InfoListItem icon={<FaCalendarAlt />} label="Data" value="21 de maio" />
                <InfoListItem icon={<FaClock />} label="Hora" value="20h00 - 04h00" />
              </ul>
            
              {!isUnlocked ? (
                <div className={styles.lockedSection}>
                  <p className={`${styles.unlockTimeMessage} ${handelsonTwo.className}`}>
                  O conteúdo será desbloqueado às{" "}
                  <span className={styles.highlight}>20h do dia 21 de maio</span>
                  </p>
                  <Countdown />
                </div>
              ) : (
                <div className={styles.unlockedSection}>
                  <p className={`${styles.unlockMessage} ${handelsonTwo.className}`}>
                    🎉 Já podes aceder às surpresas!
                  </p>
                </div>
              )}
            </div>
            
            <div className={styles.rightColumn}>
              <img 
                src={penguinImg.src} 
                alt="Poster do Jantar de Curso" 
                className={styles.image} 
              />
            </div>

          </div>
        </div>
        </FullScreenWrapper>
      );
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>  
        <div className={styles.leftColumn}>
        <h1 className={`${styles.mainTitle} ${handelsonTwo.className}`}>
          <span className={styles.jantar}>JANTAR</span>
            <span className={styles.de}>de</span>
          <span className={styles.curso}>CURSO</span>
        </h1>
        
          <ul className={`${styles.infoList} ${handelsonTwo.className}`}>
            <InfoListItem icon={<FaMapMarkerAlt />} label="Local" value="MADSpot" />
            <InfoListItem icon={<FaCalendarAlt />} label="Data" value="21 de maio" />
            <InfoListItem icon={<FaClock />} label="Hora" value="20h00 - 04h00" />
          </ul>

          <p className={`${styles.description} ${handelsonTwo.className}`}>
          Junta-te a nós para um jantar inesquecível!
          </p>

          <Link href={`/shop/${jantarProduct.id}`} className={`${styles.button} ${handelsonTwo.className}`}>
            Saber mais
          </Link>
        </div>
      
        <div className={styles.rightColumn}>
          <img 
            src={penguinImg.src} 
            alt="Poster do Jantar de Curso" 
            className={styles.image} 
          />
        </div>

      </div>
    </div>
  );
}
