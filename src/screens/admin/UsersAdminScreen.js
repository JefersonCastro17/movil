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
import { Picker } from "@react-native-picker/picker";
import ScreenLayout from "../../components/ui/ScreenLayout";
import SectionCard from "../../components/ui/SectionCard";
import PrimaryButton from "../../components/ui/PrimaryButton";
import FormField from "../../components/ui/FormField";
import { useAuthContext } from "../../contexts/AuthContext";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  updateAdminUser
} from "../../lib/services/adminService";

const EMPTY_FORM = {
  nombre: "",
  apellido: "",
  email: "",
  password: "",
  direccion: "",
  fecha_nacimiento: "",
  id_rol: "3",
  id_tipo_identificacion: "1",
  numero_identificacion: ""
};

function getRoleText(roleId) {
  if (Number(roleId) === 1) return "Admin";
  if (Number(roleId) === 2) return "Empleado";
  return "Cliente";
}

export default function UsersAdminScreen() {
  const { user, logout } = useAuthContext();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);

  const isAdmin = user?.id_rol === 1;

  const handleAuthError = useCallback(
    async (err) => {
      if (err?.status === 401 || err?.status === 403) {
        await logout();
        Alert.alert("Sesion expirada", "Inicia sesion nuevamente.");
        return true;
      }
      return false;
    },
    [logout]
  );

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;

    setLoading(true);
    setError("");
    try {
      const data = await getAdminUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      const consumed = await handleAuthError(err);
      if (!consumed) {
        setError(err.message || "No se pudieron cargar usuarios.");
      }
    } finally {
      setLoading(false);
    }
  }, [handleAuthError, isAdmin]);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return users;
    return users.filter((item) =>
      `${item.nombre} ${item.apellido} ${item.email}`.toLowerCase().includes(query)
    );
  }, [users, search]);

  const openCreateModal = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setIsModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditId(item.id);
    setForm({
      nombre: String(item.nombre || ""),
      apellido: String(item.apellido || ""),
      email: String(item.email || ""),
      password: "",
      direccion: String(item.direccion || ""),
      fecha_nacimiento: String(item.fecha_nacimiento || "").split("T")[0],
      id_rol: String(item.id_rol || "3"),
      id_tipo_identificacion: String(item.id_tipo_identificacion || "1"),
      numero_identificacion: String(item.numero_identificacion || "")
    });
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setIsModalVisible(false);
  };

  const saveUser = async () => {
    if (!form.nombre || !form.apellido || !form.email) {
      Alert.alert("Campos faltantes", "Nombre, apellido y correo son obligatorios.");
      return;
    }

    const payload = { ...form };
    if (editId && !payload.password) {
      delete payload.password;
    }

    try {
      const response = editId
        ? await updateAdminUser(editId, payload)
        : await createAdminUser(payload);

      if (response?.success === false) {
        Alert.alert("Error", response.message || "No se pudo guardar usuario.");
        return;
      }

      Alert.alert("Guardado", editId ? "Usuario actualizado." : "Usuario creado.");
      closeModal();
      loadUsers();
    } catch (err) {
      const consumed = await handleAuthError(err);
      if (!consumed) {
        Alert.alert("Error", err.message || "No se pudo guardar usuario.");
      }
    }
  };

  const removeUser = async (id) => {
    Alert.alert("Eliminar usuario", `Se eliminara el usuario ${id}.`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAdminUser(id);
            Alert.alert("Eliminado", "Usuario eliminado.");
            loadUsers();
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
      <ScreenLayout title="Usuarios" subtitle="Modulo solo para administradores.">
        <SectionCard>
          <Text style={styles.errorText}>No tienes permiso para esta vista.</Text>
        </SectionCard>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="Gestion de usuarios" subtitle="Crear, editar y eliminar usuarios.">
      <SectionCard style={styles.controls}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre o correo..."
          placeholderTextColor="#8a95a8"
          style={styles.searchInput}
        />
        <PrimaryButton label="Nuevo usuario" onPress={openCreateModal} compact />
        <PrimaryButton label={loading ? "Cargando..." : "Refrescar"} onPress={loadUsers} tone="secondary" compact />
      </SectionCard>

      {error ? (
        <SectionCard>
          <Text style={styles.errorText}>{error}</Text>
        </SectionCard>
      ) : null}

      <View style={styles.list}>
        {filteredUsers.map((item) => (
          <SectionCard key={String(item.id)} style={styles.userCard}>
            <Text style={styles.userTitle}>
              #{item.id} - {item.nombre} {item.apellido}
            </Text>
            <Text style={styles.userMeta}>Correo: {item.email}</Text>
            <Text style={styles.userMeta}>Rol: {getRoleText(item.id_rol)}</Text>
            <Text style={styles.userMeta}>Tipo doc: {item.id_tipo_identificacion}</Text>
            <Text style={styles.userMeta}>Documento: {item.numero_identificacion}</Text>
            <View style={styles.actionRow}>
              <PrimaryButton label="Editar" tone="secondary" compact onPress={() => openEditModal(item)} />
              <PrimaryButton label="Eliminar" tone="danger" compact onPress={() => removeUser(item.id)} />
            </View>
          </SectionCard>
        ))}
      </View>

      <Modal visible={isModalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editId ? "Editar usuario" : "Nuevo usuario"}</Text>
            <ScrollView contentContainerStyle={styles.modalForm}>
              <FormField label="Nombre" value={form.nombre} onChangeText={(value) => setForm((prev) => ({ ...prev, nombre: value }))} />
              <FormField label="Apellido" value={form.apellido} onChangeText={(value) => setForm((prev) => ({ ...prev, apellido: value }))} />
              <FormField
                label="Correo"
                value={form.email}
                onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
                keyboardType="email-address"
              />
              <FormField
                label="Direccion"
                value={form.direccion}
                onChangeText={(value) => setForm((prev) => ({ ...prev, direccion: value }))}
              />
              <FormField
                label="Fecha nacimiento (YYYY-MM-DD)"
                value={form.fecha_nacimiento}
                onChangeText={(value) => setForm((prev) => ({ ...prev, fecha_nacimiento: value }))}
              />
              <FormField
                label={editId ? "Contrasena (opcional)" : "Contrasena"}
                value={form.password}
                onChangeText={(value) => setForm((prev) => ({ ...prev, password: value }))}
                secureTextEntry
              />
              <FormField
                label="Numero identificacion"
                value={form.numero_identificacion}
                onChangeText={(value) => setForm((prev) => ({ ...prev, numero_identificacion: value }))}
              />

              <Text style={styles.label}>Tipo identificacion</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={form.id_tipo_identificacion}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, id_tipo_identificacion: String(value) }))
                  }
                >
                  <Picker.Item label="Cedula" value="1" />
                  <Picker.Item label="Pasaporte" value="2" />
                  <Picker.Item label="Otro" value="3" />
                </Picker>
              </View>

              <Text style={styles.label}>Rol</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={form.id_rol}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, id_rol: String(value) }))}
                >
                  <Picker.Item label="Administrador" value="1" />
                  <Picker.Item label="Empleado" value="2" />
                  <Picker.Item label="Cliente" value="3" />
                </Picker>
              </View>

              <PrimaryButton label="Guardar" onPress={saveUser} />
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
  userCard: {
    gap: 6
  },
  userTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2d42"
  },
  userMeta: {
    fontSize: 13,
    color: "#4f5f75"
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap"
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2d42"
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#c8d2e3",
    borderRadius: 10,
    backgroundColor: "#ffffff"
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
    maxHeight: "92%",
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
