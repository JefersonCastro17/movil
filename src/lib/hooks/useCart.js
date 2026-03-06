import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sendOrder } from "../services/productService";
import { STORAGE_KEYS } from "../storage/keys";

export function useCart() {
  const [cart, setCart] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const loadCart = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.cart);
        setCart(saved ? JSON.parse(saved) : []);
      } catch {
        setCart([]);
      } finally {
        setIsHydrated(true);
      }
    };

    loadCart();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart)).catch(() => null);
  }, [cart, isHydrated]);

  const addToCart = useCallback((product) => {
    setCart((prevCart) => {
      const index = prevCart.findIndex((item) => item.id === product.id);
      if (index >= 0) {
        return prevCart.map((item, idx) =>
          idx === index ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }

      return [...prevCart, { ...product, cantidad: 1 }];
    });
  }, []);

  const setItemQuantity = useCallback((productId, newQuantity) => {
    setCart((prevCart) => {
      if (newQuantity <= 0) {
        return prevCart.filter((item) => item.id !== productId);
      }

      return prevCart.map((item) =>
        item.id === productId ? { ...item, cantidad: newQuantity } : item
      );
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const totals = useMemo(() => {
    const subTotal = cart.reduce((acc, item) => acc + Number(item.price || 0) * item.cantidad, 0);
    const tax = subTotal * 0.19;
    const finalTotal = subTotal + tax;
    const totalItems = cart.reduce((acc, item) => acc + Number(item.cantidad || 0), 0);
    return { subTotal, tax, finalTotal, totalItems };
  }, [cart]);

  const processCheckout = useCallback(
    async (id_metodo) => {
      if (!cart.length) return false;

      const orderData = {
        items: cart.map((item) => ({
          id: item.id,
          cantidad: item.cantidad
        })),
        total: Number(totals.finalTotal.toFixed(2)),
        id_metodo
      };

      return sendOrder(orderData);
    },
    [cart, totals.finalTotal]
  );

  return {
    cart,
    setCart,
    addToCart,
    setItemQuantity,
    removeFromCart,
    clearCart,
    subTotal: totals.subTotal,
    tax: totals.tax,
    finalTotal: totals.finalTotal,
    totalItems: totals.totalItems,
    processCheckout
  };
}
