import React, { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import ScreenLayout from "../../components/ui/ScreenLayout";
import SectionCard from "../../components/ui/SectionCard";
import FormField from "../../components/ui/FormField";
import PrimaryButton from "../../components/ui/PrimaryButton";
import { registerRequest } from "../../lib/services/authService";
import { COLORS } from "../../theme/colors";

const INITIAL_FORM = {
  nombre: "",
  apellido: "",
  email: "",
  password: "",
  direccion: "",
  fecha_nacimiento: "",
  id_rol: 3,
  id_tipo_identificacion: "1",
  numero_identificacion: ""
};

export default function RegisterScreen() {
  const navigation = useNavigation();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      formData.nombre &&
      formData.apellido &&
      formData.email &&
      formData.password &&
      formData.direccion &&
      formData.fecha_nacimiento &&
      formData.id_tipo_identificacion &&
      formData.numero_identificacion
    );
  }, [formData]);

  const setField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert("Campos faltantes", "Completa todos los datos.");
      return;
    }

    const nacimiento = new Date(formData.fecha_nacimiento);
    const hoy = new Date();
    const edad = hoy.getFullYear() - nacimiento.getFullYear();

    if (Number.isNaN(nacimiento.getTime()) || edad < 10) {
      Alert.alert("Fecha invalida", "Debes tener al menos 10 anos. Formato: YYYY-MM-DD.");
      return;
    }

    setLoading(true);
    try {
      const data = await registerRequest(formData);
      if (!data?.success) {
        Alert.alert("No se registro", data?.message || "Error al registrar usuario.");
        return;
      }

      Alert.alert("Registro exitoso", data?.message || "Revisa tu correo para verificar.");
      navigation.navigate("Verificar", { email: formData.email });
    } catch (error) {
      Alert.alert("Error", error.message || "No fue posible registrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Registro" subtitle="Crea tu cuenta de cliente en Mercapleno.">
      <SectionCard style={styles.card}>
        <FormField label="Nombre" value={formData.nombre} onChangeText={(value) => setField("nombre", value)} />
        <FormField label="Apellido" value={formData.apellido} onChangeText={(value) => setField("apellido", value)} />
        <View style={styles.group}>
          <Text style={styles.label}>Tipo de identificacion</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={formData.id_tipo_identificacion}
              onValueChange={(value) => setField("id_tipo_identificacion", value)}
            >
              <Picker.Item label="Cedula de ciudadania" value="1" />
              <Picker.Item label="Tarjeta de identidad" value="2" />
              <Picker.Item label="Cedula de extranjeria" value="3" />
            </Picker>
          </View>
        </View>

        <FormField
          label="Numero de identificacion"
          value={formData.numero_identificacion}
          onChangeText={(value) => setField("numero_identificacion", value)}
        />
        <FormField
          label="Fecha de nacimiento (YYYY-MM-DD)"
          value={formData.fecha_nacimiento}
          onChangeText={(value) => setField("fecha_nacimiento", value)}
          placeholder="2000-12-31"
        />
        <FormField
          label="Correo electronico"
          value={formData.email}
          onChangeText={(value) => setField("email", value)}
          keyboardType="email-address"
        />
        <FormField label="Direccion" value={formData.direccion} onChangeText={(value) => setField("direccion", value)} />
        <FormField
          label="Contrasena"
          value={formData.password}
          onChangeText={(value) => setField("password", value)}
          secureTextEntry
        />

        <PrimaryButton label={loading ? "Registrando..." : "Crear cuenta"} onPress={handleSubmit} disabled={loading} />
      </SectionCard>

      <View style={styles.links}>
        <Pressable onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>Ya tienes cuenta? Inicia sesion</Text>
        </Pressable>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12
  },
  group: {
    gap: 6
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.inputBackground
  },
  links: {
    alignItems: "center"
  },
  link: {
    color: COLORS.primary,
    fontWeight: "600"
  }
});
