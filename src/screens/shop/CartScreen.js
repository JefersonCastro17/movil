import React, { useMemo, useState } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import ScreenLayout from "../../components/ui/ScreenLayout";
import SectionCard from "../../components/ui/SectionCard";
import PrimaryButton from "../../components/ui/PrimaryButton";
import { useCartContext } from "../../contexts/CartContext";
import { useAuthContext } from "../../contexts/AuthContext";
import { formatPrice } from "../../lib/services/productService";
import { FALLBACK_IMAGE, resolveImageUrl } from "../../lib/services/imageUtils";
import { STORAGE_KEYS } from "../../lib/storage/keys";
import { COLORS } from "../../theme/colors";

const PAYMENT_METHODS = [
  { id: 1, name: "Efectivo", dbId: "M1" },
  { id: 2, name: "Tarjeta de credito", dbId: "M2" },
  { id: 3, name: "Tarjeta de debito", dbId: "M3" },
  { id: 4, name: "Transferencia", dbId: "M4" },
  { id: 5, name: "Nequi", dbId: "M5" },
  { id: 6, name: "Daviplata", dbId: "M6" }
];

function CartItem({ item, onLess, onMore, onDelete }) {
  const [imageUri, setImageUri] = useState(resolveImageUrl(item.image || item.imagen || ""));
  const subtotal = Number(item.price || 0) * Number(item.cantidad || 0);

  return (
    <SectionCard style={styles.itemCard}>
      <View style={styles.itemRow}>
        <Image
          source={{ uri: imageUri || FALLBACK_IMAGE }}
          style={styles.itemImage}
          onError={() => setImageUri(FALLBACK_IMAGE)}
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.nombre || item.name || "Producto"}</Text>
          <Text style={styles.itemMeta}>{formatPrice(Number(item.price || 0))} c/u</Text>
          <Text style={styles.itemMeta}>Subtotal: {formatPrice(subtotal)}</Text>
        </View>
      </View>
      <View style={styles.qtyRow}>
        <PrimaryButton label="-" onPress={onLess} compact tone="neutral" />
        <Text style={styles.qtyValue}>{item.cantidad}</Text>
        <PrimaryButton label="+" onPress={onMore} compact tone="secondary" />
        <PrimaryButton label="Eliminar" onPress={onDelete} compact tone="danger" />
      </View>
    </SectionCard>
  );
}

export default function CartScreen() {
  const navigation = useNavigation();
  const { cart, totalItems, setItemQuantity, removeFromCart, clearCart, processCheckout } = useCartContext();
  const { isAuthenticated, getUserId } = useAuthContext();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(PAYMENT_METHODS[0].dbId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  const totals = useMemo(() => {
    const subTotal = cart.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.cantidad || 0),
      0
    );
    const tax = subTotal * 0.19;
    const finalTotal = subTotal + tax;
    return { subTotal, tax, finalTotal };
  }, [cart]);

  const handleCheckout = async () => {
    if (!cart.length) {
      setCheckoutError("Tu carrito esta vacio.");
      return;
    }

    const idUsuario = getUserId();
    if (!isAuthenticated || !idUsuario) {
      setCheckoutError("Debes iniciar sesion para completar la compra.");
      return;
    }

    setIsProcessing(true);
    setCheckoutError(null);
    try {
      const result = await processCheckout(selectedPaymentMethod);
      if (!result || (!result.id_venta && !result.ticketId)) {
        throw new Error("No se recibio ticket de venta.");
      }

      const payload = {
        cart,
        totals,
        ticketId: result.ticketId || result.id_venta,
        paymentMethod:
          PAYMENT_METHODS.find((method) => method.dbId === selectedPaymentMethod)?.name || "Desconocido",
        createdAt: new Date().toISOString()
      };

      await AsyncStorage.setItem(STORAGE_KEYS.lastTicket, JSON.stringify(payload));
      clearCart();
      navigation.navigate("Ticket");
    } catch (error) {
      setCheckoutError(error.message || "No se pudo procesar el pago.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearCart = () => {
    Alert.alert("Vaciar carrito", "Se eliminaran todos los productos.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Vaciar", style: "destructive", onPress: clearCart }
    ]);
  };

  return (
    <ScreenLayout title="Carrito" subtitle={`${totalItems} productos en tu pedido`}>
      {!cart.length ? (
        <SectionCard>
          <Text style={styles.emptyTitle}>Tu carrito esta vacio</Text>
          <Text style={styles.emptySubtitle}>Agrega productos desde el catalogo.</Text>
          <PrimaryButton label="Ir al catalogo" onPress={() => navigation.navigate("Catalogo")} />
        </SectionCard>
      ) : (
        <>
          <View style={styles.list}>
            {cart.map((item) => (
              <CartItem
                key={String(item.id)}
                item={item}
                onLess={() => setItemQuantity(item.id, Number(item.cantidad) - 1)}
                onMore={() => setItemQuantity(item.id, Number(item.cantidad) + 1)}
                onDelete={() => removeFromCart(item.id)}
              />
            ))}
          </View>

          <SectionCard style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Metodo de pago</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedPaymentMethod}
                onValueChange={setSelectedPaymentMethod}
                enabled={!isProcessing}
              >
                {PAYMENT_METHODS.map((method) => (
                  <Picker.Item key={method.dbId} label={method.name} value={method.dbId} />
                ))}
              </Picker>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatPrice(totals.subTotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Impuestos (19%)</Text>
              <Text style={styles.totalValue}>{formatPrice(totals.tax)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabelBold}>Total final</Text>
              <Text style={styles.totalValueBold}>{formatPrice(totals.finalTotal)}</Text>
            </View>

            {checkoutError ? <Text style={styles.errorText}>{checkoutError}</Text> : null}

            <PrimaryButton
              label={isProcessing ? "Procesando..." : `Pagar ${formatPrice(totals.finalTotal)}`}
              onPress={handleCheckout}
              disabled={isProcessing}
            />
            <PrimaryButton label="Vaciar carrito" tone="danger" onPress={handleClearCart} compact />
            <PrimaryButton label="Seguir comprando" tone="secondary" onPress={() => navigation.navigate("Catalogo")} compact />
          </SectionCard>
        </>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10
  },
  itemCard: {
    gap: 10
  },
  itemRow: {
    flexDirection: "row",
    gap: 10
  },
  itemImage: {
    width: 74,
    height: 74,
    borderRadius: 8,
    backgroundColor: COLORS.background
  },
  itemInfo: {
    flex: 1,
    gap: 2
  },
  itemName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text
  },
  itemMeta: {
    fontSize: 13,
    color: COLORS.textMuted
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap"
  },
  qtyValue: {
    minWidth: 28,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text
  },
  summaryCard: {
    gap: 10
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.inputBackground
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  totalLabel: {
    color: COLORS.textMuted
  },
  totalValue: {
    color: COLORS.text,
    fontWeight: "600"
  },
  totalLabelBold: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 16
  },
  totalValueBold: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 16
  },
  errorText: {
    color: COLORS.danger,
    fontWeight: "600"
  },
  emptyTitle: {
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
    color: COLORS.text
  },
  emptySubtitle: {
    textAlign: "center",
    color: COLORS.textMuted
  }
});
