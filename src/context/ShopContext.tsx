"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

const ShopContext = createContext({
  isOpen: false,
  openCart: () => {},
  closeCart: () => {},
  cartCount: 0,
  refreshCart: () => {},
});

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  type CartItem = { quantity: number; [key: string]: unknown };

  const refreshCart = React.useCallback(() => {
    const items: CartItem[] = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartCount(items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0));
  }, []);

  useEffect(() => {
    refreshCart();
    window.addEventListener("cartUpdated", refreshCart);
    return () => window.removeEventListener("cartUpdated", refreshCart);
  }, [refreshCart]);

  return (
    <ShopContext.Provider
      value={{
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        cartCount,
        refreshCart,
      }}>
      {children}
    </ShopContext.Provider>
  );
}

export const useCartPopup = () => useContext(ShopContext);
