import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import ScreenLayout from "../../components/ui/ScreenLayout";
import SectionCard from "../../components/ui/SectionCard";
import FormField from "../../components/ui/FormField";
import PrimaryButton from "../../components/ui/PrimaryButton";
import { useAuthContext } from "../../contexts/AuthContext";
import { loginRequest } from "../../lib/services/authService";
import { COLORS } from "../../theme/colors";
import { API_URL } from "../../lib/config/env";

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuthContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [requireCode, setRequireCode] = useState(false);
  const [expectedCode, setExpectedCode] = useState("");
  const [userToVerify, setUserToVerify] = useState(null);
  const [tokenToVerify, setTokenToVerify] = useState(null);
  const [loading, setLoading] = useState(false);

  const finishLogin = async () => {
    if (!userToVerify || !tokenToVerify) {
      Alert.alert("Error", "No se encontro la sesion para validar.");
      return;
    }

    await login(userToVerify, tokenToVerify);
    Alert.alert("Listo", "Inicio de sesion exitoso.");
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Datos incompletos", "Debes ingresar correo y contrasena.");
      return;
    }

    setLoading(true);

    try {
      if (requireCode) {
        if (securityCode !== expectedCode) {
          Alert.alert("Codigo invalido", "El codigo de seguridad no coincide.");
          return;
        }
        await finishLogin();
        return;
      }

      const data = await loginRequest({ email, password });
      if (!data?.success) {
        Alert.alert("Ingreso fallido", data?.message || "Credenciales incorrectas.");
        return;
      }

      setUserToVerify(data.user);
      setTokenToVerify(data.token);

      if (data.user?.id_rol === 1) {
        setExpectedCode("123");
        setRequireCode(true);
        Alert.alert("Validacion", "Usuario ADMIN: ingresa codigo 123.");
        return;
      }

      if (data.user?.id_rol === 2) {
        setExpectedCode("456");
        setRequireCode(true);
        Alert.alert("Validacion", "Usuario EMPLEADO: ingresa codigo 456.");
        return;
      }

      await login(data.user, data.token);
      Alert.alert("Listo", "Inicio de sesion exitoso.");
    } catch (error) {
      if (error?.status === 403 && error?.data?.code === "EMAIL_NOT_VERIFIED") {
        Alert.alert("Correo sin verificar", "Debes verificar tu correo primero.");
        navigation.navigate("Verificar", { email });
      } else {
        Alert.alert("Error", error.message || "No fue posible iniciar sesion.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Mercapleno" subtitle="Accede a tu cuenta y administra ventas o compras.">
      <SectionCard style={styles.card}>
        <FormField
          label="Correo electronico"
          value={email}
          onChangeText={setEmail}
          placeholder="usuario@correo.com"
          keyboardType="email-address"
          editable={!requireCode}
        />
        <FormField
          label="Contrasena"
          value={password}
          onChangeText={setPassword}
          placeholder="Tu contrasena"
          secureTextEntry
          editable={!requireCode}
        />
        {requireCode ? (
          <FormField
            label="Codigo de seguridad"
            value={securityCode}
            onChangeText={setSecurityCode}
            placeholder="Codigo de validacion"
          />
        ) : null}

        <PrimaryButton
          label={loading ? "Procesando..." : requireCode ? "Validar codigo" : "Ingresar"}
          onPress={handleSubmit}
          disabled={loading}
        />
      </SectionCard>

      <View style={styles.links}>
        <Pressable onPress={() => navigation.navigate("Recuperar")}>
          <Text style={styles.link}>Olvide mi contrasena</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("Registro")}>
          <Text style={styles.link}>Crear cuenta nueva</Text>
        </Pressable>
        <Text style={styles.apiInfo}>API: {API_URL}</Text>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12
  },
  links: {
    gap: 8,
    alignItems: "center"
  },
  link: {
    color: COLORS.primary,
    fontWeight: "600"
  },
  apiInfo: {
    marginTop: 8,
    fontSize: 11,
    color: COLORS.textMuted
  }
});
