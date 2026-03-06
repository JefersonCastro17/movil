import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Image, StyleSheet, Text, TextInput, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import ScreenLayout from "../../components/ui/ScreenLayout";
import SectionCard from "../../components/ui/SectionCard";
import PrimaryButton from "../../components/ui/PrimaryButton";
import { useCartContext } from "../../contexts/CartContext";
import { useAuthContext } from "../../contexts/AuthContext";
import { getCategories, getProducts, formatPrice } from "../../lib/services/productService";
import { FALLBACK_IMAGE, resolveImageUrl } from "../../lib/services/imageUtils";
import { COLORS } from "../../theme/colors";

const EMPTY_FILTERS = {
  nombre: "",
  categoria: "todas",
  precioMin: "",
  precioMax: ""
};

function ProductCard({ product, onAdd }) {
  const [imageUri, setImageUri] = useState(
    resolveImageUrl(product.image || product.imagen || "")
  );

  return (
    <SectionCard style={styles.productCard}>
      <Image
        source={{ uri: imageUri || FALLBACK_IMAGE }}
        style={styles.productImage}
        resizeMode="cover"
        onError={() => setImageUri(FALLBACK_IMAGE)}
      />
      <Text style={styles.productName}>{product.nombre || product.name || "Producto"}</Text>
      <Text style={styles.productMeta}>Categoria: {product.category || product.categoria || "N/A"}</Text>
      <Text style={styles.productPrice}>{formatPrice(Number(product.price || product.precio || 0))}</Text>
      <PrimaryButton
        label="Agregar al carrito"
        onPress={() =>
          onAdd({
            ...product,
            id: product.id,
            nombre: product.nombre || product.name || "Producto",
            price: Number(product.price ?? product.precio ?? 0),
            image: product.image || product.imagen || ""
          })
        }
        compact
      />
    </SectionCard>
  );
}

export default function InventoryScreen() {
  const navigation = useNavigation();
  const { addToCart, totalItems } = useCartContext();
  const { user, logout } = useAuthContext();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([{ value: "todas", label: "Todas las categorias" }]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const handleUnauthorized = useCallback(async () => {
    await logout();
    Alert.alert("Sesion expirada", "Inicia sesion nuevamente.");
  }, [logout]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await getCategories();
      const cats = Array.isArray(response) ? response : [];
      const mapped = cats.map((item) => ({
        value: item.value || item.id || item.codigo || item.nombre || item.label,
        label: item.label || item.nombre || String(item.value || item.id || "Categoria")
      }));
      setCategories([{ value: "todas", label: "Todas las categorias" }, ...mapped]);
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        await handleUnauthorized();
      }
    }
  }, [handleUnauthorized]);

  const fetchProducts = useCallback(
    async (activeFilters) => {
      setIsLoading(true);
      setError("");
      try {
        const response = await getProducts(activeFilters);
        setProducts(Array.isArray(response) ? response : []);
      } catch (err) {
        if (err?.status === 401 || err?.status === 403) {
          await handleUnauthorized();
          return;
        }
        setError(err.message || "No se pudieron cargar productos.");
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    },
    [handleUnauthorized]
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts(filters);
    }, filters.nombre ? 350 : 0);

    return () => clearTimeout(timeoutId);
  }, [filters, fetchProducts]);

  const visibleCategoryCount = useMemo(
    () => categories.filter((item) => item.value !== "todas").length,
    [categories]
  );

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <ScreenLayout
      title="Catalogo"
      subtitle={`Productos: ${isLoading ? "-" : products.length} | Categorias: ${visibleCategoryCount}`}
    >
      <SectionCard style={styles.actionsCard}>
        <View style={styles.rowGap}>
          <PrimaryButton label={`Carrito (${totalItems})`} onPress={() => navigation.navigate("Carrito")} compact />
          {user?.id_rol === 1 || user?.id_rol === 2 ? (
            <PrimaryButton label="Panel" tone="secondary" onPress={() => navigation.navigate("Dashboard")} compact />
          ) : null}
          <PrimaryButton label="Cerrar sesion" tone="danger" onPress={logout} compact />
        </View>
      </SectionCard>

      <SectionCard style={styles.filterCard}>
        <Text style={styles.sectionTitle}>Filtros</Text>
        <TextInput
          value={filters.nombre}
          onChangeText={(value) => setFilter("nombre", value)}
          placeholder="Buscar por nombre..."
          placeholderTextColor={COLORS.placeholder}
          style={styles.input}
        />
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={filters.categoria}
            onValueChange={(value) => setFilter("categoria", value)}
          >
            {categories.map((cat) => (
              <Picker.Item key={String(cat.value)} label={cat.label} value={cat.value} />
            ))}
          </Picker>
        </View>
        <View style={styles.rowGap}>
          <TextInput
            value={String(filters.precioMin)}
            onChangeText={(value) => setFilter("precioMin", value)}
            placeholder="Precio min"
            placeholderTextColor={COLORS.placeholder}
            keyboardType="numeric"
            style={[styles.input, styles.flexInput]}
          />
          <TextInput
            value={String(filters.precioMax)}
            onChangeText={(value) => setFilter("precioMax", value)}
            placeholder="Precio max"
            placeholderTextColor={COLORS.placeholder}
            keyboardType="numeric"
            style={[styles.input, styles.flexInput]}
          />
        </View>
        <PrimaryButton label="Limpiar filtros" tone="neutral" onPress={() => setFilters(EMPTY_FILTERS)} compact />
      </SectionCard>

      {error ? (
        <SectionCard>
          <Text style={styles.errorText}>{error}</Text>
        </SectionCard>
      ) : null}

      <View style={styles.productList}>
        {isLoading ? (
          <SectionCard>
            <Text style={styles.loadingText}>Cargando productos...</Text>
          </SectionCard>
        ) : products.length ? (
          products.map((product) => (
            <ProductCard key={String(product.id)} product={product} onAdd={addToCart} />
          ))
        ) : (
          <SectionCard>
            <Text style={styles.emptyText}>No hay productos para los filtros actuales.</Text>
          </SectionCard>
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  actionsCard: {
    padding: 10
  },
  rowGap: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap"
  },
  filterCard: {
    gap: 10
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: COLORS.text,
    backgroundColor: COLORS.inputBackground
  },
  flexInput: {
    flex: 1
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.inputBackground
  },
  productList: {
    gap: 10
  },
  productCard: {
    gap: 8
  },
  productImage: {
    width: "100%",
    height: 170,
    borderRadius: 10,
    backgroundColor: COLORS.background
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text
  },
  productMeta: {
    fontSize: 13,
    color: COLORS.textMuted
  },
  productPrice: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.primary
  },
  loadingText: {
    textAlign: "center",
    color: COLORS.textMuted,
    fontWeight: "600"
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.textMuted
  },
  errorText: {
    color: COLORS.danger,
    fontWeight: "600"
  }
});
