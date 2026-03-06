import "react-native-gesture-handler";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuthContext } from "./src/contexts/AuthContext";
import { CartProvider } from "./src/contexts/CartContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { COLORS } from "./src/theme/colors";

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    card: COLORS.card,
    primary: COLORS.primary,
    text: COLORS.text,
    border: COLORS.border
  }
};

function BootstrapGate() {
  const { isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return <AppNavigator />;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style="light" />
          <BootstrapGate />
        </NavigationContainer>
      </CartProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background
  }
});
