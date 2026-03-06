import React, { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View, Share } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import ScreenLayout from "../../components/ui/ScreenLayout";
import SectionCard from "../../components/ui/SectionCard";
import PrimaryButton from "../../components/ui/PrimaryButton";
import { useAuthContext } from "../../contexts/AuthContext";
import { STORAGE_KEYS } from "../../lib/storage/keys";
import { formatPrice } from "../../lib/services/productService";
import { COLORS } from "../../theme/colors";

export default function TicketScreen() {
  const navigation = useNavigation();
  const { getUserEmail, getUserName } = useAuthContext();
  const [ticketData, setTicketData] = useState(null);

  useEffect(() => {
    const loadTicket = async () => {
      const rawTicket = await AsyncStorage.getItem(STORAGE_KEYS.lastTicket);
      if (!rawTicket) {
        navigation.navigate("Catalogo");
        return;
      }

      try {
        setTicketData(JSON.parse(rawTicket));
      } catch {
        await AsyncStorage.removeItem(STORAGE_KEYS.lastTicket);
        navigation.navigate("Catalogo");
      }
    };

    loadTicket();
  }, [navigation]);

  const handleBackToCatalog = async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.lastTicket);
    navigation.navigate("Catalogo");
  };

  const shareMessage = useMemo(() => {
    if (!ticketData) return "";
    return [
      "Ticket Mercapleno",
      `Cliente: ${getUserName()}`,
      `Correo: ${getUserEmail()}`,
      `Ticket: ${ticketData.ticketId || "N/A"}`,
      `Metodo de pago: ${ticketData.paymentMethod || "N/A"}`,
      `Total: ${formatPrice(Number(ticketData?.totals?.finalTotal || 0))}`
    ].join("\n");
  }, [ticketData, getUserEmail, getUserName]);

  const handleShare = async () => {
    try {
      await Share.share({ message: shareMessage });
    } catch {
      Alert.alert("No disponible", "No fue posible compartir el ticket.");
    }
  };

  if (!ticketData) {
    return (
      <ScreenLayout title="Ticket" subtitle="Cargando informacion...">
        <SectionCard>
          <Text style={styles.muted}>Recuperando ticket de compra...</Text>
        </SectionCard>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="Ticket de compra" subtitle="Resumen de tu ultima transaccion.">
      <SectionCard style={styles.summary}>
        <Text style={styles.brand}>MERCAPLENO</Text>
        <Text style={styles.itemText}>Cliente: {getUserName()}</Text>
        <Text style={styles.itemText}>Correo: {getUserEmail()}</Text>
        <Text style={styles.itemText}>Ticket: {ticketData.ticketId || "N/A"}</Text>
        <Text style={styles.itemText}>
          Fecha: {new Date(ticketData.createdAt || Date.now()).toLocaleString("es-CO")}
        </Text>
        <Text style={styles.itemText}>Metodo: {ticketData.paymentMethod || "N/A"}</Text>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Productos</Text>
        {(ticketData.cart || []).map((item) => {
          const nombre = item.nombre || item.name || "Producto";
          const subtotal = Number(item.price || 0) * Number(item.cantidad || 0);
          return (
            <View key={String(item.id)} style={styles.rowBetween}>
              <Text style={styles.itemText}>
                {nombre} x{item.cantidad}
              </Text>
              <Text style={styles.itemText}>{formatPrice(subtotal)}</Text>
            </View>
          );
        })}
      </SectionCard>

      <SectionCard>
        <View style={styles.rowBetween}>
          <Text style={styles.itemText}>Subtotal</Text>
          <Text style={styles.itemText}>{formatPrice(Number(ticketData?.totals?.subTotal || 0))}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.itemText}>Impuestos</Text>
          <Text style={styles.itemText}>{formatPrice(Number(ticketData?.totals?.tax || 0))}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.totalLabel}>Total final</Text>
          <Text style={styles.totalValue}>{formatPrice(Number(ticketData?.totals?.finalTotal || 0))}</Text>
        </View>
      </SectionCard>

      <PrimaryButton label="Compartir ticket" tone="secondary" onPress={handleShare} />
      <PrimaryButton label="Volver al catalogo" onPress={handleBackToCatalog} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  summary: {
    gap: 6
  },
  brand: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text
  },
  itemText: {
    fontSize: 14,
    color: COLORS.text
  },
  muted: {
    color: COLORS.textMuted
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary
  }
});
