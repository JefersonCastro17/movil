import React, { useCallback, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import ScreenLayout from "../../components/ui/ScreenLayout";
import SectionCard from "../../components/ui/SectionCard";
import PrimaryButton from "../../components/ui/PrimaryButton";
import { useAuthContext } from "../../contexts/AuthContext";
import {
  formatPrice,
  getResumen,
  getResumenMes,
  getTopProductos,
  getVentasMes
} from "../../lib/services/reportesService";

function safeNumber(value) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatRange(inicio, fin) {
  if (!inicio && !fin) return "Todo el periodo";
  return `${inicio || "inicio"} a ${fin || "hoy"}`;
}

export default function StatsScreen() {
  const { user, logout } = useAuthContext();
  const [ventasMes, setVentasMes] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [resumen, setResumen] = useState({ dinero_total: 0, total_ventas: 0, promedio: 0 });
  const [resumenMes, setResumenMes] = useState([]);
  const [mesInicio, setMesInicio] = useState("");
  const [mesFin, setMesFin] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const hasAccess = user?.id_rol === 1 || user?.id_rol === 2;

  const loadStats = useCallback(async () => {
    if (!hasAccess) return;

    setLoading(true);
    try {
      const [rVentasMes, rTopProductos, rResumen, rResumenMes] = await Promise.all([
        getVentasMes(mesInicio, mesFin),
        getTopProductos(),
        getResumen(),
        getResumenMes()
      ]);

      setVentasMes(Array.isArray(rVentasMes) ? rVentasMes : []);
      setTopProductos(Array.isArray(rTopProductos) ? rTopProductos : []);
      setResumen({
        dinero_total: safeNumber(rResumen?.dinero_total),
        total_ventas: safeNumber(rResumen?.total_ventas),
        promedio: safeNumber(rResumen?.promedio)
      });
      setResumenMes(Array.isArray(rResumenMes) ? rResumenMes : []);
      setLastUpdated(new Date());
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        await logout();
        Alert.alert("Sesion expirada", "Inicia sesion de nuevo.");
      } else {
        Alert.alert("Error", err.message || "No se pudieron cargar los reportes.");
      }
    } finally {
      setLoading(false);
    }
  }, [hasAccess, logout, mesFin, mesInicio]);

  React.useEffect(() => {
    loadStats();
  }, [loadStats]);

  const ventasOrdenadas = useMemo(() => {
    return [...ventasMes].sort((a, b) => String(a.mes).localeCompare(String(b.mes)));
  }, [ventasMes]);

  const totalPeriodo = useMemo(
    () => ventasOrdenadas.reduce((acc, item) => acc + safeNumber(item.total), 0),
    [ventasOrdenadas]
  );

  const promedioMensual = useMemo(() => {
    if (!ventasOrdenadas.length) return 0;
    return totalPeriodo / ventasOrdenadas.length;
  }, [totalPeriodo, ventasOrdenadas.length]);

  const bestMonth = useMemo(() => {
    if (!ventasOrdenadas.length) return { mes: "-", total: 0 };
    return ventasOrdenadas.reduce(
      (best, current) => (safeNumber(current.total) > safeNumber(best.total) ? current : best),
      ventasOrdenadas[0]
    );
  }, [ventasOrdenadas]);

  const topProducto = useMemo(() => {
    if (!topProductos.length) return null;
    return [...topProductos]
      .sort((a, b) => safeNumber(b.total_vendido) - safeNumber(a.total_vendido))
      .at(0);
  }, [topProductos]);

  if (!hasAccess) {
    return (
      <ScreenLayout title="Estadisticas" subtitle="Modulo para administradores y empleados.">
        <SectionCard>
          <Text style={styles.errorText}>No tienes permiso para esta vista.</Text>
        </SectionCard>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title="Estadisticas de ventas"
      subtitle={`Rango: ${formatRange(mesInicio, mesFin)} | Actualizado: ${lastUpdated ? lastUpdated.toLocaleString("es-CO") : "Sin datos"}`}
    >
      <SectionCard style={styles.filterCard}>
        <Text style={styles.label}>Mes inicio (YYYY-MM)</Text>
        <TextInput
          value={mesInicio}
          onChangeText={setMesInicio}
          placeholder="2026-01"
          placeholderTextColor="#8a95a8"
          style={styles.input}
        />
        <Text style={styles.label}>Mes fin (YYYY-MM)</Text>
        <TextInput
          value={mesFin}
          onChangeText={setMesFin}
          placeholder="2026-12"
          placeholderTextColor="#8a95a8"
          style={styles.input}
        />
        <View style={styles.row}>
          <PrimaryButton label={loading ? "Actualizando..." : "Actualizar"} onPress={loadStats} compact />
          <PrimaryButton
            label="Limpiar filtros"
            tone="neutral"
            compact
            onPress={() => {
              setMesInicio("");
              setMesFin("");
            }}
          />
        </View>
      </SectionCard>

      <View style={styles.kpiGrid}>
        <SectionCard style={styles.kpiCard}>
          <Text style={styles.kpiTitle}>Ingresos totales</Text>
          <Text style={styles.kpiValue}>{formatPrice(resumen.dinero_total)}</Text>
        </SectionCard>
        <SectionCard style={styles.kpiCard}>
          <Text style={styles.kpiTitle}>Total ventas</Text>
          <Text style={styles.kpiValue}>{resumen.total_ventas}</Text>
        </SectionCard>
        <SectionCard style={styles.kpiCard}>
          <Text style={styles.kpiTitle}>Ticket promedio</Text>
          <Text style={styles.kpiValue}>{formatPrice(resumen.promedio)}</Text>
        </SectionCard>
        <SectionCard style={styles.kpiCard}>
          <Text style={styles.kpiTitle}>Mejor mes</Text>
          <Text style={styles.kpiValue}>{bestMonth.mes || "-"}</Text>
          <Text style={styles.kpiSub}>{formatPrice(safeNumber(bestMonth.total))}</Text>
        </SectionCard>
      </View>

      <SectionCard>
        <Text style={styles.sectionTitle}>Resumen de periodo</Text>
        <Text style={styles.itemText}>Total periodo: {formatPrice(totalPeriodo)}</Text>
        <Text style={styles.itemText}>Promedio mensual: {formatPrice(promedioMensual)}</Text>
        <Text style={styles.itemText}>
          Top producto: {topProducto?.nombre || "-"} ({safeNumber(topProducto?.total_vendido)})
        </Text>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Ventas por mes</Text>
        {ventasOrdenadas.length ? (
          ventasOrdenadas.map((item, index) => (
            <View key={`${item.mes}-${index}`} style={styles.rowBetween}>
              <Text style={styles.itemText}>{item.mes}</Text>
              <Text style={styles.itemText}>{formatPrice(safeNumber(item.total))}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.itemText}>Sin datos para el rango actual.</Text>
        )}
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Top productos</Text>
        {topProductos.length ? (
          topProductos.map((item, index) => (
            <View key={`${item.nombre}-${index}`} style={styles.rowBetween}>
              <Text style={styles.itemText}>{item.nombre}</Text>
              <Text style={styles.itemText}>{safeNumber(item.total_vendido)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.itemText}>Sin datos.</Text>
        )}
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Resumen mensual</Text>
        {resumenMes.length ? (
          resumenMes.map((item, index) => (
            <View key={`${item.mes}-${index}`} style={styles.rowBetween}>
              <Text style={styles.itemText}>{item.mes}</Text>
              <Text style={styles.itemText}>
                {safeNumber(item.cantidad_ventas)} ventas | {formatPrice(safeNumber(item.total_mes))}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.itemText}>Sin datos.</Text>
        )}
      </SectionCard>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  filterCard: {
    gap: 8
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2d42"
  },
  input: {
    borderWidth: 1,
    borderColor: "#c8d2e3",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: "#172033",
    backgroundColor: "#ffffff"
  },
  row: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap"
  },
  kpiGrid: {
    gap: 10
  },
  kpiCard: {
    gap: 2
  },
  kpiTitle: {
    color: "#4f5f75",
    fontSize: 13
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2d42"
  },
  kpiSub: {
    color: "#0a5c36",
    fontWeight: "600"
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2d42"
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  itemText: {
    fontSize: 14,
    color: "#1f2d42"
  },
  errorText: {
    color: "#b52d2d",
    fontWeight: "600"
  }
});
