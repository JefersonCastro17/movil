import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS } from "../../theme/colors";

export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  editable = true
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !editable ? styles.disabled : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 6
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.inputBackground
  },
  disabled: {
    backgroundColor: "#e5e7eb",
    color: COLORS.textMuted
  }
});
