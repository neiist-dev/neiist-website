import Link from "next/link";
import { getAllProducts, getAllOrders } from "@/utils/dbUtils";
import { isJantarDeCursoCategory } from "@/utils/shop/orderKindUtils";
import { serverCheckRoles } from "@/utils/permissionUtils";
import styles from "@/styles/pages/DinnerPage.module.css";
import FullScreenWrapper from "@/components/FullScreenWrapper";
import InfoListItem from "@/components/jantar-de-curso/InfoListItem";
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaPiggyBank
} from "react-icons/fa";
export default async function DinnerPage() {
  const userRoles = await serverCheckRoles([]);
  const products = await getAllProducts(true);
  const productById = new Map(products.map((product) => [product.id, product]));
  const jantarProduct = products.find((product) => isJantarDeCursoCategory(product.category));

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
          <div className={styles.signedUpScreen}>
            <div className={styles.signedUpContent}>
              <h1>Espera pelo jantar para descobrires todas as surpresas!</h1>
              <p>Até breve!</p>
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
          <h1 className={styles.mainTitle}>
            Jantar de Curso
          </h1>
          <p className={styles.saveTheDateText}>SAVE THE DATE</p>
          <hr className={styles.separator} />
        
          <ul className={styles.infoList}>
            <InfoListItem icon={<FaMapMarkerAlt />} label="Local" value="[Local]" />
            <InfoListItem icon={<FaCalendarAlt />} label="Data" value="21 de maio" />
            <InfoListItem icon={<FaClock />} label="Hora" value="[Hora]" />
          </ul>

          <p className={styles.description}>
            Junta-te a nós para um jantar inesquecível!
          </p>

          <Link href={`/shop/${jantarProduct.id}`} className={styles.button}>
            Ver Jantar de Curso
          </Link>
        </div>
      
        <div className={styles.rightColumn}>
          <img 
            src="/Penguin.png" 
            alt="Poster do Jantar de Curso" 
            className={styles.image} 
          />
        </div>

      </div>
    </div>
  );
}
