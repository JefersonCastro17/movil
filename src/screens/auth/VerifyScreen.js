import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import ScreenLayout from "../../components/ui/ScreenLayout";
import SectionCard from "../../components/ui/SectionCard";
import FormField from "../../components/ui/FormField";
import PrimaryButton from "../../components/ui/PrimaryButton";
import {
  resendVerificationRequest,
  verifyEmailRequest
} from "../../lib/services/authService";
import { COLORS } from "../../theme/colors";

export default function VerifyScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [email, setEmail] = useState(route.params?.email || "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!email || !code) {
      Alert.alert("Campos faltantes", "Ingresa correo y codigo.");
      return;
    }

    setLoading(true);
    try {
      const data = await verifyEmailRequest({ email, code });
      if (!data?.success) {
        Alert.alert("No verificado", data?.message || "No se pudo validar el correo.");
        return;
      }

      Alert.alert("Correo verificado", data?.message || "Tu cuenta ya esta lista.");
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert("Error", error.message || "No fue posible verificar.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      Alert.alert("Correo requerido", "Ingresa el correo para reenviar codigo.");
      return;
    }

    setLoading(true);
    try {
      const data = await resendVerificationRequest({ email });
      if (!data?.success) {
        Alert.alert("Error", data?.message || "No se pudo reenviar el codigo.");
        return;
      }
      Alert.alert("Codigo reenviado", data?.message || "Revisa tu correo.");
    } catch (error) {
      Alert.alert("Error", error.message || "No fue posible reenviar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Verificar correo" subtitle="Confirma tu cuenta con el codigo enviado.">
      <SectionCard style={styles.card}>
        <FormField
          label="Correo electronico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <FormField label="Codigo de verificacion" value={code} onChangeText={setCode} />

        <PrimaryButton label={loading ? "Verificando..." : "Verificar"} onPress={handleVerify} disabled={loading} />
        <PrimaryButton
          label="Reenviar codigo"
          onPress={handleResend}
          disabled={loading}
          tone="secondary"
        />
      </SectionCard>

      <View style={styles.links}>
        <Pressable onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>Volver a iniciar sesion</Text>
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
