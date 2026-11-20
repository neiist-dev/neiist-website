import { FaShoppingCart } from "react-icons/fa";
import { useCartPopup } from "@/context/ShopContext";
import styles from "@/styles/components/layout/navbar/ShoppingCart.module.css";

const ShoppingCart = () => {
  const { openCart, cartCount } = useCartPopup();

  return (
    <button
      className={styles.cartButton}
      onClick={openCart}
      aria-label={cartCount > 0 ? `Carrinho de compras (${cartCount})` : "Carrinho de compras"}>
      <FaShoppingCart aria-hidden="true" />
      {cartCount > 0 && <span className={styles.itemCount}>{cartCount}</span>}
    </button>
  );
};

export default ShoppingCart;
