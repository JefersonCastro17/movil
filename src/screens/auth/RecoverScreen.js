import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import ScreenLayout from "../../components/ui/ScreenLayout";
import SectionCard from "../../components/ui/SectionCard";
import FormField from "../../components/ui/FormField";
import PrimaryButton from "../../components/ui/PrimaryButton";
import {
  requestPasswordReset,
  resetPasswordRequest
} from "../../lib/services/authService";
import { COLORS } from "../../theme/colors";

export default function RecoverScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    if (!email) {
      Alert.alert("Correo requerido", "Ingresa tu correo.");
      return;
    }

    setLoading(true);
    try {
      const data = await requestPasswordReset({ email });
      if (!data?.success) {
        Alert.alert("Error", data?.message || "No se pudo enviar el codigo.");
        return;
      }

      Alert.alert("Codigo enviado", data?.message || "Revisa tu correo.");
      setStep("reset");
    } catch (error) {
      Alert.alert("Error", error.message || "No fue posible enviar el codigo.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email || !code || !newPassword || !confirmPassword) {
      Alert.alert("Campos faltantes", "Completa todos los campos.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Validacion", "Las contrasenas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const data = await resetPasswordRequest({ email, code, newPassword });
      if (!data?.success) {
        Alert.alert("Error", data?.message || "No se pudo actualizar la contrasena.");
        return;
      }
      Alert.alert("Listo", data?.message || "Contrasena actualizada.");
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert("Error", error.message || "No fue posible actualizar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout
      title="Recuperar contrasena"
      subtitle="Solicita codigo y actualiza tu contrasena."
    >
      <SectionCard style={styles.card}>
        <FormField
          label="Correo electronico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        {step === "reset" ? (
          <>
            <FormField label="Codigo recibido" value={code} onChangeText={setCode} />
            <FormField
              label="Nueva contrasena"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <FormField
              label="Confirmar contrasena"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </>
        ) : null}

        <PrimaryButton
          label={
            loading
              ? "Procesando..."
              : step === "request"
                ? "Enviar codigo"
                : "Actualizar contrasena"
          }
          onPress={step === "request" ? handleRequest : handleReset}
          disabled={loading}
        />
      </SectionCard>

      <View style={styles.links}>
        <Pressable onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>Volver a login</Text>
        </Pressable>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12
  },
  links: {
    alignItems: "center"
  },
  link: {
    color: COLORS.primary,
    fontWeight: "600"
  }
});
