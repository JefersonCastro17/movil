import React, { createContext, useContext } from "react";
import { useCart } from "../lib/hooks/useCart";

const CartContext = createContext(null);

export function useCartContext() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCartContext debe usarse dentro de CartProvider.");
  }
  return context;
}

export function CartProvider({ children }) {
  const cart = useCart();
  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>;
}
