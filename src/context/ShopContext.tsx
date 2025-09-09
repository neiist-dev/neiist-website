"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { CartItem } from "@/types/shop";

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

  const refreshCart = useCallback(() => {
    const cart: CartItem[] = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
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
