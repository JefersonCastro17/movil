import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthContext } from "../contexts/AuthContext";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import VerifyScreen from "../screens/auth/VerifyScreen";
import RecoverScreen from "../screens/auth/RecoverScreen";
import InventoryScreen from "../screens/shop/InventoryScreen";
import CartScreen from "../screens/shop/CartScreen";
import TicketScreen from "../screens/shop/TicketScreen";
import DashboardScreen from "../screens/admin/DashboardScreen";
import ProductsAdminScreen from "../screens/admin/ProductsAdminScreen";
import MovementsScreen from "../screens/admin/MovementsScreen";
import UsersAdminScreen from "../screens/admin/UsersAdminScreen";
import StatsScreen from "../screens/admin/StatsScreen";
import { COLORS } from "../theme/colors";

const AuthStack = createNativeStackNavigator();
const PrivateStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Registro" component={RegisterScreen} />
      <AuthStack.Screen name="Verificar" component={VerifyScreen} />
      <AuthStack.Screen name="Recuperar" component={RecoverScreen} />
    </AuthStack.Navigator>
  );
}

function PrivateNavigator() {
  const { user } = useAuthContext();
  const homeRoute = user?.id_rol === 3 ? "Catalogo" : "Dashboard";

  return (
    <PrivateStack.Navigator
      key={homeRoute}
      initialRouteName={homeRoute}
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.card,
        headerTitleStyle: { fontWeight: "700" }
      }}
    >
      <PrivateStack.Screen name="Catalogo" component={InventoryScreen} />
      <PrivateStack.Screen name="Carrito" component={CartScreen} />
      <PrivateStack.Screen name="Ticket" component={TicketScreen} />
      <PrivateStack.Screen name="Dashboard" component={DashboardScreen} />
      <PrivateStack.Screen name="ProductosAdmin" component={ProductsAdminScreen} options={{ title: "Productos" }} />
      <PrivateStack.Screen name="Movimientos" component={MovementsScreen} options={{ title: "Movimientos" }} />
      <PrivateStack.Screen name="UsuariosAdmin" component={UsersAdminScreen} options={{ title: "Usuarios" }} />
      <PrivateStack.Screen name="Estadisticas" component={StatsScreen} options={{ title: "Estadisticas" }} />
    </PrivateStack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated } = useAuthContext();
  return isAuthenticated ? <PrivateNavigator /> : <AuthNavigator />;
}
