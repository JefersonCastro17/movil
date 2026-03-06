import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import ScreenLayout from "../../components/ui/ScreenLayout";
import SectionCard from "../../components/ui/SectionCard";
import PrimaryButton from "../../components/ui/PrimaryButton";
import { useAuthContext } from "../../contexts/AuthContext";

function getRoleLabel(roleId) {
  if (roleId === 1) return "Administrador";
  if (roleId === 2) return "Empleado";
  return "Cliente";
}

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { user, logout, getUserName } = useAuthContext();

  const modules = useMemo(() => {
    const baseModules = [
      {
        id: "inventario",
        title: "Gestion de inventario",
        detail:
          user?.id_rol === 1
            ? "CRUD completo de productos."
            : "Registro de entradas y salidas de inventario.",
        action: user?.id_rol === 1 ? () => navigation.navigate("ProductosAdmin") : () => navigation.navigate("Movimientos")
      },
      {
        id: "reportes",
        title: "Reportes de ventas",
        detail: "KPI, top de productos y resumen mensual.",
        action: () => navigation.navigate("Estadisticas")
      },
      {
        id: "catalogo",
        title: "Catalogo y carrito",
        detail: "Flujo de venta directo desde dispositivo movil.",
        action: () => navigation.navigate("Catalogo")
      }
    ];

    if (user?.id_rol === 1) {
      baseModules.splice(1, 0, {
        id: "usuarios",
        title: "Gestion de usuarios",
        detail: "Crear, editar y eliminar usuarios del sistema.",
        action: () => navigation.navigate("UsuariosAdmin")
      });
    }

    return baseModules;
  }, [navigation, user?.id_rol]);

  return (
    <ScreenLayout
      title={`Panel de ${getRoleLabel(user?.id_rol)}`}
      subtitle={`Bienvenido ${getUserName()}`}
    >
      <SectionCard>
        <Text style={styles.sectionTitle}>Accesos rapidos</Text>
        <View style={styles.moduleList}>
          {modules.map((module) => (
            <SectionCard key={module.id} style={styles.moduleCard}>
              <Text style={styles.moduleTitle}>{module.title}</Text>
              <Text style={styles.moduleDetail}>{module.detail}</Text>
              <PrimaryButton label="Abrir modulo" onPress={module.action} compact />
            </SectionCard>
          ))}
        </View>
      </SectionCard>

      <PrimaryButton label="Cerrar sesion" tone="danger" onPress={logout} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1f2d42"
  },
  moduleList: {
    gap: 10
  },
  moduleCard: {
    gap: 8
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2d42"
  },
  moduleDetail: {
    color: "#4f5f75"
  }
});
