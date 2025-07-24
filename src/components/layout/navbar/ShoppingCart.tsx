import { FaShoppingCart } from "react-icons/fa";
import styles from "@/styles/components/layout/navbar/ShoppingCart.module.css";

const ShoppingCart = () => {
  return (
    <button className={styles.cartButton} onClick={() => (window.location.href = "/404")}>
      <FaShoppingCart />
    </button>
  );
};

export default ShoppingCart;
