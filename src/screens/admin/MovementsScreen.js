import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import ScreenLayout from "../../components/ui/ScreenLayout";
import SectionCard from "../../components/ui/SectionCard";
import PrimaryButton from "../../components/ui/PrimaryButton";
import FormField from "../../components/ui/FormField";
import { useAuthContext } from "../../contexts/AuthContext";
import {
  getMovementProducts,
  registerMovement
} from "../../lib/services/movementsService";
import { formatPrice } from "../../lib/services/productService";
import { FALLBACK_IMAGE, resolveImageUrl } from "../../lib/services/imageUtils";

const MOVEMENT_TYPES = [
  { value: "ENTRADA", label: "Entrada / recepcion" },
  { value: "SALIDA", label: "Salida / ajuste negativo" }
];

function MovementCard({ item, onPress }) {
  const [imageUri, setImageUri] = useState(resolveImageUrl(item.imagen || item.image || ""));

  return (
    <SectionCard style={styles.card}>
      <View style={styles.cardRow}>
        <Image
          source={{ uri: imageUri || FALLBACK_IMAGE }}
          style={styles.image}
          onError={() => setImageUri(FALLBACK_IMAGE)}
        />
        <View style={styles.cardInfo}>
          <Text style={styles.title}>{item.nombre}</Text>
          <Text style={styles.meta}>ID: {item.id} | Categoria: {item.categoria || "N/A"}</Text>
          <Text style={styles.meta}>Precio: {formatPrice(Number(item.precio || 0))}</Text>
          <Text style={styles.meta}>Stock: {item.stock}</Text>
        </View>
      </View>
      <PrimaryButton label="Registrar movimiento" onPress={onPress} compact />
    </SectionCard>
  );
}

export default function MovementsScreen() {
  const { user, logout } = useAuthContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [movementForm, setMovementForm] = useState({
    tipo_movimiento: "ENTRADA",
    cantidad: "",
    id_documento: "",
    comentario: ""
  });

  const hasAccess = user?.id_rol === 1 || user?.id_rol === 2;

  const handleAuthError = useCallback(
    async (err) => {
      if (err?.status === 401 || err?.status === 403) {
        await logout();
        Alert.alert("Sesion expirada", "Inicia sesion nuevamente.");
        return true;
      }
      return false;
    },
    [logout]
  );

  const loadProducts = useCallback(async () => {
    if (!hasAccess) return;

    setLoading(true);
    setError("");
    try {
      const data = await getMovementProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      const consumed = await handleAuthError(err);
      if (!consumed) {
        setError(err.message || "No se pudo cargar el inventario.");
      }
    } finally {
      setLoading(false);
    }
  }, [handleAuthError, hasAccess]);

  React.useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return products;

    return products.filter((item) =>
      `${item.id} ${item.nombre} ${item.categoria}`.toLowerCase().includes(query)
    );
  }, [products, search]);

  const openMovementModal = (product) => {
    setSelectedProduct(product);
    setMovementForm({
      tipo_movimiento: "ENTRADA",
      cantidad: "",
      id_documento: "",
      comentario: ""
    });
  };

  const closeModal = () => {
    setSelectedProduct(null);
  };

  const saveMovement = async () => {
    if (!selectedProduct) return;

    const cantidad = Number(movementForm.cantidad);
    if (!cantidad || cantidad <= 0) {
      Alert.alert("Cantidad invalida", "Debes ingresar una cantidad positiva.");
      return;
    }

    if (movementForm.tipo_movimiento === "SALIDA" && cantidad > Number(selectedProduct.stock || 0)) {
      Alert.alert("Stock insuficiente", `Disponible: ${selectedProduct.stock}`);
      return;
    }

    if (!movementForm.id_documento.trim()) {
      Alert.alert("Documento requerido", "Ingresa un documento de referencia.");
      return;
    }

    try {
      await registerMovement({
        id_producto: selectedProduct.id,
        tipo_movimiento: movementForm.tipo_movimiento,
        cantidad,
        id_documento: movementForm.id_documento.trim(),
        comentario: movementForm.comentario.trim()
      });

      Alert.alert("Movimiento registrado", "Operacion completada con exito.");
      closeModal();
      loadProducts();
    } catch (err) {
      const consumed = await handleAuthError(err);
      if (!consumed) {
        Alert.alert("Error", err.message || "No se pudo registrar el movimiento.");
      }
    }
  };

  if (!hasAccess) {
    return (
      <ScreenLayout title="Movimientos" subtitle="Modulo disponible para administrador y empleado.">
        <SectionCard>
          <Text style={styles.errorText}>No tienes permiso para esta vista.</Text>
        </SectionCard>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="Registro de inventario" subtitle="Entradas y salidas de stock.">
      <SectionCard style={styles.controls}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por id, nombre o categoria..."
          placeholderTextColor="#8a95a8"
          style={styles.searchInput}
        />
        <PrimaryButton label={loading ? "Cargando..." : "Refrescar"} tone="secondary" onPress={loadProducts} compact />
      </SectionCard>

      {error ? (
        <SectionCard>
          <Text style={styles.errorText}>{error}</Text>
        </SectionCard>
      ) : null}

      <View style={styles.list}>
        {filteredProducts.map((item) => (
          <MovementCard
            key={String(item.id)}
            item={item}
            onPress={() => openMovementModal(item)}
          />
        ))}
      </View>

      <Modal visible={Boolean(selectedProduct)} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Movimiento - {selectedProduct?.nombre || ""}
            </Text>
            <View style={styles.modalForm}>
              <Text style={styles.label}>Tipo de movimiento</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={movementForm.tipo_movimiento}
                  onValueChange={(value) =>
                    setMovementForm((prev) => ({ ...prev, tipo_movimiento: value }))
                  }
                >
                  {MOVEMENT_TYPES.map((type) => (
                    <Picker.Item key={type.value} label={type.label} value={type.value} />
                  ))}
                </Picker>
              </View>

              <FormField
                label="Cantidad"
                value={movementForm.cantidad}
                onChangeText={(value) => setMovementForm((prev) => ({ ...prev, cantidad: value }))}
                keyboardType="numeric"
              />
              <FormField
                label="Documento referencia"
                value={movementForm.id_documento}
                onChangeText={(value) => setMovementForm((prev) => ({ ...prev, id_documento: value }))}
              />
              <FormField
                label="Comentario"
                value={movementForm.comentario}
                onChangeText={(value) => setMovementForm((prev) => ({ ...prev, comentario: value }))}
              />

              <PrimaryButton
                label={`Registrar ${movementForm.tipo_movimiento}`}
                onPress={saveMovement}
              />
              <PrimaryButton label="Cancelar" tone="neutral" onPress={closeModal} />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  controls: {
    gap: 10
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#c8d2e3",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: "#172033",
    backgroundColor: "#ffffff"
  },
  list: {
    gap: 10
  },
  card: {
    gap: 10
  },
  cardRow: {
    flexDirection: "row",
    gap: 10
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: "#e5ebf5"
  },
  cardInfo: {
    flex: 1,
    gap: 2
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2d42"
  },
  meta: {
    fontSize: 13,
    color: "#4f5f75"
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2d42"
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#c8d2e3",
    borderRadius: 10,
    backgroundColor: "#ffffff"
  },
  errorText: {
    color: "#b52d2d",
    fontWeight: "600"
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 16
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2d42",
    marginBottom: 8
  },
  modalForm: {
    gap: 10
  }
});
