import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import ScreenLayout from "../../components/ui/ScreenLayout";
import SectionCard from "../../components/ui/SectionCard";
import PrimaryButton from "../../components/ui/PrimaryButton";
import FormField from "../../components/ui/FormField";
import { useAuthContext } from "../../contexts/AuthContext";
import {
  createCrudProduct,
  deleteCrudProduct,
  getCrudProducts,
  updateCrudProduct
} from "../../lib/services/adminService";

const EMPTY_FORM = {
  id_productos: "",
  nombre: "",
  precio: "",
  id_categoria: "",
  id_proveedor: "",
  descripcion: "",
  estado: "Disponible",
  imagen: ""
};

function normalizeProductPayload(form) {
  return {
    nombre: form.nombre,
    precio: Number(form.precio || 0),
    id_categoria: form.id_categoria,
    id_proveedor: form.id_proveedor,
    descripcion: form.descripcion,
    estado: form.estado || "Disponible",
    imagen: form.imagen
  };
}

function parseProductId(rawId) {
  const parsed = Number(String(rawId || "").replace(/[^\d]/g, ""));
  return Number.isNaN(parsed) ? null : parsed;
}

export default function ProductsAdminScreen() {
  const { user, logout } = useAuthContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);

  const isAdmin = user?.id_rol === 1;

  const handleAuthError = useCallback(
    async (err) => {
      if (err?.status === 401 || err?.status === 403) {
        await logout();
        Alert.alert("Sesion expirada", "Inicia sesion otra vez.");
        return true;
      }
      return false;
    },
    [logout]
  );

  const loadProducts = useCallback(async () => {
    if (!isAdmin) return;

    setLoading(true);
    setError("");
    try {
      const data = await getCrudProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      const consumed = await handleAuthError(err);
      if (!consumed) {
        setError(err.message || "No se pudieron cargar los productos.");
      }
    } finally {
      setLoading(false);
    }
  }, [handleAuthError, isAdmin]);

  React.useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return products;

    return products.filter((item) =>
      `${item.id_productos} ${item.nombre} ${item.descripcion}`.toLowerCase().includes(query)
    );
  }, [products, search]);

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setIsEditing(false);
    setIsModalVisible(true);
  };

  const openEditModal = (product) => {
    setForm({
      id_productos: String(product.id_productos || ""),
      nombre: String(product.nombre || ""),
      precio: String(product.precio ?? ""),
      id_categoria: String(product.id_categoria || ""),
      id_proveedor: String(product.id_proveedor || ""),
      descripcion: String(product.descripcion || ""),
      estado: String(product.estado || "Disponible"),
      imagen: String(product.imagen || "")
    });
    setIsEditing(true);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setForm(EMPTY_FORM);
    setIsEditing(false);
  };

  const saveProduct = async () => {
    if (!form.nombre || !form.precio || !form.id_categoria || !form.id_proveedor) {
      Alert.alert("Campos faltantes", "Completa nombre, precio, categoria y proveedor.");
      return;
    }

    const payload = normalizeProductPayload(form);
    try {
      if (isEditing) {
        const parsedId = parseProductId(form.id_productos);
        if (!parsedId) {
          Alert.alert("ID invalido", "No se pudo identificar el producto a editar.");
          return;
        }
        await updateCrudProduct(parsedId, payload);
        Alert.alert("Actualizado", "Producto actualizado correctamente.");
      } else {
        await createCrudProduct(payload);
        Alert.alert("Creado", "Producto agregado correctamente.");
      }

      closeModal();
      loadProducts();
    } catch (err) {
      const consumed = await handleAuthError(err);
      if (!consumed) {
        Alert.alert("Error", err.message || "No se pudo guardar el producto.");
      }
    }
  };

  const handleDelete = async (rawId) => {
    const parsedId = parseProductId(rawId);
    if (!parsedId) {
      Alert.alert("ID invalido", "No se pudo identificar el producto.");
      return;
    }

    Alert.alert("Eliminar producto", `Se eliminara el producto ${parsedId}.`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCrudProduct(parsedId);
            Alert.alert("Eliminado", `Producto ${parsedId} eliminado.`);
            loadProducts();
          } catch (err) {
            const consumed = await handleAuthError(err);
            if (!consumed) {
              Alert.alert("Error", err.message || "No se pudo eliminar.");
            }
          }
        }
      }
    ]);
  };

  if (!isAdmin) {
    return (
      <ScreenLayout title="Productos" subtitle="Modulo solo para administradores.">
        <SectionCard>
          <Text style={styles.errorText}>No tienes permiso para esta vista.</Text>
        </SectionCard>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="Productos (Admin)" subtitle="CRUD de productos y stock base.">
      <SectionCard style={styles.controls}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por id, nombre o descripcion..."
          placeholderTextColor="#8a95a8"
          style={styles.searchInput}
        />
        <PrimaryButton label="Agregar producto" onPress={openCreateModal} compact />
        <PrimaryButton label={loading ? "Cargando..." : "Refrescar"} tone="secondary" onPress={loadProducts} compact />
      </SectionCard>

      {error ? (
        <SectionCard>
          <Text style={styles.errorText}>{error}</Text>
        </SectionCard>
      ) : null}

      <View style={styles.list}>
        {filteredProducts.map((product) => (
          <SectionCard key={String(product.id_productos)} style={styles.productCard}>
            <Text style={styles.productTitle}>
              #{product.id_productos} - {product.nombre}
            </Text>
            <Text style={styles.productMeta}>Precio: {product.precio}</Text>
            <Text style={styles.productMeta}>Categoria: {product.id_categoria}</Text>
            <Text style={styles.productMeta}>Proveedor: {product.id_proveedor}</Text>
            <Text style={styles.productMeta}>Estado: {product.estado}</Text>
            <Text style={styles.productMeta}>Descripcion: {product.descripcion || "N/A"}</Text>
            <View style={styles.actionsRow}>
              <PrimaryButton label="Editar" tone="secondary" compact onPress={() => openEditModal(product)} />
              <PrimaryButton label="Eliminar" tone="danger" compact onPress={() => handleDelete(product.id_productos)} />
            </View>
          </SectionCard>
        ))}
      </View>

      <Modal visible={isModalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{isEditing ? "Editar producto" : "Nuevo producto"}</Text>
            <ScrollView contentContainerStyle={styles.modalForm}>
              {isEditing ? (
                <FormField
                  label="ID"
                  value={form.id_productos}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, id_productos: value }))}
                  editable={false}
                />
              ) : null}
              <FormField label="Nombre" value={form.nombre} onChangeText={(value) => setForm((prev) => ({ ...prev, nombre: value }))} />
              <FormField
                label="Precio"
                value={form.precio}
                onChangeText={(value) => setForm((prev) => ({ ...prev, precio: value }))}
                keyboardType="numeric"
              />
              <FormField
                label="Categoria (ID)"
                value={form.id_categoria}
                onChangeText={(value) => setForm((prev) => ({ ...prev, id_categoria: value }))}
              />
              <FormField
                label="Proveedor (ID)"
                value={form.id_proveedor}
                onChangeText={(value) => setForm((prev) => ({ ...prev, id_proveedor: value }))}
              />
              <FormField
                label="Descripcion"
                value={form.descripcion}
                onChangeText={(value) => setForm((prev) => ({ ...prev, descripcion: value }))}
              />
              <FormField
                label="Estado"
                value={form.estado}
                onChangeText={(value) => setForm((prev) => ({ ...prev, estado: value }))}
                placeholder="Disponible o Agotado"
              />
              <FormField
                label="Imagen"
                value={form.imagen}
                onChangeText={(value) => setForm((prev) => ({ ...prev, imagen: value }))}
                placeholder="Ruta o URL"
              />
              <PrimaryButton label={isEditing ? "Guardar cambios" : "Crear producto"} onPress={saveProduct} />
              <PrimaryButton label="Cancelar" tone="neutral" onPress={closeModal} />
            </ScrollView>
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
  productCard: {
    gap: 6
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2d42"
  },
  productMeta: {
    fontSize: 13,
    color: "#4f5f75"
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap"
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
    maxHeight: "90%",
    padding: 14
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2d42",
    marginBottom: 8
  },
  modalForm: {
    gap: 10,
    paddingBottom: 8
  }
});
